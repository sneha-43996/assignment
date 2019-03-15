'use strict';

const async = require('async'),
DAO = require('../DAOManager').queries,
Models = require('../Models/'),
utils = require('../Utils'),
request = require('request'),
mongoose = require('mongoose');

exports.addUserDataToDB = (callback) => {
    let userData = [];
    let passwordHash = '';
    let url = `https://jsonplaceholder.typicode.com/users`;
    async.auto({
        GET_JSON_DATA: function (cb) {
            request({
                headers: { 'Content-Type': 'application/json' },
                uri: url,
                method: 'GET',
            },(error, response, body) => {
                if (error) {
                    console.log('error for users data is here', error);
                    cb(error);
                } else {
                    userData = JSON.parse(body);
                    cb();
                }
            });
        },
        GENERATE_PASSWORD: ['GET_JSON_DATA', function (res, cb) {
            utils.universalFunctions.cryptData('qwertyui', function (err, res) {
                if (err) {
                    cb(err);
                } else {
                    passwordHash = res;
                    userData.forEach(function (data, idx) {
                        data.password = passwordHash;
                        if (idx == userData.length-1) {
                            cb();
                        }
                    })
                }
            });
        }],
        CONNECT_DATABASE: function (cb) {
            mongoose.connect('mongodb://localhost:27017/master', 
            function (err){
                if (err) {
                    console.log("DB Error: ", err);
                    process.exit(1);
                } else {
                    console.log('MongoDB Connected mongodb://localhost:27017/master');
                    DAO.remove(Models.userData, {}, cb);
                }
            });
        },
        WRITE_DATA_TO_DATABASE: ['GENERATE_PASSWORD', 'GET_JSON_DATA', 'CONNECT_DATABASE', function(res, cb) {
            DAO.bulkInsert(Models.userData, userData, cb);
        }]
    }, function(err, resp){
        if (err) {
            callback(err);
        } else {
            mongoose.connection.close();
            callback();
        }
    })  
};