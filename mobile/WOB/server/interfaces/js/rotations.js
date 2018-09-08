var logging = true;
var onmobile = false;

var app = {
    // Application Constructor
    initialize: function () {

        if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/)) {
            onmobile = true;
            this.initFastClick();
        } else {

            //code specific to browser
        }

        if(window.DeviceMotionEvent){
            window.addEventListener("devicemotion", motion, false);
        }else{
            alert("DeviceMotionEvent is not supported");
        }


        if(window.DeviceOrientationEvent){
          window.addEventListener("deviceorientation", orientation, false);
      }else{
          alert("DeviceOrientationEvent is not supported");
      }

  },

  initFastClick: function () {
    window.addEventListener('load', function () {
        FastClick.attach(document.body);
    }, false);
},
};


function motion(event){
  Trajectoires.OSC.sendMessage("/Accelerometer", [event.accelerationIncludingGravity.x, event.accelerationIncludingGravity.y, event.accelerationIncludingGravity.z]);
}

function orientation(event){
    Trajectoires.OSC.sendMessage("/Magnetometer", [event.alpha , event.beta, event.gamma]);
    );
}