//Drawing vars

//canvas use for the rendering of the curves
var traj_canvas;
var traj_ctx;

//canvas used to draw the background
var bg_canvas;
var bg_ctx;

//html page canvas used to draw dynamic elements (should be simple)
var dyn_canvas;
var dyn_ctx;

var backgroundCurve = true;
var SPEAKER_DIST = 1;

var COLOR_SCALE = '#505050';
var SPEAKER_STROKE_COLOR = '#000000';
var SPEAKER_FILL_COLOR = '#b5b3b3';
var SPEAKER_SIZE = 0.2;

var default_colors = ['#d11141', '#00b159', '#00aedb', '#f37735', '#ffc425'];

var FIRST_POINT_SIZE = 5; //pix
var POINT_SIZE = 1; //pix

//unit converter vars
var scaleFactor = 4; //give the units of the whole height or width
var minWH;
var pixToValue = scaleFactor / minWH;

//Curves
var trajectories = []; //Array of TimedCurves
var currentCurveIndex = 0;
var currentCurve = null;
var currentCurveLbl = "";
var last_p = [0, 0];
var DISTANCE_TRESHOLD = 8; //pix
var currentCurve = null;

//Events
var isTouched = false;
var ongoingTouches = [];
var timeStart; // for Time curve information
var touchState = 'wait';

var refreshTimer;
var refreshTimerInterval = 500; //ms

function traj_initCanvas() {
    bg_canvas = document.getElementById("bg-canvas");
    dyn_canvas = document.getElementById("dyn-canvas");
    traj_canvas = document.getElementById("traj-canvas");


    currentCurveLbl = document.getElementById('lbl_current_curve');

    var header = 50,
        right = 0,
        foot = 50;

    bg_canvas.width = window.innerWidth - right;
    bg_canvas.height = window.innerHeight - header - foot;

    traj_canvas.width = bg_canvas.width;
    traj_canvas.height = bg_canvas.height;
    dyn_canvas.width = bg_canvas.width;
    dyn_canvas.height = bg_canvas.height;


    traj_ctx = traj_canvas.getContext("2d");
    traj_ctx.imageSmoothingEnabled = true;


    bg_ctx = bg_canvas.getContext("2d");
    bg_ctx.imageSmoothingEnabled = true;

    dyn_ctx = dyn_canvas.getContext("2d");
    dyn_ctx.imageSmoothingEnabled = true;


    minWH = Math.min(dyn_canvas.width, dyn_canvas.height); // declared as global for now...
    pixToValue = scaleFactor / minWH;
    repaintAll();

    // refreshTimer = setInterval(refresh, refreshTimerInterval);
}

function refresh() {

}


function ongoingTouchIndexById(idToFind) {
    var i = 0;
    for (i = 0; i < ongoingTouches.length; i++) {
        var id = ongoingTouches[i].identifier;

        if (id === idToFind) {
            return i;
        }
    }
    return -1; // not found
}

function event2CanvasPos(evt) {
    var rel = [];
    rel[0] = evt.pageX - dyn_canvas.offsetLeft;
    rel[1] = evt.pageY - dyn_canvas.offsetTop;
    return rel;
}

//UnitConverter
function convertCanvasPosIntoUnits(coords) {
    var res = [];
    var h = Number(traj_canvas.height);
    var w = Number(traj_canvas.width);
    coords[1] = h - coords[1];
    res[0] = (coords[0] - (w / 2)) * pixToValue;
    res[1] = (coords[1] - (h / 2)) * pixToValue;
    return res;
}

//todo
function convertUnitsIntoCanvasPos(coords) {
    var res = [];
    var h = Number(traj_canvas.height);
    var w = Number(traj_canvas.width);
    res[0] = coords[0] * (1 / pixToValue) + (w / 2);
    res[1] = coords[1] * (1 / pixToValue) + (h / 2);
    res[1] = h - res[1];

    res[0] = Math.floor(res[0]);
    res[1] = Math.floor(res[1]);
    return res;
}

function getColorForIndex(idx) {
    return default_colors[(idx + default_colors.length) % default_colors.length];
}

function draw_startCurrentCurve(evt) {
    var pos = event2CanvasPos(evt);
    drawCurveFirstPoint(dyn_ctx, pos, currentCurveIndex);
    traj_ctx.beginPath();
    traj_ctx.lineWidth = 2;
    traj_ctx.strokeStyle = currentCurve.color;
    traj_ctx.moveTo(pos[0], pos[1]);
}

function draw_updateCurrentCurve(evt) {
    if (currentCurve !== null) {
        var pos = event2CanvasPos(evt);
        dyn_ctx.lineWidth = 2;
        dyn_ctx.lineTo(pos[0], pos[1]);
        dyn_ctx.stroke();
    }
}


