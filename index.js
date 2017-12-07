'use strict';

// This is an example of using p2pspider, you can change the code to make it do something else.
var fs = require('fs');
var path = require('path');
var parseTorrent = require('parse-torrent');

var MongoClient = require('mongodb').MongoClient;
var DB_CONN_STR = 'mongodb://localhost:27017/TorrentDB';

var bencode = require('bencode');
var P2PSpider = require('./lib');
var shelljs = require('shelljs/global');

var collection = null;

var p2p = P2PSpider({
    nodesMaxSize: 400,
    maxConnections: 800,
    timeout: 10000
});

p2p.ignore(function (infohash, rinfo, callback) {
    var torrentFilePathSaveTo = path.join(__dirname, "torrents", infohash + ".torrent");
    fs.exists(torrentFilePathSaveTo, function(exists) {
        callback(exists); //if is not exists, download the metadata.
    });
});

p2p.on('metadata', function (metadata) {
    var torrentFilePathSaveTo = path.join(__dirname, "torrents", metadata.infohash + ".torrent");
    fs.writeFile(torrentFilePathSaveTo, bencode.encode({'info': metadata.info}), function(err) {
        if (err) {
            return console.error(err);
        }
        var info =  parseTorrent(fs.readFileSync(__dirname + '/torrents/' + metadata.infohash +'.torrent'));
        console.log(metadata.infohash + ".torrent has saved.    fileName is -->",info.name);
        var dbInfo = {
            torrent:metadata.infohash +'.torrent',
            fileName:info.name,
            files:getFileInfo(info.files)
        };
        insertData(dbInfo,function(result) {
            console.log('result.result --->',result.result);
        });

    });
});

var getFileInfo = function (files) {
    var filesArr = [];
    files.forEach(function(item,index){
        var info = {
            fileName:item.name,
            size:item.length
        }
        filesArr.push(info);
    });
    return filesArr;
}

/**
 * 插入数据
 * */
var insertData = function(data,callback) {
    //插入数据
    collection.insert(data, function(err, result) {
        if(err) {
            console.log('Error:'+ err);
            startDB();
            return;
        }
        callback(result);
    });
}

var startDB = function () {
    exec('/usr/local/mongodb/bin/mongod  --shutdown --dbpath /usr/local/mongodb/data/');
    exec('/usr/local/mongodb/bin/mongod --dbpath=/usr/local/mongodb/data --logpath=/usr/local/mongodb/logs --logappend  --port=27017 --fork');
}


MongoClient.connect(DB_CONN_STR, function (err, db) {
    if (err) {
        startDB();
        exec('node index.js')
        process.exit(1);
    } else {
        collection = db.collection('torrentInfo');
        p2p.listen(6881, '0.0.0.0');
    }
});
