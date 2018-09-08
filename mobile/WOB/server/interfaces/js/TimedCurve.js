//////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////  CURVE Object and Methods //////////////////////////////////////////////////////

function TimedCurve(source) {
    this.X = [];
    this.Y = [];
    this.Z = [];
    this.t = [];
    this.color = Trajectoires.Utils.getColorSource(source) || Trajectoires.Utils.getColorSource(1);
    this.sourceNumber = source || Number(1);
    this.multiPlay = true;
    // this.xScale = 1;
    // this.yScale = 1;
    // this.zScale = 1;

}

TimedCurve.prototype.changeSource = function(source) {
    this.sourceNumber = Number(source);
    this.color = Trajectoires.Utils.getColorSource(source);
    var index = Trajectoires.TrajManager.trajectories.indexOf(this);
    Trajectoires.TrajManager.multiPlayChanged(index)
}


// write points into currentCurve object
TimedCurve.prototype.addTimedPoint = function (x, y, z, t) {
    this.X.push(x);
    this.Y.push(y);
    this.Z.push(z);
    this.t.push(Math.floor(t));
}

// TimedCurve.prototype.addTimedPointMiddle = function(x,y,z,t) {
//     var range = Trajectoires.EventManager.getSliderValue();
//     var lastPoint = Trajectoires.Utils.findPointIdx(range[0],this); 

// }

TimedCurve.prototype.spaceScale = function (factor) {
    for (var k = 0; k < this.X.length; k++) {
        this.X[k] = factor * this.X[k];
        this.Y[k] = factor * this.Y[k];
        this.Z[k] = factor * this.Z[k];
    }
}
TimedCurve.prototype.sapceScaleAxis = function(factor,vectorAxis,pointAxis) {
    var point = [],
        distance =0,
        dirVector =[],
        projectedPoint = [];
    for (var k=0; k<this.X.length;k++) {
        point = [this.X[k],this.Y[k]];
        projectedPoint = Trajectoires.Utils.getProjectedPoint(point,vectorAxis,pointAxis);
        dirVector = Trajectoires.Utils.getDirVector(point,projectedPoint);      
        distance =  Math.sqrt(Math.pow(point[0]-projectedPoint[0],2) + Math.pow(point[1]-projectedPoint[1],2));
        this.X[k] = projectedPoint[0] + distance * factor * dirVector[0];
        this.Y[k] = projectedPoint[1] + distance * factor * dirVector[1];
    }
}

TimedCurve.prototype.sapceScaleAxisRange = function(factor,vectorAxis,pointAxis,pointsLine) {
        var point = [],
            distance =0,
            dirVector =[],
            factorRange = 1;
            projectedPoint = [];
    for (var k=0; k<this.X.length;k++) {
        point = [this.X[k],this.Y[k]];
        projectedPoint = Trajectoires.Utils.getProjectedPoint(point,vectorAxis,pointAxis);
        if (Trajectoires.Utils.isPointNearLine(point,pointsLine)) {
            dirVector = Trajectoires.Utils.getDirVector(point,projectedPoint);      
            distance =  Math.sqrt(Math.pow(point[0]-projectedPoint[0],2) + Math.pow(point[1]-projectedPoint[1],2));
            this.X[k] = projectedPoint[0] + distance * factor * dirVector[0];
            this.Y[k] = projectedPoint[1] + distance * factor * dirVector[1];
        }
    }

}


TimedCurve.prototype.timeScale = function (factor) {
    for (var k = 0; k < this.X.length; k++) {
        this.t[k] = Math.floor(factor * this.t[k]);
    }
}

TimedCurve.prototype.changeTotalTime = function(time) {
    if (time == 0) {return;}
    var rapport =  time / this.lengthTime();
    this.timeScale(rapport);
}


TimedCurve.prototype.changeXScale = function(factor) {
    for (var k=0; k<this.X.length;k++) {
        this.X[k] = factor * this.X[k];
    }
    // this.xScale = this.xScale*factor;
}
TimedCurve.prototype.changeYScale = function(factor) {
    for (var k=0; k<this.X.length;k++) {
        this.Y[k] = factor * this.Y[k];
    }
}
TimedCurve.prototype.changeZScale = function(factor) {
    for (var k=0; k<this.X.length;k++) {
        this.Z[k] = factor * this.Z[k];
    }
}

TimedCurve.prototype.xMiror = function() {
    for (var k=0; k< this.Y.length; k++) {
        this.Y[k] = - this.Y[k];
    }
}

TimedCurve.prototype.yMiror = function() {
    for (var k=0; k< this.X.length; k++) {
        this.X[k] = - this.X[k];
    }
}

TimedCurve.prototype.zMiror = function() {
    for (var k=0; k< this.Z.length; k++) {
        this.Z[k] = - this.Z[k];
    }
}

TimedCurve.prototype.tMiror = function() {
    var totalTime = this.lengthTime(),
        oldCurve = this.clone(),
        length = this.t.length-1;
    for (var k=0; k<this.t.length;k++) {
        this.t[k] = totalTime - oldCurve.t[length-k];
        this.X[k] = oldCurve.X[length-k];
        this.Y[k] = oldCurve.Y[length-k];
        this.Z[k] = oldCurve.Z[length-k];
    }
}


TimedCurve.prototype.translate = function(x,y,z) {
    var actualX = this.X[0];
    var actualY = this.Y[0];
    var actualZ = this.Z[0];
    for (var k=0;k<this.X.length;k++) {
        this.X[k] = this.X[k] - actualX + x;
        this.Y[k] = this.Y[k] - actualY + y;
        this.Z[k] = this.Z[k] - actualZ + z;
    }
}

TimedCurve.prototype.rotate = function(center,angle) {
    var newXY,
        X,
        Y;
    for (var k=0;k<this.X.length;k++) {
        X = this.X[k];
        Y = this.Y[k];
        newXY = Trajectoires.Utils.rotate(center[0],center[1],X,Y,angle);
        this.X[k] = newXY[0];
        this.Y[k] = newXY[1];
    }
}


    // arrange the curve for osc sending
TimedCurve.prototype.getAllTimedPoints = function () {
        var allpoints = [];
        for (var i = 0; i < this.X.length; i++) {
            oscCurve.push(this.X[i]);
            oscCurve.push(this.Y[i]);
            oscCurve.push(this.Z[i]);
            oscCurve.push(this.t[i]);
        }
        return allpoints;
    }



TimedCurve.prototype.clone = function () {
    var clone = jQuery.extend(true, {}, this)
    return clone;
}

TimedCurve.prototype.cloneNoPoints = function() {
    var clone = new TimedCurve();
    clone.color = this.color;
    clone.sourceNumber = this.sourceNumber;
    return clone;
}


TimedCurve.prototype.lengthTime = function() {
    var lengt = this.X.length-1;
    var time = this.t[lengt];
    return time;
}


