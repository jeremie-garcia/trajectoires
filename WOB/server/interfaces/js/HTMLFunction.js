// this function are called by html elements.
// TODO : create events on each html elements


function sendTrigger(message) {}


//Functions called from Html interface
function deleteCurrentCurve() {
    Trajectoires.TrajManager.deleteCurve(Trajectoires.TrajManager.currentCurveIndex);
    Trajectoires.EventManager.hideLongTouchMenu();
}

function selectNextCurve() {
    Trajectoires.TrajManager.selectCurve((Trajectoires.TrajManager.currentCurveIndex + 1) % Trajectoires.TrajManager.trajectories.length);
}

function selectPreviousCurve() {
    Trajectoires.TrajManager.selectCurve((Trajectoires.TrajManager.currentCurveIndex - 1 + Trajectoires.TrajManager.trajectories.length) % Trajectoires.TrajManager.trajectories.length);
}

function sendTriggerPlay() {
    Trajectoires.OSC.sendPlay("Play");
}

function sendTriggerRecord() {
    Trajectoires.OSC.sendRecord("Record");
}

//Getters and Setters
function setCanvasZoom(factor) {
    //if (logger) writtraj_canvasog("traj_canvas Zoom " + factor);
    Trajectoires.View.scaleFactor = Trajectoires.View.scaleFactor / factor;
    Trajectoires.View.pixToValue = Trajectoires.View.scaleFactor / Trajectoires.View.minWH;
    Trajectoires.View.repaintAll();
}


function setDrawCurvesInBackground() {
    Trajectoires.View.backgroundCurve = document.getElementById("flip-curvesinback").value == 'on';
    Trajectoires.View.traj_repaint();
    Trajectoires.View.dyn_repaint();
}

function setLoopMode() {
    Trajectoires.Player.loopMode = document.getElementById("flip-loop").value == 'on';
}

function setOrientationMode() {
    Trajectoires.EventManager.stream_orientation = document.getElementById("flip-orientation").value == 'on';
}

function setHpDistance() {
    Trajectoires.View.SPEAKER_DIST = document.getElementById("speaker_dist").value;
    Trajectoires.View.bg_repaint();
}

function exportCurrentCurve(){
    exportCurrentCurveAsAntescofoNIM();
    if(Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex]){
     if(Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex].X.length <1000){
            Trajectoires.OSC.sendCurveSingleMessageOSC(Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex], Trajectoires.TrajManager.currentCurveIndex);
        }else{
            Trajectoires.OSC.sendCurveOSC(Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex], Trajectoires.TrajManager.currentCurveIndex);
        }
    }
    Trajectoires.Session.saveInSelectedSession();
}

function exportCurrentCurveAsAntescofoNIM(){
    var manager = Trajectoires.TrajManager;
    if(manager.trajectories[manager.currentCurveIndex]){
        Trajectoires.OSC.saveAntescofo(manager.trajectories[manager.currentCurveIndex], manager.currentCurveIndex, Trajectoires.Session.currentSession);
    }
        
}

function setTimeSliderMode() {
    if (document.getElementById("flip-timeSlider").value == 'on') {
        $("#slider-div").show();
    } else {
        $("#slider-div").hide();    
    }
     
}

function simplifyCurrentCurve(tolerance) {
    var currentCurve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex];
    if (currentCurve != undefined) {
        var newCurve = Trajectoires.Utils.simplifyCurve(currentCurve,tolerance);
        Trajectoires.TrajManager.trajectories.push(newCurve); 
        Trajectoires.TrajManager.selectCurve(Trajectoires.TrajManager.trajectories.length-1);
    }
}

function changeSourceControled() {
    var curveIdx = Trajectoires.TrajManager.currentCurveIndex;
    var curve = Trajectoires.TrajManager.trajectories[curveIdx];
    if (curve != undefined) {
        var source = Number(document.getElementById("sourceControled").value);
        curve.changeSource(source);
        Trajectoires.View.current_repaint();
        Trajectoires.View.traj_repaint();
        Trajectoires.View.dyn_repaint();
    }
}

