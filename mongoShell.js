var fs = require('fs');
var parseTorrent = require('parse-torrent');

var fileDirectory = __dirname + '/torrents/';

var MongoClient = require('mongodb').MongoClient;
var DB_CONN_STR = 'mongodb://localhost:27017/TorrentDB';

var collection = null;

/**
 * 连接数据库
 * */
MongoClient.connect(DB_CONN_STR, async function (err, db) {
    console.log("连接成功！");
    collection = db.collection('torrents');

    if (fs.existsSync(fileDirectory)) {
        fs.readdir(fileDirectory, async function (err, files) {
            if (err) {
                console.log(err);
                return;
            }
            saveTorrentsWithDB(files);
        });
    }
    else {
        console.log(fileDirectory + "  Not Found!");
    }

});


const saveTorrentsWithDB = function (torrentsFiles) {
    if(torrentsFiles.length <= 0){
        console.log('录入完成');
        return
    }
    var filename = torrentsFiles.pop();
    var path = fileDirectory + filename;
    try {
        var info = parseTorrent(fs.readFileSync(path));
        var dbInfo = {
            torrent: filename,
            fileName: info.name,
            files: getFileInfo(info.files)
        };
        insertData(dbInfo, function (result) {
            console.log('filename -->', filename);
            console.log(result.result);
            saveTorrentsWithDB(torrentsFiles);
        });
    } catch (e) {
        console.log('error');
        fs.unlink(path);
        saveTorrentsWithDB(torrentsFiles);
    }
}

var getFileInfo = function (files) {
    var filesArr = [];
    files.forEach(function (item, index) {
        var info = {
            fileName: item.name,
            size: item.length
        }
        filesArr.push(info);
    });
    return filesArr;
}

/**
 * 插入数据
 * */
var insertData = function (data, callback) {
    //插入数据
    collection.insert(data, function (err, result) {
        if (err) {
            console.log('Error:' + err);
            return;
        }
        callback(result);
    });
}