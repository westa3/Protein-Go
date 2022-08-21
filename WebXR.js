// button to start XR experience
let xrButton = document.getElementById('xr-button');

// to control the xr session
let xrSession = null;

// reference space used within an application
let xrRefSpace = null;

// Canvas OpenGL context used for rendering
let gl = null;

//CHECK USER'S BROWSER FOR XR COMPATIBILITY PART
function checkXR() {
    if (!window.isSecureContext) {
      document.getElementById("warning").innerText = "WebXR unavailable. Please use secure context";
    }
    if (navigator.xr) { // check to see if WebXR is supported
      navigator.xr.addEventListener('devicechange', checkSupportedState);
      checkSupportedState();
    } else {
      document.getElementById("warning").innerText = "WebXR unavailable for this browser";
    }
  }
  function checkSupportedState() {
    navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
      if (supported) {
        xrButton.innerHTML = 'Enter AR';
        xrButton.addEventListener('click', onButtonClicked);
      } else {
        xrButton.innerHTML = 'AR not found';
      }
      xrButton.disabled = !supported;
    });
  }
  
//HOOK UP THE BUTTON THAT WHEN CLICKED WILL START AR SESSION
function onButtonClicked() {
    if (!xrSession) {
        navigator.xr.requestSession('immersive-ar', {
            optionalFeatures: ['dom-overlay'],
            requiredFeatures: ['local'],
            domOverlay: {root: document.getElementById('overlay')}
        }).then(onSessionStarted, onRequestSessionError);
    } else {
      xrSession.end();
    }
  }

//USING LOCAL REFERENCE SPACE
function onSessionStarted(session) {
    xrSession = session;
    xrButton.innerHTML = 'Exit AR';
  
    // Show which type of DOM Overlay got enabled (if any)
    if (session.domOverlayState) {
      document.getElementById('info').innerHTML = 'DOM Overlay type: ' + session.domOverlayState.type;
    }
  
    session.addEventListener('end', onSessionEnded);
    // create a canvas element and WebGL context for rendering
    let canvas = document.createElement('canvas');
    gl = canvas.getContext('webgl', { xrCompatible: true });
    session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });
  
    session.requestReferenceSpace('local').then((refSpace) => {
      xrRefSpace = refSpace;
      // start WebXR rendering loop
      session.requestAnimationFrame(onXRFrame);
    });
  
  }
  
  function onRequestSessionError(ex) {
    document.getElementById('info').innerHTML = "Failed to start AR session.";
  }

//When the session starts, your responsibility is to create an <canvas> element and a WebGL context used to create the XRWebGLLayer. Once that is done, you can start the WebXR loop by requesting the desired reference space and registering onXRFrame callback. To make things consistent, you should also include a callback function to be executed when the session ends
function onSessionEnded(event) {
    xrSession = null;
    xrButton.innerHTML = 'Enter AR';
    document.getElementById('info').innerHTML = '';
    gl = null;
  }

//SESSION LOOP CALLBACK FUNCTION
function onXRFrame(t, frame) {
    let session = frame.session;
    session.requestAnimationFrame(onXRFrame);
    let pose = frame.getViewerPose(xrRefSpace);
    if (!pose) {
      return;
    }
    const pos = pose.transform.position;
    info.innerHTML = `x:${pos.x.toFixed(2)} y:${pos.y.toFixed(2)} z:${pos.z.toFixed(2)}`;
  }

//BROADCASTING HTML
var static = require('node-static');
const https = require('https');
const fs = require('fs');
const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
}
const file = new (static.Server)();
https.createServer(options, function (req, res) {
    req.addListener('end', function () {
        file.serve(req, res);
    }).resume();
}).listen(3000);