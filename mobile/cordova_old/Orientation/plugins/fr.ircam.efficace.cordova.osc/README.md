cordova-osc-plugin
==================
This is a fork from https://github.com/sy1vain/cordova-osc-plugin, a simple OSC plugin. It adds comments and an updated version of the JavaOsc Lib.

Install OSC using the Cordova CLI:

$ cordova plugin add https://github.com/jeremie-garcia/cordova-osc-plugin.git

Supported platforms
===================
* Android
* iOS

Supported features
==================
* OSC Receive
* OSC Send

Example
==================
* Sending an OSCMessage
```javascript
function sendOscMsg() {
    var host = "127.0.0.1";
    var port = 1234;
    var address = "/hello";
    var data =  "world";
    var sender = new OSCSender(host, port);
    sender.send(address, data, null, null);
    sender.close();
}
```

Android OSC relies on https://github.com/hoijui/JavaOSC (included as a JAR file)

iOS OSC relies on https://github.com/danieldickison/CocoaOSC