function processCreateNewCurve(x, y, z, t) {
    timeStart = t;
    currentCurve = new TimedCurve(getColorForIndex(trajectories.length));
    selectCurve(trajectories.length);
    currentCurve.addTimedPoint(x, y, z, 0);
    streamCurveLastPoint(currentCurve);
}

function processAddPointToCurve(x, y, z, t) {
    if (currentCurve !== null) {
        currentCurve.addTimedPoint(x, y, z, t - timeStart);
        streamCurveLastPoint(currentCurve);
    }
}

function processEndCurve(x, y, z, t) {
    clearContext(dyn_ctx);
    // processAddPointToCurve(x, y, z, t - timeStart);
    //store the curve if non null and at least 4 points (dist is enought would be better)
    if (currentCurve !== null && currentCurve.X.length > 4) {
        trajectories.push(currentCurve.clone());
        traj_repaint();
        sendCurveOSC(trajectories[currentCurveIndex], currentCurveIndex);
    }
    //on refait...
    currentCurve = null;
}

//events
function handleStart(evt) {
    evt.preventDefault();

    if (touchState === 'wait') {
        touchState = '1touch';
        var touches = evt.changedTouches;
        var i = 0; // take first touch  
        ongoingTouches.push(touches[i]);
        last_p = [touches[i].pageX, touches[i].pageY];
        var coords = convertCanvasPosIntoUnits(event2CanvasPos(touches[i], last_p));
        var z = 0;
        var t = Math.floor(evt.timeStamp);
        processCreateNewCurve(coords[0], coords[1], z, t);
        draw_startCurrentCurve(touches[i]);

    } else if (touchState === '1touch') {
        touchState = '2touch';
        // TODO : add 2touch functionality  
    }
}

function handleMove(evt) {
    evt.preventDefault();
    if (touchState === '1touch') {
        var i = 0;
        var touches = evt.changedTouches;
        if (currentCurve !== null && distanceBtwPoints([touches[i].pageX, touches[i].pageY], last_p) > DISTANCE_TRESHOLD) {
            last_p = [touches[0].pageX, touches[0].pageY];
            var coords = convertCanvasPosIntoUnits(event2CanvasPos(touches[0]));
            var z = 0;
            var t = Math.floor(evt.timeStamp);
            processAddPointToCurve(coords[0], coords[1], z, t);
            draw_updateCurrentCurve(touches[i]);
        }
    } else if (touchState === '2touch') {

    }

}

function distanceBtwPoints(p1, p2) {
    var dx = p1[0] - p2[0];
    var dy = p1[1] - p2[1];
    return Math.sqrt(dx * dx + dy * dy);
}

function handleEnd(evt) {
    evt.preventDefault();
    var touches = evt.changedTouches;
    var nbTouch = evt.touches.length;

    if (nbTouch < 1) {
        var i = 0;
        var coords = convertCanvasPosIntoUnits(event2CanvasPos(touches[i]));
        var z = 0;
        var t = Math.floor(evt.timeStamp);
        processEndCurve(coords[0], coords[1], z, t);
        touchState = 'wait';

    } else if (touchState === '2touch') {
        touchState = '1touch';
    }
}

function handleCancel(evt) {
    evt.preventDefault();
}


function handleMouseDown(evt) {
    if (touchState === 'wait') {
        touchState = '1touch';
        last_p = [evt.pageX, evt.pageY];
        var coords = convertCanvasPosIntoUnits(event2CanvasPos(evt));
        var z = 0;
        var t = Math.floor(evt.timeStamp);

        processCreateNewCurve(coords[0], coords[1], z, t);
        draw_startCurrentCurve(evt);
    }
}

function handleMouseMove(evt) {

    if (touchState === '1touch') {
        if (currentCurve !== null && distanceBtwPoints([evt.pageX, evt.pageY], last_p) > DISTANCE_TRESHOLD) {
            last_p = [evt.pageX, evt.pageY];
            var coords = convertCanvasPosIntoUnits(event2CanvasPos(evt));
            var z = 0;
            var t = Math.floor(evt.timeStamp);

            processAddPointToCurve(coords[0], coords[1], z, t);
            draw_updateCurrentCurve(evt);
        }
    }
}

function handleMouseUp(evt) {
    var coords = convertCanvasPosIntoUnits(event2CanvasPos(evt));
    var z = 0;
    var t = Math.floor(evt.timeStamp);
    processEndCurve(coords[0], coords[1], z, t);
    touchState = 'wait';
    //"draw_updateCurrentCurve(evt);
}

