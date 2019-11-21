///////////////////////// TRAJ MANAGER ///////////////////////////
Traj.Manager = {
    //Curves
    trajectories : [], //Array of TimedCurves
    currentCurveIndex : -1, //Index Of the sekected curve
    currentCurve : null, 
    currentCurveLbl : "", //label for html display
    clipboardCurve : null, //temporary curve to paste
    currentSource : 1, //the current selected source (apply to a selected source or set for the next one)
    modifiedCurve : null, 
    NB_SOURCES : 8,
    multiplay_indexes : [], //list of curve index to play for each source indexes i.e. if 4 sources = [0, 'undefined', 23, 'undeifned']
    allowed_indexes : null, //list of index that are allowed for playing (multiuser value effect only)
    //MULTIPLAY//
    //find all possible curves indexes matching the source nb
    getPossibleTrajIndexesForSource : function (source_idx){
        var traj_indexes = [];

            var cpt = 0;
            for (var i = 0; i < this.trajectories.length; i++) {
                if(this.trajectories[i].sourceNumber === source_idx){
                    traj_indexes[cpt] = i;
                    cpt++;
                }
            }
        return traj_indexes;
    },

    //returns the traj index or undefined for the source asked
    findTrajforMissingSource : function (sourceNB){
        var idx = Traj.Manager.getPossibleTrajIndexesForSource(sourceNB);
        if(idx.length>0){
            return idx[idx.length - 1];
        }else{
            return'undefined';
        } 
    },

    //this methods populates the multiplay_indexes array
    createMultiPlayIndexes : function(){
        var indexes = [];
        //for each sources
        for (var i = 0 ; i < Traj.Manager.NB_SOURCES; i++) {
            indexes[i] = Traj.Manager.findTrajforMissingSource(i+1);
        }
        this.multiplay_indexes = indexes;
    },

    //this methods returns an array containeng the curves' indexes for MultiPlay
    getMultiPlayIndexes : function(){
        var indexes = [],
            cpt =0,
            multi = Traj.Manager.multiplay_indexes;

        for (var i = 0; i < multi.length; i++) {
            if(multi[i] !== 'undefined'){
                indexes[cpt] = multi[i];
                cpt++;
            }
        };
        return indexes;
    },

    //this methods update the multiplay indexes with the current selected curve
    updateMultiPlayIndexes : function(source_nb, curve_index){
        Traj.Manager.multiplay_indexes[(source_nb-1)] = curve_index;
    },

    //called when a trajectorie gets a new source number
    updateMultiPlayForSourceChange: function (index,prev_source,new_source){
        var multi = Traj.Manager.multiplay_indexes;
        multi[prev_source-1] = Traj.Manager.findTrajforMissingSource(prev_source);
        multi[new_source-1] = index;
        Traj.Manager.multiplay_indexes = multi;
    },

    //decrease all indexes by one if they are more or equal than the deleted curve (delted before the call)
    updateMultiForDeletedCurve : function(index){
        var multi = Traj.Manager.multiplay_indexes;
        for (var i = 0; i < multi.length; i++) {
            if(multi[i] !== 'undefined'){
                if(multi[i]> index){
                    multi[i] = multi[i]-1;
                }else if (multi[i]===index){
                    multi[i] = Traj.Manager.findTrajforMissingSource(i + 1);
                }
            }
        }
        Traj.Manager.multiplay_indexes = multi;
    },

    setTrajectories : function(traj_array){
        this.trajectories = traj_array;
        this.createMultiPlayIndexes();
        this.selectCurve(0);
        Traj.View.repaintAll();
    },

    processCreateNewCurve : function(x, y, z, t) {
        Traj.Events.hideContextMenu();
        Traj.View.dyn_repaint();

        if(Traj.Manager.hasSelectedCurve()){
            Traj.Manager.modifiedCurve = Traj.Manager.currentCurveIndex; // keep the curve to be modified
        }
            Traj.Manager.currentCurveIndex = Traj.Manager.trajectories.length;
        
        timeStart = t;
        Traj.Manager.currentCurve = new TimedCurve(Traj.Manager.currentSource);
        Traj.Manager.currentCurve.addTimedPoint(x, y, z, 0);
        
        if (Traj.Events.rangeSlider) { // case "Select and Redraw" : draw the curve being modified and the range slider points
            var val = Traj.Events.getSliderValue();
            var curve = this.trajectories[Traj.Manager.modifiedCurve];
            Traj.View.drawTimePointsSelect(val,curve);
            Traj.View.drawCurve(Traj.View.traj_ctx,curve,Traj.Manager.modifiedCurve,Traj.View.CURVE_ACTIVE_STROKE_SIZE,curve.color);
        } else {
            Traj.View.clearContext(Traj.View.current_ctx);
        }

        Traj.View.traj_repaint();
        Traj.OSC.streamNewCurve(Traj.Manager.currentCurveIndex);
        Traj.OSC.streamCurveLastPoint(Traj.Manager.currentCurve);  
    },


    processAddPointToCurve : function(x, y, z, t) {
    if (Traj.Manager.currentCurve !== null) {
            Traj.Manager.currentCurve.addTimedPoint(x, y, z, t - timeStart);
            Traj.OSC.streamCurveLastPoint(Traj.Manager.currentCurve);
        }
    },


    processEndCurve : function(x, y, z, t) {
        if (Traj.Manager.currentCurve !== null && Traj.Manager.currentCurve.X.length > 6) {
            
            Traj.Manager.trajectories.push(Traj.Manager.currentCurve.clone());
            Traj.Manager.currentCurve = null;    

            var curveIndex = Traj.Manager.trajectories.length-1;

            Traj.Manager.selectCurve(curveIndex); // avant ou après
            Traj.Events.initSlider(false); // update TimeSlider 
            Traj.Events.drawing = false;

            // Variables for circular or concat
            var currentCurve = Traj.Manager.trajectories[curveIndex],
                lastCurve = Traj.Manager.trajectories[Traj.Manager.modifiedCurve],
                curveLength = currentCurve.X.length-1,
                firstPoint = [currentCurve.X[0],currentCurve.Y[0]],
                lastPoint = [currentCurve.X[curveLength],currentCurve.Y[curveLength]],
                distance = Traj.Utils.distanceBtwPoints(firstPoint,lastPoint);

            if (typeof(lastCurve)!=='undefined') {
                var lastPointLastCurve = [lastCurve.X[lastCurve.X.length-1],lastCurve.Y[lastCurve.X.length-1]];
                var distance2 = Traj.Utils.distanceBtwPoints(firstPoint,lastPointLastCurve);
            } else {
                var distance2 = Infinity;
            }
            Traj.Events.showContextMenu(distance < 0.4, distance2 < 0.5);


            Traj.Session.saveTrajSession(); // save session
            
            if(currentCurve.X.length <1000){
                Traj.OSC.sendCurveSingleMessageOSC(currentCurve, curveIndex);
            }else{
                Traj.OSC.sendCurveOSC(currentCurve, curveIndex);
            }
            
        }else{
            Traj.Manager.currentCurve = null;
            Traj.Manager.selectPreviousCurve();
            Traj.View.dyn_repaint();
            Traj.Manager.selectCurve(Traj.Manager.trajectories.length-1); // avant ou après
        }         
    },

    processMakeCircular : function(currentCurve,curveIndex) {
        var curveIndex = Traj.Manager.currentCurveIndex,
            currentCurve = Traj.Manager.trajectories[curveIndex],
            curveLength = currentCurve.X.length-1,
            firstPoint = [currentCurve.X[0],currentCurve.Y[0]],
            lastPoint = [currentCurve.X[curveLength],currentCurve.Y[curveLength]],
            distance = Traj.Utils.distanceBtwPoints(firstPoint,lastPoint),
            lastDistance =  Traj.Utils.distanceBtwPoints(lastPoint,[currentCurve.X[curveLength-1],currentCurve.Y[curveLength-1]]),
            speed = lastDistance/(currentCurve.t[curveLength]-currentCurve.t[curveLength-1]);
        currentCurve.addTimedPoint(firstPoint[0],firstPoint[1],currentCurve.Z[0],currentCurve.t[curveLength]+distance/speed);
        Traj.Manager.trajectories[curveIndex] = currentCurve;
        Traj.Manager.selectCurve(Traj.Manager.trajectories.length-1); // avant ou après
    },

    processModifyCurve : function() {
        var newCurve = Traj.Manager.currentCurve,
            curve = Traj.Manager.trajectories[Traj.Manager.modifiedCurve].clone(),
            rangeTime = Traj.Events.getSliderValue(),
            firstPoint = Traj.Utils.findPointIdx(rangeTime[0],curve),
            lastPoint = Traj.Utils.findPointIdx(rangeTime[1],curve);

        this.clipboardCurve = newCurve;
        this.pasteInCurveAndAdapt(curve,firstPoint,lastPoint);
        this.selectCurve(this.trajectories.length-1);  
    },

    copyCurrentCurve : function(beginIdx,endIdx) {

        if(Traj.Manager.hasCurveSelected())
        {
            var curve = Traj.Manager.trajectories[Traj.Manager.currentCurveIndex];

            newCurve = curve.clone();
            for (var k=0;k<curve.X.length;k++) {
                newCurve.t[k] = newCurve.t[k] - newCurve.t[0];
            }
            this.clipboardCurve = newCurve;
        }
    },

    // paste dans une courbe la clipboardCurve en translatant le reste de la courbe.
    pasteInCurve : function(curve,beginIdx,endIdx) { 
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

        Traj.Manager.trajectories.splice(Traj.Manager.currentCurveIndex,1);
        Traj.Manager.trajectories.push(curve);
        Traj.Events.initSlider(false); 
        Traj.Manager.currentCurve = null;
        Traj.Manager.selectCurve(Traj.Manager.trajectories.length-1);
    },

    // paste dans une courbe la clipboardCurve en la déformant (spacialement et temporellement) pour qu'elle rentre entre les deux curseurs curve[beginIdx] et curve[endIdx]
    pasteInCurveAndAdapt : function(curve,beginIdx,endIdx) {
        var clipboardCurve = this.clipboardCurve,
            maxIdxClipboardCurve = clipboardCurve.X.length-1,
            curve = curve.clone(),
            rangeTime = [curve.t[beginIdx], curve.t[endIdx]],
            newTimeRange = clipboardCurve.lengthTime(),
            curveVector = [curve.X[endIdx] - curve.X[beginIdx], curve.Y[endIdx] - curve.Y[beginIdx]],
            clipboardCurveVector = [clipboardCurve.X[maxIdxClipboardCurve] - clipboardCurve.X[0], clipboardCurve.Y[maxIdxClipboardCurve] - clipboardCurve.Y[0]],
            lengthCurve = Math.sqrt(Math.pow(curveVector[0],2) + Math.pow(curveVector[1],2)),
            lengthClipboardCurve = Math.sqrt(Math.pow(clipboardCurveVector[0],2) + Math.pow(clipboardCurveVector[1],2)),
            sgnAngle = Traj.Utils.sign(curveVector[0]*clipboardCurveVector[1]-clipboardCurveVector[0]*curveVector[1]),
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
            sgnAngle = Traj.Utils.sign(clipboardCurveVector[0]*curveVector[1] - curveVector[0]*clipboardCurveVector[1]);
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
        Traj.Manager.trajectories.push(curve);
        Traj.Events.initSlider(false);
    },

    deleteCurve : function(index) {
        Traj.Manager.trajectories.splice(index, 1);
        Traj.Manager.updateMultiForDeletedCurve(index);
        Traj.Manager.selectCurve((Traj.Manager.currentCurveIndex - 1 + Traj.Manager.trajectories.length) % Traj.Manager.trajectories.length);
        Traj.View.traj_repaint();
        Traj.View.dyn_repaint();  
        Traj.Session.saveTrajSession();
    },

    selectCurveLight : function(index) {
        Traj.Manager.currentCurveIndex = index;
        Traj.Manager.currentCurveLbl.innerHTML = "" + Traj.Manager.currentCurveIndex;
        Traj.View.traj_repaint();
    },

    selectCurve : function(index) {
        if (isNaN(index) || index <0 || index === null){
            index = -1;
        }

        var lastCurveIdx = Traj.Manager.currentCurveIndex;
        Traj.Manager.currentCurveIndex = index;
        Traj.Manager.currentCurveLbl.innerHTML = (index===-1) ? " " : ( "" + Traj.Manager.currentCurveIndex);
        

        //update the source color button
        if(Traj.Manager.getCurrentCurve()){
            var nb = Traj.Manager.getCurrentCurve().sourceNumber;
            Traj.Events.selectSourceButton(nb);
            Traj.Manager.currentSource = nb;
            Traj.Manager.updateMultiPlayIndexes(nb,index);
        }
        
        // change slider max value to curve max time, and time length, but not during drawing a new one (after)
        if (Traj.Manager.trajectories[index] && index!=lastCurveIdx) {
            Traj.Events.initSlider(false); 
        }

        //redraw
        Traj.View.traj_repaint();
        Traj.View.dyn_repaint();
        Traj.View.current_repaint();

        Traj.Session.saveTrajSession();
    },

    hasSelectedCurve : function (){
        return this.currentCurveIndex != -1;
    },

    getCurrentCurve : function () {
        if (this.hasSelectedCurve()){
            return this.trajectories[Traj.Manager.currentCurveIndex];
        }
        return Traj.Manager.currentCurve;
    },

    getClosestCurveFromTouch : function(pos) {
        var trajectories = Traj.Manager.trajectories;
        var curve = {};
        var minDistance = 0.5; //0.05 very close
        var distance = 0;
        var index = null;
        for (var k = 0 ; k<trajectories.length;k++) {
            curve = trajectories[k];
            distance = curve.getDistanceToPoint(pos);
            if (distance < minDistance){
                minDistance = distance;
                index = k;
            }
        }
        return index;
    },

    ////////////////////////////////////
    ////////// CALLED FROM HTML ////////
    ////////////////////////////////////

    selectNextCurve :function(){
        var idx = (Traj.Manager.currentCurveIndex != -1) ? (Traj.Manager.currentCurveIndex + 1) : 0;
        Traj.Manager.selectCurve(idx % Traj.Manager.trajectories.length);
    },

    selectPreviousCurve : function (){
        var idx = (Traj.Manager.currentCurveIndex != -1) ? (Traj.Manager.currentCurveIndex - 1 + Traj.Manager.trajectories.length) : Traj.Manager.trajectories.length -1;
        Traj.Manager.selectCurve(idx % Traj.Manager.trajectories.length);
    },

    translateCurve : function (){
        var curve = Traj.Manager.trajectories[Traj.Manager.currentCurveIndex];
        if (curve != undefined) {
            var inputX = document.getElementById('xOriPos').value;
            var inputY = document.getElementById('yOriPos').value;
            var inputZ = document.getElementById('zOriPos').value;
            curve.translate(Number(inputX),Number(inputY),Number(inputZ));
            Traj.Manager.selectCurve(Traj.Manager.currentCurveIndex);
        }
    },

    copyCurrentCurve : function (){
        var curve = Traj.Manager.trajectories[Traj.Manager.currentCurveIndex];
        if (curve != undefined) {
            Traj.Manager.copyCurrentCurve(0,curve.X.length-1);
            Traj.Events.hideLongTouchMenu();
        }
    },

    pasteInCurrentCurve : function (){
        var curve = Traj.Manager.trajectories[Traj.Manager.currentCurveIndex];
        if (curve != undefined) {
            var beginTime = Traj.Events.getSliderValue();
            var beginIdx = Traj.Utils.findPointIdx(beginTime,curve);
            Traj.Manager.pasteInCurve(curve,beginIdx,beginIdx);
            Traj.Events.hideLongTouchMenu();
            //Traj.Manager.selectCurve(Traj.Manager.trajectories.length-1);
        }
    },

    duplicateCurrentCurve : function (){
        var curve = Traj.Manager.trajectories[Traj.Manager.currentCurveIndex];
        if (curve != undefined) {
            var newCurve = curve.clone();
            var XYZ = [newCurve.X[0]+0.1,newCurve.Y[0]-0.1,newCurve.Z[0]];
            newCurve.translate(XYZ[0],XYZ[1],XYZ[2]);
            Traj.Manager.trajectories.push(newCurve);
            Traj.Manager.selectCurve(Traj.Manager.trajectories.length-1);
            Traj.Events.hideLongTouchMenu();
        }
    },

    deleteCurrentCurve : function() {
        Traj.Manager.deleteCurve(Traj.Manager.currentCurveIndex);
        Traj.Events.hideLongTouchMenu();
    },

    deleteAllCurves : function() {
        Traj.Manager.setTrajectories([]);
        Traj.Events.hideLongTouchMenu();
    },

    mirror : function (type){
        var curve = Traj.Manager.trajectories[Traj.Manager.currentCurveIndex];
        if (curve != undefined) {
            if (type == 'x') {
                curve.xMiror();
            } else if (type == 'y') {
                curve.yMiror();
            } else if (type == 'z') {
                curve.zMiror();
            } else if (type == 't') {
                curve.tMiror();
            }
            Traj.Manager.selectCurve(Traj.Manager.currentCurveIndex);
        }
    },

    simplifyCurrentCurve : function (tolerance){
        var currentCurve = Traj.Manager.trajectories[Traj.Manager.currentCurveIndex];
        if (currentCurve != undefined) {
            var newCurve = Traj.Utils.simplifyCurve(currentCurve,tolerance);
            Traj.Manager.trajectories[Traj.Manager.currentCurveIndex] = newCurve ; 
        }
        Traj.View.current_repaint();

    },

    SelectandRedrawEdit : function (){
        var curveIdx = Traj.Manager.currentCurveIndex;
        if (Traj.Manager.trajectories[curveIdx]) {
            Traj.Events.initSlider(true)
            $("#divCurveOptions").hide();
            $("#divCurveOptions").removeClass( "show" ).addClass( "hide" );
            $("#playDiv").show();      
            Traj.View.bg_repaint(true);
        }   
    },

    changeScale : function (){
        var curve = Traj.Manager.trajectories[Traj.Manager.currentCurveIndex];
        if (curve != undefined) {
            if (axis == 'x') {
                curve.changeXScale(scale);
            } else if (axis == 'y') {
                curve.changeYScale(scale);
            } else if (axis == 'z') {
                curve.changeZScale(scale);
            }
            Traj.Manager.selectCurve(Traj.Manager.currentCurveIndex);
        }
    },

    changeTime : function (){
        var curve = Traj.Manager.trajectories[Traj.Manager.currentCurveIndex];
        if (curve != undefined) {
            var inputTime = document.getElementById('timeStretch');
            curve.changeTotalTime(Number(inputTime.value));
            Traj.Manager.selectCurve(Traj.Manager.currentCurveIndex);
            Traj.Events.initSlider(false);
        }
    },

    changeSourceControled : function (){
        var curveIdx = Traj.Manager.currentCurveIndex;
        var curve = Traj.Manager.trajectories[curveIdx];
        if (curve != undefined) {
            var source = Number(document.getElementById("sourceControled").value);
            curve.changeSource(source);
            Traj.View.current_repaint();
            Traj.View.traj_repaint();
            Traj.View.dyn_repaint();
        }
    },

    longestCurveIdxOfPlayedCurve : function(indexes) {
        var maxTime = 0,
            idx = indexes[0];
        for (var k=0;k<indexes.length;k++) {
            var time = this.trajectories[indexes[k]].getDuration();
            if (time>maxTime) {
                maxTime = time;
                idx = indexes[k];
            }
        }
        return idx;
    },

    //for multi-user version, to be overridden in another js file
    processClientId : function(id){
        // do something only if multiuser version
    }
};

