'use strict';

var ERROR = require('../ResponseMessages').ENGLISH.ERROR,
    SERVER = require('../Config').serverConfig.SERVER,
    Jwt = require('jsonwebtoken'),
    mongoose = require('mongoose'),
    Models = require('../Models'),
    async = require('async'),
    DAO = require('../DAOManager').queries;

var generateToken = function(tokenData) {
    return Jwt.sign(tokenData, SERVER.JWT_SECRET_KEY);
};

var decipherToken = function(token, callback) {
    Jwt.verify(token, SERVER.JWT_SECRET_KEY, function(err, decodedData) {
        if (err)
            return callback(ERROR.INVALID_TOKEN);
        return callback(null, decodedData);
    })
};

var verifyUserToken = function(token, finalCallback) {
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
        VERIFY_USER: ['CONNECT_DB', function(res, callback){
            var response = {
                valid: false,
                name: ERROR.DEFAULT
            };
            Jwt.verify(token, SERVER.JWT_SECRET_KEY, function(err, decodedData) {
                if (err) {
                    console.log('verify customer: ', err);
                    response.name = err.name;
                    callback(response)
                } else {
                    console.log('verify customer:decodedData ', decodedData);
                    DAO.getData(Models.userData, { _id: mongoose.Types.ObjectId(decodedData._id) }, {}, { limit: 1, lean: true }, function(err, data) {
                        if (!err && data && data[0] && data[0].accessToken == token) {
                            response.valid = true;
                            response.userData = decodedData;
                            response.authData = data[0];
                        } else {
                            response.valid = false;
                            response.name = ERROR.TOKEN_EXPIRED;
                        }
                        callback(response);
                    });
                }
            });
        }]
    }, function(error, response) {
        mongoose.connection.close();
        if(error) {
            finalCallback(error);
        } else {
            finalCallback(null, response.VERIFY_USER);
        }
    })
    
};

module.exports = {
    generateToken: generateToken,
    decipherToken: decipherToken,
    verifyUserToken: verifyUserToken
};