function addTouchEvents(canvas) {
    canvas.addEventListener("touchstart", handleStart, false);
    canvas.addEventListener("touchend", handleEnd, false);
    canvas.addEventListener("touchcancel", handleCancel, false);
    canvas.addEventListener("touchmove", handleMove, false);
}

function addMouseEvents(canvas) {
    canvas.addEventListener("mousedown", handleMouseDown, false);
    canvas.addEventListener("mousemove", handleMouseMove, false);
    canvas.addEventListener("mouseup", handleMouseUp, false);
}

//init
function traj_initEvents() {
    if (isCordova) {
        addTouchEvents(dyn_canvas);
    } else {
        addMouseEvents(dyn_canvas);
    }
}

function repaintAll() {
    bg_repaint();
    traj_repaint();
    dyn_repaint();
}

function dyn_repaint() {
    clearContext(dyn_ctx);
    if (currentCurve !== null) {
        drawCurve(dyn_ctx, currentCurve, currentCurveIndex, 3, 0.9);
    }
}

//drawing functions
function traj_repaint() {
    clearContext(traj_ctx);
    if (backgroundCurve) {
        drawAllCurves(traj_ctx);
    } else {}
}

//drawing functions
function bg_repaint() {
    clearContext(bg_ctx);
    drawAxis();
    drawSpeakers();
}

function clearContext(ctx) {
    ctx.clearRect(0, 0, dyn_canvas.width, dyn_canvas.height);
}

function drawAxis() {

    bg_ctx.globalAlpha = 1;
    var step = 0.1; //in Traj Units
    var step_pix = step * (1 / pixToValue);

    while (step_pix < 10) {
        step_pix = step_pix * 10;
    }
    //draw small grid
    bg_ctx.beginPath();
    bg_ctx.strokeStyle = COLOR_SCALE;
    bg_ctx.lineWidth = 0.3;

    var center_x = Math.floor(traj_canvas.width / 2);
    var center_y = Math.floor(traj_canvas.height / 2);

    //draw from center with a step
    for (var i = 0;
        (center_x - (i * step_pix)) > 0; i++) {
        bg_ctx.moveTo(center_x - (i * step_pix), 0);
        bg_ctx.lineTo(center_x - (i * step_pix), traj_canvas.height);
        bg_ctx.moveTo(center_x + (i * step_pix), 0);
        bg_ctx.lineTo(center_x + (i * step_pix), traj_canvas.height);
    }

    for (var j = 0;
        (center_y - (j * step_pix)) > 0; j++) {
        bg_ctx.moveTo(0, center_y - (j * step_pix));
        bg_ctx.lineTo(traj_canvas.width, center_y - (j * step_pix));
        bg_ctx.moveTo(0, center_y + (j * step_pix));
        bg_ctx.lineTo(traj_canvas.width, center_y + (j * step_pix));
    }
    bg_ctx.stroke();

    //draw the axis
    bg_ctx.globalAlpha = 1;
    bg_ctx.beginPath();
    bg_ctx.strokeStyle = COLOR_SCALE;
    bg_ctx.lineWidth = 1;
    bg_ctx.moveTo(Math.floor(traj_canvas.width / 2), 0);
    bg_ctx.lineTo(Math.floor(traj_canvas.width / 2), traj_canvas.height);
    bg_ctx.moveTo(0, Math.floor(traj_canvas.height / 2));
    bg_ctx.lineTo(traj_canvas.width, Math.floor(traj_canvas.height / 2));
    bg_ctx.stroke();


    //draw labels for 1 units
    bg_ctx.fillStyle = 'black';
    bg_ctx.font = '10px Georgia';


    var pos = convertUnitsIntoCanvasPos([1, 0]);
    bg_ctx.fillText(1, pos[0], pos[1]);
    pos = convertUnitsIntoCanvasPos([-1, 0]);
    bg_ctx.fillText(-1, pos[0], pos[1]);
    pos = convertUnitsIntoCanvasPos([0, 1]);
    bg_ctx.fillText(1, pos[0], pos[1]);
    pos = convertUnitsIntoCanvasPos([0, -1]);
    bg_ctx.fillText(-1, pos[0], pos[1]);

}

function drawSpeakers() {
    //Plot the 4 speakers
    var hp_size = SPEAKER_SIZE * (1 / pixToValue)
    var pos = convertUnitsIntoCanvasPos([SPEAKER_DIST, SPEAKER_DIST]);
    drawSpeakerAt(pos, hp_size);
    pos = convertUnitsIntoCanvasPos([SPEAKER_DIST, -SPEAKER_DIST]);
    drawSpeakerAt(pos, hp_size);
    pos = convertUnitsIntoCanvasPos([-SPEAKER_DIST, SPEAKER_DIST]);
    drawSpeakerAt(pos, hp_size);
    pos = convertUnitsIntoCanvasPos([-SPEAKER_DIST, -SPEAKER_DIST]);
    drawSpeakerAt(pos, hp_size);
}

