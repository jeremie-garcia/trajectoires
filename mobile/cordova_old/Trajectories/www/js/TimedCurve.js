//////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////  CURVE Object and Methods //////////////////////////////////////////////////////

function TimedCurve(col, parent) {
    this.X = [];
    this.Y = [];
    this.Z = [];
    this.t = [];
    this.color = col || 'black';
    this.isPlaying = false;
    this.playTime = 0;
    this.sourceNumber = Number(1);
    this.timers = [];

    // write points into currentCurve object
    this.addTimedPoint = function (x, y, z, t) {
        this.X.push(x);
        this.Y.push(y);
        this.Z.push(z);
        this.t.push(Math.floor(t));

    };

    this.spaceScale = function (factor) {
        for (var k = 0; k < this.X.length; k++) {
            this.X[k] = factor * this.X[k];
            this.Y[k] = factor * this.Y[k];
            this.Z[k] = factor * this.Z[k];
        }
    };

    this.timeScale = function (factor) {
        for (var k = 0; k < this.X.length; k++) {
            this.t[k] = factor * this.t[k];
        }
    };

    // arrange the curve for osc sending
    this.getAllTimedPoints = function () {
        var allpoints = [];
        for (var i = 0; i < this.X.length; i++) {
            oscCurve.push(this.X[i]);
            oscCurve.push(this.Y[i]);
            oscCurve.push(this.Z[i]);
            oscCurve.push(this.t[i]);
        }
        return allpoints;
    };

    this.replayCurvePoint = function (index) {
        this.playTime = this.t[index];
        streamCurvePoint(this, index);
        dyn_repaint();
    };

    this.play = function () {
        if (this.isPlaying)
            this.stop();
        this.playTime = 0;
        this.isPlaying = true;

        for (var i = 0; i < this.X.length; i++) {
            var del = this.t[i];
            this.timers.push(setTimeout(this.replayCurvePoint(i), del)); // don't stream the point after time del. Seems to work with bind method (need to clearely define the 'this'-trajectories[currentCurveIndex]- object as the fisrt argument)
            // this.timers.push(setTimeout(this.replayCurvePoint.bind(trajectories[currentCurveIndex],i), del)); 
        }
    };

    this.isPlaying = function () {
        return this.isPlaying;
    };

    this.stop = function () {
        for (key in this.timers) {
            clearTimeout(this.timers[key]);
        }
        this.timers = [];
        this.isPlaying = false;
    };

    this.clone = function () {
        var clone = new TimedCurve();
        clone.X = this.X;
        clone.Y = this.Y;
        clone.Z = this.Z;
        clone.t = this.t;
        clone.color = this.color;
        clone.sourceNumber = this.sourceNumber;
        return clone;
    };
}

//OSC Methods
function streamCurveLastPoint(curve) {
    var last_index = curve.X.length - 1;
    streamCurvePoint(curve, last_index);
}

function streamCurvePoint(curve, index) {
    osc_sendPosxyzMsg([curve.sourceNumber, curve.X[index], curve.Y[index], curve.Z[index]]);
}

function sendCurveOSC(curve, id) {
    var oscPoint;
    for (var i = 0; i < curve.X.length; i++) {
        oscPoint = [];
        oscPoint.push(id);
        oscPoint.push(curve.X[i]);
        oscPoint.push(curve.Y[i]);
        oscPoint.push(curve.Z[i]);
        oscPoint.push(curve.t[i]);
        osc_sendTrajPoint(oscPoint);
    }
}