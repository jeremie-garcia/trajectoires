////////////////////////////////////////////////////////////
//////////////////////// EVENT ////////////////////////////

Trajectoires.EventManager = {

stream_orientation : false,
rangeSlider : false,
touchId : 0,
idRotateLeft : [],
idRotateRight : [],
isTransforming : false,
touches : [],
drawing : false,
idSetTimeoutTransformation : 0,
idSetTimeoutLongTouchMenu : 0,
center2Touch : [],
transformation : null, // null, 1touch, 2touch, 3touch


///////////////////////////////////////////////////////////////////
/////////////////////// TOUCH AND MOUSE EVENT /////////////////////
///////////////////////////////////////////////////////////////////
handleStart : function(evt) {
    Trajectoires.State.newAction();
    Trajectoires.EventManager.hideContextMenu();
    if (Trajectoires.View.touchState === 'wait' && evt.changedTouches.length < 2) {
        //console.log(evt.changedTouches.length)
        lastFactor = 1; // IN GLOBAL FOR NOW (used for 3 fingers event, stretch)
        Trajectoires.EventManager.touches = []; 
        if (evt.touches[1]) {Trajectoires.EventManager.touchId = evt.touches[1].identifier;} // if the Zslider had been touch before the canvas
        else {Trajectoires.EventManager.touchId = evt.touches[0].identifier;} // canvas is touch in 1st
        Trajectoires.View.touchState = '1touch';                               // set state
        var touches = evt.changedTouches;
        var i = 0;                                                      // take first touch of changed touches (only 1 new touch at a time)             
        var evt_pos = Trajectoires.Utils.event2CanvasPos(touches[i]);   
        var coords = Trajectoires.Utils.convertCanvasPosIntoUnits(evt_pos);

        Trajectoires.View.last_event_pos = evt_pos;
        Trajectoires.EventManager.touches.push([evt.changedTouches[0].clientX,evt.changedTouches[0].clientY]);

        if (Trajectoires.EventManager.drawing) { // CAS dessin
            var z = Trajectoires.EventManager.getZSliderValue()||0;
            var t = Math.floor(evt.timeStamp);
            Trajectoires.TrajManager.processCreateNewCurve(coords[0], coords[1], z, t);
            Trajectoires.View.draw_startCurrentCurve(touches[i]);

        } else { // CAS 1 doigt select : moved in handleEnd
            Trajectoires.EventManager.transformation = '1touch';
            Trajectoires.View.traj_repaint();
            Trajectoires.EventManager.idSetTimeoutTransformation = setTimeout(function() {Trajectoires.EventManager.isTransforming = true;},150); // 150ms for touch before translating 
            //Trajectoires.EventManager.idSetTimeoutLongTouchMenu = setTimeout(Trajectoires.EventManager.showLongTouchMenu,1200);
        }

    } else if (Trajectoires.View.touchState === '1touch' || (evt.changedTouches.length == 2 && Trajectoires.View.touchState === 'wait')){
        clearTimeout(Trajectoires.EventManager.idSetTimeoutTransformation); // avoid selecting another curve
        Trajectoires.EventManager.transformation = '2touch';
        Trajectoires.View.touchState = '2touch';

        Trajectoires.View.traj_repaint();
        Trajectoires.EventManager.touches.push([evt.changedTouches[0].clientX,evt.changedTouches[0].clientY]);

        if (evt.changedTouches.length == 2) { // si les deux doigts sont posés en même temps (dans le même événement)
            Trajectoires.EventManager.touches = [];
            Trajectoires.EventManager.touches.push([evt.changedTouches[0].clientX,evt.changedTouches[0].clientY]);
            Trajectoires.EventManager.touches.push([evt.changedTouches[1].clientX,evt.changedTouches[1].clientY]);
        }
        //console.log(Trajectoires.EventManager.touches)
        // case for rotate from hammer.js
        var center = [(evt.touches[0].clientX + evt.touches[1].clientX)/2 , (evt.touches[0].clientY + evt.touches[1].clientY)/2];
        Trajectoires.EventManager.center2Touch = Trajectoires.Utils.convertCanvasPosIntoUnits(center);

    } else if (Trajectoires.View.touchState === '2touch') {
        Trajectoires.EventManager.transformation = '3touch';

        Trajectoires.View.touchState = '3touch';
        Trajectoires.View.traj_repaint();
        Trajectoires.EventManager.touches[0] = [evt.touches[0].clientX, evt.touches[0].clientY];
        Trajectoires.EventManager.touches[1] = [evt.touches[1].clientX, evt.touches[1].clientY];
        Trajectoires.EventManager.touches.push([evt.changedTouches[0].clientX,evt.changedTouches[0].clientY]);
        //console.log(Trajectoires.EventManager.touches)
    }
    evt.preventDefault();
    return false;
},

handleMove : function(evt) {
        
    if (Trajectoires.View.touchState === '1touch') { // CAS 1 doigt

        if (Trajectoires.EventManager.drawing) { // CAS DESSIN
            for (var k=0; k<evt.changedTouches.length;k++) { // pour tous les touchés
                if (evt.changedTouches[k].identifier == Trajectoires.EventManager.touchId) { // est-ce que le touché est le bon ?
                    var touches = evt.changedTouches;
                    var evt_pos = Trajectoires.Utils.event2CanvasPos(touches[k]);
                    if (Trajectoires.TrajManager.currentCurve !== null && Trajectoires.Utils.distanceBtwPoints(evt_pos, Trajectoires.View.last_event_pos) > Trajectoires.View.DISTANCE_TRESHOLD) {
                        var coords = Trajectoires.Utils.convertCanvasPosIntoUnits(evt_pos);
                        var z = Trajectoires.EventManager.getZSliderValue()||0;
                        var t = Math.floor(evt.timeStamp);
                        Trajectoires.TrajManager.processAddPointToCurve(coords[0], coords[1], z, t);
                        Trajectoires.View.draw_updateCurrentCurve(touches[k]);   
                        Trajectoires.View.last_event_pos = evt_pos;              
                    }
                }
            }
        } else { // CAS TRANSLATION

            if (Trajectoires.EventManager.transformation == '1touch') {//Trajectoires.EventManager.isTransforming) { 
                var evt_pos = Trajectoires.Utils.event2CanvasPos(evt.changedTouches[0]),
                    coords = Trajectoires.Utils.convertCanvasPosIntoUnits(evt_pos),
                    lastCoords = Trajectoires.Utils.convertCanvasPosIntoUnits(Trajectoires.View.last_event_pos),
                    translateXY = [coords[0] - lastCoords[0], coords[1] - lastCoords[1]],
                    curve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex];

                curve.translate(translateXY[0] + curve.X[0],translateXY[1] + curve.Y[0],curve.Z[0]);
                Trajectoires.View.current_repaint();
                Trajectoires.View.last_event_pos = evt_pos; 
            }
        }

    } else if (Trajectoires.View.touchState === '2touch') { // CAS 2 doigts
        // See hammer recognition
        clearTimeout(Trajectoires.EventManager.idSetTimeoutLongTouchMenu);

        var center = [(evt.touches[0].clientX + evt.touches[1].clientX)/2 , (evt.touches[0].clientY + evt.touches[1].clientY)/2]; // mise à jour du centre pour le point de rotation
        Trajectoires.EventManager.center2Touch = Trajectoires.Utils.convertCanvasPosIntoUnits(center);

        Trajectoires.EventManager.touches[0] = [evt.touches[0].clientX, evt.touches[0].clientY]; // mise à jour des points pour le dessin de la droite
        Trajectoires.EventManager.touches[1] = [evt.touches[1].clientX, evt.touches[1].clientY];

    } else if (Trajectoires.View.touchState === '3touch') { // CAS 3 doigts
        // scale / axis done with the 2 first finger
        clearTimeout(Trajectoires.EventManager.idSetTimeoutLongTouchMenu);
        // draw line TODO : put it in a function and call it on touchstart for 2 fingers (plot it in an other canvas to avoid multiple draws)
        var dyn_ctx = Trajectoires.View.dyn_ctx;
        Trajectoires.View.dyn_repaint();
        var point1 = [2*Trajectoires.EventManager.touches[0][0]-Trajectoires.EventManager.touches[1][0],2*Trajectoires.EventManager.touches[0][1]-Trajectoires.EventManager.touches[1][1]];
        var point2 = [2*Trajectoires.EventManager.touches[1][0]-Trajectoires.EventManager.touches[0][0],2*Trajectoires.EventManager.touches[1][1]-Trajectoires.EventManager.touches[0][1]];
        dyn_ctx.beginPath();
        dyn_ctx.moveTo(point1[0],point1[1]);
        dyn_ctx.lineTo(point2[0],point2[1]);
        dyn_ctx.stroke();

        // 3 finger stretch => PUT IT IN A FUNCTION 
        var Utils = Trajectoires.Utils;
        var touches = Trajectoires.EventManager.touches;
        var axis = Trajectoires.Utils.getDirVector(Utils.convertCanvasPosIntoUnits(touches[0]),Utils.convertCanvasPosIntoUnits(touches[1]));
        var firstPoint = Utils.convertCanvasPosIntoUnits(touches[2]);
        var actualPoint = Utils.convertCanvasPosIntoUnits([evt.touches[2].clientX,evt.touches[2].clientY]);
        var projectedPoint = Utils.getProjectedPoint(actualPoint,axis,Utils.convertCanvasPosIntoUnits(touches[0]));
        var normalVector = Utils.getDirVector(firstPoint,projectedPoint);
        var firstDistance = Utils.distanceBtwPoints(firstPoint,projectedPoint);
        var distance = Utils.distanceBtwPoints(actualPoint,projectedPoint);
        var curve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex];
        var sign = Utils.sign(normalVector[0]*(actualPoint[0]-projectedPoint[0]) + normalVector[1]*(actualPoint[1]-projectedPoint[1]));
        var factor = sign*distance/firstDistance;
        curve.sapceScaleAxis(factor/lastFactor,axis,Trajectoires.Utils.convertCanvasPosIntoUnits(Trajectoires.EventManager.touches[0]));
        lastFactor = factor; // save last transformation factor
        Trajectoires.View.current_repaint();

    evt.preventDefault();
    return false;
}
},

