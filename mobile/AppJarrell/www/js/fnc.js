////////////////////// Global variables TODO : put it as a class attribute ///////////////////////////////
var ongoingTouches = new Array;

var timeStart = Math.floor(Date.now()); // for Time curve information

var index = 0; // index for setofcurve

//////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////// Variables /////////////////////////////////////////////////////////////////////////
var plotCanvas = new canvas();

var currentCurve;
var setOfCurves = [];

var etat = 'wait';
// wait, 1touch, dessin, play, 2touch, continueCurve


/////////////////////////////////// COLOR /////////////////////////////////////////////////////////////////
// TODO : add in a class, use "nombre d'or" method
var colors = ["purple","cyan","red","yellow", "green"];


function getColor () {
    return colors[setOfCurves.length%colors.length];
}

function newColor () {
    index++;
}

var currentColor = getColor();

///////////
function ongoingTouchIndexById(idToFind) {
    for (var i = 0; i < ongoingTouches.length; i++) {
        var id = ongoingTouches[i].identifier;
        
        if (id == idToFind) {
            return i;
        }
    }
    return -1; // not found
}
///////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////// EVENT FUNCTION //////////////////////////////////////////////
//////// TOUCH START ///////////
function handleStart(evt) {
    evt.preventDefault();
    
    if (etat == 'wait') {    // new curve
        
        etat = '1touch';
        currentCurve = new Curve();
        timeStart = Math.floor(evt.timeStamp);
        
        var el = document.getElementById(plotCanvas.canv);
        var ctx = el.getContext("2d");
        var touches = evt.changedTouches;
        plotCanvas.erase();
        plotCanvas.plotAxis();
        
        if (document.getElementById("background").checked) {
            plotCanvas.plotAll();
        }
        
        ctx.globalAlpha = 1;
        
        var i = 0; // take first touch       
        //  for (var i=0; i<touches.length; i++) {
        ongoingTouches.push(touches[i]);
        //curve.push(touches[i]);
        
        ctx.fillStyle = getColor();
        ctx.fillRect(touches[i].pageX - el.offsetLeft, touches[i].pageY - el.offsetTop, 10, 10);
        
        currentCurve.curveWrite(touches[i].pageX - el.offsetLeft, touches[i].pageY - el.offsetTop, 0, evt.timeStamp - timeStart);
        sendOscMsg([1, Math.floor(1000*currentCurve.X[currentCurve.X.length-1]), Math.floor(1000*currentCurve.Y[currentCurve.Y.length-1]),  0]);
        
    } else if (etat =='continueCurve') {  // continue curve

        var el = document.getElementById(plotCanvas.canv);
        var ctx = el.getContext("2d");
        var touches = evt.changedTouches;
        
        if (document.getElementById("background").checked) {
            plotCanvas.plotAll();
        }
        
        ctx.globalAlpha = 1;
        
        var i = 0; // take first touch       
        //  for (var i=0; i<touches.length; i++) {
        ongoingTouches.push(touches[i]);
        //curve.push(touches[i]);
        
        ctx.fillStyle = getColor();
        ctx.fillRect(touches[i].pageX - el.offsetLeft, touches[i].pageY - el.offsetTop, 2, 2);
        
        currentCurve.curveWrite(touches[i].pageX - el.offsetLeft, touches[i].pageY - el.offsetTop, 0, evt.timeStamp - timeStart);
        sendOscMsg([1, Math.floor(1000*currentCurve.X[currentCurve.X.length-1]), Math.floor(1000*currentCurve.Y[currentCurve.Y.length-1]),  0]);
        
        
        
        
    } else if (etat == '1touch') {
        etat = '2touch';
    // TODO : add 2touch functionality  
    }
//    }
}

