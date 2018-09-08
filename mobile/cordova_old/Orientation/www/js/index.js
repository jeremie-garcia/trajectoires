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



var app = {
    // Application Constructor

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
            this.initFastClick();
            document.addEventListener("deviceready", this.onDeviceReady, false);
            document.addEventListener("pause", this.onPause, false);
            document.addEventListener("resume", this.onResume, false);
            document.addEventListener("volumedownbutton", this.onVolumeDownKeyDown, false);
            document.addEventListener("volumeupbutton", this.onVolumeUpKeyDown, false);

        } else {
            app.receivedEvent('deviceready');
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
        app.receivedEvent('deviceready');

        //start OSC
        startOSC();

        var btn = document.getElementById('record-btn');

        btn.addEventListener('touchstart', startRecording, false);
        btn.addEventListener('touchend', stopRecording, false);

        if (window.DeviceOrientationEvent) {
            window.addEventListener("deviceorientation", process, false);
        } else {
            // Le navigateur ne supporte pas l'événement deviceorientation
        }

    },
    // Update DOM on a Received Event
    receivedEvent: function (id) {
        console.log("App received event " + id);
    },

    onPause: function () {
        console.log("On Pause");
        stopOSC();
    },

    onResume: function () {
        console.log("On Resume");
        startOSC();
    },

    onVolumeDownKeyDown: function () {
        console.log("Key Volume Down");
    },

    onVolumeUpKeyDown: function () {
        console.log("Key VOlume Up");
    }
};


//orientation process method

function process(event) {
    var orientation_args = [];
    orientation_args[0] = event.alpha *1;
    orientation_args[1] = event.beta *1;
    orientation_args[2] = event.gamma *1;
    sendOscOrientation(orientation_args);
}

// RECORDING METHODS
var isrecording = false;

function startRecording() {
    isrecording = true;
    document.getElementById('record-btn').style.backgroundColor = 'green';
}

function stopRecording() {
    document.getElementById('record-btn').style.backgroundColor = 'red';
    isrecording = false;
}