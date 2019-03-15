'use strict';
var UniversalFunc = require('../Utils/universalFunctions');
var Controller = require('../Controller').postAndCommentsController;
var swaggerResponse = require('../ResponseMessages').ENGLISH.swaggerDefaultResponseMessages;
var routes = [];

exports.addPostDataToDB = {
    method: 'GET',
    path: '/api/addPostDataToDB',
    handler: function(request, reply) {
        Controller.addPostDataToDB(function(err, data) {
            if (err) {
                reply(UniversalFunc.sendError(err));
            } else {
                reply(UniversalFunc.sendSuccess(null, data));
            }
        });
    },
    config: {
        description: 'run script to add posts data in DB',
        tags: ['api', 'cron'],
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
}


for (let key in exports) {
    routes.push(exports[key])
}

module.exports = routes;