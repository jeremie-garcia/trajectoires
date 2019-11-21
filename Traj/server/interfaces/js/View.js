/*
* The Traj.View Namespace handles the rendering of trajectories
* It uses four different canvas to render static and dynamic aspects
*/
Traj.View = {

    traj_canvas : {}, // rendering of the curves
    traj_ctx : {}, //associated context

    bg_canvas : {}, //rendering the background
    bg_ctx : {}, //associated context

    dyn_canvas : {}, //rendering dynamic elements
    dyn_ctx : {}, //associated context

    current_canvas : {}, //rendering the current curve
    current_ctx : {}, //associated context

    // Unit converter
    scaleFactor : 8,
    minWH : {}, //Ratios of Width and height to be changed dynamically on init
    pixToValue : 1,

    //Speakers related draing vars
    SPEAKER_DIST : 1, //Distances of the speakers in arbitrary units
    SPEAKER_STROKE_COLOR : '#000000',
    SPEAKER_FILL_COLOR : '#b5b3b3',
    SPEAKER_SIZE : 0.2, //SIZE of the speakers in arbitrary units

    //curve drawing vars
    backgroundCurve : true, //boolean to display or not the curves in background
    COLOR_SCALE : '#505050', //background color for scale
    default_colors : [], 
    start_hue : 0.34,

    initSourcesColors : function (nbSources){
        //using golden ratio
        for(var i = 0; i< Traj.Manager.NB_SOURCES;i++){
            var h = (this.start_hue + i*Traj.Utils.golden_ratio_conjugate)%1,
            col = Traj.Utils.HSVtoRGB(h, 0.95, 0.68);
            this.default_colors[i] = Traj.Utils.rgbToHex(col);
        }
    },

    FIRST_POINT_SIZE : 5, //pix
    CURVE_STROKE_SIZE : 2,
    CURVE_ACTIVE_STROKE_SIZE : 3,
    CURVE_ALPHA : 0.35,
    CURVE_ACTIVE_ALPHA : 0.9,

    //Events variables...
    last_event_pos : [0, 0],
    DISTANCE_TRESHOLD : 8, //pix

    //Events
    isTouched : false,
    ongoingTouches : [],
    timeStart : {}, // for Time curve information
    touchState : 'wait',

    //initializing the canvas and their contexts
    initCanvas : function() {
        //retrieving the canvas from the html code 
        //(Probably be better to add them dynamically...)
        this.bg_canvas = document.getElementById("bg-canvas");
        this.dyn_canvas = document.getElementById("dyn-canvas");
        this.traj_canvas = document.getElementById("traj-canvas");
        this.current_canvas = document.getElementById("current-canvas");
        Traj.Manager.currentCurveLbl = document.getElementById('lbl_current_curve');

        //positions of the hearder and footer in pixels$
        //TODO us the actual size of the html code
        var header = 0,
        right = 0,
        foot = 40,
        canvas_width = window.innerWidth - right,
        canvas_height = window.innerHeight - header - foot;

        function initializeCanvasContext(canvas, width, height) {
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext("2d");
            ctx.imageSmoothingEnabled = true;
            return ctx;
        }

        this.bg_ctx = initializeCanvasContext(this.bg_canvas,canvas_width,canvas_height);
        this.traj_ctx = initializeCanvasContext(this.traj_canvas,canvas_width,canvas_height);
        this.dyn_ctx = initializeCanvasContext(this.dyn_canvas,canvas_width,canvas_height);
        this.current_ctx = initializeCanvasContext(this.current_canvas,canvas_width,canvas_height);

        //loads the speaker image as a sprite
        this.speaker_image.onload = function() {
            Traj.View.current_repaint();
        };
        this.speaker_image.src = 'css/speaker_icon.png';


        this.minWH = Math.min(this.dyn_canvas.width, this.dyn_canvas.height); 
        this.pixToValue = this.scaleFactor / this.minWH;

        this.initSourcesColors();
        this.repaintAll();
    },

    //used to clear any of the graphics contexts
    clearContext : function(ctx) {
        ctx.clearRect(0, 0, this.dyn_canvas.width, this.dyn_canvas.height);
    },

    drawCurveFirstPoint : function(ctx, pos, index) {
        this.drawPoint(ctx, pos, this.FIRST_POINT_SIZE);
        ctx.fillStyle = 'black';
        ctx.font = '12px Georgia';
        ctx.fillText(index, pos[0] - this.FIRST_POINT_SIZE - 2, pos[1] - this.FIRST_POINT_SIZE - 2);
    },

    drawPoint : function(ctx, pos, size) {
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], size, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.stroke();
    },

    drawCurve : function(ctx, curve, index, linewidth, alpha, withPoint) {

        if(Traj.Manager.allowed_indexes === null || Traj.Manager.allowed_indexes.indexOf(curve.sourceNumber)!==-1){

            ctx.lineWidth = linewidth;
            ctx.fillStyle = curve.color;
            ctx.strokeStyle = curve.color;
            ctx.globalAlpha = alpha;

            var i = 0;
            var pos = Traj.Utils.convertUnitsIntoCanvasPos([curve.X[i], curve.Y[i]]);
            this.drawCurveFirstPoint(ctx, pos, index);

            // ctx.beginPath();
            ctx.moveTo(pos[0], pos[1]);

            for (i = 1; i < curve.X.length; i++) {
                pos = Traj.Utils.convertUnitsIntoCanvasPos([curve.X[i], curve.Y[i]]);
                ctx.lineTo(pos[0], pos[1]);
            }
            ctx.stroke();

            //draw the points
            if (withPoint) {
                for (i = 1; i < curve.X.length; i++) {
                    pos = Traj.Utils.convertUnitsIntoCanvasPos([curve.X[i], curve.Y[i]]);
                    this.drawPoint(ctx, pos, (linewidth*0.5));
                }
            }
            ctx.globalAlpha = 1;
        }
    },

    speaker_image : new Image(),
    speaker_image_width : 26,

    //draw the points of the curve that have an orientation defined.
    drawOrientationForCurve : function(ctx, curve) {
        for (var i = 0; i < curve.orientation.length; i++) {
            var orientation = curve.getOrientationAtIndex(i);
            if(orientation[0]!= 'undefined'){
                Traj.View.drawOrientationForPoint(ctx,[curve.X[i], curve.Y[i]], orientation);
            }
        };
    },

    //the position needs to be in the space units, not the canvas units.
    drawOrientationForPoint : function(ctx, position, orientation){

        var alpha = orientation[0] * Math.PI / 180,
        pos = Traj.Utils.convertUnitsIntoCanvasPos(position),
        offset_angle = Math.atan2(position[1],position[0]),
        w = Traj.View.speaker_image_width;
        ctx.save();
        ctx.translate(pos[0],pos[1]);
        ctx.rotate(alpha-offset_angle + Math.PI);
        ctx.drawImage(this.speaker_image,-w/2,-w/2, w, w);
        ctx.restore();
    },

    //////////////////////////////////
    //////// BACKGROUND DRAWING///////
    //////////////////////////////////

    //draw the axis
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


        var pos = Traj.Utils.convertUnitsIntoCanvasPos([1, 0]);
        this.bg_ctx.fillText(1, pos[0], pos[1]);
        pos = Traj.Utils.convertUnitsIntoCanvasPos([-1, 0]);
        this.bg_ctx.fillText(-1, pos[0], pos[1]);
        pos = Traj.Utils.convertUnitsIntoCanvasPos([0, 1]);
        this.bg_ctx.fillText(1, pos[0], pos[1]);
        pos = Traj.Utils.convertUnitsIntoCanvasPos([0, -1]);
        this.bg_ctx.fillText(-1, pos[0], pos[1]);
    },

    //draw the axis
    drawCircularGrid : function() {
        this.bg_ctx.globalAlpha = 0.6;
        this.bg_ctx.beginPath();
        this.bg_ctx.strokeStyle = this.COLOR_SCALE;
        this.bg_ctx.lineWidth = 1.2;
        
        var radius = 1; //in Traj Units
        var radius_pix = radius * (1 / this.pixToValue);

        var center_x = Math.floor(this.traj_canvas.width / 2);
        var center_y = Math.floor(this.traj_canvas.height / 2);

        var max_radius_pix = (center_x< center_y)? center_y : center_x;

        //draw from center with a step
        for (var radius = radius_pix; (radius <= max_radius_pix) && (radius < 5*radius_pix); radius += radius_pix) {
          this.bg_ctx.arc(center_x, center_y, radius, 0, 2 * Math.PI, false);
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


        var pos = Traj.Utils.convertUnitsIntoCanvasPos([1, 0]);
        this.bg_ctx.fillText(1, pos[0], pos[1]);
        pos = Traj.Utils.convertUnitsIntoCanvasPos([-1, 0]);
        this.bg_ctx.fillText(-1, pos[0], pos[1]);
        pos = Traj.Utils.convertUnitsIntoCanvasPos([0, 1]);
        this.bg_ctx.fillText(1, pos[0], pos[1]);
        pos = Traj.Utils.convertUnitsIntoCanvasPos([0, -1]);
        this.bg_ctx.fillText(-1, pos[0], pos[1]);

    },

    //draw the speakers
    drawSpeakers : function() {
        //Plot the 4 speakers
        var hp_size = this.SPEAKER_SIZE * (1 / this.pixToValue)
        var pos = Traj.Utils.convertUnitsIntoCanvasPos([this.SPEAKER_DIST, this.SPEAKER_DIST]);
        this.drawSpeakerAt(pos, hp_size);
        pos = Traj.Utils.convertUnitsIntoCanvasPos([this.SPEAKER_DIST, -this.SPEAKER_DIST]);
        this.drawSpeakerAt(pos, hp_size);
        pos = Traj.Utils.convertUnitsIntoCanvasPos([-this.SPEAKER_DIST, this.SPEAKER_DIST]);
        this.drawSpeakerAt(pos, hp_size);
        pos = Traj.Utils.convertUnitsIntoCanvasPos([-this.SPEAKER_DIST, -this.SPEAKER_DIST]);
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

    bg_repaint : function(selectEditMode) {
        this.clearContext(this.bg_ctx);
        if (selectEditMode) {
            this.bg_ctx.fillStyle = "#D7F0ED";
            this.bg_ctx.rect(0,0,this.bg_canvas.width,this.bg_canvas.height);
            this.bg_ctx.fill();
        }
        //this.drawAxis();
        this.drawCircularGrid();
        this.drawSpeakers();
    },

    //////////////////////////////////
    //////// Trajectories DRAWING///////
    //////////////////////////////////
    drawAllBackgroundCurves : function(){
        var ctx = this.traj_ctx,
        alpha_stroke,
        lwidth = this.CURVE_STROKE_SIZE,
        drawPoint = false,
        currentCurveIndex = Traj.Manager.currentCurveIndex,
        trajectories = Traj.Manager.trajectories,
        multi_indexes = Traj.Player.isMulti ? Traj.Manager.getMultiPlayIndexes() : [currentCurveIndex];

        for (var i = 0; i < trajectories.length; i++) {
            if(i!= Traj.Manager.currentCurveIndex){
                alpha_stroke = (multi_indexes.indexOf(i)!==-1) ? this.CURVE_ACTIVE_ALPHA : this.CURVE_ALPHA;
                this.drawCurve(ctx, trajectories[i], i, lwidth, alpha_stroke, drawPoint);
            }
        }
    },

    //draws the trajectories that will be played in multi mode even if no curves drawn in background
    drawSelectedMultiCurves : function(){
        var ctx = this.traj_ctx,
        alpha_stroke,
        lwidth = this.CURVE_STROKE_SIZE,
        drawPoint = false,
        currentCurveIndex = Traj.Manager.currentCurveIndex,
        trajectories = Traj.Manager.trajectories,
        multi_indexes = Traj.Manager.getMultiPlayIndexes();

        for (var i = 0; i < multi_indexes.length; i++) {
            var curve_index = multi_indexes[i];
            if(curve_index!= Traj.Manager.currentCurveIndex){
                this.drawCurve(ctx, trajectories[curve_index], curve_index, lwidth, this.CURVE_ACTIVE_ALPHA, drawPoint);
            }
        }
    },

    traj_repaint : function() {
        this.clearContext(this.traj_ctx);
        if (this.backgroundCurve) {
            this.drawAllBackgroundCurves();
        }else if(Traj.Player.isMulti){
            this.drawSelectedMultiCurves();
        }
    },

    //////////////////////////////////
    //////// DYNAMIC DRAWING///////
    //////////////////////////////////

    draw_startCurrentCurve : function(evt) {
        var pos = Traj.Utils.event2CanvasPos(evt);
        this.dyn_ctx.lineWidth = this.CURVE_ACTIVE_STROKE_SIZE;
        this.dyn_ctx.strokeStyle = Traj.Manager.currentCurve.color;
        this.drawCurveFirstPoint(this.dyn_ctx, pos, Traj.Manager.currentCurveIndex);
    },

    dyn_repaint : function() {
        this.clearContext(this.dyn_ctx);
    },

    drawTimePointsSelect : function(now,curve) {
        var dyn_ctx = Traj.View.dyn_ctx;
        Traj.View.dyn_repaint();
        var curve = curve || Traj.Manager.trajectories[Traj.Manager.currentCurveIndex];
        //var currentCurve = Traj.Manager.trajectories[Traj.Manager.currentCurveIndex];

        var pointCoord = Traj.Utils.interpolate(now[0],curve);
        var x = pointCoord[0];
        var y = pointCoord[1];

        var pos = Traj.Utils.convertUnitsIntoCanvasPos([x,y]);
        dyn_ctx.lineWidth = 5;
        dyn_ctx.fillStyle = curve.color;
        dyn_ctx.strokeStyle = curve.color;
        dyn_ctx.globalAlpha = Traj.View.CURVE_ACTIVE_ALPHA;
        Traj.View.drawPoint(dyn_ctx,pos , 8);
        Traj.View.drawPoint(dyn_ctx,pos , 18);

        pointCoord = Traj.Utils.interpolate(now[1],curve);
        x = pointCoord[0];
        y = pointCoord[1];
        pos = Traj.Utils.convertUnitsIntoCanvasPos([x,y]);
        Traj.View.drawPoint(dyn_ctx,pos , 10);
        Traj.View.drawPoint(dyn_ctx,pos , 16);
    },

    //////////////////////////////////
    //////// CURRENT DRAWING///////
    //////////////////////////////////

    draw_updateCurrentCurve : function(evt) {
        if (Traj.Manager.currentCurve !== null) {
            var pos = Traj.Utils.event2CanvasPos(evt);
            this.current_ctx.beginPath();
            this.current_ctx.lineWidth = this.CURVE_ACTIVE_STROKE_SIZE;
            this.current_ctx.strokeStyle = Traj.Manager.currentCurve.color;
            this.current_ctx.moveTo(this.last_event_pos[0],this.last_event_pos[1]);
            this.current_ctx.lineTo(pos[0], pos[1]);
            this.current_ctx.stroke();
        }
    },

    current_repaint : function() {
        this.clearContext(this.current_ctx);
        var currentCurveIndex = Traj.Manager.currentCurveIndex;
        var curve = Traj.Manager.trajectories[currentCurveIndex];
        if (typeof(curve) != 'undefined') {
            this.drawCurve(this.current_ctx,curve,currentCurveIndex,this.CURVE_ACTIVE_STROKE_SIZE,this.CURVE_ACTIVE_ALPHA,true);
            this.drawOrientationForCurve(this.current_ctx,curve);
        }
    },


    /////////////////////////////////
    //////// ALL DRAWING///////
    //////////////////////////////////

    //used to redraw all the canvas
    repaintAll : function() {
        this.bg_repaint();
        this.traj_repaint();
        this.dyn_repaint();
        this.current_repaint();
    },

    ////////////////////////////////////
    ////////// CALLED FROM HTML ////////
    ////////////////////////////////////

    updateHpDistance : function(){
        Traj.View.SPEAKER_DIST = document.getElementById("speaker_dist").value;
        Traj.View.bg_repaint();
    },

    setCanvasZoom : function(factor){
        //if (logger) writtraj_canvasog("traj_canvas Zoom " + factor);
        Traj.View.scaleFactor = Traj.View.scaleFactor / factor;
        Traj.View.pixToValue = Traj.View.scaleFactor / Traj.View.minWH;
        Traj.View.repaintAll();
    },

    updateDrawCurvesInBackground : function(){
        Traj.View.backgroundCurve = document.getElementById("flip-curvesinback").value == 'on';
        Traj.View.traj_repaint();
        Traj.View.dyn_repaint();
    },

    updateZSliderMode : function(){
        if (document.getElementById("flip-zSlider").value == 'on') {
            $("#ZSliderDiv").show();
        } else {
            $("#ZSliderDiv").hide();    
        }
    },

    setDefaultFeedbackDisplay : function(){
        Traj.View.setFeedbackDisplay(" ");
    },

    setFeedbackDisplay : function (msg){
        var display = document.getElementById('feedbackDisplay');
        display.innerText = "" + msg;
    },

    displayOverCanvasElements : function (boolean){
        if(boolean){
            $("#slider-div").show(); 
            $(".canvas-left-overlay").show();
            $("#TopMenu").show();
            $("#drawZone").show();
        }else{
            $("#slider-div").hide(); 
            $(".canvas-left-overlay").hide();
            $("#TopMenu").hide();
            $("#drawZone").hide();
        }
    },
};

