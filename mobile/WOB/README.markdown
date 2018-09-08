#Using WebOSCBridge Application Server

This project is designed as a desktop application running a server for spatialization control interfaces.
This project is an adaption of the [interface.js][interfacejs] project by Charlie Roberts and modified.


##Build from source
If you want to build the server from source you'll need to download and install [node.js][nodejs]. After installing Node.js, open a terminal and run the following commands:

```
npm install
npm install gulp -g
gulp nw
```

This will build releases of the application.
You can configure the release in the gulpfile.js file.

[nodejs]:http://nodejs.org
[npm]:http://nodejs.org/download/
[node-webkit]:https://github.com/rogerwang/node-webkit#downloads
[interfacejs]:https://github.com/charlieroberts/interface.js