handleEnd : function(evt) { // BUG POSSIBLE LORSQU'ON LACHE PLUSIEURS DOIGTS EN MÊME TEMPS (jamais arrivé pour l'instant...)
                            // L'iPad semble plus souvent regrouper les touchés que l'android
        //if (Trajectoires.EventManager.drawing) {
    var touches = evt.changedTouches;
    var nbTouch = evt.touches.length;

if (!Trajectoires.EventManager.drawing && !Trajectoires.EventManager.isTransforming) {
        clearTimeout(Trajectoires.EventManager.idSetTimeoutTransformation); 
        var evt_pos = Trajectoires.Utils.event2CanvasPos(evt.changedTouches[0]);   
        var coords = Trajectoires.Utils.convertCanvasPosIntoUnits(evt_pos);
        Trajectoires.View.traj_repaint();
            var curveSelected = Trajectoires.Utils.getClosestCurveFromTouch(coords);
            Trajectoires.TrajManager.selectCurve(curveSelected);
    }

    for (var k=0; k<evt.changedTouches.length;k++) { // boucle sur tous les touchés

            if (evt.changedTouches[k].identifier == Trajectoires.EventManager.touchId) { // si c'est le 1e touché qui est laché (sert à ne pas prendre en compte le laché du zSlider par exemple)
                var i = 0;
                var coords = Trajectoires.Utils.convertCanvasPosIntoUnits(Trajectoires.Utils.event2CanvasPos(touches[i]));
                var z = Trajectoires.EventManager.getZSliderValue()||0;
                var t = Math.floor(evt.timeStamp);

                if (Trajectoires.EventManager.drawing) { // CAS DESSIN
                    if (!Trajectoires.EventManager.rangeSlider) {
                        Trajectoires.TrajManager.processEndCurve(coords[0], coords[1], z, t); // cas dessin normal
                    } else {
                        Trajectoires.TrajManager.processModifyCurve(coords[0], coords[1], z, t); // cas "redraw"
                    }
                }
                Trajectoires.View.touchState = 'wait';

                if (Trajectoires.EventManager.isTransforming) { // CAS TRANSFORMATION
                    Trajectoires.EventManager.isTransforming = false;
                    Trajectoires.TrajManager.currentCurve = null;
                    Trajectoires.View.traj_repaint();
                    Trajectoires.View.dyn_repaint();
                }

            } else if (Trajectoires.View.touchState === '1touch') { // 1 doigt => passage à 0 doigt
                Trajectoires.EventManager.transformation = null;
                Trajectoires.View.touchState = 'wait';
                Trajectoires.View.dyn_repaint();
            } else if (Trajectoires.View.touchState === '2touch') { // 2 doigt => passage à 1 doigt
                Trajectoires.View.touchState = '1touch';
            } else if (Trajectoires.View.touchState === '3touch') { // 3 doigt => passage à 2 doigt
                Trajectoires.View.touchState = '2touch';
            }
    }
    Trajectoires.View.traj_repaint();
    Trajectoires.View.ongoingTouches = [];
    evt.preventDefault();
    Trajectoires.EventManager.touches = [];
    clearTimeout(Trajectoires.EventManager.idSetTimeoutLongTouchMenu); // annuler le pop du menu
    // Trajectoires.EventManager.drawing = false;
    return false;
//}
},

