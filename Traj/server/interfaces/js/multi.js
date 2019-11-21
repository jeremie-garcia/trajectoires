///////////////////////// TRAJ MANAGER ///////////////////////////
Traj.Manager.processClientId  = function(args){
    // do something only if multiuser version
        var id = args[0];
        var total = args[1];
        Traj.View.updateClientIdView(id,total);
        Traj.View.updateSourceButtons(id,total);
};

Traj.View.updateClientIdView = function (id,total){
        var currentCurveLID = document.getElementById('lbl_current_id');
        currentCurveLID.innerHTML = "" + (id+1) + "/" + total;
};

Traj.View.updateSourceButtons = function (id,total){
        var buttons = document.getElementsByClassName('sourceButton');
        if(total ===1){
            Traj.Manager.allowed_indexes = null;
        }else if(total==2){
            if(id===0){
                    Traj.Manager.allowed_indexes = [1,3];
                }else if(id ===1){ //the second has 2 and 4
                    Traj.Manager.allowed_indexes = [2,4];
                }
        }else if(total>2){
                Traj.Manager.allowed_indexes = [id+1];
        }
        
        //update the SourceButtons the buttons accordingly
        for (var k=0;k<buttons.length;k++) {
            //show the ones that may have been swithed of
            buttons[k].style.display = "block";

            if(total==2){
                //the first has 1 and 3
                if(id===0){
                    if(k!=0 && k!=2){
                        buttons[k].style.display = "none";
                    }
                }else if(id===1){
                    if(k!=1 && k!=3){
                        buttons[k].style.display = "none";
                    }
                }

            }else if(total>2){
                //get your own id (max 4) only
                if(k!=id){
                        buttons[k].style.display = "none";
                    }
            }
        }

        Traj.View.repaintAll();
};

