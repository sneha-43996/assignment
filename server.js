'use strict';

//External Dependencies
var Hapi = require('hapi');
require('dotenv').config();

require('http');

//Internal Dependencies
const Config = require('./Config'),
    Plugins = require('./Plugins'),
    Routes = require('./Routes'),
    _ = require('underscore');

//Create Server
var server = new Hapi.Server({
    app: {
        name: Config.serverConfig.SERVER.APP_NAME
    }
});

server.connection({
    port: Config.serverConfig.SERVER.PORTS.HAPI,
    routes: { cors: true },
});

server.register(Plugins, function(err) {
    if (err) server.error('Error while loading plugins : ' + err);
    else {
        server.log('info', 'Plugins Loaded');
        server.route(Routes);
    }
});

//Default Route
server.route({
    method: 'GET',
    path: '/',
    handler: function(req, res) {
        res.view('redirect');
    }
});

// Adding Views
server.views({
    engines: {
        html: require('handlebars')
    },
    relativeTo: __dirname,
    path: './Utils'
});

process.on('uncaughtException', (err) => {
    console.log('uncaughtException error >>>>>> ', err);
});

process.on('unhandledRejection', (err) => {
    console.log('unhandledRejection error >>>>>> ', err);
});
//Start Server
server.start(function(err) {
    if (err) server.log(err);
    else server.log('info', 'Server running at: ' + server.info.uri);
});

module.exports = server;