handleCancel : function(evt) { // prévoir ce cas comme celui d'un touchEnd ?
    evt.preventDefault();
},

// FOR LONG TOUCH MENU
handleStartLongTouch : function(evt) {
    clearTimeout(Trajectoires.EventManager.idSetTimeoutLongTouchMenu);
    Trajectoires.EventManager.idSetTimeoutLongTouchMenu = setTimeout(Trajectoires.EventManager.showLongTouchMenu,1500);
    Trajectoires.EventManager.touchlongFirst = [evt.changedTouches[0].clientX, evt.changedTouches[0].clientY];
},
handleMoveLongTouch : function(evt) {
    var touchLong = [evt.changedTouches[0].clientX, evt.changedTouches[0].clientY];
    var touchlongFirst = Trajectoires.EventManager.touchlongFirst;
    var dist = Trajectoires.Utils.distanceBtwPoints(touchLong,touchlongFirst);
    if (dist>10) {
        clearTimeout(Trajectoires.EventManager.idSetTimeoutLongTouchMenu);
    }
},


handleMouseDown : function(evt) {
    if (Trajectoires.View.touchState === 'wait') {
        Trajectoires.View.touchState = '1touch';
        var evt_pos = Trajectoires.Utils.event2CanvasPos(evt);
        var coords = Trajectoires.Utils.convertCanvasPosIntoUnits(evt_pos);
        var z = 0;
        var t = Math.floor(evt.timeStamp);
        Trajectoires.TrajManager.processCreateNewCurve(coords[0], coords[1], z, t);
        Trajectoires.View.draw_startCurrentCurve(evt);
        Trajectoires.View.last_event_pos =  evt_pos;
    }
},

handleMouseMove : function(evt) {
    if (Trajectoires.View.touchState === '1touch') {
        var evt_pos = Trajectoires.Utils.event2CanvasPos(evt);
        if (Trajectoires.TrajManager.currentCurve !== null && Trajectoires.Utils.distanceBtwPoints(evt_pos, Trajectoires.View.last_event_pos) > Trajectoires.View.DISTANCE_TRESHOLD) {
            var coords = Trajectoires.Utils.convertCanvasPosIntoUnits(evt_pos);
            var z = 0;
            var t = Math.floor(evt.timeStamp);
            Trajectoires.TrajManager.processAddPointToCurve(coords[0], coords[1], z, t);
            Trajectoires.View.draw_updateCurrentCurve(evt);
            Trajectoires.View.last_event_pos = evt_pos;  
        }
    }
},

handleMouseUp : function(evt) {
    var coords = Trajectoires.Utils.convertCanvasPosIntoUnits(Trajectoires.Utils.event2CanvasPos(evt));
    var z = 0;
    var t = Math.floor(evt.timeStamp);
    if (!Trajectoires.EventManager.rangeSlider && Trajectoires.TrajManager.currentCurve !== null) {
        Trajectoires.TrajManager.processEndCurve(coords[0], coords[1], z, t); // cas dessin normal
    } else if (Trajectoires.EventManager.rangeSlider) {
        Trajectoires.TrajManager.processModifyCurve(coords[0], coords[1], z, t); // cas "redraw"
    }
    Trajectoires.View.touchState = 'wait';
    //"draw_updateCurrentCurve(evt);
},

