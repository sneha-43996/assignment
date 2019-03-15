'use strict';

var saveData = function(model, data, callback) {
    new model(data).save(function(err, result) {
        if (err) {
            return callback(err);
        } else {
            callback(null, result);
        }
    })
};

var getData = function(model, query, projection, options, callback) {
    model.find(query, projection, options, function(err, data) {
        if (err) {
            return callback(err);
        } else {
            return callback(null, data);
        }
    });
};

var findAndUpdate = function(model, conditions, update, options, callback) {
    model.findOneAndUpdate(conditions, update, options, function(error, result) {
        if (error) {
            return callback(error);
        }
        return callback(null, result);
    })
};

var update = function(model, conditions, update, options, callback) {
    model.update(conditions, update, options, function(err, result) {
        if (err) {
            return callback(err);
        }
        callback(null, result);

    });
};

var remove = function(model, condition, callback) {
    model.remove(condition, function(err, result) {
        if (err) {
            return callback(err);
        } else callback(null, result);
    });
};


var count = function(model, condition, callback) {
    model.count(condition, function(error, count) {
        if (error) {
            console.log("Error Get Count: ", error);
            return callback(error);
        }
        return callback(null, count);
    })
};

var drop = function(model, callback) {
    model.drop(function(error, count) {
        if (error) {
            console.log("error dropping : ", error);
            return callback(error);
        }
        return callback(null, count);
    })
};

var insert = function(model, data, options, callback) {
    model.collection.insert(data, options, function(err, result) {
        if (err) callback(err);
        else callback(null, result);
    })
};

let bulkInsert = function(model, data, callback) {
    model.collection.insertMany(data, function(err, result) {
        if (err) callback(err);
        else callback(null, result);
    })
};


module.exports = {
    saveData: saveData,
    getData: getData,
    update: update,
    remove: remove,
    insert: insert,
    count: count,
    findAndUpdate: findAndUpdate,
    drop,
    bulkInsert
};