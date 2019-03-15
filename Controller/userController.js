'use strict';

const async = require('async'),
DAO = require('../DAOManager').queries,
ERROR = require('../ResponseMessages').ENGLISH.ERROR,
Models = require('../Models/'),
util = require('../Utils').universalFunctions,
tokenManager = require('../Lib').tokenManager,
mongoose = require('mongoose');

exports.loginUser = function(payload, callbackLogin) {
    var dataToSend = {};
    async.auto({
        CONNECT_DB: function(callback){
            mongoose.connect('mongodb://localhost:27017/master', 
            function (err){
                if (err) {
                    console.log("DB Error: ", err);
                    process.exit(1);
                } else {
                    console.log('MongoDB Connected mongodb://localhost:27017/master');
                    callback();
                }
            });
        },
        CHECK_EMAIL_EXISTS: ['CONNECT_DB', function(res, callback) {
            var query = { email: payload.email };
            DAO.getData(Models.userData, query, {}, { lean: true }, function(err, res) {
                if (err) {
                    callback(err);
                } else if (res && res.length == 0 || err) {
                    callback(ERROR.WRONG_EMAIL);
                } else {
                    dataToSend = res[0];
                    callback(null, res[0]);
                }
            });
        }],
        COMPARE_PASSWORD: ['CHECK_EMAIL_EXISTS', function(result, callback) {
            util.compareCryptData(payload.password, result.CHECK_EMAIL_EXISTS.password, function(err, passwordMatch) {
                if (err) callback(err);
                else {
                    if (passwordMatch == true) callback(null, {});
                    else callback(ERROR.WRONG_PASSWORD);
                }
            })
        }],
        UPDATE_ACCESS_TOKEN: ['CHECK_EMAIL_EXISTS', 'COMPARE_PASSWORD', function(result, callback) {
            var dataToUpdate = {
                accessToken: tokenManager.generateToken({
                    _id: result.CHECK_EMAIL_EXISTS._id,
                    timestamp: new Date()
                }),
            };
            dataToSend.accessToken = dataToUpdate.accessToken;
            DAO.update(Models.userData, { _id: result.CHECK_EMAIL_EXISTS._id }, dataToUpdate, { lean: true }, callback);
        }]
    }, (err, final) => {
        mongoose.connection.close();
        if (err) {
            callbackLogin(err);
        } else {
            callbackLogin(null, { userDetails: dataToSend });
        }
    })
};

exports.logoutUser = function(authData, callbackLogout) {
    async.auto({
        CONNECT_DB: function(callback){
            mongoose.connect('mongodb://localhost:27017/master', 
            function (err){
                if (err) {
                    console.log("DB Error: ", err);
                    process.exit(1);
                } else {
                    console.log('MongoDB Connected mongodb://localhost:27017/master');
                    callback();
                }
            });
        },
        LOGOUT: ['CONNECT_DB', function(res, callback) {
            DAO.update(Models.userData, { _id: mongoose.Types.ObjectId(authData._id) }, { $unset: { accessToken: 1 } }, { lean: true }, function(err, res) {
                if (err) {
                    callback(err);
                } else {
                    callback(null);
                }
            });
        }]
    }, (err, final) => {
        mongoose.connection.close();
        if (err) {
            callbackLogout(err);
        } else {
            callbackLogout(null);
        }
    })
};

exports.getAllUsers = function(authData, callback) {
    let options = {
        lean: true
    };
    let criteria = {
        _id: { $ne: mongoose.Types.ObjectId(authData._id) }
    };
    
    async.auto({
        CONNECT_DB: function(cb){
            mongoose.connect('mongodb://localhost:27017/master', 
            function (err){
                if (err) {
                    console.log("DB Error: ", err);
                    cb(err);
                } else {
                    console.log('MongoDB Connected mongodb://localhost:27017/master');
                    cb();
                }
            });
        },
        GET_USERS_DATA: ['CONNECT_DB', function(res, cb) {
            DAO.getData(Models.userData, criteria, { password: 0, accessToken: 0 }, options, (err, res) => {
                if (err) {
                    cb(err);
                } else {
                    cb(null, res);
                }
            });
        }],
        GET_USERS_COUNT: ['CONNECT_DB', function(res, cb) {
            DAO.count(Models.userData, criteria, (err, res) => {
                if (err) {
                    cb(err);
                } else {
                    cb(null, res);
                }
            });
        }]
    }, function(err, res) {
        mongoose.connection.close();
        if (err) {
            callback(err);
        } else {
            callback(null, { usersData: res.GET_USERS_DATA, usersCount: res.GET_USERS_COUNT });
        }
    });
};

