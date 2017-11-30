var fs = require('fs');
var parseTorrent = require('parse-torrent');

var fileDirectory = __dirname + '/torrents/';

var MongoClient = require('mongodb').MongoClient;
var DB_CONN_STR = 'mongodb://localhost:27017/TorrentDB';

var collection = null;

/**
 * 连接数据库
 * */
MongoClient.connect(DB_CONN_STR, function(err, db) {
    console.log("连接成功！");
    collection = db.collection('torrentInfo');

    if(fs.existsSync(fileDirectory)){
        fs.readdir(fileDirectory, function (err, files) {
            if (err) {
                console.log(err);
                return;
            }
            files.forEach(function (filename) {
                var path = fileDirectory + filename;
                var info =  parseTorrent(fs.readFileSync(path));
                var dbInfo = {
                    torrent:filename,
                    fileName:info.name,
                    files:getFileInfo(info.files)
                };
                insertData(dbInfo,function(result) {
                    console.log(result.result);
                });
            });
        });
    }
    else {
        console.log(fileDirectory + "  Not Found!");
    }

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
            return;
        }
        callback(result);
    });
}