function drawSpeakerAt(pos, hp_size) {
    bg_ctx.fillStyle = SPEAKER_FILL_COLOR;
    bg_ctx.globalAlpha = 0.6;
    bg_ctx.lineWidth = 1;
    bg_ctx.fillRect(pos[0] - hp_size / 2, pos[1] - hp_size / 2, hp_size, hp_size);
    bg_ctx.strokeStyle = SPEAKER_STROKE_COLOR;
    bg_ctx.globalAlpha = 1;
    bg_ctx.rect(pos[0] - hp_size / 2, pos[1] - hp_size / 2, hp_size, hp_size);
    bg_ctx.closePath();
    bg_ctx.stroke();
}

function drawCurveFirstPoint(ctx, pos, index) {
    drawPoint(ctx, pos, FIRST_POINT_SIZE);
    ctx.fillStyle = 'black';
    ctx.font = '10px Georgia';
    ctx.fillText(index, pos[0] - FIRST_POINT_SIZE - 2, pos[1] - FIRST_POINT_SIZE - 2);
}

function drawCurvePoint(ctx, pos) {
    drawPoint(ctx, pos, POINT_SIZE);
}

function drawPoint(ctx, pos, size) {
    ctx.beginPath();
    ctx.arc(pos[0], pos[1], size, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.stroke();
}

function drawAllCurves(ctx) {
    var i = 0,
        alpha_stroke,
        lwidth;
    for (i = 0; i < trajectories.length; i++) {
        alpha_stroke = (i === currentCurveIndex) ? 0.9 : 0.4;
        lwidth = (i === currentCurveIndex) ? 3 : 1;
        drawCurve(ctx, trajectories[i], i, lwidth, alpha_stroke);
    }
}

function drawCurve(ctx, curve, index, linewidth, alpha) {

    ctx.lineWidth = linewidth;
    ctx.fillStyle = curve.color;
    ctx.strokeStyle = curve.color;
    ctx.globalAlpha = alpha;


    var i = 0;
    var pos = convertUnitsIntoCanvasPos([curve.X[i], curve.Y[i]]);
    drawCurveFirstPoint(ctx, pos, index);


    ctx.beginPath();
    ctx.moveTo(pos[0], pos[1]);

    for (i = 1; i < curve.X.length; i++) {
        pos = convertUnitsIntoCanvasPos([curve.X[i], curve.Y[i]]);
        ctx.lineTo(pos[0], pos[1]);
    }
    ctx.stroke();


    //draw the points
    for (i = 0; i < curve.X.length; i++) {
        pos = convertUnitsIntoCanvasPos([curve.X[i], curve.Y[i]]);
        drawCurvePoint(ctx, pos);
    }

    ctx.globalAlpha = 1;
}

function deleteCurve(index) {
    trajectories.splice(index, 1);
    selectCurve((currentCurveIndex - 1 + trajectories.length) % trajectories.length);
    traj_repaint();
    dyn_repaint();
}

function selectCurve(index) {
    if (isNaN(index))
        index = 0;
    currentCurveIndex = index;
    currentCurveLbl.innerHTML = "" + currentCurveIndex;
    traj_repaint();
    dyn_repaint();
}

function sendTrigger(message) {}


//Functions called from Html interface
function deleteCurrentCurve() {
    deleteCurve(currentCurveIndex);
}

function selectNextCurve() {
    selectCurve((currentCurveIndex + 1) % trajectories.length);
}

function selectPreviousCurve() {
    selectCurve((currentCurveIndex - 1 + trajectories.length) % trajectories.length);
}

function playCurrentCurve() {
    trajectories[currentCurveIndex].play();
}

function stopCurrentCurve() {
    trajectories[currentCurveIndex].stop();
}


function sendTriggerPlay() {
    osc_sendPlay("Play");
}

function sendTriggerRecord() {
    osc_sendRecord("Record");
}

//Getters and Setters
function setCanvasZoom(factor) {
    //if (logger) writtraj_canvasog("traj_canvas Zoom " + factor);
    scaleFactor = scaleFactor / factor;
    pixToValue = scaleFactor / minWH;
    repaintAll();
}

function setDrawCurvesInBackground() {
    backgroundCurve = document.getElementById("flip-curvesinback").value == 'on';
    traj_repaint();
    dyn_repaint();
}

function setHpDistance() {
    SPEAKER_DIST = document.getElementById("speaker_dist").value;
    if (logger) writeLog("APP HPDistance " + SPEAKER_DIST);
    bg_repaint();
    dyn_repaint();
}