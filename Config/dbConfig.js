'use strict';

var mongoPort = process.env.MONGO_PORT || 27017,
    mongoHost = process.env.MONGO_HOST || 'localhost',
    mongoDatabase = process.env.MONGO_DATABASE || 'fc_home_services',
    mongoUserPass = process.env.MONGO_USER && process.env.MONGO_PASS ? process.env.MONGO_USER + ":" + process.env.MONGO_PASS + "@" : '';

var MONGO = {
    URI: "mongodb://" + mongoUserPass + mongoHost + ":" + mongoPort + "/" + mongoDatabase,
    PORT: 27017,
    DATABASE: mongoDatabase
};



module.exports = {
    MONGO: MONGO
};