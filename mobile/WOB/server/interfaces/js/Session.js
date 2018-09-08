
////////////////////////////////////////////////////////////
/////////////////////// SESSION ///////////////////////////
Trajectoires.Session = {

    lblCurrentSession : {},
    currentSession : {},
    traj_dict : [],
    playedCurves : [],

    saveTrajSession : function(){  
        var idx = this.currentSession;
        this.traj_dict[idx] = Trajectoires.TrajManager.trajectories;
        this.playedCurves[idx] = Trajectoires.TrajManager.playedCurves;
        localStorage.trajectories = JSON.stringify(this.traj_dict);
        localStorage.playedCurves = JSON.stringify(this.playedCurves);
    },

    appendTrajSession : function(){
        Trajectoires.Session.saveTrajSession(this.traj_dict.length);
        alert("Session Saved with ID " + (this.traj_dict.length - 1));
    },

  /*  loadTrajSession : function(idx){
        trajectories = this.traj_dict[idx];
        Trajectoires.View.repaintAll();
    },
*/
    loadTrajSession : function(idx){
        var newTrajectories = this.traj_dict[idx];
        Trajectoires.TrajManager.trajectories = [];
        var newCurve = {};
        for (var i = 0; i < newTrajectories.length; i++) {
            newCurve = new TimedCurve(newTrajectories[i].sourceNumber);
            for (var j = 0; j < this.traj_dict[idx][i].X.length; j++) {
                newCurve.addTimedPoint(newTrajectories[i].X[j],newTrajectories[i].Y[j],newTrajectories[i].Z[j],newTrajectories[i].t[j]);
            }
            newCurve.sourceNumber =  newTrajectories[i].sourceNumber;
            newCurve.multiPlay = newTrajectories[i].multiPlay;
            Trajectoires.TrajManager.trajectories.push(newCurve);
        }
        Trajectoires.TrajManager.playedCurves = (this.playedCurves == []) ? [] : this.playedCurves[idx];
        Trajectoires.TrajManager.selectCurve(0);
        Trajectoires.View.repaintAll();
        //Trajectoires.TrajManager.multiPlayChanged();

    },



    loadLastTrajSession : function(){
        if(this.traj_dict.length > 0){
            Trajectoires.Session.loadTrajSession(this.traj_dict.length -1);
        }
    },

    clearTrajSessions : function(){
        localStorage.clear();
    },

    traj_initStorage : function(){
        this.traj_dict = (typeof localStorage.trajectories === 'undefined') ? [] : JSON.parse( localStorage.trajectories );
        this.playedCurves = (typeof localStorage.playedCurves === 'undefined') ? [[]] : JSON.parse( localStorage.playedCurves );
        Trajectoires.Session.loadLastTrajSession();
        this.currentSession = this.traj_dict.length - 1;
        if (this.currentSession<0) {
            this.newSession();
        }
        this.lblCurrentSession = document.getElementById('lblCurrentSession');
        this.updateCurrentSessionLbl();

    },

    selectNextSession : function() {
        this.saveInSelectedSession();
        this.currentSession = (this.currentSession + 1) % this.traj_dict.length;
        this.loadTrajSession(this.currentSession);
        this.updateCurrentSessionLbl();
        this.saveTrajSession();
    },

    selectPreviousSession : function() {
        this.saveInSelectedSession();
        this.currentSession = (this.currentSession - 1 + this.traj_dict.length) % this.traj_dict.length;
        this.loadTrajSession(this.currentSession);
        this.updateCurrentSessionLbl();
        this.saveTrajSession();
    },

    loadSlectedSession : function() {
        this.loadTrajSession(this.currentSession);
    },

    saveInSelectedSession : function() {
        this.traj_dict[this.currentSession] = Trajectoires.TrajManager.trajectories;
        this.playedCurves[this.currentSession] = Trajectoires.TrajManager.playedCurves;
        this.saveTrajSession();
    },

    deleteSelectedSession : function() {
        if (this.traj_dict.length > 1) {
            var keepCurrentSession = this.currentSession;
            this.selectPreviousSession();
            this.traj_dict.splice(keepCurrentSession,1);
            this.playedCurves.splice(keepCurrentSession,1);
            if (this.currentSession > this.traj_dict.length-1) {
                this.currentSession = 0;
            }
            this.updateCurrentSessionLbl(); 
        }
    },

    newSession : function() {
        if (this.traj_dict.length > 0) {
            this.saveInSelectedSession();
        }
        this.traj_dict.push([]);
        this.playedCurves.push([]);
        this.currentSession = this.traj_dict.length-1;
        this.updateCurrentSessionLbl();
        this.loadSlectedSession();
        this.saveTrajSession();
    },

    updateCurrentSessionLbl : function() {
        this.lblCurrentSession.innerHTML = 'Session ' + Number(this.currentSession+1) + '/' + Number(this.traj_dict.length);
    }

};


////////////////////////////////////////////////////////////
/////////////////////// State (undo) ///////////////////////

Trajectoires.State = {
    historySessions : [],

    newAction : function() { // call it when you want to save the state of the app
        var newState = JSON.stringify(Trajectoires.TrajManager.trajectories);
        this.historySessions.unshift(newState);
        var length = this.historySessions.length;
        if (length>10) {
            this.historySessions = this.historySessions.splice(10,length-10);
        }
    },

    undo : function() { // load previous state saved. Problem : if you change the session and then press undo, you get all the curves from the last session...
        if (this.historySessions.length>0) {
            Trajectoires.TrajManager.trajectories = [];
            var lastState = JSON.parse(this.historySessions[0]);
            var newCurve = {};
            for (var i = 0; i < lastState.length; i++) {
                newCurve = new TimedCurve(lastState[i].sourceNumber);
                for (var j = 0; j < lastState[i].X.length; j++) {
                    newCurve.addTimedPoint(lastState[i].X[j],lastState[i].Y[j],lastState[i].Z[j],lastState[i].t[j]);
                }
                Trajectoires.TrajManager.trajectories.push(newCurve);
            }
            Trajectoires.TrajManager.selectCurve(0);
            Trajectoires.View.repaintAll();
            this.historySessions.splice(0,1);
        }
    },
};