addTouchEvents : function(canvas) {
    canvas.addEventListener("touchstart", Trajectoires.EventManager.handleStart, false);
    canvas.addEventListener("touchend", Trajectoires.EventManager.handleEnd, false);
    canvas.addEventListener("touchcancel", Trajectoires.EventManager.handleCancel, false);
    canvas.addEventListener("touchmove", Trajectoires.EventManager.handleMove, false);
    canvas.addEventListener('touchstart',Trajectoires.EventManager.handleStartLongTouch,false);
    canvas.addEventListener('touchmove',Trajectoires.EventManager.handleMoveLongTouch,false);
},

addMouseEvents : function(canvas) {
    canvas.addEventListener("mousedown", Trajectoires.EventManager.handleMouseDown, false);
    canvas.addEventListener("mousemove", Trajectoires.EventManager.handleMouseMove, false);
    canvas.addEventListener("mouseup", Trajectoires.EventManager.handleMouseUp, false);
},

processOrientationEvents : function(event) {
    var alpha = event.alpha;
    // gamma: left to right
    var gamma = event.gamma;
    // beta: front back motion
    var beta = event.beta;
    var msg = [alpha,beta,gamma];
    if(Trajectoires.EventManager.stream_orientation){ 
        Trajectoires.OSC.sendOrientation(msg);
    }
},

addOrientationEvents : function(){
    if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", Trajectoires.EventManager.processOrientationEvents);
    }
},




///////////////////////////////////////////////////////////////////
///////////////////////////// INIT EVENT //////////////////////////
///////////////////////////////////////////////////////////////////

trajInitEvents : function() {
    if (onmobile) {
        Trajectoires.EventManager.addTouchEvents(Trajectoires.View.dyn_canvas);
        Trajectoires.EventManager.addOrientationEvents();
        Trajectoires.EventManager.initSlider(false);
        Trajectoires.EventManager.initZSlider();
        Trajectoires.EventManager.addSessionButtonTouch();
        Trajectoires.EventManager.addCurveButton();
        Trajectoires.EventManager.addRotateEvent();
        //Trajectoires.EventManager.addFullscreenEvent();
    } else {
        Trajectoires.EventManager.addMouseEvents(Trajectoires.View.dyn_canvas);
        Trajectoires.EventManager.addOrientationEvents();
        Trajectoires.EventManager.initSlider(false);
        Trajectoires.EventManager.initZSlider();
        Trajectoires.EventManager.addSessionButtonMouse();
        Trajectoires.EventManager.addCurveButton();
        // hide draw zone
        var drawZone = document.getElementById('drawZone');
        var drawZoneRight = document.getElementById('drawZoneRight');
        drawZone.style.display="none";
        drawZoneRight.style.display="none";

    }
// functions that already make distinction between mobile or computer
    Trajectoires.EventManager.addDrawZoneEvent(); 
    Trajectoires.EventManager.addRotationEvt();
    Trajectoires.EventManager.initContextMenu();
    Trajectoires.EventManager.addSourceButtonEvent();
    Trajectoires.EventManager.hideLongTouchMenu();
    Trajectoires.EventManager.addPlayPauseEvent();
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
    var index = Trajectoires.TrajManager.currentCurveIndex;
    if (Trajectoires.TrajManager.trajectories[index]) {
        var maxTime = Trajectoires.TrajManager.trajectories[index].lengthTime();
    } else {
        var maxTime = 100;
    }

    // déclaration du slider (plugin jquery.range.js)
    $('.timeSlider').jRange({
        from: 0,
        to: maxTime,
        step: 1,
        scale: [0,maxTime],
        format: '%s ms',
        width: width,
        showLabels: true,
        isRange : range, // true pour le range slider
        onstatechange : Trajectoires.EventManager.sliderOnChange,
        isVertical: false, 
    });

    Trajectoires.EventManager.timeSlider = $('.timeSlider').data('plugin_jRange'); // actualiser la variable du slider
    Trajectoires.EventManager.rangeSlider = range; // true si c'est un range slider
    if (range) {this.setSliderValue('0,100')}

    if (document.getElementById("flip-timeSlider").value == 'on') {
        $("#slider-div").show();
    } else {
        $("#slider-div").hide();    
    }
    //this.sliderOnChange();
    Trajectoires.View.bg_repaint();
},

setSliderValue : function(value) {
    var slider = Trajectoires.EventManager.timeSlider;
    slider.setValue(value);
},

getSliderValue : function() {
    var slider = Trajectoires.EventManager.timeSlider;
    if (Trajectoires.EventManager.rangeSlider) {
        var value = slider.getValue().split(',');
        var values = [Number(value[0]),Number(value[1])];
        return values;
    } else {
        if (slider)
        return Number(slider.getValue());
    }
},

