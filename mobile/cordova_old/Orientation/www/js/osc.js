// OSC METHODS //

var host = "127.0.0.1";
var port = 1234;
var sender;


function startOSC() {
    console.log("Starting OSC");
    if (sender != null)
        sender.close();
    host = document.getElementById("host").value;
    port = document.getElementById("port").value;
    sender = new OSCSender(host, port);
    console.log("OSC started");
}


function stopOSC() {
    if (sender != null)
        sender.close();
    console.log("OSC stopped");
}


function onfailure(message) {
    console.log("OSC Send Error " + message);
    alert("OSC Send Error " + message);
};

function onSuccess(message) {
    // Not used
};

function sendOscMessageNoDouble(address, msg) {
    sender.sendnodouble(address, msg, onSuccess, onfailure);
}

function sendOscMessage(address, msg) {
        sender.send(address, msg, onSuccess, onfailure);
    }
    //////////////////////////////////
    //PROTOCOL and SPECIFIC METHODS //
    //////////////////////////////////

var pos_address = '/spat/posxyz';
var trajpoint_address = '/spat/trajpoint';
var play_address = '/spat/play';
var record_address = '/spat/record';
var orientation_address = '/spat/orientation';
var orientation_alpha = '/alpha';
var orientation_beta = '/beta';
var orientation_gamma = '/gamma';

// Sending message throught osc
function sendPosxyzOscMsg(msg) {
    sendOscMessageNoDouble(pos_address, msg);
}

// for sending trajectories points
function sendOscTrajPoint(msg) {
    sendOscMessageNoDouble(trajpoint_address, msg);
}

function sendOscPlay(msg) {
    sendOscMessageNoDouble(play_address, msg);  // BUG when using sendOscMessage 
}                                               // Bug sometimes when sending play and rec message during sending position points 

function sendOscRecord(msg) {
    sendOscMessageNoDouble(record_address, msg);
}

function sendOscOrientation(msg){
    sendOscMessageNoDouble(orientation_address + orientation_alpha, msg[0]);
    sendOscMessageNoDouble(orientation_address + orientation_beta, msg[1]);
    sendOscMessageNoDouble(orientation_address + orientation_gamma, msg[2]);
}
