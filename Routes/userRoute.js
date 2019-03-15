'use strict';
var UniversalFunc = require('../Utils/universalFunctions');
var Joi = require('joi');
var Controller = require('../Controller').userController;
var swaggerResponse = require('../ResponseMessages').ENGLISH.swaggerDefaultResponseMessages;
var SUCCESS = require('../ResponseMessages').ENGLISH.SUCCESS;
var ERROR = require('../ResponseMessages').ENGLISH.ERROR;
var routes = [];


exports.loginUser = {
    method: 'POST',
    path: '/api/user/login',
    config: {
        description: 'Login user',
        tags: ['api', 'user'],
        handler: function(request, reply) {
            Controller.loginUser(request.payload, function(error, success) {
                if (error) {
                    reply(UniversalFunc.sendError(error));
                } else {
                    reply(UniversalFunc.sendSuccess(SUCCESS.LOGGED_IN, success));
                }
            });
        },
        validate: {
            payload: {
                email: Joi.string().required(),
                password: Joi.string().required().min(6).max(25)
            },
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.logoutUser = {
    method: 'PUT',
    path: '/api/user/logout',
    config: {
        description: 'logout user',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: function(request, reply) {
            if (request.hasOwnProperty('auth')) {
                Controller.logoutUser(request.auth.credentials.authData, function(error, success) {
                    if (error) reply(UniversalFunc.sendError(error));
                    else reply(UniversalFunc.sendSuccess(SUCCESS.LOGOUT, success));
                });
            } else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.getAllUsers = {
    method: 'GET',
    path: '/api/user/getAllUsers',
    handler: function(request, reply) {
        if (request.hasOwnProperty('auth')) {
            Controller.getAllUsers(request.auth.credentials.authData, function(error, success) {
                if (error) {
                    return reply(UniversalFunc.sendError(error));
                } else {
                    return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                }
            });
        } else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
    },
    config: {
        description: 'get all users',
        tags: ['api', 'user'],
        auth: 'UserAuth',
        validate: {
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.getAllPosts = {
    method: 'GET',
    path: '/api/user/getAllPosts',
    handler: function(request, reply) {
        if (request.hasOwnProperty('auth')) {
            Controller.getAllPosts(request.auth.credentials.authData, function(error, success) {
                if (error) {
                    return reply(UniversalFunc.sendError(error));
                } else {
                    return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                }
            });
        } else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
    },
    config: {
        description: 'get all posts',
        tags: ['api', 'user'],
        auth: 'UserAuth',
        validate: {
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.updateProfilePic = {
    method: 'PUT',
    path: '/api/user/updateProfilePic',
    handler: function(request, reply) {
        if (request.hasOwnProperty('auth')) {
            Controller.updateProfilePic(request.auth.credentials.authData, request.payload, function(err, data) {
                if (err) {
                    reply(UniversalFunc.sendError(err));
                } else {
                    reply(UniversalFunc.sendSuccess(null, data))
                }
            });
        } else {
            reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        }
    },
    config: {
        description: 'update profile pic',
        auth: 'UserAuth',
        tags: ['api', 'Any'],
        payload: {
            maxBytes: 5097152,
            parse: true,
            output: 'file'
        },
        validate: {
            payload: {
                image: Joi.any().meta({ swaggerType: 'file' }).required().description('image file')
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

for (let key in exports) {
    routes.push(exports[key])
}

module.exports = routes;