sliderOnChange : function() {
    if (Trajectoires.EventManager.rangeSlider) { // range slider
        var val = Trajectoires.EventManager.getSliderValue();
        Trajectoires.View.drawTimePointsSelect(val);

    } else { // slider normal
        if (!(Trajectoires.Player.isPlaying)) {
            if (Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex]) {
                var val = Trajectoires.EventManager.getSliderValue();
                if (Trajectoires.TrajManager.playedCurves.length > 1) {
                    Trajectoires.View.drawSeveralTimePoint(val);
                } else {
                    Trajectoires.View.drawTimePoint(val);
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
        onstatechange : Trajectoires.EventManager.zsliderOnChange,
    });
    Trajectoires.EventManager.zSlider = $('.ZSlider').data('plugin_jRange');
    $("#ZSliderDiv").hide();

},

zsliderOnChange : function() {
    if (!(Trajectoires.Player.isPlaying) && !Trajectoires.TrajManager.currentCurve ) {
        var curve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex];
        var now = Trajectoires.EventManager.getSliderValue();
        var pointCoord = Trajectoires.Utils.interpolate(now,curve);
        pointCoord[3] = Trajectoires.EventManager.getZSliderValue();
        Trajectoires.OSC.sendPosxyzMsg(pointCoord);
    }
},

getZSliderValue : function() {
    var slider = Trajectoires.EventManager.zSlider;
    return Number(slider.getValue());
},

setZSliderValue : function(value) {
    var slider = Trajectoires.EventManager.zSlider;
    if (slider) {
    slider.setValue(value);
    }
},






///////////////////////////////////////////////////////////////////
////////////////// SEVERAL (menu, transformation) /////////////////
///////////////////////////////////////////////////////////////////

addRotateEvent : function() { // uses hammer.js
    angle = 0; // IN GLOBAL FOR NOW ...
    scale = 1; // mémorise les valeurs pour les transformation précédentes

    var myElement = Trajectoires.View.dyn_canvas;
    var mc = new Hammer.Manager(myElement);
    var rotate = new Hammer.Rotate();
    mc.add([rotate]);
    mc.on("rotate",function(evt) {

        if (Trajectoires.EventManager.isTransforming) {
            var dyn_ctx = Trajectoires.View.dyn_ctx;
            var center = Trajectoires.EventManager.center2Touch;

            dyn_ctx.lineWidth = 5;
            dyn_ctx.fillStyle = "#7CAEA8";
            dyn_ctx.strokeStyle = "#7CAEA8";
            dyn_ctx.globalAlpha = Trajectoires.View.CURVE_ACTIVE_ALPHA;
            Trajectoires.View.dyn_repaint();
            Trajectoires.View.drawPoint(dyn_ctx,Trajectoires.Utils.convertUnitsIntoCanvasPos(center) , 8);
            Trajectoires.View.drawPoint(dyn_ctx,Trajectoires.Utils.convertUnitsIntoCanvasPos(center) , 18);

            // draw line TODO : put it in a function and call it on touchstart for 2 fingers (plot it in an other canvas to avoid multiple draws)
            var point1 = [2*Trajectoires.EventManager.touches[0][0]-Trajectoires.EventManager.touches[1][0],2*Trajectoires.EventManager.touches[0][1]-Trajectoires.EventManager.touches[1][1]];
            var point2 = [2*Trajectoires.EventManager.touches[1][0]-Trajectoires.EventManager.touches[0][0],2*Trajectoires.EventManager.touches[1][1]-Trajectoires.EventManager.touches[0][1]];
            dyn_ctx.beginPath();
            dyn_ctx.moveTo(point1[0],point1[1]);
            dyn_ctx.lineTo(point2[0],point2[1]);
            dyn_ctx.stroke();

            var curve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex];

            curve.spaceScale(evt.scale / scale);
            curve.rotate(center,-evt.rotation - angle)
            Trajectoires.View.current_repaint();
            scale = evt.scale;
            angle = -evt.rotation;
        } else { 
            scale = 1;
            angle = 0;

            Trajectoires.View.dyn_repaint();
        }
        // le premier passage dans la fonction remet les valeurs de scale et angle à leur valeurs initiales et passe isTransforming à 'true'
        Trajectoires.EventManager.isTransforming = true; 
    });
},

addSessionButtonTouch : function() {
    var sessionDivOverCanvas = $('#sessionDivOverCanvas');
    sessionDivOverCanvas.hide();
    sessionDivOverCanvas.addClass( "hide" );
    var sessionDiv = document.getElementById("lblCurrentSession");
    sessionDiv.addEventListener("touchstart",function(){
        if (sessionDivOverCanvas.hasClass("hide")) {
            sessionDivOverCanvas.show();
            sessionDivOverCanvas.removeClass( "hide" ).addClass( "show" );
        } else if (sessionDivOverCanvas.hasClass("show")) {
            sessionDivOverCanvas.hide();
            sessionDivOverCanvas.removeClass( "show" ).addClass( "hide" );
        }
    });
    Trajectoires.View.dyn_canvas.addEventListener("touchstart", function() {
        if (sessionDivOverCanvas.hasClass("show")) {
            sessionDivOverCanvas.hide();
            sessionDivOverCanvas.removeClass( "show" ).addClass( "hide" );
        }
    }, false);
},

addSessionButtonMouse : function() {
    var sessionDivOverCanvas = $('#sessionDivOverCanvas');
    sessionDivOverCanvas.hide();
    sessionDivOverCanvas.addClass( "hide" );
    var sessionDiv = document.getElementById("lblCurrentSession");
    sessionDiv.addEventListener("mousedown",function(){
        if (sessionDivOverCanvas.hasClass("hide")) {
            sessionDivOverCanvas.show();
            sessionDivOverCanvas.removeClass( "hide" ).addClass( "show" );
        } else if (sessionDivOverCanvas.hasClass("show")) {
            sessionDivOverCanvas.hide();
            sessionDivOverCanvas.removeClass( "show" ).addClass( "hide" );
        }
    });
    Trajectoires.View.dyn_canvas.addEventListener("mousedown", function() {
        if (sessionDivOverCanvas.hasClass("show")) {
            sessionDivOverCanvas.hide();
            sessionDivOverCanvas.removeClass( "show" ).addClass( "hide" );
        }
    }, false);
},


