var Q = require('q'),
    Db = require('mongodb').Db,
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server,
    HOST = process.env['MONGO_NODE_DRIVER_HOST'] || 'localhost',
    PORT = process.env['MONGO_NODE_DRIVER_PORT'] || Connection.DEFAULT_PORT,
    _dbPromiseMap = {};

/**
 * Returns a promise that resolves to an open DB.  Calling db(...) again with the same parameters at a later time (but
 * before a call to closeAll) will yield the same promise and thus the same open db.  To close db connections, see
 * closeAll().
 *
 * @param dbName
 * @param host
 * @param port
 * @return {*}
 */
exports.db = function (dbName, host /*omit for default*/, port /*omit for default*/) {
    var dbKey = dbName + (host || "") + (port || ""),
        dbPromise = _dbPromiseMap[dbKey];

    if (!dbPromise) {
        dbPromise = Q.fcall(function () {
            var db = new Db(dbName, new Server(host || HOST, port || PORT, {}));

            return Q.ncall(db.open, db);
        });

        _dbPromiseMap[dbKey] = dbPromise;
    }

    return dbPromise;
};

/**
 * Returns a promise that resolves to a collection.  A new collection will be created in the db if one does not exist.
 *
 * @param db
 * @param collectionName
 * @return {*}
 */
exports.collection = function (db, collectionName) {
    var dbPromise = null;

    if (db instanceof Db) {
        dbPromise = Q.fcall(function () {
            return db;
        });
    } else {
        // Promise
        dbPromise = db;
    }

    return dbPromise.then(function (db) {
        return Q.ncall(db.collection, db, collectionName);
    }).then(function (collection) {
            if (!collection) {
                return Q.ncall(db.createCollection, db, collectionName);
            } else {
                return collection;
            }
        });
}

/**
 * Closes all dbs that were opened via this module.  Calling db(...) after this will result in a new db open promise
 * being created.
 *
 * @return {*}
 */
exports.closeAll = function () {
    return Q.fcall(function () {
        for (var key in _dbPromiseMap) {
            if (_dbPromiseMap.hasOwnProperty(key)) {
                var dbPromise = _dbPromiseMap[key];
                delete _dbPromiseMap[key];

                return dbPromise.then(function (db) {
                    return Q.ncall(db.close, db);
                }).then(function () {
                        // Call close all again to move onto next dbPromise
                        return exports.closeAll();
                    });
            }
        }

        // If we got here, we do not have any more dbPromises in our map
        _dbPromiseMap = {};

        return null;
    });
}