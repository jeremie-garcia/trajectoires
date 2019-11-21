/*
* This is the Index file creating the Traj Namespace and Initializaiton functions.
*/

var Traj = {

    logging : false, //if we want to logg data from the users
    onmobile : false, //running on mobile or desktop
    
    // Application Constructor
    initialize: function () {
        if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/)) {
            this.onmobile = true;
            this.initFastClick();
            document.addEventListener("pause", this.onPause, false);
            document.addEventListener("resume", this.onResume, false);
        } else {

        }

        window.addEventListener("beforeunload", function (e) {
            var confirmationMessage = '';

           (e || window.event).returnValue = confirmationMessage; //Gecko + IE
            return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
        });

        //Initializations
        Traj.View.initCanvas(); //Drawing
        Traj.Session.initStorage(); //storage
        Traj.Events.initEvents(); // Events

        //avoid contextual menus on links
        window.oncontextmenu = function(event) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        };

        //called before exiting the window to save the current trajectories in the current session
        window.onbeforeunload = function (e) {
            Traj.Session.saveInSelectedSession();
         };
    },

    //use to improve the touch speed on mobile devices
    initFastClick: function () {
        window.addEventListener('load', function () {
            FastClick.attach(document.body);
        }, false);
    },

    //Events to log the ppause and Resume on mobile platforms
    onPause: function () {
        console.log("On Pause");
    },

    onResume: function () {
        console.log("On Resume");
    },
};
