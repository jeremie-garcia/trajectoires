# Trajectoires

**WebOSCBridge Application Server**

© Ircam UMR 9912 STMS, 2014-2015
Xavier Favory, Jérémie Garcia, Jean Bresson


This project is designed as a desktop application running a server for spatialization control interfaces.
This project is an adaption of the [interface.js][interfacejs] project by Charlie Roberts and modified.


###### Build from source
If you want to build the server from source you'll need to download and install [node.js][nodejs]. After installing Node.js, open a terminal and run the following commands:

```
npm install
npm install gulp -g
gulp traj
```

This will build releases of the application.
You can configure the release in the gulpfile.js file.

[nodejs]:http://nodejs.org
[npm]:http://nodejs.org/download/
[node-webkit]:https://github.com/rogerwang/node-webkit#downloads
[interfacejs]:https://github.com/charlieroberts/interface.js





##### See also:

* X. Favory, J. Garcia, J. Bresson. [Trajectoires : une application mobile pour le contrôle et l'écriture de la spatialisation sonore](https://hal.archives-ouvertes.fr/hal-01218595). Conférence francophone sur l'Interaction Homme-Machine (IHM'15), Toulouse, France, 2015.

* J. Garcia, X. Favory, J. Bresson. [Trajectoires: a Mobile Application for Controlling Sound Spatialization](https://hal.inria.fr/hal-01285852) CHI EA'16: ACM Extended Abstracts on Human Factors in Computing Systems. San Jose, USA, 2016.

##### Acknowledgements

This project was developed with support of the French National Research Agency Labex SMART (ANR-11-LABX-65) and EFFICACe project (ANR-13-JS02-0004-01). 
