'use strict';

var Boom = require('boom'),
    CONFIG = require('../Config'),
    Joi = require('joi'),
    md5 = require('md5'),
    CONSTANTS = CONFIG.constants,
    ERROR = require('../ResponseMessages').ENGLISH.ERROR,
    SUCCESS = require('../ResponseMessages').ENGLISH.SUCCESS,
    NOTIFICATION_MESSAGES = require('../ResponseMessages').ENGLISH.notificationMessages,
    bcrypt = require('bcryptjs'),
    random = require('random-int'),
    async = require('async'),
    Path = require('path'),
    logger = require('log4js').getLogger('[UNIVERSAL FUNCTIONS]'),
    GeoPoint = require('geopoint'),
    DAO = require('../DAOManager').queries,
    where = require('node-where'),
    NodeGeocoder = require('node-geocoder'),
    Models = require('../Models/'),
    _ = require('underscore'),
    __ = require('lodash'),
    moment = require('moment');
require('moment-range');

var authorizationHeaderObj = Joi.object({
    authorization: Joi.string().required()
}).unknown();

var sendError = function(data, lang) {

    if (lang) {
        ERROR = require('../ResponseMessages')[lang].ERROR;
    }

    if (typeof data == 'object' && data.hasOwnProperty('statusCode') && data.hasOwnProperty('customMessage')) {
        let messageType = data.type;
        if (ERROR[messageType]) {
            data.customMessage = ERROR[messageType].customMessage;
        }
        if (data.hasOwnProperty('data')) {
            var errorToSend = Boom.create(data.statusCode, data.customMessage, data.data);
            errorToSend.output.payload.data = data.data;
        } else {
            var errorToSend = Boom.create(data.statusCode, data.customMessage);
        }

        errorToSend.output.payload.responseType = data.type;
        return errorToSend;
    } else {
        var errorToSend = '';
        if (typeof data == 'object') {
            if (data.name == 'MongoError') {
                errorToSend += ERROR.DB_ERROR.customMessage;
            } else if (data.name == 'ApplicationError') {
                errorToSend += ERROR.APP_ERROR.customMessage;
            } else if (data.name == 'ValidationError') {
                errorToSend += data.message + ". " + "Enter a Valid Value for  " + data.errors[Object.keys(data.errors)[0]].path;
            } else if (data.name == 'CastError') {
                errorToSend += ERROR.DB_ERROR.customMessage + ERROR.INVALID_ID.customMessage + data.value;
            }
        } else {
            errorToSend = data
        }
        var customErrorMessage = errorToSend;
        if (typeof customErrorMessage == 'string') {
            if (errorToSend.indexOf("[") > -1) {
                customErrorMessage = errorToSend.substr(errorToSend.indexOf("["));
            }
            customErrorMessage = customErrorMessage && customErrorMessage.replace(/"/g, '');
            customErrorMessage = customErrorMessage && customErrorMessage.replace('[', '');
            customErrorMessage = customErrorMessage && customErrorMessage.replace(']', '');
        }
        return Boom.create(400, customErrorMessage)
    }
};

var sendSuccess = function(successMsg, data, lang) {

    if (lang) {
        SUCCESS = require('../ResponseMessages')[lang].SUCCESS;
    }

    successMsg = successMsg || SUCCESS.DEFAULT.customMessage;
    if (typeof successMsg == 'object' && successMsg.hasOwnProperty('statusCode') && successMsg.hasOwnProperty('customMessage')) {
        let messageType = successMsg.type;
        successMsg.customMessage = SUCCESS[messageType].customMessage;
        return { statusCode: successMsg.statusCode, message: successMsg.customMessage, data: data || null };

    } else {
        return { statusCode: 200, message: successMsg, data: data || null };

    }
};

var getNotificationMessage = function(type, lang) {
    if (lang == CONSTANTS.LANGUAGE.SPANISH) {
        NOTIFICATION_MESSAGES = require('../ResponseMessages')[lang].notificationMessages;
    } else if (lang == CONSTANTS.LANGUAGE.ARABIC) {
        NOTIFICATION_MESSAGES = require('../ResponseMessages')[lang].notificationMessages;
    }
    return NOTIFICATION_MESSAGES[type];
}
var failActionFunction = function(request, reply, source, error) {
    if (error.isBoom) {
        if (0) {

        } else {
            delete error.output.payload.validation;
            if (error.output.payload.message.indexOf("authorization") !== -1) {
                error.output.statusCode = ERROR.UNAUTHORIZED.statusCode;
                return reply(error);
            }
            var details = error.data.details[0];
            if (details.message.indexOf("pattern") > -1 && details.message.indexOf("required") > -1 && details.message.indexOf("fails") > -1) {
                error.output.payload.message = "Invalid " + details.path;
                return reply(error);
            }

            if (details.type == 'date.min') {
                error.output.payload.message = 'Please choose a future time'
            }
        }
    }
    var customErrorMessage = '';

    if (error.output.payload.message.indexOf("[") > -1) customErrorMessage = error.output.payload.message.substr(error.output.payload.message.indexOf("["));
    else customErrorMessage = error.output.payload.message;

    customErrorMessage = customErrorMessage.replace(/"/g, '');
    customErrorMessage = customErrorMessage.replace('[', '');
    customErrorMessage = customErrorMessage.replace(']', '');
    // error.output.payload.message = customErrorMessage.capitalize();
    delete error.output.payload.validation;
    return reply(error);
};

function cryptDataMd5(data) { // MD5 encryption
    return md5(md5(data))
};

function cryptData(data, callback) { // bcrypt encryption
    bcrypt.hash(data, 8, (err, hash) => {
        if (err) callback(err);
        else callback(null, hash);
    });
};

function compareCryptData(data, hash, callback) { // bcrypt matching
    bcrypt.compare(data, hash, (error, result) => {
        if (error) {
            callback(error);
        } else {
            callback(null, result);
        }
    })
};

function generateRandomString(length, isNumbersOnly) {
    var charsNumbers = '0123456789';
    var charsLower = 'abcdefghijklmnopqrstuvwxyz';
    var charsUpper = charsLower.toUpperCase();
    var chars;

    if (isNumbersOnly)
        chars = charsNumbers;
    else
        chars = charsNumbers + charsLower + charsUpper;

    if (!length) length = 32;

    var string = '';
    for (var i = 0; i < length; i++) {
        var randomNumber = random(0, chars.length);
        randomNumber = randomNumber || 1;
        string += chars.substring(randomNumber - 1, randomNumber);
    }
    return string;
};

function getRange(startDate, endDate, diffIn) {

    var dr = moment.range(startDate, endDate);
    if (!diffIn)
        diffIn = 'minutes';
    if (diffIn == "milli")
        return dr.diff();

    return dr.diff(diffIn);

};

function isEmpty(obj) {
    if (obj == null) return true;
    if (obj.length && obj.length > 0) return false;
    if (obj.length === 0) return true;

    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }
    return true;
};

function getFileNameWithUserId(thumbFlag, fullFileName, userId) {
    var prefix = CONSTANTS.PIC_PREFIX.ORIGINAL;
    var ext = fullFileName && fullFileName.length > 0 && fullFileName.substr(fullFileName.lastIndexOf('.') || 0, fullFileName.length);
    if (thumbFlag) {
        prefix = CONSTANTS.PIC_PREFIX.THUMB;
    }
    return prefix + userId + ext;
};

function getDistanceBetweenPoints(origin, destination) {
    var start = new GeoPoint(origin.lat, origin.long);
    var end = new GeoPoint(destination.lat, destination.long);
    return start.distanceTo(end); //in miles
};


function getAvailableSlots(workingStartTime, workingEndTime, duration, finalCallback) {
    let availableSlots = [];

    let startTime = workingStartTime;
    let endTime = workingEndTime;

    while (startTime < endTime) {
        availableSlots.push({
            minStartTime: startTime,
            maxStartTime: moment(startTime).add(duration, 'minutes').utc(),
            isAvailable: true
        });
        startTime = moment(startTime).add(duration, 'minutes').utc();
    }

    finalCallback(null, availableSlots);

}

let convertAccentedCharacters = function(str) {
    var conversions = new Object();
    conversions['ae'] = 'ä|æ|ǽ';
    conversions['oe'] = 'ö|œ';
    conversions['ue'] = 'ü';
    conversions['Ae'] = 'Ä';
    conversions['Ue'] = 'Ü';
    conversions['Oe'] = 'Ö';
    conversions['A'] = 'À|Á|Â|Ã|Ä|Å|Ǻ|Ā|Ă|Ą|Ǎ';
    conversions['a'] = 'à|á|â|ã|å|ǻ|ā|ă|ą|ǎ|ª';
    conversions['C'] = 'Ç|Ć|Ĉ|Ċ|Č';
    conversions['c'] = 'ç|ć|ĉ|ċ|č';
    conversions['D'] = 'Ð|Ď|Đ';
    conversions['d'] = 'ð|ď|đ';
    conversions['E'] = 'È|É|Ê|Ë|Ē|Ĕ|Ė|Ę|Ě';
    conversions['e'] = 'è|é|ê|ë|ē|ĕ|ė|ę|ě';
    conversions['G'] = 'Ĝ|Ğ|Ġ|Ģ';
    conversions['g'] = 'ĝ|ğ|ġ|ģ';
    conversions['H'] = 'Ĥ|Ħ';
    conversions['h'] = 'ĥ|ħ';
    conversions['I'] = 'Ì|Í|Î|Ï|Ĩ|Ī|Ĭ|Ǐ|Į|İ';
    conversions['i'] = 'ì|í|î|ï|ĩ|ī|ĭ|ǐ|į|ı';
    conversions['J'] = 'Ĵ';
    conversions['j'] = 'ĵ';
    conversions['K'] = 'Ķ';
    conversions['k'] = 'ķ';
    conversions['L'] = 'Ĺ|Ļ|Ľ|Ŀ|Ł';
    conversions['l'] = 'ĺ|ļ|ľ|ŀ|ł';
    conversions['N'] = 'Ñ|Ń|Ņ|Ň';
    conversions['n'] = 'ñ|ń|ņ|ň|ŉ';
    conversions['O'] = 'Ò|Ó|Ô|Õ|Ō|Ŏ|Ǒ|Ő|Ơ|Ø|Ǿ';
    conversions['o'] = 'ò|ó|ô|õ|ō|ŏ|ǒ|ő|ơ|ø|ǿ|º';
    conversions['R'] = 'Ŕ|Ŗ|Ř';
    conversions['r'] = 'ŕ|ŗ|ř';
    conversions['S'] = 'Ś|Ŝ|Ş|Š';
    conversions['s'] = 'ś|ŝ|ş|š|ſ';
    conversions['T'] = 'Ţ|Ť|Ŧ';
    conversions['t'] = 'ţ|ť|ŧ';
    conversions['U'] = 'Ù|Ú|Û|Ũ|Ū|Ŭ|Ů|Ű|Ų|Ư|Ǔ|Ǖ|Ǘ|Ǚ|Ǜ';
    conversions['u'] = 'ù|ú|û|ũ|ū|ŭ|ů|ű|ų|ư|ǔ|ǖ|ǘ|ǚ|ǜ';
    conversions['Y'] = 'Ý|Ÿ|Ŷ';
    conversions['y'] = 'ý|ÿ|ŷ';
    conversions['W'] = 'Ŵ';
    conversions['w'] = 'ŵ';
    conversions['Z'] = 'Ź|Ż|Ž';
    conversions['z'] = 'ź|ż|ž';
    conversions['AE'] = 'Æ|Ǽ';
    conversions['ss'] = 'ß';
    conversions['IJ'] = 'Ĳ';
    conversions['ij'] = 'ĳ';
    conversions['OE'] = 'Œ';
    conversions['f'] = 'ƒ';
    for (var i in conversions) {
        var re = new RegExp(conversions[i], "g");
        str = str.replace(re, i);
    }
    return str;
}

let decodeStreetAddress = function(streetAddress, callback) {
    let address = {};
    var options = {
        provider: 'google',
        httpAdapter: 'https',
        apiKey: 'AIzaSyAZPtMyeaoJuEg4uYn9fd1qmqzlLBSI4Qc'
    };

    var geocoder = NodeGeocoder(options);
    geocoder.geocode(streetAddress, function(err, result) {
        if (err) {
            return callback(err);
        } else {
            if (result) {
                let city = convertAccentedCharacters(result[0].city);
                let country = convertAccentedCharacters(result[0].country);
                address = {
                    streetAddress: streetAddress,
                    city: city,
                    country: country,
                    locationLongLat: {
                        "type": "Point",
                        "coordinates": [result[0].longitude, result[0].latitude]
                    }
                };
            }
            return callback(null, address);
        }
    });
}

let decodeLatLong = function(longitude, latitude, callback) {
    var options = {
        provider: 'google',
        httpAdapter: 'https',
        apiKey: 'AIzaSyAZPtMyeaoJuEg4uYn9fd1qmqzlLBSI4Qc'
    };

    var address = {};

    var geocoder = NodeGeocoder(options);

    geocoder.reverse({ lat: latitude, lon: longitude })
        .then(function(res) {
            let city = convertAccentedCharacters(res[0].city);
            let country = convertAccentedCharacters(res[0].country);
            address = {
                streetAddress: res[0].formattedAddress,
                city: city,
                country: country,
                locationLongLat: {
                    "type": "Point",
                    "coordinates": [res[0].longitude, res[0].latitude]
                }
            };
            callback(null, address);

        })
        .catch(function(err) {
            if (err) {
                callback(err);
            }
        });
}

let getReferralCode = function() {

    var length = 6;
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var size = chars.length;
    var str = '';
    for (var i = 0; i < length; i++) {
        var randomnumber = Math.floor(Math.random() * size);
        str = chars[randomnumber] + str;
    }
    return str;
}

let printDataToConsole = function(string, data, env_type) {
    if (env_type === CONSTANTS.ENVIRONMENT_TYPE.DEV) {
        if(process.env.ENVIRONMENT === CONSTANTS.ENVIRONMENT_TYPE.DEV) {
            console.log(string,data);
        }
    } else if (env_type === CONSTANTS.ENVIRONMENT_TYPE.PROD) {
        if(process.env.ENVIRONMENT === CONSTANTS.ENVIRONMENT_TYPE.PROD) {
            console.log(string, data);
        }
    } else {
        console.log(string, data);
    }
}


module.exports = {
    authorizationHeaderObj: authorizationHeaderObj,
    sendError: sendError,
    sendSuccess: sendSuccess,
    failActionFunction: failActionFunction,
    cryptData: cryptData,
    cryptDataMd5: cryptDataMd5,
    compareCryptData: compareCryptData,
    generateRandomString: generateRandomString,
    getRange: getRange,
    isEmpty: isEmpty,
    getFileNameWithUserId: getFileNameWithUserId,
    getDistanceBetweenPoints: getDistanceBetweenPoints,
    getAvailableSlots: getAvailableSlots,
    convertAccentedCharacters: convertAccentedCharacters,
    decodeStreetAddress: decodeStreetAddress,
    decodeLatLong: decodeLatLong,
    getReferralCode: getReferralCode,
    getNotificationMessage: getNotificationMessage,
    printDataToConsole: printDataToConsole
}