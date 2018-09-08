
Trajectoires.Player = {
	
	loopMode : false,
    requestId : undefined,
	loopID : undefined,
	isPlaying : false,


    play : function() {
        // Trajectoires.TrajManager.multiPlayChanged();
        // if (Trajectoires.TrajManager.playedCurves.length > 1) {
        //     this.playAllCurve();
        // } else { this.playCurrentCurve();}
        this.playCurrentCurve();
    },

    playCurve : function(curveIdx) {
        this.stopCurrentCurve();
        Trajectoires.Player.isPlaying = true;
        playButton.innerHTML = 'Pause';

        var curve = Trajectoires.TrajManager.trajectories[curveIdx],
            lengthTime = curve.lengthTime(),
            pointCoord,
            x = curve.X[0],
            y = curve.Y[0],
            xOld = curve.X[0],
            yOld = curve.Y[0],
            z = curve.Z[0],
            counter = 0,
            idx = 0,
            idxOld = 0;

        Trajectoires.OSC.sendPlay("start");

        var begin = new Date().getTime();

        var timeSliderPosition = Trajectoires.EventManager.getSliderValue(); // check if the slider is not at the end (or mostly)
        if (timeSliderPosition < lengthTime-100) {                           // if it is not, change the begin time (if it is, leave it to restart at the begining)
            begin -= timeSliderPosition;
        } 
        var now = new Date().getTime();
        pointCoord = Trajectoires.Utils.interpolate(now-begin,curve);
        xOld = pointCoord[1];
        yOld = pointCoord[2];

        (function loop() {
            // get time for new frame
            now = new Date().getTime() - begin;
            counter = (counter + 1) % 2; // can be use to render once of two loops

            // actualize time slider
            //if (counter ==1) {
            Trajectoires.EventManager.setSliderValue(now);
            //} 
            //find idx
            idx = Trajectoires.Utils.findPointIdx(now,curve);
            
            // [sourceNumber, X, Y, Z, t]
            pointCoord = Trajectoires.Utils.interpolate(now,curve,idx);
            x = pointCoord[1];
            y = pointCoord[2];
            z = pointCoord[3];

            if (!isNaN(x)&&!isNaN(y)) {

                //if (counter == 1) { 
                    Trajectoires.OSC.sendPosxyzMsg(pointCoord);   // send osc point
                //}
                // clear dyn canvas = large point
                Trajectoires.View.dyn_repaint();
                Trajectoires.Player.repaintPoint(curve,[x,y]);  // paint point
                xOld = x;
                yOld = y;

                Trajectoires.Player.repaintCurve(curve,idx,idxOld); // paint large curve
                idxOld = idx;
                
                Trajectoires.EventManager.setZSliderValue(z);
            }

            // test if the curve is ended and if loop is activated
            if (now > lengthTime) {
                Trajectoires.OSC.sendPlay("end");
                Trajectoires.View.traj_repaint();
                if (Trajectoires.Player.loopMode) {
                    Trajectoires.Player.playCurrentCurve();//playCurve(curveIdx);
                    return;
                }  
                    Trajectoires.Player.stopCurrentCurve();
                    Trajectoires.Player.isPlaying = false;             
                    return;  
            }
            
            Trajectoires.Player.requestId = requestAnimationFrame(loop);
        }())

    },

    playAllCurve : function() {        // LAG WHEN LOOP MODE. TODO : SAVE ALL THE LOADED DATA AND KEEP IT FOR THE NEXT CALL OF playAllCurve() (add a function that calls playAllCurve())
        this.stopCurrentCurve();

        Trajectoires.Player.isPlaying = true;

        var curvesIdx = Trajectoires.TrajManager.playedCurves; // A definir dans TrajManager

        var curveArray = [], 
            lengthTimeArray = [],
            pointCoordArray = [],
            xArray = [],
            yArray = [],
            xOldArray = [],
            yOldArray = [],
            idxArray = [],
            idxOldArray = [],
            counter = 0;

        for (var k=0; k<curvesIdx.length;k++) {
            var curve = Trajectoires.TrajManager.trajectories[curvesIdx[k]],
                lengthTime = curve.lengthTime(),
                pointCoord,
                x = curve.X[0],
                y = curve.Y[0],
                xOld = curve.X[0],
                yOld = curve.Y[0],
                idx = 0,
                idxOld = 0;

            curveArray[k] = curve;
            lengthTimeArray[k] = lengthTime;
            pointCoordArray[k] = pointCoord;
            xArray[k] = x;
            yArray[k] = y;
            xOldArray[k] = xOld; 
            yOldArray[k] = yOld;
            idxArray[k] = idx;
            idxOldArray[k] = idxOld;
        }

        Trajectoires.OSC.sendPlay("start");
        
        var begin = new Date().getTime();

        // check si le curseur du player est à la fin ou non et ajuste le begin de lecture
        var timeSliderPosition = Trajectoires.EventManager.getSliderValue();
        if (timeSliderPosition < lengthTime - 100) {
            begin -= timeSliderPosition;
        }

        // selection de la courbe la plus longue (pour le timeSlider)
        var longestCurveIdx = Trajectoires.TrajManager.longestCurveIdxOfPlayedCurve();
        Trajectoires.TrajManager.selectCurve(longestCurveIdx);
        var now = new Date().getTime();
        for (var k=0; k<curvesIdx.length;k++) {
            pointCoordArray[k] = Trajectoires.Utils.interpolate(now - begin,curveArray[k]);
            xOldArray[k] = pointCoordArray[k][1];
            yOldArray[k] = pointCoordArray[k][2];
        }

        (function loopMulti() {
            // get time for new frame
            now = new Date().getTime() - begin;
            counter = (counter + 1) % 2;

            // clear dyn canvas = large point
            Trajectoires.View.dyn_repaint();

            // actualize time slider
            Trajectoires.EventManager.setSliderValue(now);

            for (var k=0; k<pointCoordArray.length;k++) {
                if (lengthTimeArray[k]) {
                    idxArray[k] = Trajectoires.Utils.findPointIdx(now,curveArray[k]);
                    pointCoordArray[k] = Trajectoires.Utils.interpolate(now,curveArray[k],idxArray[k]);
                    xArray[k] = pointCoordArray[k][1];
                    yArray[k] = pointCoordArray[k][2];

                    if (!isNaN(xArray[k])&&!isNaN(yArray[k])) {
                        //if (counter == 1) { 
                            Trajectoires.OSC.sendPosxyzMsg(pointCoordArray[k]);
                        //}
                        Trajectoires.Player.repaintPoint(curveArray[k],[xArray[k],yArray[k]]);
                        xOldArray[k] = xArray[k];
                        yOldArray[k] = yArray[k];

                        Trajectoires.Player.repaintCurve(curveArray[k],idxArray[k],idxOldArray[k]);
                        idxOldArray[k] = idxArray[k];
                    }

                    // test if the curve is ended 
                    if (now > lengthTimeArray[k]) {
                        curveArray.splice(k,1); 
                        lengthTimeArray.splice(k,1);
                        pointCoordArray.splice(k,1);
                        xArray.splice(k,1);
                        yArray.splice(k,1);
                        xOldArray.splice(k,1);
                        yOldArray.splice(k,1);
                    }
                }
            }

            if (xOldArray.length<1) {
                Trajectoires.OSC.sendPlay("end");
                Trajectoires.View.traj_repaint();
                if (Trajectoires.Player.loopMode) {
                    Trajectoires.Player.isPlaying = false;  
                    Trajectoires.Player.playAllCurve();
                    return;
                    //Trajectoires.Player.loopID = setTimeout(function() {Trajectoires.Player.playCurrentCurve();},500); 
                }
            Trajectoires.Player.stopCurrentCurve();
            Trajectoires.Player.isPlaying = false;  
            return;
            }  

            Trajectoires.Player.requestId = requestAnimationFrame(loopMulti);
        }())
    },


	playCurrentCurve : function() {
        var curveIdx = Trajectoires.TrajManager.currentCurveIndex,
            curve = Trajectoires.TrajManager.trajectories[curveIdx];

        Trajectoires.View.dyn_ctx.lineWidth = 5;
        Trajectoires.View.dyn_ctx.fillStyle = curve.color;
        Trajectoires.View.dyn_ctx.strokeStyle = curve.color;
        Trajectoires.View.dyn_ctx.globalAlpha = Trajectoires.View.CURVE_ACTIVE_ALPHA;

        Trajectoires.View.traj_ctx.lineWidth = Trajectoires.View.CURVE_ACTIVE_STROKE_SIZE *2.5;
        Trajectoires.View.traj_ctx.strokeStyle = curve.color;


        this.playCurve(curveIdx);

	},

	stopCurrentCurve : function() {
        if (this.isPlaying) {
            if (this.requestId) {
                cancelAnimationFrame(this.requestId);
                this.requestId = undefined;
            }
            // if (this.loopID) {
            //     clearTimeout(this.loopID);
            //     this.loopID = undefined;
            // }
            Trajectoires.View.dyn_repaint();
            Trajectoires.Player.isPlaying = false;
            Trajectoires.OSC.sendPlay("end");

            var playButton = document.getElementById('playButton');
            var multiplayButton = document.getElementById('multiplayButton');
            playButton.innerHTML = 'Play';
            multiplayButton.innerHTML = 'Multi';
        }
	},



	repaintPoint : function(curve,point) {
		var dyn_ctx = Trajectoires.View.dyn_ctx;

        dyn_ctx.strokeStyle = curve.color;
        dyn_ctx.lineWidth = 5 ;

        if (point) {
            var pos = Trajectoires.Utils.convertUnitsIntoCanvasPos(point);
            //draw large point 
            Trajectoires.View.drawPoint(dyn_ctx,pos , 8);
            Trajectoires.View.drawPoint(dyn_ctx,pos , 18);
        }
    },

    repaintCurve : function(curve,index,lastIndex) {
        var dyn_ctx = Trajectoires.View.dyn_ctx,
            pos,
            last_pos;

        dyn_ctx.lineWidth = Trajectoires.View.CURVE_ACTIVE_STROKE_SIZE *2.5;
        dyn_ctx.strokeStyle = curve.color;
        //Trajectoires.View.traj_repaint();
        if (index>0) {
            for (var idx =0;idx<index+1;idx++) {
                pos = Trajectoires.Utils.convertUnitsIntoCanvasPos([curve.X[idx], curve.Y[idx]]);
                last_pos =  Trajectoires.Utils.convertUnitsIntoCanvasPos([curve.X[idx-1], curve.Y[idx-1]]);

                // draw large curve
                dyn_ctx.beginPath();
                dyn_ctx.moveTo(last_pos[0], last_pos[1]);
                dyn_ctx.lineTo(pos[0], pos[1]);
                dyn_ctx.stroke();
            }
        }
    },





}







