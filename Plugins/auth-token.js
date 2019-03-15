'use strict';
var TokenManager = require('../Lib/tokenManager'),
UniversalFunc = require('../Utils/universalFunctions'),
ERROR = require('../ResponseMessages').ENGLISH.ERROR,
AuthBearer = require('hapi-auth-bearer-token');

exports.register = function(server, options, next) {
    server.register(AuthBearer, function(err) {
        server.auth.strategy('UserAuth', 'bearer-access-token', {
            allowQueryToken: true,
            allowMultipleHeaders: true,
            accessTokenName: 'accessToken',
            validateFunc: function(token, callback) {
                TokenManager.verifyUserToken(token, function(response) {
                    if (response.valid) {
                        callback(null, true, { token: token, userData: response.userData, authData: response.authData });
                    } else {
                        callback(UniversalFunc.sendError(ERROR.SESSION_EXPIRED));
                    }
                });
            }
        });
    });
    next();
};

exports.register.attributes = {
    name: 'auth-token-plugin'
};