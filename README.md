Introduction
============

This is a node.js module which wraps the [mongodb module](https://github.com/mongodb/node-mongodb-native) with the
[q promises module](https://github.com/kriskowal/q).  It handles opening a db (and maintaining the open db object) as
well as accessing collections (creating them if need be).  If you query for the same db multiple times during the
lifetime of your node app, you'll be handed the same open db object (unless you explicitly close the db with a call to
closeAll()).

Installation
============

    npm install q-mongodb

Usage
=====

    var QMongoDB = require('q-mongodb');

    QMongoDB.db('my_db').then(function(db) {
        return QMongoDB.collection(db, 'people');
    }).then(function(collection) {
        // Perform standard collection operations here
    }).then(function() {
        return QMongoDB.closeAll();
    });
