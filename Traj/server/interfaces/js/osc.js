////////////////////////////////////////////////////////////
///////////////////////// OSC /////////////////////////////
Traj.OSC = {
    //OSC Protocol
    spat_address : '/spat',
    traj_address : '/traj',
    pos_address : '/traj/posxyz',
    trajpoint_address : '/traj/trajpoint',
    traj_new_address : '/traj/newtraj',
    traj_suffix : '/traj',
    play_address : '/traj/play',
    record_address : '/traj/record',
    orientation_address : '/traj/orientation',
    draw_address : '/traj/draw',

    // SENDING MESSAGES
    isInteger : function(value) {
        if ((undefined === value) || (null === value)) {
          return false;
        }
        return value % 1 == 0;
    },

    getTypeForElement : function(elem){
        var type = typeof elem;
        switch (type) {
            case 'string':
            return 's';
            break;
            case 'boolean':
            return 'b';
            break;
            case 'number':
            return Traj.OSC.isInteger(elem) ? 'i' : 'f'; //not using doubles because Max does not understand them
            break;
            default:
            return 'f';
        }
    },

    getTypesForArgs : function(args){
        var tt = '';

        if(typeof args === 'string')
            return 's';

        for(var i = 0; i < args.length; i++) {
            tt += Traj.OSC.getTypeForElement(args[i]);
        }
        return tt;
    },

    sendMessage : function(address, msg) {
        var tt = Traj.OSC.getTypesForArgs(msg);
        Interface.OSC.send(address, tt, msg );
    },

    //RECEIVING MESSAGE
    processMessages : function(msg) {
        var address = msg.address;
        var split = address.split('/');
        
        //test for the correct namespace
     //  console.log(split[1]);
        //receiving the client ID (used for choosing curves)
         if(split[1].indexOf("id") != -1 ){
            Traj.Manager.processClientId([msg.parameters[0],msg.parameters[1]]);
         }

        if(split[1].indexOf("spat") != -1 ){
            //console.log(split[2]);
            if(split[2].indexOf("source") != -1){
                var nb = (split[2].replace("source",""));
                var sourcenb = Number(nb);
                var curve = new TimedCurve();
                for (var k =0; k<msg.parameters.length/4;k++) {
                  curve.addTimedPoint(msg.parameters[4*k],msg.parameters[4*k+1],msg.parameters[4*k+2],msg.parameters[4*k+3]);
                }
                var manager = Traj.Manager;
                manager.trajectories.push(curve);
                manager.updateMultiPlayIndexes(sourcenb, manager.trajectories.length - 1);
                curve.changeSource(sourcenb); // care : to change the source of a curve, the curve need to be already pushed in trajectories 
                Traj.View.traj_repaint();
                //manager.selectCurve(manager.trajectories.length-1);
            }
        }
    },


    //FACILITIES
    sendPosxyzMsg : function(msg) {
        Traj.OSC.sendMessage(Traj.OSC.pos_address, msg);
    },

    sendSpatMessage: function(msg){
        Traj.OSC.sendMessage(Traj.OSC.spat_address,msg);
    },

    sendTrajPoint : function(msg) {
        Traj.OSC.sendMessage(Traj.OSC.trajpoint_address, msg);
    },

    //OLD VERSION
    // sendTraj : function(msg) {
    //    Traj.OSC.sendMessage(Traj.OSC.traj_address, msg);
    //},

    sendTraj : function(number, msg) {
        Traj.OSC.sendMessage(Traj.OSC.traj_address + "/source" + number + Traj.OSC.traj_suffix, msg);
    },

    sendPlay : function(msg) {
        Traj.OSC.sendMessage(Traj.OSC.play_address, msg);
    },

    sendRecord : function(msg) {
        Traj.OSC.sendMessage(Traj.OSC.record_address, msg);
    },

    sendOrientation : function(sourceNB, msg){
        Traj.OSC.sendSpatMessage(['source',sourceNB, 'yaw', msg[0]]);
        //Traj.OSC.sendSpatMessage(['source', Traj.Manager.currentSource, 'pitch', msg[1]]);
        //Traj.OSC.sendSpatMessage(['source', Traj.Manager.currentSource, 'roll', msg[2]]);
    },

    sendNewTraj : function(msg){
        Traj.OSC.sendMessage(Traj.OSC.traj_new_address, msg);
    },

    sendDraw : function(msg) {
        Traj.OSC.sendMessage(Traj.OSC.draw_address, msg);
    },

    streamCurveLastPoint : function(curve) {
        var last_index = curve.X.length - 1;
        this.streamCurvePoint(curve, last_index);
    },

    streamNewCurve : function(index){
        Traj.OSC.sendNewTraj(index);
    },

    streamCurvePoint : function(curve, index) {
        //ussing Spat formatting source ID xyz x y z
        Traj.OSC.streamPoint(curve.sourceNumber, [curve.X[index], curve.Y[index], curve.Z[index]]);
    },

    streamPoint : function(sourceNb, coords){
        //ussing Spat formatting source ID xyz x y z
        Traj.OSC.sendSpatMessage( ['source', sourceNb, 'xyz',coords[0], coords[1], coords[2]]);
    },

    sendCurveOSC : function(curve, id) {
        var oscPoint;
        for (var i = 0; i < curve.X.length; i++) {
            oscPoint = [];
            oscPoint.push(id);
            oscPoint.push(curve.X[i]);
            oscPoint.push(curve.Y[i]);
            oscPoint.push(curve.Z[i]);
            oscPoint.push(curve.t[i]);
            Traj.OSC.sendTrajPoint(oscPoint);
        }
    },

    sendCurveSingleMessageOSC : function(curve, id) {
        var args = [];
        for (var i = 0; i < curve.X.length; i++) {
            args.push(curve.X[i]);
            args.push(curve.Y[i]);
            args.push(curve.Z[i]);
            args.push(curve.t[i]);
        }
        Traj.OSC.sendTraj(curve.sourceNumber, args);
    },

    saveAntescofo : function (curve, id, sessionID){
       var args = [];
        args.push(1+ sessionID); //to have same labels ias in the UI
        args.push(id);
        for (var i = 0; i < curve.X.length; i++) {
            args.push(curve.X[i]);
            args.push(curve.Y[i]);
            args.push(curve.Z[i]);
            args.push(curve.t[i]);
        }
        Traj.OSC.sendMessage("/savenimtraj", args);
    }

};

