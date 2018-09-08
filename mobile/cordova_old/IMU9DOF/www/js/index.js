var dt = 100; //ms interval time

var imuData = {
    a: [0, 0, 0],
    g: [0, 0, 0],
    m: [0, 0, 0],
    b: 0
};


/***************/
/*ACCELEROMETER*/
/***************/

function accelerometerSuccess(acceleration) {
    imuData.a[0] = acceleration.x;
    imuData.a[1] = acceleration.y;
    imuData.a[2] = acceleration.z;
};

function accelerometerError() {
    alert('onError!');
};


/***************/
/*  GYROSCOPE  */
/***************/

function gyroscopeSuccess(speed) {
    imuData.g[0] = speed.x;
    imuData.g[1] = speed.y;
    imuData.g[2] = speed.z;
};

function gyroscopeError() {
    alert('onError!');
};




function updateIMUData() {
    navigator.accelerometer.getCurrentAcceleration(accelerometerSuccess,
        accelerometerError);
    navigator.gyroscope.getCurrentAngularSpeed(gyroscopeSuccess, gyroscopeError);
}




var app = {
    // Application Constructor

    initialize: function () {
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
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function (id) {
        //init the canvas and listneners
        createThreeCanvas();

        setInterval(function () {
            updateIMUData();
            computeIMU();
            displayThree();
        }, samplePeriodMillis);

    }
};

/***************/
/*     OSC     */
/***************/

var host = "127.0.0.1";
var port = 1234;
var address = "/imu";

function startOscSend() {
    host = document.getElementById("host").value;
    port = document.getElementById("port").value;
    sendOsc("hello");
};

function sendOsc(data) {
    var sender = new OSCSender(host, port);

    sender.send(address, data, null, null);
    sender.close();
};

//LED
$('.led').click(function () {
    $('this').toggleClass('led-green');
});