exports.getAllPosts = function(authData, callback) {
    let options = {
        lean: true
    };
    
    async.auto({
        CONNECT_DB: function(callback){
            mongoose.connect(`mongodb://localhost:27017/db_${authData.id}`, 
            function (err){
                if (err) {
                    console.log("DB Error: ", err);
                    process.exit(1);
                } else {
                    console.log(`MongoDB Connected mongodb://localhost:27017/db_${authData.id}`);
                    callback();
                }
            });
        },
        GET_POSTS_DATA: ['CONNECT_DB', function(res, cb) {
            DAO.getData(Models.postData, {}, {}, options, (err, res) => {
                if (err) {
                    cb(err);
                } else {
                    cb(null, res);
                }
            });
        }],
        GET_POSTS_COUNT: ['CONNECT_DB', function(res, cb) {
            DAO.count(Models.postData, {}, (err, res) => {
                if (err) {
                    cb(err);
                } else {
                    cb(null, res);
                }
            });
        }]
    }, function(err, res) {
        mongoose.connection.close();
        if (err) {
            callback(err);
        } else {
            callback(null, { postsData: res.GET_POSTS_DATA, postsCount: res.GET_POSTS_COUNT });
        }
    });
};

exports.updateProfilePic = function(authData, payloadData, callback) {
    let imageData = {};
    let updatedData = {};
    async.auto({
        CONNECT_DB: function(cb){
            mongoose.connect(`mongodb://localhost:27017/db_${authData.id}`, 
            function (err){
                if (err) {
                    console.log("DB Error: ", err);
                    cb(err);
                } else {
                    console.log(`MongoDB Connected mongodb://localhost:27017/db_${authData.id}`);
                    cb();
                }
            });
        },
        UPLOAD_IMAGE_TO_S3: function(cb) {
            let folderName = Config.awsConfig.s3BucketCredentials.folder.profilePicture;
            folderName = Config.awsConfig.s3BucketCredentials.folder.user + '/' + authData._id + '/' + folderName;
            
            if (payloadData.image && payloadData.image.filename) {
                uploadFileManager.uploadFilesOnS3(payloadData.image, folderName, function(err, uploadedInfo) {
                    if (err) {
                        cb(err)
                    } else {
                        if (uploadedInfo && uploadedInfo.original && uploadedInfo.thumbnail) {
                            imageData.original = uploadedInfo.original || null;
                            imageData.thumbnail = uploadedInfo.thumbnail || null;
                            cb(null, imageData);
                        } else {
                            cb(ERROR.INVALID_FORMAT);
                        }
                    }
                })
            } else {
                cb(ERROR.INVALID_FORMAT);
            }
        },
        UPDATE_PROFILE_PIC_URL: ['CONNECT_DB', 'UPLOAD_IMAGE_TO_S3', function(res, cb) {
            let criteria = {
                _id: mongoose.Types.ObjectId(authData._id)
            };

            let dataToUpdate = {
                $set: {
                    profilePicUrls: imageData
                }
            };

            let options = {
                lean: true,
                new: true
            }
            DAO.update(Models.userData, criteria, dataToUpdate, options, (err, res) => {
                if (err) {
                    cb(err);
                } else {
                    updatedData = res;
                    cb(null);
                }
            });
        }]
    }, function(err, res) {
        mongoose.connection.close();
        if (err) {
            callback(err);
        } else {
            callback(null, updatedData);
        }
    });
};