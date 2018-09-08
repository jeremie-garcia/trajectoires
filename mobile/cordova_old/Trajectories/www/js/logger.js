//////////////////////
// LOGGING UTILITIES//
// jgarcia 19/03/2015
//////////////////////


var logger_file;
var debug = false;
var logger = true;

function initlogger() {

    window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dir) {
        if (debug)
            console.log("got main dir", dir);

        var log_path = "log.txt";
        dir.getFile(log_path, {create: true}, function (file) {
            if (debug)
                console.log("got the file", file);
            logger_file = file;
        });
    });
    if (logger) writeLog("App started");
}

function writeLog(str) {
    if (!logger_file) {
        console.log("Problem with the logger");
        return;
    }

    var log = (new Date()) + " " + str + "\n";
    if (debug)
        console.log("going to log " + log);
    logger_file.createWriter(function (fileWriter) {

        fileWriter.seek(fileWriter.length);

        var blob = new Blob([log], {
            type: 'text/plain'
        });
        fileWriter.write(blob);
        if (debug)
            console.log("ok, in theory i worked");
    }, log_fail);
}


function currentLogtoConsole() {
    if (!logger_file) {
        console.log("Problem with the logger");
        return;
    }

    logger_file.file(function (file) {
        var reader = new FileReader();

        reader.onloadend = function (e) {
            console.log(this.result);
        };

        reader.readAsText(file);
    }, log_fail);

}

function log_fail(e) {
    console.log("FileSystem Error");
    console.dir(e);
}