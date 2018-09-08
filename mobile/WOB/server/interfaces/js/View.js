////////////////////////////////////////////////////////////
///////////////////////// VIEW ////////////////////////////
Trajectoires.View = {
    //Drawing vars
    //canvas use for the rendering of the curves
    traj_canvas : {},
    traj_ctx : {},

    //canvas used to draw the background
    bg_canvas : {},
    bg_ctx : {},

    //html page canvas used to draw dynamic elements (should be simple)
    dyn_canvas : {},
    dyn_ctx : {},

    current_canvas : {},
    current_ctx : {},

    backgroundCurve : true,
    SPEAKER_DIST : 1,

    COLOR_SCALE : '#505050',
    SPEAKER_STROKE_COLOR : '#000000',
    SPEAKER_FILL_COLOR : '#b5b3b3',
    SPEAKER_SIZE : 0.2,

    //curve drawing vars
    default_colors : ['#373737', '#e69a00', '#5a9f29', '#e63d00', '#005788', '#810A69', '#2C827B', '#C6C027'],
    FIRST_POINT_SIZE : 5, //pix
    CURVE_STROKE_SIZE : 1,
    CURVE_ACTIVE_STROKE_SIZE : 3,
    CURVE_ALPHA : 0.4,
    CURVE_ACTIVE_ALPHA : 0.9,
 
    last_event_pos : [0, 0],
    DISTANCE_TRESHOLD : 8, //pix

    //Events
    isTouched : false,
    ongoingTouches : [],
    timeStart : {}, // for Time curve information
    touchState : 'wait',

    repaintAll : function() {
        this.bg_repaint();
        this.traj_repaint();
        this.dyn_repaint();
        this.current_repaint();
    },

    dyn_repaint : function() {
        this.clearContext(this.dyn_ctx);
    },

//drawing functions
    traj_repaint : function() {
        var currentCurve = Trajectoires.TrajManager.currentCurve;
        var currentCurveIndex = Trajectoires.TrajManager.currentCurveIndex;
        var trajectories = Trajectoires.TrajManager.trajectories;
        this.clearContext(this.traj_ctx);
        if (this.backgroundCurve) {
            this.drawAllCurves(this.traj_ctx);
        } else if (currentCurve=== null && (trajectories.length > 0)){
            //this.drawCurve(this.traj_ctx, trajectories[currentCurveIndex], currentCurveIndex, this.CURVE_ACTIVE_STROKE_SIZE,this.CURVE_ACTIVE_ALPHA,true);
        }
    },

    current_repaint : function() {
        var currentCurveIndex = Trajectoires.TrajManager.currentCurveIndex;
        this.clearContext(this.current_ctx);
        var curve = Trajectoires.TrajManager.trajectories[currentCurveIndex];
        if (typeof(curve) != 'undefined') {
            this.drawCurve(this.current_ctx,curve,currentCurveIndex,this.CURVE_ACTIVE_STROKE_SIZE,this.CURVE_ACTIVE_ALPHA,true);
        }
    },
 

    bg_repaint : function(selectEditMode) {
        this.clearContext(this.bg_ctx);
        if (selectEditMode) {
            this.bg_ctx.fillStyle = "#D7F0ED";
            this.bg_ctx.rect(0,0,this.bg_canvas.width,this.bg_canvas.height);
            this.bg_ctx.fill();
        }
        this.drawAxis();
        this.drawSpeakers();
        //this.drawDrawZone();
    },

    clearContext : function(ctx) {
        ctx.clearRect(0, 0, this.dyn_canvas.width, this.dyn_canvas.height);
    },

    // drawDrawZone : function() {
    //     var ctx = this.bg_ctx;
    //     var radius = 100;
    //     var centerX = 0;
    //     var centerY = this.bg_canvas.height-30;
    //     ctx.globalAlpha = 0.6;
    //     ctx.beginPath();
    //     ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    //     ctx.fillStyle = 'green';
    //     ctx.fill();
    //     ctx.lineWidth = 5;
    //     ctx.strokeStyle = '#003300';
    //     ctx.stroke();

    // },

    drawAxis : function() {
        this.bg_ctx.globalAlpha = 1;
        var step = 0.1; //in Traj Units
        var step_pix = step * (1 / this.pixToValue);

        while (step_pix < 10) {
            step_pix = step_pix * 10;
        }
        //draw small grid
        this.bg_ctx.beginPath();
        this.bg_ctx.strokeStyle = this.COLOR_SCALE;
        this.bg_ctx.lineWidth = 0.3;

        var center_x = Math.floor(this.traj_canvas.width / 2);
        var center_y = Math.floor(this.traj_canvas.height / 2);

        //draw from center with a step
        for (var i = 0;
            (center_x - (i * step_pix)) > 0; i++) {
            this.bg_ctx.moveTo(center_x - (i * step_pix), 0);
        this.bg_ctx.lineTo(center_x - (i * step_pix), this.traj_canvas.height);
        this.bg_ctx.moveTo(center_x + (i * step_pix), 0);
        this.bg_ctx.lineTo(center_x + (i * step_pix), this.traj_canvas.height);
    }

    for (var j = 0;
        (center_y - (j * step_pix)) > 0; j++) {
        this.bg_ctx.moveTo(0, center_y - (j * step_pix));
        this.bg_ctx.lineTo(this.traj_canvas.width, center_y - (j * step_pix));
        this.bg_ctx.moveTo(0, center_y + (j * step_pix));
        this.bg_ctx.lineTo(this.traj_canvas.width, center_y + (j * step_pix));
        }
        this.bg_ctx.stroke();

        //draw the axis
        this.bg_ctx.globalAlpha = 1;
        this.bg_ctx.beginPath();
        this.bg_ctx.strokeStyle = this.COLOR_SCALE;
        this.bg_ctx.lineWidth = 1;
        this.bg_ctx.moveTo(Math.floor(this.traj_canvas.width / 2), 0);
        this.bg_ctx.lineTo(Math.floor(this.traj_canvas.width / 2), this.traj_canvas.height);
        this.bg_ctx.moveTo(0, Math.floor(this.traj_canvas.height / 2));
        this.bg_ctx.lineTo(this.traj_canvas.width, Math.floor(this.traj_canvas.height / 2));
        this.bg_ctx.stroke();


        //draw labels for 1 units
        this.bg_ctx.fillStyle = 'black';
        this.bg_ctx.font = '10px Georgia';


        var pos = Trajectoires.Utils.convertUnitsIntoCanvasPos([1, 0]);
        this.bg_ctx.fillText(1, pos[0], pos[1]);
        pos = Trajectoires.Utils.convertUnitsIntoCanvasPos([-1, 0]);
        this.bg_ctx.fillText(-1, pos[0], pos[1]);
        pos = Trajectoires.Utils.convertUnitsIntoCanvasPos([0, 1]);
        this.bg_ctx.fillText(1, pos[0], pos[1]);
        pos = Trajectoires.Utils.convertUnitsIntoCanvasPos([0, -1]);
        this.bg_ctx.fillText(-1, pos[0], pos[1]);

    },

    drawSpeakers : function() {
        //Plot the 4 speakers
        var hp_size = this.SPEAKER_SIZE * (1 / this.pixToValue)
        var pos = Trajectoires.Utils.convertUnitsIntoCanvasPos([this.SPEAKER_DIST, this.SPEAKER_DIST]);
        this.drawSpeakerAt(pos, hp_size);
        pos = Trajectoires.Utils.convertUnitsIntoCanvasPos([this.SPEAKER_DIST, -this.SPEAKER_DIST]);
        this.drawSpeakerAt(pos, hp_size);
        pos = Trajectoires.Utils.convertUnitsIntoCanvasPos([-this.SPEAKER_DIST, this.SPEAKER_DIST]);
        this.drawSpeakerAt(pos, hp_size);
        pos = Trajectoires.Utils.convertUnitsIntoCanvasPos([-this.SPEAKER_DIST, -this.SPEAKER_DIST]);
        this.drawSpeakerAt(pos, hp_size);
    },

    drawSpeakerAt : function(pos, hp_size) {
        this.bg_ctx.fillStyle = this.SPEAKER_FILL_COLOR;
        this.bg_ctx.globalAlpha = 0.6;
        this.bg_ctx.lineWidth = 1;
        this.bg_ctx.fillRect(pos[0] - hp_size / 2, pos[1] - hp_size / 2, hp_size, hp_size);
        this.bg_ctx.strokeStyle = this.SPEAKER_STROKE_COLOR;
        this.bg_ctx.globalAlpha = 1;
        this.bg_ctx.rect(pos[0] - hp_size / 2, pos[1] - hp_size / 2, hp_size, hp_size);
        this.bg_ctx.closePath();
        this.bg_ctx.stroke();
    },

    drawCurveFirstPoint : function(ctx, pos, index) {
        this.drawPoint(ctx, pos, this.FIRST_POINT_SIZE);
        ctx.fillStyle = 'black';
        ctx.font = '10px Georgia';
        ctx.fillText(index, pos[0] - this.FIRST_POINT_SIZE - 2, pos[1] - this.FIRST_POINT_SIZE - 2);
    },

    drawPoint : function(ctx, pos, size) {
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], size, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.stroke();
    },

    drawAllCurves : function(ctx) {
        var alpha_stroke,
            lwidth,
            drawPoint,
            currentCurveIndex = Trajectoires.TrajManager.currentCurveIndex,
            trajectories = Trajectoires.TrajManager.trajectories;
 
        for (var i = 0; i < trajectories.length; i++) { // TODO : DO NOT DRAW CURRENT CURVE IN TRAJ_CANVAS. USE CURRENT_CANVAS
            if (i!=currentCurveIndex) {
                alpha_stroke = (trajectories[i].multiPlay) ? this.CURVE_ACTIVE_ALPHA-0.1 : this.CURVE_ALPHA;//(i === currentCurveIndex) ? this.CURVE_ACTIVE_ALPHA : this.CURVE_ALPHA;
                lwidth = (trajectories[i].multiPlay) ? this.CURVE_ACTIVE_STROKE_SIZE-1 : this.CURVE_STROKE_SIZE;//(i === currentCurveIndex) ? this.CURVE_ACTIVE_STROKE_SIZE : this.CURVE_STROKE_SIZE;
                drawPoint = false ;//(i === currentCurveIndex) ? true : false;
                this.drawCurve(ctx, trajectories[i], i, lwidth, alpha_stroke,drawPoint);
            }
        }
    },

    draw_startCurrentCurve : function(evt) {
        var pos = Trajectoires.Utils.event2CanvasPos(evt);
        this.dyn_ctx.lineWidth = this.CURVE_ACTIVE_STROKE_SIZE;
        this.dyn_ctx.strokeStyle = Trajectoires.TrajManager.currentCurve.color;
        this.drawCurveFirstPoint(this.dyn_ctx, pos, Trajectoires.TrajManager.currentCurveIndex);
    },

    draw_updateCurrentCurve : function(evt) {
    if (Trajectoires.TrajManager.currentCurve !== null) {
        var pos = Trajectoires.Utils.event2CanvasPos(evt);
        this.current_ctx.beginPath();
        this.current_ctx.lineWidth = this.CURVE_ACTIVE_STROKE_SIZE;
        this.current_ctx.strokeStyle = Trajectoires.TrajManager.currentCurve.color;
        this.current_ctx.moveTo(this.last_event_pos[0],this.last_event_pos[1]);
        this.current_ctx.lineTo(pos[0], pos[1]);
        this.current_ctx.stroke();
        }
    },

    drawCurve : function(ctx, curve, index, linewidth, alpha,withPoint) {
        ctx.lineWidth = linewidth;
        ctx.fillStyle = curve.color;
        ctx.strokeStyle = curve.color;
        ctx.globalAlpha = alpha;

        var i = 0;
        var pos = Trajectoires.Utils.convertUnitsIntoCanvasPos([curve.X[i], curve.Y[i]]);
        this.drawCurveFirstPoint(ctx, pos, index);

        // ctx.beginPath();
        ctx.moveTo(pos[0], pos[1]);

        for (i = 1; i < curve.X.length; i++) {
            pos = Trajectoires.Utils.convertUnitsIntoCanvasPos([curve.X[i], curve.Y[i]]);
            ctx.lineTo(pos[0], pos[1]);
        }
        ctx.stroke();

        //draw the points
        if (withPoint) {
            for (i = 1; i < curve.X.length; i++) {
                pos = Trajectoires.Utils.convertUnitsIntoCanvasPos([curve.X[i], curve.Y[i]]);
                this.drawPoint(ctx, pos, (linewidth*0.9));
            }
        }
        ctx.globalAlpha = 1;
    },

    // Called when TimeSlider is moved
    drawTimePoint : function(now) {
        var dyn_ctx = Trajectoires.View.dyn_ctx;
        Trajectoires.View.dyn_repaint();
        var currentCurve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex];

        var pointCoord = Trajectoires.Utils.interpolate(now,currentCurve);
        var x = pointCoord[1];
        var y = pointCoord[2];
        var z = pointCoord[3];

        if (!isNaN(x)&&!isNaN(y)) {
            Trajectoires.OSC.sendPosxyzMsg(pointCoord);
        }

        var pos = Trajectoires.Utils.convertUnitsIntoCanvasPos([x,y]);
        
        dyn_ctx.lineWidth = 5;
        dyn_ctx.fillStyle = currentCurve.color;
        dyn_ctx.strokeStyle = currentCurve.color;
        dyn_ctx.globalAlpha = Trajectoires.View.CURVE_ACTIVE_ALPHA;
        Trajectoires.View.drawPoint(dyn_ctx,pos , 8);
        Trajectoires.View.drawPoint(dyn_ctx,pos , 18);
        //Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex].replayCurvePoint(currentID,false);
         Trajectoires.EventManager.setZSliderValue(z); // weird to let it here, but easier beacause here 'z' is known
    },

    // when multiplay activated
    drawSeveralTimePoint : function(now) {
        var curvesIdx = Trajectoires.TrajManager.playedCurves,
            dyn_ctx = Trajectoires.View.dyn_ctx;

        Trajectoires.View.dyn_repaint();
        
        for (var k=0; k<curvesIdx.length;k++) {
            var currentCurve = Trajectoires.TrajManager.trajectories[curvesIdx[k]],
                pointCoord = Trajectoires.Utils.interpolate(now,currentCurve),
                x = pointCoord[1],
                y = pointCoord[2];

            if (!isNaN(x)&&!isNaN(y)) {
                Trajectoires.OSC.sendPosxyzMsg(pointCoord);
            }

            var pos = Trajectoires.Utils.convertUnitsIntoCanvasPos([x,y]);
        
            dyn_ctx.lineWidth = 5;
            dyn_ctx.fillStyle = currentCurve.color;
            dyn_ctx.strokeStyle = currentCurve.color;
            dyn_ctx.globalAlpha = Trajectoires.View.CURVE_ACTIVE_ALPHA;
            Trajectoires.View.drawPoint(dyn_ctx,pos , 8);
            Trajectoires.View.drawPoint(dyn_ctx,pos , 18);
        }
    },




    drawTimePointsSelect : function(now,curve) {
        var dyn_ctx = Trajectoires.View.dyn_ctx;
        Trajectoires.View.dyn_repaint();
        var curve = curve || Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex];
        //var currentCurve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex];

        var pointCoord = Trajectoires.Utils.interpolate(now[0],curve);
        var x = pointCoord[1];
        var y = pointCoord[2];

        var pos = Trajectoires.Utils.convertUnitsIntoCanvasPos([x,y]);
        dyn_ctx.lineWidth = 5;
        dyn_ctx.fillStyle = curve.color;
        dyn_ctx.strokeStyle = curve.color;
        dyn_ctx.globalAlpha = Trajectoires.View.CURVE_ACTIVE_ALPHA;
        Trajectoires.View.drawPoint(dyn_ctx,pos , 8);
        Trajectoires.View.drawPoint(dyn_ctx,pos , 18);

        pointCoord = Trajectoires.Utils.interpolate(now[1],curve);
        x = pointCoord[1];
        y = pointCoord[2];
        pos = Trajectoires.Utils.convertUnitsIntoCanvasPos([x,y]);
        Trajectoires.View.drawPoint(dyn_ctx,pos , 10);
        Trajectoires.View.drawPoint(dyn_ctx,pos , 16);


    },



    traj_initCanvas : function() {
        this.bg_canvas = document.getElementById("bg-canvas");
        this.dyn_canvas = document.getElementById("dyn-canvas");
        this.traj_canvas = document.getElementById("traj-canvas");
        this.current_canvas = document.getElementById("current-canvas");

        Trajectoires.TrajManager.currentCurveLbl = document.getElementById('lbl_current_curve');

        var header = 40,
        right = 0,
        foot = 40;

        this.bg_canvas.width = window.innerWidth - right;
        this.bg_canvas.height = window.innerHeight - header - foot;

        this.traj_canvas.width = this.bg_canvas.width;
        this.traj_canvas.height = this.bg_canvas.height;
        this.dyn_canvas.width = this.bg_canvas.width;
        this.dyn_canvas.height = this.bg_canvas.height;
        this.current_canvas.width = this.bg_canvas.width;
        this.current_canvas.height = this.bg_canvas.height;

        this.traj_ctx = this.traj_canvas.getContext("2d");
        this.traj_ctx.imageSmoothingEnabled = true;

        this.bg_ctx = this.bg_canvas.getContext("2d");
        this.bg_ctx.imageSmoothingEnabled = true;

        this.dyn_ctx = this.dyn_canvas.getContext("2d");
        this.dyn_ctx.imageSmoothingEnabled = true;

        this.current_ctx = this.current_canvas.getContext("2d");
        this.current_ctx.imageSmoothingEnabled = true;


        this.minWH = Math.min(this.dyn_canvas.width, this.dyn_canvas.height); 
        this.pixToValue = this.scaleFactor / this.minWH;
        this.repaintAll();

        // refreshTimer = setInterval(refresh, refreshTimerInterval);
    }


};

// Unit converter
Trajectoires.View.scaleFactor = 4;
Trajectoires.View.minWH = {};
Trajectoires.View.pixToValue = Trajectoires.View.scaleFactor / Trajectoires.View.minWH;

