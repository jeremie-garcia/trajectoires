
Trajectoires.Utils = {

    ongoingTouchIndexById : function(idToFind) {
        var i = 0, id;
        for (i = 0; i < Trajectoires.View.ongoingTouches.length; i++) {
            id = Trajectoires.View.ongoingTouches[i].identifier;

            if (id === idToFind) {
                return i;
            }
        }
        return -1; // not found
    },

    //WARNING : SHOULD NOT ALTER THE EVT OBJ
    event2CanvasPos : function(evt) {
        var rel = [];
        rel[0] = evt.pageX - Trajectoires.View.dyn_canvas.offsetLeft;
        rel[1] = evt.pageY - Trajectoires.View.dyn_canvas.offsetTop;
        return rel;
    },

    //UnitConverter WARNING : SHOULD NOT ALTER THE COORDS ARRAY
    convertCanvasPosIntoUnits : function(coords) {
        var res = [];
        var h = Number(Trajectoires.View.traj_canvas.height);
        var w = Number(Trajectoires.View.traj_canvas.width);
        res[1] = h - coords[1];
        res[0] = (coords[0] - (w / 2)) * Trajectoires.View.pixToValue;
        res[1] = (res[1] - (h / 2)) * Trajectoires.View.pixToValue;
        return res;
    },

    //todo
    convertUnitsIntoCanvasPos : function(coords) {
        var res = [];
        var h = Number(Trajectoires.View.traj_canvas.height);
        var w = Number(Trajectoires.View.traj_canvas.width);
        res[0] = coords[0] * (1 / Trajectoires.View.pixToValue) + (w / 2);
        res[1] = coords[1] * (1 / Trajectoires.View.pixToValue) + (h / 2);
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
        console.log(distance)
        if (distance < 1 ) {//seuil
            if (lengthLine < distanceToPoint0 || lengthLine < distanceToPoint1) {
                console.log('false')
                return false;
            } else {
                console.log('true')
                return true;
            }
        } else { return false;}
    },

    getColorForIndex : function(idx) {
        return Trajectoires.View.default_colors[(idx + Trajectoires.View.default_colors.length) % Trajectoires.View.default_colors.length];
    },
    getColorSource : function(source) {
        return Trajectoires.View.default_colors[(source-1)%Trajectoires.View.default_colors.length];
    },

    distanceBtwPoints : function(p1, p2) {
        var dx = p1[0] - p2[0];
        var dy = p1[1] - p2[1];
        return Math.sqrt(dx * dx + dy * dy);
    },

    // weirdDistanceBtwPoints : function(p1,p2) {
    //     var dx = p1[0] - p2[0];
    //     var dy = p1[1] - p2[1];
    //     return (dx + dy)/4;
    // },

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

    findPointsIdx : function(maxTime,lastPoint,curve) {
        var timeSearch = curve.t[lastPoint],
            pointIdx = lastPoint,
            pointsIdx = [];
        while (timeSearch < maxTime) {
            pointIdx = pointIdx+1;
            timeSearch = curve.t[pointIdx];
        }
        var nbPoints = pointIdx-1 - lastPoint;
        var points = 0;
        for (points=1; points<nbPoints+1;points++){
            pointsIdx.push(lastPoint+points);
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

    interpolate : function(now,curve,lastPoint) {
        if (typeof(lastPoint) == 'undefined') {
            var lastPoint = Trajectoires.Utils.findPointIdx(now,curve); 
        }

            var lastTime = curve.t[lastPoint],
                nextTime = 0;
            if (curve.t[lastPoint+1]!==undefined) {
                nextTime = curve.t[lastPoint+1] 
                var diffTime = nextTime - lastTime;
                var x = curve.X[lastPoint]*(nextTime-now)/diffTime + curve.X[lastPoint+1]*(now-lastTime)/diffTime;
                var y = curve.Y[lastPoint]*(nextTime-now)/diffTime + curve.Y[lastPoint+1]*(now-lastTime)/diffTime;
                var z = curve.Z[lastPoint]*(nextTime-now)/diffTime + curve.Z[lastPoint+1]*(now-lastTime)/diffTime;
            } else {
                var x = curve.X[lastPoint];
                var y = curve.Y[lastPoint];
                var z = curve.Z[lastPoint];
            }
        
            var pointCoord = [];
            pointCoord.push(curve.sourceNumber);
            pointCoord.push(x);
            pointCoord.push(y);
            pointCoord.push(z);
            pointCoord.push(now);

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


    getDistanceCurveFromTouch : function(curve,pos) {
        var distance = Infinity;
        var minDistance = Infinity;
        for (var k=0;k<curve.X.length;k++) {
            distance = this.distanceBtwPoints([curve.X[k],curve.Y[k]],pos)
            if (distance<minDistance) {
                minDistance = distance;
            }
        }
        return minDistance;
    },

    getClosestCurveFromTouch : function(pos) {
        var trajectories = Trajectoires.TrajManager.trajectories;
        var curve = {};
        var minDistance = Infinity;
        var distance = 0;
        var index = null;
        for (var k = 0 ; k<trajectories.length;k++) {
            curve = trajectories[k];
            distance = this.getDistanceCurveFromTouch(curve,pos);
            if (distance < minDistance){
                minDistance = distance;
                index = k;
            }
        }
        return index;
    },

    removeDoublon : function(a) {
        return a.sort().filter(function(item, pos, ary) {
            return !pos || item != ary[pos - 1];
        })
    },



};