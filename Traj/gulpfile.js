var NwBuilder = require('nw-builder');
var gulp = require('gulp');
var gutil = require('gulp-util');

 
gulp.task('traj', function () {

    var nw = new NwBuilder({
        version: '0.12.1',
        macIcns: './icon-design/icon.icns',
        //winIco: './icon-design/icon.ico', //can only use that on win or need WINE
        appVersion:'1.0.0',
        buildType: 'versioned',
        //zip:'true', //if activated this prevents the traj folder to appear
        files: [ './**',
        '!./gulpfile.js',
        '!./icon-design/**',
        '!./cache/**',
        '!./build/**',
        //'!./node_modules/**', attempt to remove the dev packages by installing node --prodcution afterwards
        '!./node_modules/gulp/**',
        '!./node_modules/gulp-util/**',
        '!./node_modules/nw-builder/**'],
        platforms: ['osx', 'win32', 'linux32'] // change this to 'win' for/on windows
        //platforms: ['osx'] // change this to 'win' for/on windows
    });
 
    // Log stuff you want
    nw.on('log', function (msg) {
        gutil.log('nw-builder', msg);
    });
 
    // Build returns a promise, return it so the task isn't called in parallel
    return nw.build().catch(function (err) {
        gutil.log('nw-builder', err);
    });
});