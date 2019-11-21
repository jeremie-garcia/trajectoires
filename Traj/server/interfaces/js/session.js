
/*
* This file contains the namesapce Traj.Session to manage storing and retrieving of
* Trajectories. Sessions are stored as JSON files on the local storage.
* Should probably be updated to work in the server side not the client side
*/

Traj.Session = {

    dict : [], //dictionarry object used to manage the sessions
    lblCurrentSession : {}, //name of the current session loaded
    currentSession : {}, //list of current curves in the session

    clearTrajSessions : function(){
        localStorage.clear();
    },

    updateCurrentSessionLbl : function() {
        this.lblCurrentSession.innerHTML = 'Session ' + Number(this.currentSession+1) + '/' + Number(this.dict.length);
    },

    makeTrajectoriesArrayFromDict : function(array){
        var trajectories= [],
        newCurve = {};

        for (var i = 0; i < array.length; i++) {
            newCurve = new TimedCurve(array[i].sourceNumber);

            for (var j = 0; j < array[i].X.length; j++) {
                newCurve.addOrientedTimedPoint(array[i].X[j],
                                               array[i].Y[j],
                                               array[i].Z[j],
                                               array[i].t[j],
                                               array[i].orientation[j]);

            }
            newCurve.sourceNumber =  array[i].sourceNumber;
            trajectories.push(newCurve);
        }
        return trajectories;
    },

    loadTrajSession : function(idx){
        var trajectories = this.makeTrajectoriesArrayFromDict(this.dict[idx]);
        Traj.Manager.setTrajectories(trajectories);
    },

    loadSelectedSession : function() {
        this.loadTrajSession(this.currentSession);
    },

    loadLastTrajSession : function(){
        if(this.dict.length > 0){
            Traj.Session.loadTrajSession(this.dict.length -1);
        }
    },

    saveTrajSession : function(){
        var idx = this.currentSession;
        this.dict[idx] = Traj.Manager.trajectories;
        localStorage.trajectories = JSON.stringify(this.dict);
    },

    saveInSelectedSession : function() {
        this.dict[this.currentSession] = Traj.Manager.trajectories;
        this.saveTrajSession();
    },

    appendTrajSession : function(){
        Traj.Session.saveTrajSession(this.dict.length);
        alert("Session Saved with ID " + (this.dict.length - 1));
    },

    selectNextSession : function() {
        this.saveInSelectedSession();
        this.currentSession = (this.currentSession + 1) % this.dict.length;
        this.loadTrajSession(this.currentSession);
        this.updateCurrentSessionLbl();
        this.saveTrajSession();
    },

    selectPreviousSession : function() {
        this.saveInSelectedSession();
        this.currentSession = (this.currentSession - 1 + this.dict.length) % this.dict.length;
        this.loadTrajSession(this.currentSession);
        this.updateCurrentSessionLbl();
        this.saveTrajSession();
    },

    deleteSelectedSession : function() {
        if (this.dict.length > 1) {
            var keepCurrentSession = this.currentSession;
            this.selectPreviousSession();
            this.dict.splice(keepCurrentSession,1);
            if (this.currentSession > this.dict.length-1) {
                this.currentSession = 0;
            }
            this.updateCurrentSessionLbl();
        }else{
            this.dict = [];
            this.newSession();
        }
    },

    newSession : function() {
        if (this.dict.length > 0) {
            this.saveInSelectedSession();
        }
        this.dict.push([]);
        this.currentSession = this.dict.length-1;
        this.updateCurrentSessionLbl();
        this.loadSelectedSession();
        this.saveTrajSession();
    },


    initStorage : function(){
        //if it exists load from JSON file otherwise create a new one
        this.dict = (typeof localStorage.trajectories === 'undefined') ? [] : JSON.parse( localStorage.trajectories );
        //if it exists load from JSON file otherwise create a new one
        Traj.Session.loadLastTrajSession();
        this.currentSession = this.dict.length - 1;
        if (this.currentSession<0) {
            this.newSession();
        }
        this.lblCurrentSession = document.getElementById('lblCurrentSession');
        this.updateCurrentSessionLbl();
    },


    exportCurrentCurveAsAntescofoNIM : function (){
        var manager = Traj.Manager;
        if(manager.trajectories[manager.currentCurveIndex]){
            Traj.OSC.saveAntescofo(manager.trajectories[manager.currentCurveIndex], manager.currentCurveIndex, Traj.Session.currentSession);
        }
    },

    exportCurrentCurve : function (){
        Traj.Session.exportCurrentCurveAsAntescofoNIM();
        if(Traj.Manager.trajectories[Traj.Manager.currentCurveIndex]){
         if(Traj.Manager.trajectories[Traj.Manager.currentCurveIndex].X.length <1000){
                Traj.OSC.sendCurveSingleMessageOSC(Traj.Manager.trajectories[Traj.Manager.currentCurveIndex], Traj.Manager.currentCurveIndex);
            }else{
                Traj.OSC.sendCurveOSC(Traj.Manager.trajectories[Traj.Manager.currentCurveIndex], Traj.Manager.currentCurveIndex);
            }
        }
        Traj.Session.saveInSelectedSession();
    }
};

