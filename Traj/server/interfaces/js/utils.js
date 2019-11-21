/*
Utilities for Traj namespace
Convert canvas position to different coordonates systems.
Mathematical utilities for curves processing

*/

Traj.Utils = {

    golden_ratio_conjugate : 0.618033988749895,

    //events utilities for touch/mouse events
    getStartEventName : function(){
        return Traj.onmobile ? 'touchstart' : 'mousedown';
    },

    getMoveEventName : function(){
        return Traj.onmobile ? 'touchmove' : 'mousemove';
    },

    getEndEventName : function(){
        return Traj.onmobile ? 'touchend' : 'mouseup';
    },

    ongoingTouchIndexById : function(idToFind) {
        var i = 0, id;
        for (i = 0; i < Traj.View.ongoingTouches.length; i++) {
            id = Traj.View.ongoingTouches[i].identifier;

            if (id === idToFind) {
                return i;
            }
        }
        return -1; // not found
    },

    //WARNING : SHOULD NOT ALTER THE EVT OBJ
    event2CanvasPos : function(evt) {
        var rel = [];
        rel[0] = evt.pageX - Traj.View.dyn_canvas.offsetLeft;
        rel[1] = evt.pageY - Traj.View.dyn_canvas.offsetTop;
        return rel;
    },

    //UnitConverter WARNING : SHOULD NOT ALTER THE COORDS ARRAY
    convertCanvasPosIntoUnits : function(coords) {
        var res = [];
        var h = Number(Traj.View.traj_canvas.height);
        var w = Number(Traj.View.traj_canvas.width);
        res[1] = h - coords[1];
        res[0] = (coords[0] - (w / 2)) * Traj.View.pixToValue;
        res[1] = (res[1] - (h / 2)) * Traj.View.pixToValue;
        return res;
    },

    convertUnitsIntoCanvasPos : function(coords) {
        var res = [];
        var h = Number(Traj.View.traj_canvas.height);
        var w = Number(Traj.View.traj_canvas.width);
        res[0] = coords[0] * (1 / Traj.View.pixToValue) + (w / 2);
        res[1] = coords[1] * (1 / Traj.View.pixToValue) + (h / 2);
        res[1] = h - res[1];

        res[0] = Math.floor(res[0]);
        res[1] = Math.floor(res[1]);
        return res;
    },

    getDirVector : function(point1,point2) {
        var vector = [point1[0] - point2[0], point1[1] - point2[1]];
        var normVector = Math.sqrt(Math.pow(vector[0],2) + Math.pow(vector[1],2));
        vector[0] = vector[0]/normVector;
        vector[1] = vector[1]/normVector;
        return vector;
    },

    getProjectedPoint : function(point,dirVector,pointVector) {
        // dirVector doit être UNITAIRE !!
        // trouver H projeté orthogonal de A sur la droite passant par (B = pointVector) de vecteur directeur dirVector
        var vectorBA = [point[0]-pointVector[0],point[1]-pointVector[1]];
        var distanceBH = vectorBA[0]*dirVector[0] + vectorBA[1]*dirVector[1];
        var projectedPoint = [pointVector[0] + distanceBH*dirVector[0],pointVector[1] + distanceBH*dirVector[1]];
        return projectedPoint; 
    },

    isPointNearLine : function(point,pointsLine) {
        var dirVector = this.getDirVector(pointsLine[0],pointsLine[1]);
        var projectedPoint = this.getProjectedPoint(point,dirVector,pointsLine[0]);
        var distance = this.distanceBtwPoints(point,projectedPoint);
        var distanceToPoint0 = this.distanceBtwPoints(projectedPoint,pointsLine[0]);
        var distanceToPoint1 = this.distanceBtwPoints(projectedPoint,pointsLine[1]);
        var lengthLine = this.distanceBtwPoints(pointsLine[0],pointsLine[1]);
        if (distance < 1 ) {//seuil
            return (!(lengthLine < distanceToPoint0 || lengthLine < distanceToPoint1));
        } else { 
            return false;
        }
    },

    HSVtoRGB : function (h, s, v) {
        var r, g, b, i, f, p, q, t;
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    },

    rgbToHex : function (rgb) {
        return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
    },

    getColorForIndex : function(idx) {
        return Traj.View.default_colors[(idx + Traj.View.default_colors.length) % Traj.View.default_colors.length];
    },

    getColorSource : function(source) {
        return Traj.View.default_colors[(source-1)%Traj.View.default_colors.length];
    },

    distanceBtwPoints : function(p1, p2) {
        var dx = p1[0] - p2[0];
        var dy = p1[1] - p2[1];
        return Math.sqrt(dx * dx + dy * dy);
    },

    simplifyCurve : function(curve,tolerance) {
        var points = [],
        pt = {};

        for (var k=0;k<curve.X.length;k++) {
            var pt = {};
            pt.x = curve.X[k];
            pt.y = curve.Y[k];
            pt.t = curve.t[k];
            points.push(pt); 

        }           
        var newPoints = simplify(points,tolerance);

        var newCurve = curve.cloneNoPoints();

        for (var k=0;k<newPoints.length;k++) {
            newCurve.addTimedPoint(newPoints[k].x,newPoints[k].y,0,newPoints[k].t);
        }

        return newCurve;
    },

    findPointsIdx : function(maxTime,idx,curve) {
        var timeSearch = curve.t[idx],
        pointIdx = idx,
        pointsIdx = [];
        while (timeSearch < maxTime) {
            pointIdx = pointIdx+1;
            timeSearch = curve.t[pointIdx];
        }
        var nbPoints = pointIdx-1 - idx;
        var points = 0;
        for (points=1; points<nbPoints+1;points++){
            pointsIdx.push(idx+points);
        }
        return pointsIdx;
    }, 

    findPointIdx : function(time,curve) {
        var timeSearch = 0,
        pointIdx = 0;
        while (timeSearch <= time ) {
            pointIdx = pointIdx+1;
            timeSearch = curve.t[pointIdx];
        }
        if (pointIdx>0) {
            return pointIdx-1;
        } else {
            return pointIdx;
        }
    },

    //returns an array with [x,y,z,t,[alpha,beta,gamma]]
    interpolate : function(now,curve,idx) {
        if(typeof(idx)=="undefined"){
            var idx = Traj.Utils.findPointIdx(now,curve);
        }
        var lastTime = curve.t[idx],
            nextTime = 0,
            orientation = [0,0,0],
            x, y, z;

        //process orientation find previous and next orientation if it is defined
        if(curve.hasOrientation()){
            var prev_orientation = curve.orientation[idx],
                prev_orientation_time = curve.t[idx],
                next_orientation = curve.orientation[idx+1],
                next_orientation_time = curve.t[idx+1];

            if(prev_orientation[0]==='undefined'){
                //set value to the previously defined points with orientation and the time
                for (var i = idx-1; i >= 0; i--) {
                    if(curve.orientation[i][0]!=null){
                        prev_orientation = curve.orientation[i];
                        prev_orientation_time = curve.t[i];
                        break;
                    }
                }
            }

            if(typeof(next_orientation) === 'undefined' || next_orientation[0]=='undefined'){
                //set value to the previously defined points with orientation and the time
                for (var j = idx+2; j < curve.orientation.length; j++) {
                    if(curve.orientation[j][0]!='undefined'){
                        next_orientation = curve.orientation[j];
                        next_orientation_time = curve.t[j];
                        break;
                    }
                }
            }

            if(prev_orientation[0]==='undefined'){
                prev_orientation = next_orientation;
                prev_orientation_time = 0;
            }

            if(typeof(next_orientation) == 'undefined' || next_orientation[0]==='undefined'){
                next_orientation = prev_orientation;
                next_orientation_time = curve.t[curve.t.lentgh - 1];
            }

            console.log(prev_orientation + " " + next_orientation);

            var orientation_diffTime = next_orientation_time - prev_orientation_time;
            orientation[0] = prev_orientation[0]*(next_orientation_time-now)/orientation_diffTime 
                            + next_orientation[0]*(now-prev_orientation_time)/orientation_diffTime;
            orientation[1] = prev_orientation[1]*(next_orientation_time-now)/orientation_diffTime 
                            + next_orientation[1]*(now-prev_orientation_time)/orientation_diffTime;
            orientation[2] = prev_orientation[2]*(next_orientation_time-now)/orientation_diffTime 
                            + next_orientation[2]*(now-prev_orientation_time)/orientation_diffTime;

        }

        if (curve.t[idx+1]!==undefined) {
            nextTime = curve.t[idx+1] 
            var diffTime = nextTime - lastTime;
            x = curve.X[idx]*(nextTime-now)/diffTime + curve.X[idx+1]*(now-lastTime)/diffTime;
            y = curve.Y[idx]*(nextTime-now)/diffTime + curve.Y[idx+1]*(now-lastTime)/diffTime;
            z = curve.Z[idx]*(nextTime-now)/diffTime + curve.Z[idx+1]*(now-lastTime)/diffTime;
        } else {
            x = curve.X[idx];
            y = curve.Y[idx];
            z = curve.Z[idx];
        }

        var pointCoord = [];
        pointCoord.push(x);
        pointCoord.push(y);
        pointCoord.push(z);
        pointCoord.push(now)
        pointCoord.push(orientation);

        return pointCoord;
    },

    rotate : function(cx, cy, x, y, angle) {
        var radians = (Math.PI / 180) * angle,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (x - cx)) - (sin * (y - cy)) + cx,
        ny = (sin * (x - cx)) + (cos * (y - cy)) + cy;
        return [nx, ny];
    },

    sign : function(x) {
        return x/Math.abs(x);
    },


    removeDoublon : function(a) {
        return a.sort().filter(function(item, pos, ary) {
            return !pos || item != ary[pos - 1];
        })
    },



};