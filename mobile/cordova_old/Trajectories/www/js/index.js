/* Made by Xavier Favory & Jérémie Garcia
 * 19/03/2015
 *- clean code
 *- add logs
 
 * 31/03/2015
 *- clean code
 *- fix iOS draw bug
 *- if (logger)
 
 TODO : fix OSC iOS bugs, clean initobjects.js
 */
var logging = true;
var isCordova = false;

var app = {
    // Application Constructor


    // this.logger;

    initialize: function () {
        console.log("console log init");
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function () {
        if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/)) {
            isCordova = true;
            this.initFastClick();
            document.addEventListener("deviceready", this.onDeviceReady, false);
            document.addEventListener("pause", this.onPause, false);
            document.addEventListener("resume", this.onResume, false);
            document.addEventListener("volumedownbutton", this.onVolumeDownKeyDown, false);
            document.addEventListener("volumeupbutton", this.onVolumeUpKeyDown, false);
            
        } else {
            app.onDeviceReady();
            logger = false;
        }
    },
    initFastClick: function () {
        window.addEventListener('load', function () {
            FastClick.attach(document.body);
        }, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function () {
        console.log("device ready, start making you custom calls!");

        //If we are in Cordova, Init the Plugins (OSC and Log, Orientation or Acceleration)
        if (isCordova) {
            osc_startOSC();

            //this.logger = new FileLogger();
        }
        //create a canvas Manager
        traj_initCanvas();
        traj_initEvents();
    },
    onPause: function () {
        console.log("On Pause");
        if (logging) writeLog("App Pause");
        osc_stopOSC();
        currentLogtoConsole();
    },

    onResume: function () {
        console.log("On Resume");
        if (logging) writeLog("App Resume");
        osc_startOSC();
    },

    onVolumeDownKeyDown: function () {
        console.log("Key Volume Down");
        if (logging) writeLog("App KeyVolumeDown");
    },

    onVolumeUpKeyDown: function () {
        console.log("Key VOlume Up");
        if (logging) writeLog("App KeyVolumeUp");
    }
};