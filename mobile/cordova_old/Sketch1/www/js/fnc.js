var ongoingTouches = new Array;
//var curve = new Array;

var timeStart = Math.floor(Date.now());  // for Time curve information

var canv = "canvas"; // Canvas name

var isTouched = false;

var scaleFactor = 1;

var curve = new Curve();

function colorForTouch(touch) {
    var id = touch.identifier;
    id = id.toString(16); // make it a hex digit
    return "#" + id + id + id;
}

function ongoingTouchIndexById(idToFind) {
    for (var i = 0; i < ongoingTouches.length; i++) {
        var id = ongoingTouches[i].identifier;

        if (id == idToFind) {
            return i;
        }
    }
    return -1; // not found
}



//////////////////// TOUCH START ////////////////////////////////////////////////////////////////////////
function handleStart(evt) {
    evt.preventDefault();
    if (!isTouched) { 
        curve = new Curve();
        isTouched = true;
        timeStart = Math.floor(evt.timeStamp);
        var el = document.getElementById(canv);
        var ctx = el.getContext("2d");
        var touches = evt.changedTouches;
        erase();
        var i = 0; // take first touch       
        //  for (var i=0; i<touches.length; i++) {
        ongoingTouches.push(touches[i]);
        //curve.push(touches[i]);

        var color = colorForTouch(touches[i]);
        ctx.fillStyle = color;
        ctx.fillRect(touches[i].pageX - 2, touches[i].pageY - 2, 4, 4);
        
        curve.curveWrite(touches[i].pageX,touches[i].pageY,0,evt.timeStamp-timeStart);
    //    }
    }
}

//////////////////////// TOUCH MOVE //////////////////////////////////////////////////////////////////////
function handleMove(evt) {
    evt.preventDefault();
    var el = document.getElementById(canv);
    var ctx = el.getContext("2d");
    var touches = evt.changedTouches;
    ctx.lineWidth = 4;
    var i = 0;
    //for (var i=0; i<touches.length; i++) {
    var color = colorForTouch(touches[i]);
    var idx = ongoingTouchIndexById(touches[i].identifier);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    ctx.moveTo(ongoingTouches[idx].pageX, ongoingTouches[idx].pageY);
    ctx.lineTo(touches[i].pageX, touches[i].pageY);
    ctx.closePath();
    ctx.stroke();

    ongoingTouches.splice(idx, 1, touches[i]); // swap in the new touch record

    curve.curveWrite(touches[i].pageX,touches[i].pageY,0,evt.timeStamp-timeStart);

        //}
}

////////////////////// TOUCH END //////////////////////////////////////////////////////////////////////////
function handleEnd(evt) {
    //  alert(ongoingTouches[1].pageX);
    //    sendOscMsg(ongoingTouches.pageX);
    evt.preventDefault();
    var el = document.getElementById(canv);
    var ctx = el.getContext("2d");
    var touches = evt.changedTouches;
    var nbTouch = evt.touches.length;

    if (nbTouch <1) {
        ctx.lineWidth = 4;
        var i = 0;
        //for (var i=0; i<touches.length; i++) {
        var color = colorForTouch(touches[i]);
        var idx = ongoingTouchIndexById(touches[i].identifier);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(ongoingTouches[i].pageX, ongoingTouches[i].pageY);
        ctx.lineTo(touches[i].pageX, touches[i].pageY);
        ctx.closePath();
        ongoingTouches.splice(i, 1); // remove it; we're done

        curve.curveWrite(touches[i].pageX,touches[i].pageY,0,evt.timeStamp-timeStart);
        //}

        sendOscMsg(curve.Collect());

        //curve = new Curve();
        isTouched = false;
    }
}

function handleCancel(evt) {
    evt.preventDefault();
    var touches = evt.changedTouches;
    var i = 0;
    //for (var i=0; i<touches.length; i++) {
    ongoingTouches.splice(i, 1); // remove it; we're done       
    //}
    sendOscMsg(curve.Collect());
//    curve = new Curve();
    isTouched = false;
}



//////////////////////////// CANVAS ////////////////////////////////////////////////////////////////////////////////
function erase() {
    //if (confirm("Do you want to erase the curve ?")) {
    var el = document.getElementById(canv);
    var ctx = el.getContext("2d");
    ctx.clearRect(0, 0, el.width, el.height);
}

