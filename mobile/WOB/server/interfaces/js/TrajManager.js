///////////////////////// TRAJ MANAGER ///////////////////////////
Trajectoires.TrajManager = {
    //Curves
    trajectories : [], //Array of TimedCurves
    currentCurveIndex : 0,
    currentCurve : null,
    currentCurveLbl : "",
    playedCurves : [], // array for multiPlay 
    clipboardCurve : null,   
    currentSource : 1,
    circular : false,
    idContextMenu : null,
    modifiedCurve : null, 

    processCreateNewCurve : function(x, y, z, t) {
        Trajectoires.OSC.sendDraw('start'); 
        Trajectoires.EventManager.hideContextMenu();
        //if (Trajectoires.EventManager.rangeSlider) { // case "Select and Redraw"
            Trajectoires.TrajManager.modifiedCurve = Trajectoires.TrajManager.currentCurveIndex; // keep the curve to be modified
        //}
        timeStart = t;
        Trajectoires.TrajManager.currentCurve = new TimedCurve(Trajectoires.TrajManager.currentSource);
        //Trajectoires.TrajManager.selectCurve(Trajectoires.TrajManager.trajectories.length);
        //Trajectoires.TrajManager.selectCurveLight(Trajectoires.TrajManager.trajectories.length);
        Trajectoires.TrajManager.currentCurve.addTimedPoint(x, y, z, 0);
        Trajectoires.OSC.streamNewCurve(Trajectoires.TrajManager.currentCurveIndex);
        Trajectoires.OSC.streamCurveLastPoint(Trajectoires.TrajManager.currentCurve);
        
        if (Trajectoires.EventManager.rangeSlider) { // case "Select and Redraw" : draw the curve being modified and the range slider points
            var val = Trajectoires.EventManager.getSliderValue();
            var curve = this.trajectories[Trajectoires.TrajManager.modifiedCurve];
            Trajectoires.View.drawTimePointsSelect(val,curve);
            Trajectoires.View.drawCurve(Trajectoires.View.traj_ctx,curve,Trajectoires.TrajManager.modifiedCurve,Trajectoires.View.CURVE_ACTIVE_STROKE_SIZE,curve.color);
        } else {
            Trajectoires.View.clearContext(Trajectoires.View.current_ctx);

        }
    },


    processAddPointToCurve : function(x, y, z, t) {
    if (Trajectoires.TrajManager.currentCurve !== null) {
            Trajectoires.TrajManager.currentCurve.addTimedPoint(x, y, z, t - timeStart);
            Trajectoires.OSC.streamCurveLastPoint(Trajectoires.TrajManager.currentCurve);
        }
    },


    processEndCurve : function(x, y, z, t) {
        Trajectoires.State.newAction();
    //TODO use actual length instead of number of points...
    if (Trajectoires.TrajManager.currentCurve !== null && Trajectoires.TrajManager.currentCurve.X.length > 4) {
        
        var curveIndex = Trajectoires.TrajManager.currentCurveIndex;
        var currentCurve = Trajectoires.TrajManager.currentCurve;
        
        Trajectoires.TrajManager.trajectories.push(currentCurve.clone());

        Trajectoires.EventManager.initSlider(false); // update TimeSlider 

        Trajectoires.TrajManager.currentCurve = null;
        Trajectoires.View.dyn_repaint();
        Trajectoires.View.traj_repaint();

        Trajectoires.Session.saveTrajSession(); // save session

        var curveSendIdx = Trajectoires.TrajManager.trajectories.length-1;
        if(Trajectoires.TrajManager.trajectories[curveIndex].X.length <1000){
            Trajectoires.OSC.sendCurveSingleMessageOSC(Trajectoires.TrajManager.trajectories[curveSendIdx], curveSendIdx);
        }else{
            Trajectoires.OSC.sendCurveOSC(Trajectoires.TrajManager.trajectories[curveSendIdx], curveSendIdx);
        }
        Trajectoires.OSC.sendDraw('end');
        Trajectoires.TrajManager.selectCurve(Trajectoires.TrajManager.trajectories.length-1); // avant ou après
        Trajectoires.TrajManager.multiPlayChanged(Trajectoires.TrajManager.trajectories.length-1);
        Trajectoires.EventManager.drawing = false;


        // Variables for circular or concat
        var currentCurve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex],
            lastCurve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.modifiedCurve],
            curveLength = currentCurve.X.length-1,
            firstPoint = [currentCurve.X[0],currentCurve.Y[0]],
            lastPoint = [currentCurve.X[curveLength],currentCurve.Y[curveLength]],
            distance = Trajectoires.Utils.distanceBtwPoints(firstPoint,lastPoint);

        if (typeof(lastCurve)!=='undefined') {
        var lastPointLastCurve = [lastCurve.X[lastCurve.X.length-1],lastCurve.Y[lastCurve.X.length-1]]; // TODO : use pixel distance
        var distance2 = Trajectoires.Utils.distanceBtwPoints(firstPoint,lastPointLastCurve);
        } else { var distance2 = Infinity;}

        // TODO : separate distance for circular and for concat
        if (distance < 0.6 || distance2 < 0.6) {
            Trajectoires.EventManager.showContextMenu();
        }
        


    }else{
        Trajectoires.TrajManager.currentCurve = null;
        selectPreviousCurve();
        Trajectoires.View.dyn_repaint();
        Trajectoires.OSC.sendDraw('end');
        Trajectoires.TrajManager.selectCurve(Trajectoires.TrajManager.trajectories.length-1); // avant ou après
    } 
        
    },


    processMakeCircular : function(currentCurve,curveIndex) {
        var curveIndex = Trajectoires.TrajManager.currentCurveIndex,
            currentCurve = Trajectoires.TrajManager.trajectories[curveIndex],
            curveLength = currentCurve.X.length-1,
            firstPoint = [currentCurve.X[0],currentCurve.Y[0]],
            lastPoint = [currentCurve.X[curveLength],currentCurve.Y[curveLength]],
            distance = Trajectoires.Utils.distanceBtwPoints(firstPoint,lastPoint),
            lastDistance =  Trajectoires.Utils.distanceBtwPoints(lastPoint,[currentCurve.X[curveLength-1],currentCurve.Y[curveLength-1]]),
            speed = lastDistance/(currentCurve.t[curveLength]-currentCurve.t[curveLength-1]);
        currentCurve.addTimedPoint(firstPoint[0],firstPoint[1],currentCurve.Z[0],currentCurve.t[curveLength]+distance/speed);
        Trajectoires.TrajManager.trajectories[curveIndex] = currentCurve;
        Trajectoires.TrajManager.selectCurve(Trajectoires.TrajManager.trajectories.length-1); // avant ou après
        //Trajectoires.TrajManager.processEndCurveEnd(currentCurve,curveIndex);
        // clearInterval(Trajectoires.TrajManager.idContextMenu);
    },

    processModifyCurve : function() {
        Trajectoires.State.newAction();
        var newCurve = Trajectoires.TrajManager.currentCurve,
            curve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.modifiedCurve].clone(),
            rangeTime = Trajectoires.EventManager.getSliderValue(),
            firstPoint = Trajectoires.Utils.findPointIdx(rangeTime[0],curve),
            lastPoint = Trajectoires.Utils.findPointIdx(rangeTime[1],curve);

        this.clipboardCurve = newCurve;

        this.pasteInCurveAndAdapt(curve,firstPoint,lastPoint);
        this.selectCurve(this.trajectories.length-1);
        
    },


    copyCurrentCurve : function(beginIdx,endIdx) {
        var curve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex];

        newCurve = curve.clone();
        for (var k=0;k<curve.X.length;k++) {
            newCurve.t[k] = newCurve.t[k] - newCurve.t[0];
        }
        this.clipboardCurve = newCurve;
    },

    // paste dans une courbe la clipboardCurve en translatant le reste de la courbe.
    pasteInCurve : function(curve,beginIdx,endIdx) { 
        Trajectoires.State.newAction();
        var clipboardCurve = this.clipboardCurve,
            curve = curve.clone(),
            rangeTime = [curve.t[beginIdx], curve.t[endIdx]],
            newTimeRange = clipboardCurve.lengthTime();

        clipboardCurve.translate(curve.X[beginIdx],curve.Y[beginIdx],curve.Z[beginIdx]);

        for (var k=endIdx+1;k<curve.X.length;k++) {
            curve.t[k] = curve.t[k] - (rangeTime[1]-rangeTime[0]) + newTimeRange;
            curve.X[k] = curve.X[k] - curve.X[endIdx] + clipboardCurve.X[clipboardCurve.X.length-1];
            curve.Y[k] = curve.Y[k] - curve.Y[endIdx] + clipboardCurve.Y[clipboardCurve.X.length-1];
            curve.Z[k] = curve.Z[k] - curve.Z[endIdx] + clipboardCurve.Z[clipboardCurve.X.length-1];
        } 

        curve.X.splice(beginIdx,endIdx-beginIdx+1);
        curve.Y.splice(beginIdx,endIdx-beginIdx+1);
        curve.Z.splice(beginIdx,endIdx-beginIdx+1); 
        curve.t.splice(beginIdx,endIdx-beginIdx+1);

        for (var k=0;k<clipboardCurve.X.length;k++) {
            curve.X.splice(beginIdx+k,0,clipboardCurve.X[k]);
            curve.Y.splice(beginIdx+k,0,clipboardCurve.Y[k]);
            curve.Z.splice(beginIdx+k,0,clipboardCurve.Z[k]);
            curve.t.splice(beginIdx+k,0,clipboardCurve.t[k]+rangeTime[0]);
        }

        Trajectoires.TrajManager.trajectories.splice(Trajectoires.TrajManager.currentCurveIndex,1);
        Trajectoires.TrajManager.trajectories.push(curve);
        Trajectoires.EventManager.initSlider(false); 
        Trajectoires.TrajManager.currentCurve = null;
        Trajectoires.TrajManager.selectCurve(Trajectoires.TrajManager.trajectories.length-1);
    },

    // paste dans une courbe la clipboardCurve en la déformant (spacialement et temporellement) pour qu'elle rentre entre les deux curseurs curve[beginIdx] et curve[endIdx]
    pasteInCurveAndAdapt : function(curve,beginIdx,endIdx) {
        Trajectoires.State.newAction();
        var clipboardCurve = this.clipboardCurve,
            maxIdxClipboardCurve = clipboardCurve.X.length-1,
            curve = curve.clone(),
            rangeTime = [curve.t[beginIdx], curve.t[endIdx]],
            newTimeRange = clipboardCurve.lengthTime(),
            curveVector = [curve.X[endIdx] - curve.X[beginIdx], curve.Y[endIdx] - curve.Y[beginIdx]],
            clipboardCurveVector = [clipboardCurve.X[maxIdxClipboardCurve] - clipboardCurve.X[0], clipboardCurve.Y[maxIdxClipboardCurve] - clipboardCurve.Y[0]],
            lengthCurve = Math.sqrt(Math.pow(curveVector[0],2) + Math.pow(curveVector[1],2)),
            lengthClipboardCurve = Math.sqrt(Math.pow(clipboardCurveVector[0],2) + Math.pow(clipboardCurveVector[1],2)),
            sgnAngle = Trajectoires.Utils.sign(curveVector[0]*clipboardCurveVector[1]-clipboardCurveVector[0]*curveVector[1]),
            angle = (180/Math.PI)*Math.acos((curveVector[0]*clipboardCurveVector[0] + curveVector[1]*clipboardCurveVector[1]) / (lengthCurve * lengthClipboardCurve));
            lengthDiff = lengthCurve/lengthClipboardCurve;

        // if the new curve is one point delete de portion selected
        if (maxIdxClipboardCurve<2) {
            for (var k=endIdx+1;k<curve.X.length;k++) {
                curve.t[k] = curve.t[k] - (rangeTime[1]-rangeTime[0]) + newTimeRange;
            }
            clipboardCurve.X = [];
            clipboardCurve.Y = [];
            clipboardCurve.Z = [];
            clipboardCurve.t = [];

        } else {
            // adaptation de longueur 
            clipboardCurve.spaceScale(lengthDiff);

            // translation
            clipboardCurve.translate(curve.X[beginIdx],curve.Y[beginIdx],curve.Z[beginIdx]);

            // rotation
            clipboardCurveVector = [clipboardCurve.X[maxIdxClipboardCurve] - clipboardCurve.X[0], clipboardCurve.Y[maxIdxClipboardCurve] - clipboardCurve.Y[0]];
            lengthClipboardCurve = Math.sqrt(Math.pow(clipboardCurveVector[0],2) + Math.pow(clipboardCurveVector[1],2));
            angle = (180/Math.PI)*Math.acos((curveVector[0]*clipboardCurveVector[0] + curveVector[1]*clipboardCurveVector[1]) / (lengthCurve * lengthClipboardCurve));
            sgnAngle = Trajectoires.Utils.sign(clipboardCurveVector[0]*curveVector[1] - curveVector[0]*clipboardCurveVector[1]);
            var center = [clipboardCurve.X[0], clipboardCurve.Y[0]];
            clipboardCurve.rotate(center, sgnAngle*angle);

            // changement du temps
            clipboardCurve.changeTotalTime(rangeTime[1]-rangeTime[0]);
        }

        curve.X.splice(beginIdx,endIdx-beginIdx+1);
        curve.Y.splice(beginIdx,endIdx-beginIdx+1);
        curve.Z.splice(beginIdx,endIdx-beginIdx+1); 
        curve.t.splice(beginIdx,endIdx-beginIdx+1);

        for (var k=0;k<clipboardCurve.X.length;k++) {
            curve.X.splice(beginIdx+k,0,clipboardCurve.X[k]);
            curve.Y.splice(beginIdx+k,0,clipboardCurve.Y[k]);
            curve.Z.splice(beginIdx+k,0,clipboardCurve.Z[k]);
            curve.t.splice(beginIdx+k,0,clipboardCurve.t[k]+rangeTime[0]);
        }
        curve.t[0] = 0;

        Trajectoires.TrajManager.trajectories.push(curve);
        Trajectoires.EventManager.initSlider(false); 
        
    },


    longestCurveIdxOfPlayedCurve : function() {
        var maxTime = 0,
            idx;
        for (var k=0;k<this.playedCurves.length;k++) {
            var time = this.trajectories[this.playedCurves[k]].lengthTime();
            if (time>maxTime) {
                maxTime = time;
                idx = this.playedCurves[k];
            }
        }
        return idx;
    },

    deleteCurve : function(index) {
        Trajectoires.State.newAction();
        Trajectoires.TrajManager.deletePlayedCurve(index);
        Trajectoires.TrajManager.trajectories.splice(index, 1);
        Trajectoires.TrajManager.selectCurve((Trajectoires.TrajManager.currentCurveIndex - 1 + Trajectoires.TrajManager.trajectories.length) % Trajectoires.TrajManager.trajectories.length);
        Trajectoires.View.traj_repaint();
        Trajectoires.View.dyn_repaint();  
    },

    selectCurveLight : function(index) {
        Trajectoires.TrajManager.currentCurveIndex = index;
        Trajectoires.TrajManager.currentCurveLbl.innerHTML = "" + Trajectoires.TrajManager.currentCurveIndex;
        Trajectoires.View.traj_repaint();
    },

    selectCurve : function(index) {
        if (isNaN(index) || index <0)
            index = 0;
        var lastCurveIdx = Trajectoires.TrajManager.currentCurveIndex;
        Trajectoires.TrajManager.currentCurveIndex = index;
        Trajectoires.TrajManager.currentCurveLbl.innerHTML = "" + Trajectoires.TrajManager.currentCurveIndex;
        Trajectoires.View.traj_repaint();
        Trajectoires.View.dyn_repaint();
        Trajectoires.View.current_repaint();

        // change slider max value to curve max time, and time length, but not during drawing a new one (after)
        if (Trajectoires.TrajManager.trajectories[index] && index!=lastCurveIdx) {
            Trajectoires.EventManager.initSlider(false); 
        }
        Trajectoires.EventManager.refreshCurveInfo();
        Trajectoires.Session.saveTrajSession();
    },


    // multiPlayChanged : function() {
    //     var trajectories = Trajectoires.TrajManager.trajectories;
    //     this.playedCurves = [];
    //     for (var k=0;k<trajectories.length;k++) {
    //         if (trajectories[k].multiPlay) {
    //             this.playedCurves.push(k);
    //         }
    //     } 
    // },

    multiPlayChanged : function(idx) { // TODO : link it to the prop multiPlay of the timed curves (both side)
        var trajectories = Trajectoires.TrajManager.trajectories;
        var curve = trajectories[idx];

        if (idx == undefined) {
            return; 
        }

        // in case of a bug redefine playedCurves array
        if (this.playedCurves == undefined || null) {
            this.playedCurves = [];
        }
        for (var k=0;k<this.playedCurves.length;k++) {
            if(this.playedCurves[k]>trajectories.length-1) {
                this.playedCurves.splice(k,1);
                k = k-1;
            }
        }

        // remove the curve that has the same sourceNumber
        for (var k=0;k<this.playedCurves.length;k++) {
            if (trajectories[this.playedCurves[k]].sourceNumber == curve.sourceNumber) {
                trajectories[this.playedCurves[k]].multiPlay = false;
                this.playedCurves.splice(k,1);
                k = k-1;
            }
        }
        this.playedCurves.push(idx);
        this.playedCurves = Trajectoires.Utils.removeDoublon(this.playedCurves);

        // apply changement to timed curves 
        for (var k=0;k<trajectories.length;k++) {
            if (this.playedCurves.indexOf(k)>-1) {
                trajectories[k].multiPlay = true;
            } else {
                trajectories[k].multiPlay = false;
            }
        }
        Trajectoires.View.traj_repaint();
    },

    deletePlayedCurve : function(idx) {
        for (var k=0;k<this.playedCurves.length;k++) {
            if (this.playedCurves[k] == idx) {
                this.trajectories[this.playedCurves[k]].multiPlay = false;
                this.playedCurves.splice(k,1);
                return;
            }
        }
    },


};