addCurveButton : function() {
    // initialisation
    $("#divCurveOptions").hide();
    $("#divCurveOptions").addClass( "hide" );

    var openMenu = function() {
        Trajectoires.EventManager.refreshCurveInfo();
        if ($("#divCurveOptions").hasClass("hide")) {
            $("#divCurveOptions").show();
            $("#divCurveOptions").removeClass( "hide" ).addClass( "show" );
            $("#playDiv").hide();
        } else if ($("#divCurveOptions").hasClass("show")) {
            $("#divCurveOptions").hide();
            $("#divCurveOptions").removeClass( "show" ).addClass( "hide" );
            $("#playDiv").show();
        }
    };
    var closeMenu = function() {
        if ($("#divCurveOptions").hasClass("show")) {
            $("#divCurveOptions").hide();
            $("#divCurveOptions").removeClass( "show" ).addClass( "hide" );
            $("#playDiv").show();
        }
    };
    var buttonCurveMenuPressed = function(button) {
        var colorGrey = '#ECEDEE',
            colorBlack = '#666666',
            colorWhite = '#FBFBFB',
            divCurveAction = $("#divCurveAction"),
            divCurveProp = $("#divCurveProp"),
            divCurveMulti = $("#divCurveMulti"),
            action = $("#action"),
            prop = $("#prop"),
            multi = $("#multi");

        if (button == 'action') {
            //console.log('action');
            divCurveAction.show();
            action.css('background-color',colorGrey); // passer en code natif
            action.css('border-bottom-color',colorGrey);
            divCurveProp.hide();
            prop.css('background-color',colorWhite);
            prop.css('border-bottom-color',colorBlack);
            divCurveMulti.hide();
            multi.css('background-color',colorWhite);
            multi.css('border-bottom-color',colorBlack);
        } else if (button == 'prop') {
            //console.log('prop');
            divCurveAction.hide();
            action.css('background-color',colorWhite);
            action.css('border-bottom-color',colorBlack);
            divCurveProp.show();
            prop.css('background-color',colorGrey);
            prop.css('border-bottom-color',colorGrey);
            divCurveMulti.hide();
            multi.css('background-color',colorWhite);
            multi.css('border-bottom-color',colorBlack);
        } else if (button == 'multi') {
            //console.log('multi');
            divCurveAction.hide();
            action.css('background-color',colorWhite);
            action.css('border-bottom-color',colorBlack);
            divCurveProp.hide();
            prop.css('background-color',colorWhite);
            prop.css('border-bottom-color',colorBlack);
            divCurveMulti.show();
            multi.css('background-color',colorGrey);
            multi.css('border-bottom-color',colorGrey);
        }
    };

    var curveLbl = document.getElementById("lbl_current_curve");
    var curveButton = document.getElementById("curveMenuButton");

    if (onmobile) {
        curveLbl.addEventListener("touchstart",openMenu);
        curveButton.addEventListener("touchstart",openMenu);
        Trajectoires.View.dyn_canvas.addEventListener("touchstart", closeMenu, false);
    } else {
        curveLbl.addEventListener("mousedown",openMenu);
        curveButton.addEventListener("mousedown",openMenu);
        Trajectoires.View.dyn_canvas.addEventListener("mousedown",closeMenu ,false);
    }

    $('#action').on('click',function() {buttonCurveMenuPressed('action');});
    $('#prop').on('click',function() {buttonCurveMenuPressed('prop');});
    $('#multi').on('click',function() {buttonCurveMenuPressed('multi');});

    buttonCurveMenuPressed('action');
},


refreshCurveInfo : function() { // actualise les informations du curveMenu et des boutons de sources
    var index = Trajectoires.TrajManager.currentCurveIndex;
    var curve = Trajectoires.TrajManager.trajectories[index];
    if (Trajectoires.TrajManager.trajectories[index]) {
        // time info
        var timeNumber = document.getElementById('timeStretch');
        timeNumber.value = curve.lengthTime();
        // position first point
        var xOriPosBox = document.getElementById('xOriPos');
        var yOriPosBox = document.getElementById('yOriPos');
        var zOriPosBox = document.getElementById('zOriPos');
        xOriPosBox.value = curve.X[0].toFixed(2);
        yOriPosBox.value = curve.Y[0].toFixed(2);
        zOriPosBox.value = curve.Z[0].toFixed(2);
        // source number and multiplay
        document.getElementById("sourceControled").value = curve.sourceNumber;
        $("#checkPlay").prop('checked', curve.multiPlay).checkboxradio("refresh");
        Trajectoires.EventManager.selectSourceButton(curve.sourceNumber);
    } else {
        document.getElementById("sourceControled").value = 1;
        $("#checkPlay").prop('checked', false).checkboxradio("refresh");
    }
},