//////// TOUCH MOVE ////////////
function handleMove(evt) {
    evt.preventDefault();
      
    if (etat == '1touch' || etat =='continueCurve') {
        
        var el = document.getElementById(plotCanvas.canv);
        var ctx = el.getContext("2d");
        var touches = evt.changedTouches;
        ctx.lineWidth = 4;
        var i = 0;
        //for (var i=0; i<touches.length; i++) {
        var idx = ongoingTouchIndexById(touches[i].identifier);
        
        ctx.fillStyle = getColor();
        ctx.beginPath();
        ctx.strokeStyle = getColor();
        ctx.moveTo(ongoingTouches[idx].pageX - el.offsetLeft, ongoingTouches[idx].pageY - el.offsetTop);
        ctx.lineTo(touches[i].pageX - el.offsetLeft, touches[i].pageY - el.offsetTop);
        ctx.closePath();
        ctx.stroke();
        
        ongoingTouches.splice(idx, 1, touches[i]); // swap in the new touch record
        
        currentCurve.curveWrite(touches[i].pageX - el.offsetLeft, touches[i].pageY - el.offsetTop, 0, evt.timeStamp - timeStart);
        sendOscMsg([1, Math.floor(1000*currentCurve.X[currentCurve.X.length-1]), Math.floor(1000*currentCurve.Y[currentCurve.Y.length-1]),  0]);
    } else if (etat == '2touch') {
    // add curve to SetOfCurves
    // SetOfCurves.addCurve(currentCurve);
    //  Object.keys(SetOfCurves).length   
    }
//}
}

