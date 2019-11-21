var logging = true;
var onmobile = false;

var Trajectoires = {
    // Application Constructor
    initialize: function () {
        if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/)) {
            onmobile = true;
            this.initFastClick();
            document.addEventListener("pause", this.onPause, false);
            document.addEventListener("resume", this.onResume, false);
        } else {

            //code specific to browser
        }
        Trajectoires.View.traj_initCanvas();
        

        //storage things
        Trajectoires.Session.traj_initStorage();
        Trajectoires.EventManager.trajInitEvents();

        window.onbeforeunload = function (e) {
            //Trajectoires.Session.appendTrajSession();
            Trajectoires.Session.saveInSelectedSession();
         };

        //Trajectoires.TrajManager.selectCurve(Trajectoires.TrajManager.currentCurveIndex);

    },

    initFastClick: function () {
        window.addEventListener('load', function () {
            FastClick.attach(document.body);
        }, false);
    },
    onPause: function () {
        console.log("On Pause");
    },

    onResume: function () {
        console.log("On Resume");
    },
};