addRotationEvt : function() { // event for rotate buttons
    var rotateCurve = function rotateCurve(angle) {
        var curve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex];
        var timeSliderValue = Trajectoires.EventManager.getSliderValue();
        if (curve == undefined) {
            return;
        }
        var center = Trajectoires.Utils.interpolate(timeSliderValue,curve);
        center.splice(0,1);
        curve.rotate(center,angle);
        Trajectoires.TrajManager.selectCurve(Trajectoires.TrajManager.currentCurveIndex);
        Trajectoires.EventManager.sliderOnChange();
        };
    var startRotateLeft = function startRotateLeft(evt) {
        evt.preventDefault();
        var angle = 2;
        rotateCurve(angle);
        Trajectoires.EventManager.idRotateLeft.push(setInterval(function(){ rotateCurve(angle); angle=angle+2; }, 200));
    };
    var startRotateRight =  function startRotateRight(evt) {
        evt.preventDefault();
        var angle = 2;
        rotateCurve(-angle);
        Trajectoires.EventManager.idRotateRight.push(setInterval(function(){ rotateCurve(-angle);angle=angle+2 }, 200));
    };
    var endRotateLeft = function endRotate(evt) {
        clearInterval(Trajectoires.EventManager.idRotateLeft); 
        Trajectoires.EventManager.idRotateLeft = [];
    };
    var endRotateRight = function endRotate(evt) {
        clearInterval(Trajectoires.EventManager.idRotateRight);  
        Trajectoires.EventManager.idRotateRight = [];
    };

    var rotateLeft = document.getElementById("rotateLeft");
    var rotateRight = document.getElementById("rotateRight");
    if (onmobile) {
    rotateLeft.addEventListener('touchstart', startRotateLeft, false);
    rotateLeft.addEventListener('touchend', endRotateLeft, false);
    rotateRight.addEventListener('touchstart', startRotateRight, false);
    rotateRight.addEventListener('touchend', endRotateRight, false);
    } else {
    rotateLeft.addEventListener('mousedown', startRotateLeft, false);
    rotateLeft.addEventListener('mouseup', endRotateLeft, false);
    rotateRight.addEventListener('mousedown', startRotateRight, false);
    rotateRight.addEventListener('mouseup', endRotateRight, false);
    }
},

addSourceButtonEvent : function() { // evt for source buttons
    var buttons = document.getElementsByClassName('sourceButton');
    for (var k=0;k<buttons.length;k++) {
        buttons[k].children[0].style.background=Trajectoires.View.default_colors[k];
    }

    var selectSource = function(source) {
        Trajectoires.EventManager.selectSourceButton(source);
        if (Trajectoires.EventManager.drawing) {
            Trajectoires.TrajManager.currentSource = source;
        } else {
            Trajectoires.TrajManager.currentSource = source;
            var curve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex];
            if (curve != undefined) {
                curve.changeSource(source);
            }
            Trajectoires.View.current_repaint();
            Trajectoires.View.traj_repaint();
        }
    };

    if (onmobile) {
        buttons[0].addEventListener('touchstart',function() {selectSource(1);});
        buttons[1].addEventListener('touchstart',function() {selectSource(2);});
        buttons[2].addEventListener('touchstart',function() {selectSource(3);});
        buttons[3].addEventListener('touchstart',function() {selectSource(4);});
        buttons[4].addEventListener('touchstart',function() {selectSource(5);});
        buttons[5].addEventListener('touchstart',function() {selectSource(6);});
        buttons[6].addEventListener('touchstart',function() {selectSource(7);});
        buttons[7].addEventListener('touchstart',function() {selectSource(8);});
    } else {
        buttons[0].addEventListener('mousedown',function() {selectSource(1);});
        buttons[1].addEventListener('mousedown',function() {selectSource(2);});
        buttons[2].addEventListener('mousedown',function() {selectSource(3);});
        buttons[3].addEventListener('mousedown',function() {selectSource(4);});
        buttons[4].addEventListener('mousedown',function() {selectSource(5);});
        buttons[5].addEventListener('mousedown',function() {selectSource(6);});
        buttons[6].addEventListener('mousedown',function() {selectSource(7);});
        buttons[7].addEventListener('mousedown',function() {selectSource(8);});
    } 

},


addDrawZoneEvent : function() { // evt for bi-manual use for drawing
    var drawZone = document.getElementById('drawZoneEl');
    var drawZoneImg = document.getElementById('drawZoneImg');
    var drawZoneDiv = document.getElementById('drawZone');
    var drawZoneRight = document.getElementById('drawZoneElRight');
    var drawZoneImgRight = document.getElementById('drawZoneImgRight');
    var drawZoneDivRight = document.getElementById('drawZoneRight');

    var handleStart = function(evt) {    
        evt.preventDefault();    
        //console.log('draw zone touched');
        $("#slider-div").hide(); 
        $(".canvas-left-overlay").hide();
        $("#divCurveMenu").hide();
        Trajectoires.EventManager.drawing = true; 
        Trajectoires.EventManager.selectSourceButton(Trajectoires.TrajManager.currentSource);
    };

    var handleEnd = function() {
        $("#slider-div").show(); 
        $(".canvas-left-overlay").show();
        $("#divCurveMenu").show();

        var currentCurveIndex = Trajectoires.TrajManager.currentCurveIndex;
        var curve = Trajectoires.TrajManager.trajectories[currentCurveIndex];
        if (curve!=undefined) {
            var currentSource = curve.sourceNumber;
            Trajectoires.EventManager.selectSourceButton(currentSource);
        }
        if (Trajectoires.View.touchState == 'wait') { // if we have not started to draw
            Trajectoires.EventManager.drawing = false;
        }
    };

    if (onmobile) {
        drawZone.addEventListener('touchstart',handleStart,false);
        drawZoneImg.addEventListener('touchstart',handleStart,false);
        drawZone.addEventListener('touchend',handleEnd,false);    
        drawZoneImg.addEventListener('touchend',handleEnd,false);  

        drawZoneRight.addEventListener('touchstart',handleStart,false);
        drawZoneImgRight.addEventListener('touchstart',handleStart,false);
        drawZoneRight.addEventListener('touchend',handleEnd,false);    
        drawZoneImgRight.addEventListener('touchend',handleEnd,false);  

    } else {
        // for browser on computer
    }

    // initialisation
    $(".buttonSource").hide();
    $(".buttonSource").css('background-color','white');
},