//////// TOUCH END //////////////////
function handleEnd(evt) {
    //  alert(ongoingTouches[1].pageX);
    //    sendOscMsg(ongoingTouches.pageX);
    evt.preventDefault();
    var el = document.getElementById(plotCanvas.canv);
    var ctx = el.getContext("2d");
    var touches = evt.changedTouches;
    var nbTouch = evt.touches.length;
    
    if (nbTouch < 1) {
        ctx.lineWidth = 4;
        var i = 0;
        //for (var i=0; i<touches.length; i++) {
        var idx = ongoingTouchIndexById(touches[i].identifier);
        
        ctx.fillStyle = getColor();
        ctx.beginPath();
        ctx.moveTo(ongoingTouches[i].pageX, ongoingTouches[i].pageY);
        ctx.lineTo(touches[i].pageX, touches[i].pageY);
        ctx.closePath();
        ongoingTouches.splice(i, 1); // remove it; we're done
        
        currentCurve.curveWrite(touches[i].pageX-el.offsetLeft, touches[i].pageY-el.offsetTop, 0, evt.timeStamp - timeStart);
        //}
        sendOscMsg([1, Math.floor(1000*currentCurve.X[currentCurve.X.length-1]), Math.floor(1000*currentCurve.Y[currentCurve.Y.length-1]),  0]);
        //sendOscMsg(currentCurve.Collect());
        
        
        if (!document.getElementById("continueCurve").checked) {
            setOfCurves.push(currentCurve); // ajoute la courbe dessiné à setOfCurves
            index = setOfCurves.length-1; // change l'index
            currentCurve.setCurrentCurve(index); // met la courbe dessiner dans currentCurve
        
            etat = 'wait';
        } else {
            etat = 'continueCurve';   
        }
    }
}
/////// TOUCH CANCEL /////////////////
function handleCancel(evt) {
    evt.preventDefault();
    var touches = evt.changedTouches;
    var i = 0;
    //for (var i=0; i<touches.length; i++) {
    ongoingTouches.splice(i, 1); // remove it; we're done       
    //}
    sendOscMsg(currentCurve.Collect());
    //    curve = new Curve();
    plotCanvas.isTouched = false;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////// CANVAS ////////////////////////////////////////////////////////////

function canvas() {
    
    this.backgroundCurve = "true";

    this.toggle = function(b) {                     // TODO : add toggle to enable/disable background curves
        b.value=(b.value=="true")?"false":"true";
    };
    
    this.canv = "canvas"; // Canvas name

    this.isTouched = false;

    this.scaleFactor = 1; // for zoom
   
    // erase currentCurve from setofcurve
    this.erase = function() {   
        //if (confirm("Do you want to erase the curve ?")) {
        var el = document.getElementById(this.canv);
        var ctx = el.getContext("2d");
        ctx.clearRect(0, 0, el.width, el.height);
    };

    this.plotAxis = function() {
        var el = document.getElementById(this.canv);
        var ctx = el.getContext("2d");
        ctx.clearRect(0, 0, el.width, el.height);
        ctx.globalAlpha = 1;
        var ecart = 20 * this.scaleFactor;

        ctx.beginPath();
        ctx.strokeStyle = '#F00';
        ctx.lineWidth = 0.3;


        for (var h = ecart; h < Math.floor(el.width / 2); h = h + ecart) {
            ctx.moveTo(Math.floor(el.width / 2) + h, 0);
            ctx.lineTo(Math.floor(el.width / 2) + h, el.height);
            ctx.moveTo(Math.floor(el.width / 2) - h, 0);
            ctx.lineTo(Math.floor(el.width / 2) - h, el.height);
        }

        for (var h = ecart; h < Math.floor(el.height / 2); h = h + ecart) {
            ctx.moveTo(0, Math.floor(el.height / 2) + h);
            ctx.lineTo(el.width, Math.floor(el.height / 2) + h);
            ctx.moveTo(0, Math.floor(el.height / 2) - h);
            ctx.lineTo(el.width, Math.floor(el.height / 2) - h);
        }

        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.moveTo(Math.floor(el.width / 2), 0);
        ctx.lineTo(Math.floor(el.width / 2), el.height);
        ctx.moveTo(0, Math.floor(el.height / 2));
        ctx.lineTo(el.width, Math.floor(el.height / 2));
        ctx.stroke();
        ctx.closePath();

        minWH = Math.min(el.width,el.height);

        ctx.fillStyle = 'black';
        ctx.font='10px Georgia';
        for (var i = 0; i < 10; i++) {
            ctx.fillText(1, 0.5*el.width + 0.75/2*minWH*this.scaleFactor, 0.52 * el.height);
            ctx.fillText(-1, 0.5*el.width - 0.75/2*minWH*this.scaleFactor, 0.52 * el.height);
            ctx.fillText(1,0.51*el.width, 0.5*el.height - 0.75/2*minWH*this.scaleFactor);
            ctx.fillText(-1,0.51*el.width, 0.5*el.height + 0.75/2*minWH*this.scaleFactor);
            //ctx.fillText(i + 1, (0.5 + i) * el.width + 0.25 * this.scaleFactor * el.width, 0.52 * el.height); /// TODO !! BUT : créer un zoom in zoom out
        }

        // plot 4 speakers
        var distHP = document.getElementById("distHP").value;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(el.width/2+0.75*minWH/2*this.scaleFactor*distHP -30, el.height/2+0.75*minWH/2*this.scaleFactor*distHP -30, 60, 60);
        ctx.fillRect(el.width/2-0.75*minWH/2*this.scaleFactor*distHP -30, el.height/2+0.75*minWH/2*this.scaleFactor*distHP -30, 60, 60);
        ctx.fillRect(el.width/2+0.75*minWH/2*this.scaleFactor*distHP -30, el.height/2-0.75*minWH/2*this.scaleFactor*distHP -30, 60, 60);
        ctx.fillRect(el.width/2-0.75*minWH/2*this.scaleFactor*distHP -30, el.height/2-0.75*minWH/2*this.scaleFactor*distHP -30, 60, 60);
        ctx.globalAlpha = 1;
    };
    
    this.zoom = function(factor) {
        //var el = document.getElementById(this.canv);
        //var ctx = el.getContext("2d");
        //ctx.scale(factor,factor);
        currentCurve.stop();
        this.erase();
        this.scaleFactor = this.scaleFactor * factor;
        this.plotAxis();
        currentCurve.curvePlot();
        setCurrentCurve(index);
    };
    
    
    // plot all curves of setOfCurves in back
    this.plotAll = function(){
        for (var k in setOfCurves) {
            setOfCurves[k].curvePlotBack();    
        }     
    };
    
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////// ON LOAD /////////////////////////////////////////////////////////////////////////
function startup() {
    var el = document.getElementById(plotCanvas.canv);
    el.addEventListener("touchstart", handleStart, false);
    el.addEventListener("touchend", handleEnd, false);
    el.addEventListener("touchcancel", handleCancel, false);
    el.addEventListener("touchleave", handleEnd, false);
    el.addEventListener("touchmove", handleMove, false);
    
    $(el).on("tap", function (e) {
        //alert('Yo : X ' + e.pageX);
    })
    
    $(el).on("taphold",function(e) {
        
    })

    plotCanvas.erase();
    plotCanvas.plotAxis();
}



//////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////  CURVE Object and Methods //////////////////////////////////////////////////////

function Curve(obj) {
    this.X = new Array;
    this.Y = new Array;
    this.Z = new Array;
    this.t = new Array;
    
    this.color = getColor(); //obj.color || 
    
    // write points into currentCurve object
    this.curveWrite = function(x, y, z, t) {
        var el = document.getElementById(plotCanvas.canv);
        var ctx = el.getContext("2d");
        
        this.X.push((x - (el.width / 2)) / (0.75*minWH/2 * plotCanvas.scaleFactor));
        this.Y.push(-(y - (el.height / 2)) / (0.75*minWH/2 * plotCanvas.scaleFactor / 1));
        this.Z.push(z / plotCanvas.scaleFactor);
        this.t.push(Math.floor(t));
        
    };
    
    this.SpaceScale = function(factor) {
        this.X = factor * this.X;
        this.Y = factor * this.Y;
        this.Z = factor * this.Z;
    };
    
    this.TimeScale = function(factor) {
        this.t = factor * this.t;
    };
    
    this.Collect = function() {
        var oscCurve = [];
        for (var i = 0; i < this.X.length; i++) {
            oscCurve.push(this.X[i]);
            oscCurve.push(this.Y[i]);
            oscCurve.push(this.Z[i]);
            oscCurve.push(this.t[i]);
        }
        return oscCurve;
    };
    
    // plot currentCurve into canvas
    this.curvePlot = function() {
        var el = document.getElementById(plotCanvas.canv);
        var ctx = el.getContext("2d");
        ctx.fillStyle = this.color;
        ctx.fillRect(Math.floor(this.X[0] * (0.75*minWH/2) * plotCanvas.scaleFactor + el.width / 2), -Math.floor(this.Y[0] * (0.75*minWH/2) * plotCanvas.scaleFactor - el.height / 2), 10, 10);
        ctx.lineWidth = 4;
        ctx.strokeStyle = this.color;//'#000';
        ctx.beginPath();
        ctx.moveTo(Math.floor(this.X[0] * (0.75*minWH/2) * plotCanvas.scaleFactor + el.width / 2), -Math.floor(this.Y[0] * (0.75*minWH/2) * plotCanvas.scaleFactor - el.height / 2));
        for (var i = 1; i < this.X.length; i++) {
            ctx.lineTo(Math.floor(this.X[i] * (0.75*minWH/2) * plotCanvas.scaleFactor + el.width / 2), -Math.floor(this.Y[i] * (0.75*minWH/2) * plotCanvas.scaleFactor - el.height / 2));
        }
        ctx.stroke();
        ctx.closePath();
    };
    
    // plot curve in BACK
    this.curvePlotBack = function() {
            var el = document.getElementById(plotCanvas.canv);
            var ctx = el.getContext("2d");
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.4;
            ctx.fillRect(Math.floor(this.X[0] * (0.75*minWH/2) * plotCanvas.scaleFactor + el.width / 2), -Math.floor(this.Y[0] * (0.75*minWH/2) * plotCanvas.scaleFactor - el.height / 2), 10, 10);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = this.color;//'#000';
            ctx.beginPath();
            ctx.moveTo(Math.floor(this.X[0] * (0.75*minWH/2) * plotCanvas.scaleFactor + el.width / 2), -Math.floor(this.Y[0] * (0.75*minWH/2) * plotCanvas.scaleFactor - el.height / 2));
            for (var i = 1; i < this.X.length; i++) {
                ctx.lineTo(Math.floor(this.X[i] * (0.75*minWH/2) * plotCanvas.scaleFactor + el.width / 2), -Math.floor(this.Y[i] * (0.75*minWH/2) * plotCanvas.scaleFactor - el.height / 2));
            }
            ctx.stroke();
            ctx.closePath();       
    };
    
    
    

    // play back the curve to control spat via osc
    this.playOSC = function (i,el,ctx) {
        // send point OSC
        sendOscMsg([1, Math.floor(1000*this.X[i]), Math.floor(1000*this.Y[i]),  0]);    
        // plot curve
        ctx.lineTo(Math.floor(this.X[i] * (0.75*minWH/2) * plotCanvas.scaleFactor + el.width / 2), -Math.floor(this.Y[i] * (0.75*minWH/2) * plotCanvas.scaleFactor - el.height / 2));
        ctx.stroke();  
        if (i == this.X.length-1) {
            plotCanvas.erase();
            plotCanvas.plotAxis();
            this.curvePlot();
            this.plotNumCurve(index);
        }
    };
    
    this.varTime = new Array(); // to keep id of setTimeout "threads"
    
    this.play = function() {  
        this.stop();
        var el = document.getElementById(plotCanvas.canv);
        var ctx = el.getContext("2d");
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(Math.floor(this.X[0] * (0.75*minWH/2) * plotCanvas.scaleFactor + el.width / 2), -Math.floor(this.Y[0] * (0.75*minWH/2) * plotCanvas.scaleFactor - el.height / 2));
        for (var i = 0; i < this.X.length; i++) {
            var del = this.t[i];
            this.varTime.push(setTimeout(this.playOSC.bind(currentCurve,i,el,ctx), del)); 
        }
    };
    
    this.stop = function() {   // stop current curve playing
        for (key in this.varTime) {
            clearTimeout(this.varTime[key]);
        }
        this.varTime = new Array();
        plotCanvas.erase();
        plotCanvas.plotAxis();
        this.curvePlot();
        this.plotNumCurve(index);   
    };
    
    
    
    
    
// Manage set of curve and currentCurve
    this.setCurrentCurve = function(i) {
        this.stop();
        plotCanvas.erase();
        plotCanvas.plotAxis();
        currentCurve = setOfCurves[i];
        currentCurve.curvePlot();
        this.plotNumCurve(i);
        if (document.getElementById("background").checked) {
            plotCanvas.plotAll();
        }        
    };

    this.plotNumCurve = function(i) {
        var el = document.getElementById(plotCanvas.canv);
        ctx = el.getContext("2d");
        ctx.font='25px Georgia';
        ctx.fillStyle = 'black';
        ctx.fillText(i+1,el.width-30,el.height-10);   
    };

    this.previousCurve = function() {
        
        if (document.getElementById("continueCurve").checked) {
            setOfCurves.push(currentCurve); // ajoute la courbe dessiné à setOfCurves
            index = setOfCurves.length-1; // change l'index
            currentCurve.setCurrentCurve(index); // met la courbe dessiner dans currentCurve
            etat = 'wait';
            document.getElementById('continueCurve').checked = false;
        }
        index == 0 ? index = setOfCurves.length - 1 : index--;
        this.setCurrentCurve(index);
    };

    this.nextCurve = function() {
        if (document.getElementById("continueCurve").checked) {
            setOfCurves.push(currentCurve); // ajoute la courbe dessiné à setOfCurves
            index = setOfCurves.length-1; // change l'index
            currentCurve.setCurrentCurve(index); // met la courbe dessiner dans currentCurve
            etat = 'wait';
            document.getElementById('continueCurve').checked = false;
        }
        index == setOfCurves.length - 1 ?  index = 0 : index++;
        this.setCurrentCurve(index);
    };

    this.eraseCurve = function() {
        setOfCurves.splice(index,1);   
        this.previousCurve();
        this.nextCurve();
    };

}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////// OSC ///////////////////////////////////////////////////////////////////////////

function sendOscMsg(msg) {
    var host = document.getElementById("host").value;
    var port = document.getElementById("port").value;
    var address = '/spat/posxyz';
    
    var sender = new OSCSender(host, port);
    sender.send(address, msg, null, null);
    sender.close();
//alert("Message sent to \n" +
//    host + " " + port + "\n" + address + " " + data);
}

function sendOscPlay() {
    var host = document.getElementById("host").value;
    var port = document.getElementById("port").value;
    var address = '/spat/play'
    var sender = new OSCSender(host, port);
    sender.send(address, null , null, null);
    sender.close();
}

function sendOscRecord() {
    var host = document.getElementById("host").value;
    var port = document.getElementById("port").value;
    var address = '/spat/record'
    var sender = new OSCSender(host, port);
    sender.send(address, null , null, null);
    sender.close(); 
    
}
