'use strict';

const async = require('async'),
DAO = require('../DAOManager').queries,
Models = require('../Models/'),
request = require('request'),
mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

exports.addPostDataToDB = (callback) => {
    let postData = [];
    let commentsData = [];
    let finalDataToInsert = [];
    let postsUrl = `https://jsonplaceholder.typicode.com/posts`;
    let commentsUrl = `https://jsonplaceholder.typicode.com/comments`;
    async.auto({
        GET_POST_DATA: function (cb) {
            request({
                headers: { 'Content-Type': 'application/json' },
                uri: postsUrl,
                method: 'GET',
            },(error, response, body) => {
                if (error) {
                    console.log('error for posts data is here', error);
                    cb(error);
                } else {
                    postData = JSON.parse(body);
                    cb();
                }
            });
        },
        GET_COMMENTS_DATA: ['GET_POST_DATA', function (res, cb) {
            request({
                headers: { 'Content-Type': 'application/json' },
                uri: commentsUrl,
                method: 'GET',
            },(error, response, body) => {
                if (error) {
                    console.log('error for comments data is here', error);
                    cb(error);
                } else {
                    commentsData = JSON.parse(body);
                    postData.forEach( function (post, idx) {
                        post.comments = [];
                        commentsData.forEach( function (comment) {
                            if (post.id.toString() === comment.postId.toString()) {
                                post.comments.push(comment);
                            }
                        });
                        if (idx == postData.length-1) {
                            cb();
                        }
                    });
                }
            });
        }],
        GET_USERS_DATA: ['GET_POST_DATA', 'GET_COMMENTS_DATA', function (res, cb) {
            let usersData = [];
            mongoose.connect(`mongodb://localhost:27017/master`, 
            function (err) {
                if (err) {
                    console.log("DB Error: ", err);
                    process.exit(1);
                } else {
                    DAO.getData(Models.userData, {}, { id: 1 }, { lean: true }, function(error, resp) {
                        if (error) {
                            cb(error);
                        } else {
                            usersData = resp;
                            usersData.forEach( function (user, idx) {
                                user.posts = [];
                                postData.forEach( function (post) {
                                    if (user.id.toString() === post.userId.toString()) {
                                        user.posts.push(post);
                                    }
                                });
                                if (idx == usersData.length-1) {
                                    finalDataToInsert = usersData;
                                    mongoose.connection.close();
                                    cb();
                                }
                            });
                        }
                    });
                }
            });
        }],
        WRITE_DATA_TO_DATABASE: ['GET_USERS_DATA', function(res, cb) {
            finalDataToInsert.forEach(function(data, idx) {
                mongoose.connect(`mongodb://localhost:27017/db_${data.id}`,
                function (err) {
                    if (err) {
                        console.log("DB Error: ", err);
                        process.exit(1);
                    } else {
                        console.log(`MongoDB Connected mongodb://localhost:27017/db_${data.id}`);
                        DAO.bulkInsert(Models.postData, data.posts, function(error2) {
                            if (error2) {
                                cb(error2);
                            } else {
                                mongoose.connection.close();
                            }
                        });
                    }
                    if (idx == finalDataToInsert.length -1) {
                        cb();
                    }
                });
            });
        }]
    }, function(e, r){
        if (e) {
            callback(e);
        } else {
            callback(null);
        }
    })  
};