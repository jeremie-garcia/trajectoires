/*
Event manager handling both mutlitouch or mouse events
TODO: Handle both TOuch and Mouse events (for surface or new devices..)
*/

Traj.Events = {

    stream_orientation : false, //send or not the orientation via OSC
    rangeSlider : false, //display or not the range slider
    touchId : 0, //touch ID
    idRotateLeft : [], //?
    idRotateRight : [],//?
    isTransforming : false,
    isOrientationMode : false,
    touches : [], //array of touches
    drawing : false,
    transformationEventTimer : 0,
    holdEventTimer : 0,
    center2Touch : [],
    transformation : null, // null, 1touch, 2touch, 3touch

    ///////////////////////////////////////////////////////////////////
    /////////////////////// TOUCH AND MOUSE EVENT /////////////////////
    ///////////////////////////////////////////////////////////////////
    handleStart : function(evt) {
        Traj.Events.hideLongTouchMenu();
        Traj.Events.hideContextMenu();

        if(Traj.Events.isOrientationMode){
            //find the selected point
            

        }else if (Traj.View.touchState === 'wait' && evt.changedTouches.length < 2) {
            //console.log(evt.changedTouches.length)
            lastFactor = 1; // IN GLOBAL FOR NOW (used for 3 fingers event, stretch)
            Traj.Events.touches = []; 
            if (evt.touches[1]) {Traj.Events.touchId = evt.touches[1].identifier;} // if the Zslider had been touch before the canvas
            else {Traj.Events.touchId = evt.touches[0].identifier;} // canvas is touch in 1st
            Traj.View.touchState = '1touch';                               // set state
            var touches = evt.changedTouches;
            var i = 0;                                                      // take first touch of changed touches (only 1 new touch at a time)             
            var evt_pos = Traj.Utils.event2CanvasPos(touches[i]);   
            var coords = Traj.Utils.convertCanvasPosIntoUnits(evt_pos);

            Traj.View.last_event_pos = evt_pos;
            Traj.Events.touches.push([evt.changedTouches[0].clientX,evt.changedTouches[0].clientY]);

            if (Traj.Events.drawing) { // CAS dessin
                var z = Traj.Events.getZSliderValue()||0;
                var t = Math.floor(evt.timeStamp);
                Traj.Manager.processCreateNewCurve(coords[0], coords[1], z, t);
                Traj.View.draw_startCurrentCurve(touches[i]);

            } else { // CAS 1 doigt select : moved in handleEnd
                Traj.Events.transformation = '1touch';
                Traj.View.traj_repaint();
                Traj.Events.transformationEventTimer = setTimeout(
                    function() {
                        Traj.Events.isTransforming = true;
                        } , 150); // 150ms for touch before translating 
            }

        } else if (Traj.View.touchState === '1touch' || (evt.changedTouches.length == 2 && Traj.View.touchState === 'wait')){
            clearTimeout(Traj.Events.transformationEventTimer); // avoid selecting another curve
            Traj.Events.transformation = '2touch';
            Traj.View.touchState = '2touch';

            Traj.View.traj_repaint();
            Traj.Events.touches.push([evt.changedTouches[0].clientX,evt.changedTouches[0].clientY]);

            if (evt.changedTouches.length == 2) { // si les deux doigts sont posés en même temps (dans le même événement)
                Traj.Events.touches = [];
                Traj.Events.touches.push([evt.changedTouches[0].clientX,evt.changedTouches[0].clientY]);
                Traj.Events.touches.push([evt.changedTouches[1].clientX,evt.changedTouches[1].clientY]);
            }
            // case for rotate from hammer.js
            var center = [(evt.touches[0].clientX + evt.touches[1].clientX)/2 , (evt.touches[0].clientY + evt.touches[1].clientY)/2];
            Traj.Events.center2Touch = Traj.Utils.convertCanvasPosIntoUnits(center);

        } else if (Traj.View.touchState === '2touch') {
            Traj.Events.transformation = '3touch';

            Traj.View.touchState = '3touch';
            Traj.View.traj_repaint();
            Traj.Events.touches[0] = [evt.touches[0].clientX, evt.touches[0].clientY];
            Traj.Events.touches[1] = [evt.touches[1].clientX, evt.touches[1].clientY];
            Traj.Events.touches.push([evt.changedTouches[0].clientX,evt.changedTouches[0].clientY]);
            //console.log(Traj.Events.touches)
        }
        evt.preventDefault();
        return false;
    },

    handleMove : function(evt) {

        if (Traj.View.touchState === '1touch') { // CAS 1 doigt

            if (Traj.Events.drawing) { // CAS DESSIN
                for (var k=0; k<evt.changedTouches.length;k++) { // pour tous les touchés
                    if (evt.changedTouches[k].identifier == Traj.Events.touchId) { // est-ce que le touché est le bon ?
                        var touches = evt.changedTouches;
                        var evt_pos = Traj.Utils.event2CanvasPos(touches[k]);
                        if (Traj.Manager.currentCurve !== null && Traj.Utils.distanceBtwPoints(evt_pos, Traj.View.last_event_pos) > Traj.View.DISTANCE_TRESHOLD) {
                            var coords = Traj.Utils.convertCanvasPosIntoUnits(evt_pos);
                            var z = Traj.Events.getZSliderValue()||0;
                            var t = Math.floor(evt.timeStamp);
                            Traj.Manager.processAddPointToCurve(coords[0], coords[1], z, t);
                            Traj.View.draw_updateCurrentCurve(touches[k]);   
                            Traj.View.last_event_pos = evt_pos;              
                        }
                    }
                }
            } else { // CAS TRANSLATION

                if (Traj.Events.transformation == '1touch') 
                {
                    var evt_pos = Traj.Utils.event2CanvasPos(evt.changedTouches[0]),
                    coords = Traj.Utils.convertCanvasPosIntoUnits(evt_pos),
                    lastCoords = Traj.Utils.convertCanvasPosIntoUnits(Traj.View.last_event_pos),
                    translateXY = [coords[0] - lastCoords[0], coords[1] - lastCoords[1]],
                    curve = Traj.Manager.trajectories[Traj.Manager.currentCurveIndex];
                    
                    if(curve){
                        curve.translate(translateXY[0] + curve.X[0],translateXY[1] + curve.Y[0],curve.Z[0]);
                    }

                    Traj.View.current_repaint();
                    Traj.View.last_event_pos = evt_pos; 
                }
            }

        } else if (Traj.View.touchState === '2touch') { // CAS 2 doigts
            // See hammer recognition
            clearTimeout(Traj.Events.holdEventTimer);

            var center = [(evt.touches[0].clientX + evt.touches[1].clientX)/2 , (evt.touches[0].clientY + evt.touches[1].clientY)/2]; // mise à jour du centre pour le point de rotation
            Traj.Events.center2Touch = Traj.Utils.convertCanvasPosIntoUnits(center);

            Traj.Events.touches[0] = [evt.touches[0].clientX, evt.touches[0].clientY]; // mise à jour des points pour le dessin de la droite
            Traj.Events.touches[1] = [evt.touches[1].clientX, evt.touches[1].clientY];

        } else if (Traj.View.touchState === '3touch') { // CAS 3 doigts
            // scale / axis done with the 2 first finger
            clearTimeout(Traj.Events.holdEventTimer);
            // draw line TODO : put it in a function and call it on touchstart for 2 fingers (plot it in an other canvas to avoid multiple draws)
            var dyn_ctx = Traj.View.dyn_ctx;
            Traj.View.dyn_repaint();
            var point1 = [2*Traj.Events.touches[0][0]-Traj.Events.touches[1][0],2*Traj.Events.touches[0][1]-Traj.Events.touches[1][1]];
            var point2 = [2*Traj.Events.touches[1][0]-Traj.Events.touches[0][0],2*Traj.Events.touches[1][1]-Traj.Events.touches[0][1]];
            dyn_ctx.beginPath();
            dyn_ctx.moveTo(point1[0],point1[1]);
            dyn_ctx.lineTo(point2[0],point2[1]);
            dyn_ctx.stroke();

            // 3 finger stretch => PUT IT IN A FUNCTION 
            var Utils = Traj.Utils;
            var touches = Traj.Events.touches;
            var axis = Traj.Utils.getDirVector(Utils.convertCanvasPosIntoUnits(touches[0]),Utils.convertCanvasPosIntoUnits(touches[1]));
            var firstPoint = Utils.convertCanvasPosIntoUnits(touches[2]);
            var actualPoint = Utils.convertCanvasPosIntoUnits([evt.touches[2].clientX,evt.touches[2].clientY]);
            var projectedPoint = Utils.getProjectedPoint(actualPoint,axis,Utils.convertCanvasPosIntoUnits(touches[0]));
            var normalVector = Utils.getDirVector(firstPoint,projectedPoint);
            var firstDistance = Utils.distanceBtwPoints(firstPoint,projectedPoint);
            var distance = Utils.distanceBtwPoints(actualPoint,projectedPoint);
            var curve = Traj.Manager.trajectories[Traj.Manager.currentCurveIndex];
            var sign = Utils.sign(normalVector[0]*(actualPoint[0]-projectedPoint[0]) + normalVector[1]*(actualPoint[1]-projectedPoint[1]));
            var factor = sign*distance/firstDistance;
            curve.spaceScaleAxis(factor/lastFactor,axis,Traj.Utils.convertCanvasPosIntoUnits(Traj.Events.touches[0]));
            lastFactor = factor; // save last transformation factor
            Traj.View.current_repaint();

            evt.preventDefault();
            return false;
        }
    },

    handleEnd : function(evt) { // BUG POSSIBLE LORSQU'ON LACHE PLUSIEURS DOIGTS EN MÊME TEMPS (jamais arrivé pour l'instant...)
        // L'iPad semble plus souvent regrouper les touchés que l'android
        var touches = evt.changedTouches;
        var nbTouch = evt.touches.length;

        if(Traj.Events.recordingOrientationIdx!= -1){
            Traj.Events.recordingOrientationIdx = -1;
        }

        if (!Traj.Events.drawing && !Traj.Events.isTransforming && !Traj.Events.recordingOrientation) {
            clearTimeout(Traj.Events.transformationEventTimer); 
            var evt_pos = Traj.Utils.event2CanvasPos(evt.changedTouches[0]),  
            coords = Traj.Utils.convertCanvasPosIntoUnits(evt_pos),
            curveSelected = Traj.Manager.getClosestCurveFromTouch(coords);
            Traj.Manager.selectCurve(curveSelected);
            Traj.View.setDefaultFeedbackDisplay();
        }

        for (var k=0; k<evt.changedTouches.length;k++) { // boucle sur tous les touchés

            // si c'est le 1e touché qui est laché (sert à ne pas prendre en compte le laché du zSlider par exemple)
            if (evt.changedTouches[k].identifier == Traj.Events.touchId) {
                var i = 0;
                var coords = Traj.Utils.convertCanvasPosIntoUnits(Traj.Utils.event2CanvasPos(touches[i]));
                var z = Traj.Events.getZSliderValue()||0;
                var t = Math.floor(evt.timeStamp);

                if (Traj.Events.drawing) { // CAS DESSIN
                    if (!Traj.Events.rangeSlider) {
                            Traj.Manager.processEndCurve(coords[0], coords[1], z, t); // cas dessin normal
                            Traj.View.setDefaultFeedbackDisplay();
                        } else {
                            Traj.Manager.processModifyCurve(coords[0], coords[1], z, t); // cas "redraw"
                            Traj.View.setDefaultFeedbackDisplay();
                        }
                    }

                    Traj.View.touchState = 'wait';

                if (Traj.Events.isTransforming) { // CAS TRANSFORMATION
                    Traj.Events.isTransforming = false;
                    Traj.Manager.currentCurve = null;
                    Traj.View.traj_repaint();
                    Traj.View.dyn_repaint();
                }

            } else if (Traj.View.touchState === '1touch') { // 1 doigt => passage à 0 doigt
                Traj.Events.transformation = null;
                Traj.View.touchState = 'wait';
                Traj.View.dyn_repaint();
                Traj.View.setDefaultFeedbackDisplay();
            } else if (Traj.View.touchState === '2touch') { // 2 doigt => passage à 1 doigt
                Traj.View.touchState = '1touch';
            } else if (Traj.View.touchState === '3touch') { // 3 doigt => passage à 2 doigt
                Traj.View.touchState = '2touch';
            }
        }

        Traj.View.traj_repaint();
        Traj.View.ongoingTouches = [];
        evt.preventDefault();
        Traj.Events.touches = [];
        clearTimeout(Traj.Events.holdEventTimer); // annuler le pop du menu
        // Traj.Events.drawing = false;
        return false;
    },

    handleCancel : function(evt) { // prévoir ce cas comme celui d'un touchEnd ?
    evt.preventDefault();
},

handleHoldEvent : function(evt){
    if(Traj.Events.isOrientationMode){
        var traj = Traj.Manager.getCurrentCurve();
        var coords = Traj.Utils.convertCanvasPosIntoUnits(Traj.Events.touchlongFirst);
        var idx = traj.getClosestPointIndex(coords);
        Traj.Events.recordingOrientationIdx = idx;
    }else{
        Traj.Events.showLongTouchMenu();
    }
},

    // FOR LONG TOUCH MENU
    handleStartLongTouch : function(evt) {
        clearTimeout(Traj.Events.holdEventTimer);
        Traj.Events.touchlongFirst = [evt.changedTouches[0].clientX, evt.changedTouches[0].clientY];
        Traj.Events.holdEventTimer = setTimeout(Traj.Events.handleHoldEvent,1000);
    },

    handleMoveLongTouch : function(evt) {
        var touchLong = [evt.changedTouches[0].clientX, evt.changedTouches[0].clientY];
        var touchlongFirst = Traj.Events.touchlongFirst;
        var dist = Traj.Utils.distanceBtwPoints(touchLong,touchlongFirst);
        if (dist>10) {
            clearTimeout(Traj.Events.holdEventTimer);
        }
    },

    handleMouseDown : function(evt) {
        if (Traj.View.touchState === 'wait') {
            Traj.View.touchState = '1touch';
            var evt_pos = Traj.Utils.event2CanvasPos(evt);
            var coords = Traj.Utils.convertCanvasPosIntoUnits(evt_pos);
            var z = 0;
            var t = Math.floor(evt.timeStamp);
            Traj.Manager.processCreateNewCurve(coords[0], coords[1], z, t);
            Traj.View.draw_startCurrentCurve(evt);
            Traj.View.last_event_pos =  evt_pos;
        }
    },

    handleMouseMove : function(evt) {
        if (Traj.View.touchState === '1touch') {
            var evt_pos = Traj.Utils.event2CanvasPos(evt);
            if (Traj.Manager.currentCurve !== null && Traj.Utils.distanceBtwPoints(evt_pos, Traj.View.last_event_pos) > Traj.View.DISTANCE_TRESHOLD) {
                var coords = Traj.Utils.convertCanvasPosIntoUnits(evt_pos);
                var z = 0;
                var t = Math.floor(evt.timeStamp);
                Traj.Manager.processAddPointToCurve(coords[0], coords[1], z, t);
                Traj.View.draw_updateCurrentCurve(evt);
                Traj.View.last_event_pos = evt_pos;  
            }
        }
    },

    handleMouseUp : function(evt) {
        var coords = Traj.Utils.convertCanvasPosIntoUnits(Traj.Utils.event2CanvasPos(evt));
        var z = 0;
        var t = Math.floor(evt.timeStamp);
        if (!Traj.Events.rangeSlider && Traj.Manager.currentCurve !== null) {
            Traj.Manager.processEndCurve(coords[0], coords[1], z, t); // cas dessin normal
        } else if (Traj.Events.rangeSlider) {
            Traj.Manager.processModifyCurve(coords[0], coords[1], z, t); // cas "redraw"
        }
        Traj.View.touchState = 'wait';
        //"draw_updateCurrentCurve(evt);
    },

    addTouchEvents : function(canvas) {
        canvas.addEventListener("touchstart", Traj.Events.handleStart, false);
        canvas.addEventListener("touchend", Traj.Events.handleEnd, false);
        canvas.addEventListener("touchcancel", Traj.Events.handleCancel, false);
        canvas.addEventListener("touchmove", Traj.Events.handleMove, false);
        canvas.addEventListener('touchstart',Traj.Events.handleStartLongTouch,false);
        canvas.addEventListener('touchmove',Traj.Events.handleMoveLongTouch,false);
    },

    addMouseEvents : function(canvas) {
        canvas.addEventListener("mousedown", Traj.Events.handleMouseDown, false);
        canvas.addEventListener("mousemove", Traj.Events.handleMouseMove, false);
        canvas.addEventListener("mouseup", Traj.Events.handleMouseUp, false);
    },

    orientation :[0,0,0],
    orientation_calibrated : false,
    orientation_offset : 0,
    orientation_count : 0,

    calibrateOrientation : function(dir){

        Traj.Events.orientation_offset += dir;
        Traj.Events.orientation_count ++;
        var msg = "Calibrating Orientation";

        for (var i = 0; i < Traj.Events.orientation_count ; i++) {
            msg += ".";
        }

        Traj.View.setFeedbackDisplay(msg);

        if(Traj.Events.orientation_count> 20){
            Traj.Events.orientation_offset = Traj.Events.orientation_offset / Traj.Events.orientation_count;
            Traj.Events.orientation_count = 0;
            Traj.Events.orientation_calibrated = true;
            Traj.View.setFeedbackDisplay("Hold a point and define its Orientation");
        }
    },

    processOrientationEvents : function(event) {
        if(Traj.Events.stream_orientation){
            // gamma is the left-to-right tilt in degrees, where right is positive
            var tiltLR = event.gamma;
            // beta is the front-to-back tilt in degrees, where front is positive
            var tiltFB = event.beta;
            // alpha is the compass direction the device is facing in degrees
            var dir = event.alpha;
            //put with correct offset for android
            dir = (360-dir) % 360;
            if(Traj.Events.orientation_calibrated){
                //put with the offset
                dir = (dir - Traj.Events.orientation_offset + 360) % 360;
                Traj.Events.orientation = [dir,tiltLR,tiltFB];
                if(Traj.Events.recordingOrientation 
                    && Traj.Events.recordingOrientationIdx != -1
                    && Traj.Manager.hasSelectedCurve()){
                    var curve = Traj.Manager.getCurrentCurve();
                curve.setOrientationAtIndex(Traj.Events.orientation,Traj.Events.recordingOrientationIdx);
                Traj.View.setFeedbackDisplay("Setting Orientation of point " + 
                    Traj.Events.recordingOrientationIdx + " to " + Traj.Events.orientation );
            }
            Traj.OSC.sendOrientation(Traj.Manager.currentSource, Traj.Events.orientation);
        } else if(!Traj.Events.orientation_calibrated){
            Traj.Events.calibrateOrientation(dir);
        }               
    }
},

addOrientationEvents : function(){
    if (window.DeviceOrientationEvent && Traj.onmobile) {
        window.addEventListener("deviceorientation", Traj.Events.processOrientationEvents);
    }
},

recordingOrientation : false,
recordingOrientationIdx : -1,

OrientationRecording : function(){
    Traj.Events.recordingOrientation = !Traj.Events.recordingOrientation;
    Traj.View.displayOverCanvasElements(!Traj.Events.recordingOrientation);

    var button = document.getElementById('OrientationButton');

    if(Traj.Events.recordingOrientation){
        Traj.Events.stream_orientation = true;
        button.style.color = "#FF0000";
        Traj.Events.isOrientationMode = true;
        Traj.View.backgroundCurve = false;
        Traj.View.traj_repaint();
        Traj.View.dyn_repaint();
        
    }else{
        Traj.Events.stream_orientation = false;
        Traj.Events.orientation_calibrated = false;
        button.style.color = "#000000";
        Traj.Events.isOrientationMode = false;
        Traj.View.setDefaultFeedbackDisplay();
        Traj.View.repaintAll();
    }
},

    //EVENTS INITIALIZATION
    initEvents : function() {

        //test if running on mobile or not to add the correct events handler
        if (Traj.onmobile) {
            this.addTouchEvents(Traj.View.dyn_canvas);
            this.addRotateEvent();
            Traj.Events.addDrawZoneEvent(); 
        } else {
            Traj.Events.addMouseEvents(Traj.View.dyn_canvas);
            // hide draw zone
            var drawZone = document.getElementById('drawZone');
            drawZone.style.display="none";
        }

        // functions that already make distinction between mobile or computer
        this.addSessionButtonEvents();
        this.addOrientationEvents();
        this.initSlider(false);
        this.initZSlider();

        //Source selection buttons with events
        Traj.Events.addSourceButtonEvent();
        Traj.Events.addPlayPauseEvent();

        //Menu popping after drawing a shape
        Traj.Events.initContextMenu();
        Traj.Events.hideLongTouchMenu();

        Traj.View.setDefaultFeedbackDisplay();
    },

    ///////////////////////////////////////////////////////////////////
    /////////////////////////// SLIDERS EVENT /////////////////////////
    ///////////////////////////////////////////////////////////////////

    initSlider : function(range){

        // initialisation : on supprime l'ancien slider et on le remet
        $('#slider-div').remove();
        $('body').append('<div class="canvas-bot-overlay" id="slider-div" style:"position:absolute, bottom:100"> </div>');
        $('#slider-div').append('<input class="timeSlider" value="0" />');

        // définitions de paramètres
        var width = Math.round(0.9*(window.innerWidth - 100));
        var maxTime = 100;
        var index = Traj.Manager.currentCurveIndex;
        if (Traj.Manager.trajectories[index]) {
            var maxTime = Traj.Manager.trajectories[index].getDuration();
        } else {
            var maxTime = 100;
        }

        // slider declaration (plugin jquery.range.js)
        $('.timeSlider').jRange({
            from: 0,
            to: maxTime,
            step: 1,
            scale: [0,maxTime],
            format: '%s ms',
            width: width,
            showLabels: true,
            isRange : range, // true for range slider
            onstatechange : Traj.Events.sliderOnChange,
            isVertical: false, 
        });

        Traj.Events.timeSlider = $('.timeSlider').data('plugin_jRange'); // update the slider variable
        Traj.Events.rangeSlider = range; // true if range slider
        if (range) {this.setSliderValue('0,100')}

            if (document.getElementById("flip-timeSlider").value == 'on') {
                $("#slider-div").show();
            } else {
                $("#slider-div").hide();    
            }
        //this.sliderOnChange();
        Traj.View.bg_repaint();
    },

    setSliderValue : function(value) {
        var slider = Traj.Events.timeSlider;
        slider.setValue(value);
    },

    getSliderValue : function() {
        var slider = Traj.Events.timeSlider;
        if (Traj.Events.rangeSlider) {
            var value = slider.getValue().split(',');
            var values = [Number(value[0]),Number(value[1])];
            return values;
        } else {
            if (slider)
                return Number(slider.getValue());
        }
    },

    //TODO: most of this code is duplicated with the player code.
    //Need to encapsualte some parts.
    sliderOnChange : function() {

        if (Traj.Events.rangeSlider) { // range slider is changed so adapt time selection
            var val = Traj.Events.getSliderValue();
            Traj.View.drawTimePointsSelect(val);

        } else { //temporal slider is changed
            if (!(Traj.Player.isPlaying)) {

                var now = Traj.Events.getSliderValue(),
                dyn_ctx = Traj.View.dyn_ctx;

                Traj.View.dyn_repaint();

                var indexes = Traj.Player.isMulti ? Traj.Manager.getMultiPlayIndexes() : [Traj.Manager.currentCurveIndex];

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

                            //Update the display (paint playHead)
                            dyn_ctx.lineWidth = 5;
                            dyn_ctx.fillStyle = curve.color;
                            dyn_ctx.strokeStyle = curve.color;
                            dyn_ctx.globalAlpha = Traj.View.CURVE_ACTIVE_ALPHA;

                            Traj.View.drawOrientationForPoint(dyn_ctx, [x,y], orientation);
                            var pos = Traj.Utils.convertUnitsIntoCanvasPos([x,y]);
                            Traj.View.drawPoint(dyn_ctx,pos , 18);

                            //Update the Z-slider value for the selected curve only
                            if(indexes[k]===Traj.Manager.currentCurveIndex){
                                Traj.Events.setZSliderValue(z);
                            }
                        }
                    }
                }
            }
        }      
    },

    initZSlider : function() { // initialisation du zSlider (isVertical is set to true)
        var width = Math.round(0.9*(window.innerHeight - 150));
        $('.ZSlider').jRange({
            from: 5,
            to: -5,
            step: 0.1,
            scale: [5,-5],
            format: '%s',
            width: width,
            showLabels: true,
            isRange : false,
            isVertical: true,
            onstatechange : Traj.Events.zsliderOnChange,
        });
        Traj.Events.zSlider = $('.ZSlider').data('plugin_jRange');
        $("#ZSliderDiv").hide();

    },

    zsliderOnChange : function() {
        if (!(Traj.Player.isPlaying) && !Traj.Manager.currentCurve ) {
            var curve = Traj.Manager.trajectories[Traj.Manager.currentCurveIndex];
            var now = Traj.Events.getSliderValue();
            var pointCoord = Traj.Utils.interpolate(now,curve);
            pointCoord[3] = Traj.Events.getZSliderValue();
            Traj.OSC.sendPosxyzMsg(pointCoord);
        }
    },

    getZSliderValue : function() {
        var slider = Traj.Events.zSlider;
        return Number(slider.getValue());
    },

    setZSliderValue : function(value) {
        var slider = Traj.Events.zSlider;
        if (slider) {
            slider.setValue(value);
        }
    },

    ///////////////////////////////////////////////////////////////////
    ////////////////// SEVERAL (menu, transformation) /////////////////
    ///////////////////////////////////////////////////////////////////

    addRotateEvent : function() { // uses hammer.js
        angle = 0; // IN GLOBAL FOR NOW ...
        scale = 1; // store the values of the previous transforms

        var myElement = Traj.View.dyn_canvas;
        var mc = new Hammer.Manager(myElement);
        var rotate = new Hammer.Rotate();
        mc.add([rotate]);
        mc.on("rotate",function(evt) {

            if (Traj.Events.isTransforming) {
                var dyn_ctx = Traj.View.dyn_ctx;
                var center = Traj.Events.center2Touch;

                dyn_ctx.lineWidth = 5;
                dyn_ctx.fillStyle = "#7CAEA8";
                dyn_ctx.strokeStyle = "#7CAEA8";
                dyn_ctx.globalAlpha = Traj.View.CURVE_ACTIVE_ALPHA;
                Traj.View.dyn_repaint();
                Traj.View.drawPoint(dyn_ctx,Traj.Utils.convertUnitsIntoCanvasPos(center) , 8);
                Traj.View.drawPoint(dyn_ctx,Traj.Utils.convertUnitsIntoCanvasPos(center) , 18);

                // draw line TODO : put it in a function and call it on touchstart for 2 fingers (plot it in an other canvas to avoid multiple draws)
                var point1 = [2*Traj.Events.touches[0][0]-Traj.Events.touches[1][0], 2*Traj.Events.touches[0][1]-Traj.Events.touches[1][1]];
                var point2 = [2*Traj.Events.touches[1][0]-Traj.Events.touches[0][0], 2*Traj.Events.touches[1][1]-Traj.Events.touches[0][1]];

                dyn_ctx.beginPath();
                dyn_ctx.moveTo(point1[0],point1[1]);
                dyn_ctx.lineTo(point2[0],point2[1]);
                dyn_ctx.stroke();

                if(Traj.Manager.hasSelectedCurve()){

                    var curve = Traj.Manager.getCurrentCurve();

                    curve.spaceScale(evt.scale / scale);
                    curve.rotate(center,-evt.rotation - angle)
                    Traj.View.current_repaint();
                    scale = evt.scale;
                    angle = -evt.rotation;
                }

            } else { 
                scale = 1;
                angle = 0;

                Traj.View.dyn_repaint();
            }
            // le premier passage dans la fonction remet les valeurs de scale et angle à leur valeurs initiales et passe isTransforming à 'true'
            Traj.Events.isTransforming = true; 
        });
    },

    addSessionButtonEvents : function() {
        sessionDivOverCanvas = $('#sessionDivOverCanvas'),
        sessionDiv = document.getElementById("lblCurrentSession");

        sessionDivOverCanvas.hide();
        sessionDivOverCanvas.addClass( "hide" );
        sessionDiv.addEventListener(Traj.Utils.getStartEventName(),function(){
            if (sessionDivOverCanvas.hasClass("hide")) {
                sessionDivOverCanvas.show();
                sessionDivOverCanvas.removeClass( "hide" ).addClass( "show" );
            } else if (sessionDivOverCanvas.hasClass("show")) {
                sessionDivOverCanvas.hide();
                sessionDivOverCanvas.removeClass( "show" ).addClass( "hide" );
            }
        });
        Traj.View.dyn_canvas.addEventListener(Traj.Utils.getStartEventName(), function() {
            if (sessionDivOverCanvas.hasClass("show")) {
                sessionDivOverCanvas.hide();
                sessionDivOverCanvas.removeClass( "show" ).addClass( "hide" );
            }
        }, false);
    },

    addSourceButtonEvent : function() { // evt for source buttons
        var buttons = document.getElementsByClassName('sourceButton');

        var selectSource = function(source) {
            Traj.Events.selectSourceButton(source);
            if (Traj.Events.drawing) {
                Traj.Manager.currentSource = source;
            } else {
                Traj.Manager.currentSource = source;
                var curve = Traj.Manager.trajectories[Traj.Manager.currentCurveIndex];
                if (curve != undefined) {
                    var prev_source = curve.sourceNumber;
                    curve.changeSource(source);
                    Traj.Manager.updateMultiPlayForSourceChange(Traj.Manager.currentCurveIndex,prev_source,source);
                }
                Traj.View.current_repaint();
                Traj.View.traj_repaint();
            }
        };

        //Need to use the touchstart in plain text (not in a variable)
        //I don't no why and this is annoying!!!
        for (var k=0;k<buttons.length;k++) {
            buttons[k].style.background=Traj.View.default_colors[k];
            buttons[k].addEventListener(Traj.Utils.getStartEventName(), selectSource.bind(null,k+1));
        }
    },

    updateSourceButton : function(nb) { 
        var buttons = document.getElementsByClassName('sourceButton');

        var selectSource = function(source) {
            Traj.Events.selectSourceButton(source);
            if (Traj.Events.drawing) {
                Traj.Manager.currentSource = source;
            } else {
                Traj.Manager.currentSource = source;
                var curve = Traj.Manager.trajectories[Traj.Manager.currentCurveIndex];
                if (curve != undefined) {
                    curve.changeSource(source);
                }
                Traj.View.current_repaint();
                Traj.View.traj_repaint();
            }
        };

        //Need to use the touchstart in plain text (not in a variable)
        //I don't no why and this is annoying!!!
        for (var k=0;k<buttons.length;k++) {
            buttons[k].style.background=Traj.View.default_colors[k];
            buttons[k].addEventListener(Traj.Utils.getStartEventName(), selectSource.bind(null,k+1));
        }
    },

    addDrawZoneEvent : function() { // evt for bi-manual use for drawing
        var drawZone = document.getElementById('drawZone');

        var handleDrawStart = function(evt) {    
            evt.preventDefault();    
            Traj.View.displayOverCanvasElements(false);
            Traj.Events.drawing = true;
            Traj.View.setFeedbackDisplay("Draw a new curve");
            Traj.Events.selectSourceButton(Traj.Manager.currentSource);
        };

        var handleDrawEnd = function() {
            Traj.View.displayOverCanvasElements(true);
            Traj.View.setDefaultFeedbackDisplay();
            var currentCurveIndex = Traj.Manager.currentCurveIndex;
            var curve = Traj.Manager.trajectories[currentCurveIndex];
            if (curve!=undefined) {
                var currentSource = curve.sourceNumber;
                Traj.Events.selectSourceButton(currentSource);
            }
            if (Traj.View.touchState == 'wait') { // if we have not started to draw
                Traj.Events.drawing = false;
            }
        };

        drawZone.addEventListener('touchstart',handleDrawStart,false);
        drawZone.addEventListener('touchend',handleDrawEnd,false);    

        // initialisation
        $(".buttonSource").hide();
        $(".buttonSource").css('background-color','white');
    },


    selectSourceButton : function(sourceNumber) {
         // change the apparence of the sources buttons
         var buttons = document.getElementsByClassName('sourceButton');
         for (var k=0;k<buttons.length;k++) {
            buttons[k].style.borderColor='transparent';
        } 
        if (sourceNumber<9) {
            buttons[sourceNumber-1].style.borderColor = 'black';
        }
    },


    initContextMenu : function() {
        var divMenu = document.getElementById("contextMenu");
        divMenu.style.visibility = "hidden";   
        divMenu.style.zIndex = 4;

        var circularButton = document.getElementById('circularButton'),
        concatButton = document.getElementById('concatButton');

        handleTouchCircular = function() {
            Traj.Manager.processMakeCircular();
            Traj.Events.hideContextMenu();
        },

        handleTouchConcat = function() {
            var curve = Traj.Manager.trajectories[Traj.Manager.modifiedCurve];

            if (curve) {
                var length = curve.X.length-1;
                Traj.Manager.clipboardCurve = Traj.Manager.trajectories[Traj.Manager.currentCurveIndex];
                Traj.Manager.pasteInCurve(curve,length,length);
                Traj.Events.hideContextMenu();
            } else {
                handleTouchNew();
            }
        };

        circularButton.addEventListener(Traj.Utils.getStartEventName(),handleTouchCircular,false);
        concatButton.addEventListener(Traj.Utils.getStartEventName(),handleTouchConcat,false);
    },
    hideContextMenu : function() {
        var divMenu = document.getElementById("contextMenu");
        document.getElementById("circularButton").style.visibility = 'hidden';
        document.getElementById("concatButton").style.visibility = 'hidden';
        divMenu.style.visibility = "hidden";
    },

    //two boolean to show or not the contextual menu
    showContextMenu : function(circular, concat) {
        if(circular||concat){
            var divMenu = document.getElementById("contextMenu"),
            curve = Traj.Manager.trajectories[Traj.Manager.currentCurveIndex],
            pos = Traj.Utils.convertUnitsIntoCanvasPos([curve.X[curve.X.length-1],curve.Y[curve.X.length-1]]);

            if(!circular && concat){ //display at the first point
                pos = Traj.Utils.convertUnitsIntoCanvasPos([curve.X[0],curve.Y[0]]);
                pos[1] = pos[1] - 60;
            }
            
            document.getElementById("circularButton").style.visibility = circular ? 'visible' : 'hidden';
            document.getElementById("concatButton").style.visibility = concat ? 'visible' : 'hidden';

            divMenu.style.left = pos[0] + "px";
            divMenu.style.top =  (pos[1] - 40) + "px";
            divMenu.style.visibility = "visible";
            setTimeout(Traj.Events.hideContextMenu,7000);
        }
    },

    hideLongTouchMenu : function() {
        var divMenu = document.getElementById("longTouchMenu");
        divMenu.style.visibility = 'hidden';   
        divMenu.style.zIndex = 4;
    },
    showLongTouchMenu : function() {
        var pos = Traj.Events.touches[0];
        var divMenu = document.getElementById("longTouchMenu");
        divMenu.style.left = pos[0] + 'px';
        divMenu.style.top = pos[1] + 'px';
        divMenu.style.visibility = 'visible';
    },


    addFullscreenEvent : function() { 
        var header = document.getElementById('header');
        header.addEventListener('touchstart',function() {

            if (!document.fullscreenElement &&    // alternative standard method
               !document.mozFullScreenElement && !document.webkitFullscreenElement) {  // current working methods
                if (document.documentElement.requestFullscreen) {                  
                    document.documentElement.requestFullscreen();
                } else if (document.documentElement.mozRequestFullScreen) {
                    document.documentElement.mozRequestFullScreen();
                } else if (document.documentElement.webkitRequestFullscreen) {
                    document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                }
            }
        },false);
    },

    addPlayPauseEvent : function() {
        var playButton = document.getElementById('playButton');
        var playPause = function() {
            if (playButton.innerHTML == 'Play') {
                //if multi mode, then gets the list of indexes otherwise use the current index
                var indexes = Traj.Player.isMulti ? Traj.Manager.getMultiPlayIndexes() : [Traj.Manager.currentCurveIndex];

                //filter the indexes for multiuser behaviors
                if(Traj.Manager.allowed_indexes != null){
                    var updated_indexes = [];
                    var cnt = 0;
                    for(var i = 0; i< indexes.length; i++){
                        if(Traj.Manager.allowed_indexes.indexOf(Traj.Manager.trajectories[indexes[i]].sourceNumber) !=-1){
                           updated_indexes[cnt] = indexes[i];
                           cnt ++; 
                        }
                    }
                    indexes = updated_indexes;
                }

                if(indexes.length >0 ){
                    Traj.Player.playCurves(indexes);
                    playButton.innerHTML = 'Pause';
                }
            } else {
                Traj.Player.stopPlayActions();
                playButton.innerHTML = 'Play';
            }
        };
        playButton.addEventListener(Traj.Utils.getStartEventName(),playPause,false);
    },

    ////////////////////////////////////
    ////////// CALLED FROM HTML ////////
    ////////////////////////////////////

    updateOrientationMode : function(){
        Traj.Events.stream_orientation = document.getElementById("flip-orientation").value == 'on';
    },

    updateTimeSliderMode : function(){
        if (document.getElementById("flip-timeSlider").value == 'on') {
            $("#slider-div").show();
        } else {
            $("#slider-div").hide();    
        }
    },
};