function plotAxis() {
    var el = document.getElementById("canvasAxis");
    var ctx = el.getContext("2d");
    ctx.clearRect(0, 0, el.width, el.height);
    
    var ecart = 20*scaleFactor;
    
    ctx.beginPath();
    ctx.strokeStyle = '#F00';
    ctx.lineWidth = 0.3;


    for (var h=ecart ; h<Math.floor(el.width/2); h=h+ ecart) {
        ctx.moveTo(Math.floor(el.width/2)+ h, 0);
        ctx.lineTo(Math.floor(el.width/2)+ h, el.height); 
        ctx.moveTo(Math.floor(el.width/2)- h, 0);
        ctx.lineTo(Math.floor(el.width/2)- h, el.height);       
    }
    
    for (var h=ecart ; h<Math.floor(el.height/2); h=h+ ecart) {
        ctx.moveTo(0, Math.floor(el.height/2)+ h);
        ctx.lineTo(el.width, Math.floor(el.height/2)+ h); 
        ctx.moveTo(0, Math.floor(el.height/2)- h);
        ctx.lineTo(el.width, Math.floor(el.height/2)- h);       
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
    
    for (var i=0; i<10; i++) {
        ctx.fillText(i+1,(0.5+i)*el.width+0.25*scaleFactor*el.width,0.52*el.height); /// TODO !! BUT : créer un zoom in zoom out
    }
}

function zoom(factor) {
    //var el = document.getElementById(canv);
    //var ctx = el.getContext("2d");
    //ctx.scale(factor,factor);
    erase();
    scaleFactor = scaleFactor*factor;
    plotAxis();
    curve.curvePlot();  
}



//////////////////////// ON LOAD ////////////////////////////////////////////////////////////////////////////////////
function startup() {
    var el = document.getElementById(canv);
    el.addEventListener("touchstart", handleStart, false);
    el.addEventListener("touchend", handleEnd, false);
    el.addEventListener("touchcancel", handleCancel, false);
    el.addEventListener("touchleave", handleEnd, false);
    el.addEventListener("touchmove", handleMove, false);
    erase();
    plotAxis();
}



/////////////////////////  CURVE Object and Methods /////////////////////////////////////////////////////////////////

function Curve() {
    this.X = new Array;
    this.Y = new Array;
    this.Z = new Array;
    this.t = new Array;     
    
    this.curveWrite = function(x,y,z,t) {
        var el = document.getElementById(canv);
        var ctx = el.getContext("2d");
        this.X.push( (x - (el.width / 2)) / (el.width * scaleFactor / 2));
        this.Y.push(- (y - (el.height / 2)) / (el.height * scaleFactor / 2));
        this.Z.push(z/scaleFactor);
        this.t.push(Math.floor(t));  
    };
    
    this.SpaceScale = function(factor) {
        this.X = factor*this.X;
        this.Y = factor*this.Y;
        this.Z = factor*this.Z;
    };
    
    this.TimeScale = function(factor) {
        this.t = factor*this.t;
    };
    
    this.Collect = function() { 
        var oscCurve = [];
        for (var i=0; i<this.X.length;i++) {
            oscCurve.push(this.X[i]);
            oscCurve.push(this.Y[i]);
            oscCurve.push(this.Z[i]);
            oscCurve.push(this.t[i]);
        }
        return oscCurve;
    };
    
    this.curvePlot = function() {
        var el = document.getElementById(canv);
        var ctx = el.getContext("2d");   
        ctx.clearRect(0, 0, el.width, el.height);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(Math.floor(this.X[i]*(el.width/2)*scaleFactor+el.width/2), -Math.floor(this.Y[i]*(el.height/2)*scaleFactor-el.height/ 2));        
        for (var i=1; i<this.X.length;i++) {
            ctx.lineTo(Math.floor(this.X[i]*(el.width/2)*scaleFactor+el.width/2), -Math.floor(this.Y[i]*(el.height/2)*scaleFactor-el.height/ 2));
        }
        ctx.stroke();
        ctx.closePath();
    };

}



////////////////////////// OSC ////////////////////////////////////////////////////////////////////////////////////
function sendOscMsg(msg) {
    var host = document.getElementById("host").value;
    var port = document.getElementById("port").value;
    var address = document.getElementById("address").value;

    var sender = new OSCSender(host, port);
    sender.send(address, msg, null, null);
    sender.close();
    //alert("Message sent to \n" +
    //    host + " " + port + "\n" + address + " " + data);
}
