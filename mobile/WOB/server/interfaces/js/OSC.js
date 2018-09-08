////////////////////////////////////////////////////////////
///////////////////////// OSC /////////////////////////////
Trajectoires.OSC = {
    //OSC Protocol
    root_address : '/spat',
    traj_suffix : '/traj',
    pos_address : '/spat/posxyz',
    trajpoint_address : '/spat/trajpoint',
    traj_address : '/spat/traj',
    traj_new_address : '/spat/newtraj',
    play_address : '/spat/play',
    record_address : '/spat/record',
    orientation_address : '/spat/orientation',
    draw_address : '/spat/draw',

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
            return Trajectoires.OSC.isInteger(elem) ? 'i' : 'f';;
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
            tt += Trajectoires.OSC.getTypeForElement(args[i]);
        }
        return tt;
    },

    sendMessage : function(address, msg) {
        var tt = Trajectoires.OSC.getTypesForArgs(msg);
        Interface.OSC.send(address, tt, msg );
    },

    //RECEIVING MESSAGE
    processMessages : function(msg) {
        var address = msg.address;
        var split = address.split('/');
        
        //test for the correct namespace
        console.log(split[1]);
        if(split[1].indexOf("spat") != -1 ){
            console.log(split[2]);
            if(split[2].indexOf("source") != -1){
                var nb = (split[2].replace("source",""));
                var sourcenb = Number(nb);
                var curve = new TimedCurve();
                for (var k =0; k<msg.parameters.length/4;k++) {
                  curve.addTimedPoint(msg.parameters[4*k],msg.parameters[4*k+1],msg.parameters[4*k+2],msg.parameters[4*k+3]);
                }
                var manager = Trajectoires.TrajManager;
                manager.trajectories.push(curve);
                curve.changeSource(sourcenb); // care : to change the source of a curve, the curve need to be already pushed in trajectories 
                Trajectoires.View.traj_repaint();
                //manager.selectCurve(manager.trajectories.length-1);
            }
        }
    },


    //FACILITIES
    sendPosxyzMsg : function(msg) {
        Trajectoires.OSC.sendMessage(Trajectoires.OSC.pos_address, msg);
    },

    sendTrajPoint : function(msg) {
        Trajectoires.OSC.sendMessage(Trajectoires.OSC.trajpoint_address, msg);
    },

    //OLD VERSION
    // sendTraj : function(msg) {
    //    Trajectoires.OSC.sendMessage(Trajectoires.OSC.traj_address, msg);
    //},

    sendTraj : function(number, msg) {
        Trajectoires.OSC.sendMessage(Trajectoires.OSC.root_address + "/source" + number + Trajectoires.OSC.traj_suffix, msg);
    },

    sendPlay : function(msg) {
        Trajectoires.OSC.sendMessage(Trajectoires.OSC.play_address, msg);
    },

    sendRecord : function(msg) {
        Trajectoires.OSC.sendMessage(Trajectoires.OSC.record_address, msg);
    },

    sendOrientation : function(msg){
        Trajectoires.OSC.sendMessage(Trajectoires.OSC.orientation_address, msg);
    },

    sendNewTraj : function(msg){
        Trajectoires.OSC.sendMessage(Trajectoires.OSC.traj_new_address, msg);
    },

    sendDraw : function(msg) {
        Trajectoires.OSC.sendMessage(Trajectoires.OSC.draw_address, msg);
    },

    streamCurveLastPoint : function(curve) {
        var last_index = curve.X.length - 1;
        this.streamCurvePoint(curve, last_index);
    },

    streamNewCurve : function(index){
        Trajectoires.OSC.sendNewTraj(index);
    },

    streamCurvePoint : function(curve, index) {
        Trajectoires.OSC.sendPosxyzMsg([curve.sourceNumber, curve.X[index], curve.Y[index], curve.Z[index], curve.t[index]]);
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
            Trajectoires.OSC.sendTrajPoint(oscPoint);
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
        Trajectoires.OSC.sendTraj(curve.sourceNumber, args);
    },

//PREVIOUS VERSION
   //     sendCurveSingleMessageOSC : function(curve, id) {
    //    var args = [];
    //  args.push(id);
    //    for (var i = 0; i < curve.X.length; i++) {
    //        args.push(curve.X[i]);
    //        args.push(curve.Y[i]);
    //        args.push(curve.Z[i]);
    //        args.push(curve.t[i]);
    //    }
    //    Trajectoires.OSC.sendTraj(args);
    //
    //},


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
        Trajectoires.OSC.sendMessage("/savenimtraj", args);
    }

};

