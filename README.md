<img src="docs/app-icon.png" align="right" width=200>

# Trajectoires

**WebOSCBridge Application Server**

© Ircam UMR 9912 STMS, 2014-2015
Xavier Favory, Jérémie Garcia, Jean Bresson


Trajectoires is a mobile application that allows drawing sound sources trajectories.
The trajectories remotely control any spatial audio renderer using the OpenSoundControl protocol.

We are investigating the new possibilities offered by mobile devices such as smartphones and tablets to support sound spatialization control by composers. This project aims at combining gestural input with touch input to draw trajectories and the sensors integrated such as accelerometers and gyroscope to compute orientation with algorithmic processes in Max or OpenMusic.


This project is designed as a desktop application running a server for spatialization control interfaces.
This project is an adaption of the [interface.js][interfacejs] project by Charlie Roberts and modified.


### Getting Started 

You need to download and launch the desktop app first (see [releases](https://github.com/j-bresson/trajectoires/releases)).
Then visit the web page displayed by the app with your browser or any mobile device to start the application.
Note that your mobile device and your computer need to be on the same network.

=> Once the application is launched, you can use any OSC-enabled application or start with our example patches for Max and OpenMusic.


### Build from source
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





### See also:

* X. Favory, J. Garcia, J. Bresson. [Trajectoires : une application mobile pour le contrôle et l'écriture de la spatialisation sonore](https://hal.archives-ouvertes.fr/hal-01218595). Conférence francophone sur l'Interaction Homme-Machine (IHM'15), Toulouse, France, 2015.

* J. Garcia, J. Bresson, M. Schumacher, T. Carpentier, X. Favory. [Tools and Applications for Interactive-Algorithmic Control of Sound Spatialization in OpenMusic](https://hal.inria.fr/hal-01226263). inSONIC2015, Aesthetics of Spatial Audio in Sound, Music and Sound Art, Karlsruhe, Germany, 2015.

* J. Garcia, X. Favory, J. Bresson. [Trajectoires: a Mobile Application for Controlling Sound Spatialization](https://hal.inria.fr/hal-01285852) CHI EA'16: ACM Extended Abstracts on Human Factors in Computing Systems. San Jose, USA, 2016.

Alternative repository: http://gitlab.doc.gold.ac.uk/jgarc012/Trajectoires

### Acknowledgements

This project was developed with support of the French National Research Agency Labex SMART (ANR-11-LABX-65) and EFFICACe project (ANR-13-JS02-0004-01). 

We are grateful to Eric Daubresse and all the composers that helped us designing and developing the application.
The application is build upon [Interface.JS](http://www.charlie-roberts.com/interface/), a work done by [Charlie Roberts](http://www.charlie-roberts.com/).