function activeMultiPlay() {
    var curveIdx = Trajectoires.TrajManager.currentCurveIndex;  
    if (Trajectoires.TrajManager.trajectories[curveIdx]) {  
        Trajectoires.TrajManager.trajectories[curveIdx].multiPlay = document.getElementById("checkPlay").checked;
        Trajectoires.TrajManager.multiPlayChanged(0);
    } 
}
function removeMultiPlay() {
    var trajectories = Trajectoires.TrajManager.trajectories;
    for (var k=0;k<trajectories.length;k++) {
        trajectories[k].multiPlay = false;
    }
    Trajectoires.TrajManager.playedCurves = [];
    Trajectoires.EventManager.refreshCurveInfo();
    Trajectoires.TrajManager.multiPlayChanged();
}

function modeSelectEdit() {
    var curveIdx = Trajectoires.TrajManager.currentCurveIndex;
    if (Trajectoires.TrajManager.trajectories[curveIdx]) {
        Trajectoires.EventManager.initSlider(true)
        $("#divCurveOptions").hide();
        $("#divCurveOptions").removeClass( "show" ).addClass( "hide" );
        $("#playDiv").show();      
        Trajectoires.View.bg_repaint(true);
    }   
    Trajectoires.EventManager.hideLongTouchMenu();
}

function setZSliderMode() {
    if (document.getElementById("flip-zSlider").value == 'on') {
        $("#ZSliderDiv").show();
    } else {
        $("#ZSliderDiv").hide();    
    }
     
}


function changeScale(axis,scale) {
    var curve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex];
    if (curve != undefined) {
        if (axis == 'x') {
            curve.changeXScale(scale);
        } else if (axis == 'y') {
            curve.changeYScale(scale);
        } else if (axis == 'z') {
            curve.changeZScale(scale);
        }
        Trajectoires.TrajManager.selectCurve(Trajectoires.TrajManager.currentCurveIndex);
    }
}

function changeTime() {
    var curve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex];
    if (curve != undefined) {
        var inputTime = document.getElementById('timeStretch');
        curve.changeTotalTime(Number(inputTime.value));
        Trajectoires.TrajManager.selectCurve(Trajectoires.TrajManager.currentCurveIndex);
        Trajectoires.EventManager.initSlider(false);
    }
}

function translateCurve() {
    var curve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex];
    if (curve != undefined) {
        var inputX = document.getElementById('xOriPos').value;
        var inputY = document.getElementById('yOriPos').value;
        var inputZ = document.getElementById('zOriPos').value;
        curve.translate(Number(inputX),Number(inputY),Number(inputZ));
        Trajectoires.TrajManager.selectCurve(Trajectoires.TrajManager.currentCurveIndex);
    }
}



function copyCurrentCurve() {
    var curve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex];
    if (curve != undefined) {
        Trajectoires.TrajManager.copyCurrentCurve(0,curve.X.length-1);
        Trajectoires.EventManager.hideLongTouchMenu();
    }
}

function pasteInCurrentCurve() {
    var curve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex];
    if (curve != undefined) {
        var beginTime = Trajectoires.EventManager.getSliderValue();
        var beginIdx = Trajectoires.Utils.findPointIdx(beginTime,curve);
        Trajectoires.TrajManager.pasteInCurve(curve,beginIdx,beginIdx);
        Trajectoires.EventManager.hideLongTouchMenu();
        //Trajectoires.TrajManager.selectCurve(Trajectoires.TrajManager.trajectories.length-1);
    }
}

function duplicateCurrentCurve() {
    var curve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex];
    if (curve != undefined) {
        var newCurve = curve.clone();
        var XYZ = [newCurve.X[0]+0.1,newCurve.Y[0]-0.1,newCurve.Z[0]];
        newCurve.translate(XYZ[0],XYZ[1],XYZ[2]);
        Trajectoires.TrajManager.trajectories.push(newCurve);
        Trajectoires.TrajManager.selectCurve(Trajectoires.TrajManager.trajectories.length-1);
        Trajectoires.EventManager.hideLongTouchMenu();
    }
}

function mirror(type) {
    var curve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex];
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
        Trajectoires.TrajManager.selectCurve(Trajectoires.TrajManager.currentCurveIndex);
    }
} 

