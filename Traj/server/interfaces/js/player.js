
Traj.Player = {
	
	loopMode : false,
    requestId : undefined,
    loopID : undefined,
    isPlaying : false,
    isMulti : false,


    //This methods plays the curves from their indexes
    playCurves : function (indexes){

        
        
        Traj.Player.isPlaying = true;

        //Find longest curves for the time slider range
        var longestCurveIdx = Traj.Manager.longestCurveIdxOfPlayedCurve(indexes);
        var maxDuration = Traj.Manager.trajectories[longestCurveIdx].getDuration();
        Traj.Manager.selectCurve(longestCurveIdx);

        //time variables
        var begin = new Date().getTime(),
        now;

        // check if the slider is not at the end (or near)
        // if it is not, change the begin time (if it is, leave it to restart at the begining)
        var timeSliderPosition = Traj.Events.getSliderValue();
        if (timeSliderPosition < maxDuration - 100) {
            begin -= timeSliderPosition;
        }

        Traj.OSC.sendPlay("start");

        (function loopMulti() {
            // get time for new frame
            now = new Date().getTime() - begin;
            // update the time slider
            Traj.Events.setSliderValue(now);
            // clear dyn canvas
            Traj.View.dyn_repaint();
            //stop if the current time is less than the whole duration
            if(now > maxDuration){
                //if loop mode then relaucnh the palying
                if (Traj.Player.loopMode) { 
                    
                    cancelAnimationFrame(this.requestId);
                    this.requestId = undefined;
                    Traj.OSC.sendPlay("end");
                    Traj.Player.playCurves(indexes);
                    return;
                }else{
                    Traj.Player.stopPlayActions();
                    return;
                }  
            } else {
                //process each curve
                for (var k=0; k<indexes.length;k++) {

                    var curve = Traj.Manager.trajectories[indexes[k]];

                    //do it only if the curve is not finished.
                    if(!(now > curve.getDuration())) {

                        var idx = Traj.Utils.findPointIdx(now,curve),
                        pointCoord = Traj.Utils.interpolate(now,curve,idx),
                        x = pointCoord[0],
                        y = pointCoord[1],
                        z = pointCoord[2],
                        orientation = pointCoord[4];

                        if (!isNaN(x)&&!isNaN(y)) {

                            //Send OSC messages
                            Traj.OSC.streamPoint(curve.sourceNumber,[x,y,z]);
                            Traj.OSC.sendOrientation(curve.sourceNumber,orientation);

                            //Update the display (paint playHead and curve segment)
                            Traj.Player.repaintPointWithOrientation(curve,[x,y], orientation); 
                            Traj.Player.repaintCurve(curve,idx,idx-1);

                            //Update the Z-slider value for the longest curve only
                            if(indexes[k]===longestCurveIdx){
                                Traj.Events.setZSliderValue(z);
                            }
                        }
                    }
                }
                Traj.Player.requestId = requestAnimationFrame(loopMulti);
            }
        }())
    },

    stopPlayActions : function() {
        if (this.isPlaying) {
            if (this.requestId) {
                cancelAnimationFrame(this.requestId);
                this.requestId = undefined;
            }
           // Traj.View.dyn_repaint();
            Traj.Player.isPlaying = false;
            Traj.OSC.sendPlay("end");

            var playButton = document.getElementById('playButton');
            playButton.innerHTML = 'Play';
        }
    },

    repaintPointWithOrientation : function(curve,point,orientation) {
        var dyn_ctx = Traj.View.dyn_ctx;
        dyn_ctx.strokeStyle = curve.color;

        if (point && orientation) {
            Traj.View.drawOrientationForPoint(dyn_ctx, point, orientation);
            //draw large point 
            var pos = Traj.Utils.convertUnitsIntoCanvasPos(point);
            Traj.View.drawPoint(dyn_ctx,pos , 18);
        }
    },

    repaintCurve : function(curve,index,lastIndex) {
        var dyn_ctx = Traj.View.dyn_ctx,
        pos,
        last_pos;

        dyn_ctx.lineWidth = Traj.View.CURVE_ACTIVE_STROKE_SIZE *1.3;
        dyn_ctx.strokeStyle = curve.color;
        //Traj.View.traj_repaint();
        if (index>0) {
            for (var idx =0;idx<index+1;idx++) {
                pos = Traj.Utils.convertUnitsIntoCanvasPos([curve.X[idx], curve.Y[idx]]);
                last_pos =  Traj.Utils.convertUnitsIntoCanvasPos([curve.X[idx-1], curve.Y[idx-1]]);

                // draw large curve
                dyn_ctx.beginPath();
                dyn_ctx.moveTo(last_pos[0], last_pos[1]);
                dyn_ctx.lineTo(pos[0], pos[1]);
                dyn_ctx.stroke();
            }
        }
    },

    //resets the player (stop playing and refresh display)
    reset : function (){
        Traj.Player.stopPlayActions();
        Traj.Events.setZSliderValue(0);
        document.getElementById('playButton').innerHTML = 'Play';
        Traj.View.repaintAll();
    },

    ////////////////////////////////////
    ////////// CALLED FROM HTML ////////
    ////////////////////////////////////

    updateLoopMode : function(){
        Traj.Player.loopMode = document.getElementById("flip-loop").checked;
        Traj.Player.reset();
    },

    updatePlayMode : function(){
        Traj.Player.isMulti = document.getElementById("flip-PlayMode").checked;
        Traj.Player.reset();
    }
}