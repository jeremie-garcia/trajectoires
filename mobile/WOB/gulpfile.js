var NwBuilder = require('node-webkit-builder');
var gulp = require('gulp');
var gutil = require('gulp-util');
 
gulp.task('nw', function () {
 
    var nw = new NwBuilder({
        version: '0.12.1',
        macIcns: './icon-design/icon.icns',
        zip:'false',
        files: [ './**',
        '!./gulpfile.js',
        '!./icon-design/**',
        '!./cache/**',
        '!./build/**',
        '!./node_modules/gulp/**',
        './node_modules/gulp-util/**',
        './node_modules/node-webkit-builder/**'],
        //platforms: ['osx32', 'win32', 'linux32'] // change this to 'win' for/on windows
        platforms: ['osx'] // change this to 'win' for/on windows
    });
 
    // Log stuff you want
    nw.on('log', function (msg) {
        gutil.log('node-webkit-builder', msg);
    });
 
    // Build returns a promise, return it so the task isn't called in parallel
    return nw.build().catch(function (err) {
        gutil.log('node-webkit-builder', err);
    });
});