selectSourceButton : function(sourceNumber) { // change the apparence of the sources buttons
    var buttons = document.getElementsByClassName('sourceButton');
    for (var k=0;k<buttons.length;k++) {
        buttons[k].style.background='transparent';
        buttons[k].style.borderColor='transparent';
    } 
    if (sourceNumber<9) {
        buttons[sourceNumber-1].style.background = Trajectoires.View.default_colors[sourceNumber-1];
        buttons[sourceNumber-1].style.borderColor = 'black';//Trajectoires.View.default_colors[sourceNumber-1];
    }
},


initContextMenu : function() { // TODO : separate 'circular' and 'concat' menu, remove 'new'
    var divMenu = document.getElementById("contextMenu");
    divMenu.style.visibility = "hidden";   
    divMenu.style.zIndex = 4;

    var circularButton = document.getElementById('circularButton'),
        newButton = document.getElementById('newButton'),
        concatButton = document.getElementById('concatButton');
        handleTouchCircular = function() {
            Trajectoires.TrajManager.processMakeCircular();
            Trajectoires.EventManager.hideContextMenu();
        },
        handleTouchNew = function() {
            //Trajectoires.TrajManager.processEndCurveEnd();
            Trajectoires.EventManager.hideContextMenu();
        },
        handleTouchConcat = function() {
            var curve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.modifiedCurve];

            if (curve) {
                var length = curve.X.length-1;
                Trajectoires.TrajManager.clipboardCurve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex];
                Trajectoires.TrajManager.pasteInCurve(curve,length,length);
                Trajectoires.EventManager.hideContextMenu();
            } else {
                handleTouchNew();
            }
        };
    if (onmobile) {
        circularButton.addEventListener('touchstart',handleTouchCircular,false);
        newButton.addEventListener('touchstart',handleTouchNew,false);
        concatButton.addEventListener('touchstart',handleTouchConcat,false);
    } else {
        circularButton.addEventListener('mousedown',handleTouchCircular,false);
        newButton.addEventListener('mousedown',handleTouchNew,false);
        concatButton.addEventListener('mousedown',handleTouchConcat,false);  
    }
},
hideContextMenu : function() {
    var divMenu = document.getElementById("contextMenu");
    divMenu.style.visibility = "hidden";
},
showContextMenu : function() {
    var curve = Trajectoires.TrajManager.trajectories[Trajectoires.TrajManager.currentCurveIndex];
    var pos = Trajectoires.Utils.convertUnitsIntoCanvasPos([curve.X[curve.X.length-1],curve.Y[curve.X.length-1]]);
    var divMenu = document.getElementById("contextMenu");
    divMenu.style.left = pos[0] + 'px';
    divMenu.style.top = pos[1] + 'px';
    divMenu.style.visibility = "visible";
    //setTimeout(Trajectoires.EventManager.hideContextMenu,3100);
},


hideLongTouchMenu : function() {
    var divMenu = document.getElementById("longTouchMenu");
    divMenu.style.visibility = "hidden";   
    divMenu.style.zIndex = 4;
},
showLongTouchMenu : function() {
    var pos = Trajectoires.EventManager.touches[0];
    var divMenu = document.getElementById("longTouchMenu");
    divMenu.style.left = pos[0] + 'px';
    divMenu.style.top = pos[1] + 'px';
    divMenu.style.visibility = "visible";
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
      // } else {
      //   if (document.cancelFullScreen) {
      //     document.cancelFullScreen();
      //   } else if (document.mozCancelFullScreen) {
      //     document.mozCancelFullScreen();
      //   } else if (document.webkitCancelFullScreen) {
      //     document.webkitCancelFullScreen();
      //   }
      }
    },false);
},

addPlayPauseEvent : function() {
    var playButton = document.getElementById('playButton');
    var multiplayButton = document.getElementById('multiplayButton');
    var playPause = function() {
        if (playButton.innerHTML == 'Play') {
            Trajectoires.Player.play();
            // playButton.innerHTML = 'Pause';
        } else {
            Trajectoires.Player.stopCurrentCurve();
            // playButton.innerHTML = 'Play';
        }
    };
    var multiplay = function() {
        Trajectoires.TrajManager.multiPlayChanged(Trajectoires.TrajManager.currentCurveIndex);
        if (Trajectoires.TrajManager.playedCurves.length > 0) {
            if (multiplayButton.innerHTML == 'Multi') {
                Trajectoires.Player.playAllCurve();
                multiplayButton.innerHTML = 'Pause';
            } else {
                Trajectoires.Player.stopCurrentCurve();
                multiplayButton.innerHTML = 'Multi';
            }
        }
    }

    if (onmobile) {
        playButton.addEventListener('touchstart',playPause,false);
        multiplayButton.addEventListener('touchstart',multiplay,false);
    } else {
        playButton.addEventListener('mousedown',playPause,false);
        multiplayButton.addEventListener('mousedown',multiplay,false);
    }
},


};




