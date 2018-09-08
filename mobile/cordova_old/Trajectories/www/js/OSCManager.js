// OSC MANAGER
var osc_host = "127.0.0.1";
var osc_outPort = 2000;

var osc_sender;

var osc_inPort = 2001;
var osc_listener;

var IP_ADDRESS = "127.0.0.1";

//OSC Protocol
var osc_pos_address = '/spat/posxyz';
var osc_trajpoint_address = '/spat/trajpoint';
var osc_play_address = '/spat/play'
var osc_record_address = '/spat/record'

function osc_startOSC() {
    if (osc_sender != null)
        osc_sender.close();
    osc_host = document.getElementById("host").value;
    osc_outPort = document.getElementById("port").value;
    osc_sender = new OSCSender(osc_host, osc_outPort);

    if (osc_listener != null) {
        osc_listener.stopListening();
        osc_listener.close();
    }
    osc_listener = new OSCListener(osc_inPort);
    osc_listener.on("/", osc_ReceiveonSuccess);
    osc_listener.startListening(osc_ReceiveonSuccess, osc_onfailure);
    networkinterface.getIPAddress(function (ip) {
        IP_ADDRESS = ip;
        alert(IP_ADDRESS);
    });
}


function osc_stopOSC() {
    if (osc_sender != null)
        osc_sender.close();

    if (osc_listener != null) {
        osc_listener.stopListening(osc_ReceiveonSuccess);
        osc_listener.close();
    }
    console.log("OSC stopped");
}

function osc_onfailure(message) {
    console.log("OSC Listener Error " + message);
    alert("OSC Listener Error " + message);
}

function osc_onSuccess(message) {
    //console.log("OSC Success " + message);
}

function osc_ReceiveonSuccess(message) {
    console.log("OSC receive Success " + message);
}

function osc_processMessages(message) {
    console.log("OSC receive message");
}

// Sending message throught osc
function osc_sendMessageNoDouble(address, msg) {
    if (isCordova)
        osc_sender.sendnodouble(address, msg, osc_onSuccess, osc_onfailure);
}

function osc_sendMessage(address, msg) {
    if (isCordova)
        osc_sender.send(address, msg, osc_onSuccess, osc_onfailure);
}

//Message with protocol
function osc_sendPosxyzMsg(msg) {
    osc_sendMessageNoDouble(osc_pos_address, msg);
}

function osc_sendTrajPoint(msg) {
    osc_sendMessageNoDouble(osc_trajpoint_address, msg);
}

function osc_sendPlay(msg) {
    osc_sendMessageNoDouble(osc_play_address, msg);
}

function osc_sendRecord(msg) {
    osc_sendMessageNoDouble(osc_record_address, msg);
}