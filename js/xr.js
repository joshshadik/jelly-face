"use strict";

var xrDevice = null;
var xrCanvas = null;
var xrContext = null;
var xrSession = null;

function initXR()
{
    console.log("calling initXR");
    if (navigator.xr && XRSession.prototype.requestHitTest) {
        console.log("navigator has xr and has requestHitTest");
        try {
            navigator.xr.requestDevice().then(device => {
                xrDevice = device;
                console.log("got a device!");
                console.log(xrDevice);

                xrCanvas = document.createElement('canvas');
                console.log(xrCanvas);

                xrContext = xrCanvas.getContext('xrpresent');
                console.log(xrContext);

                xrDevice.requestSession({
                    outputContext: xrContext,
                    environmentIntegration: true,
                }).then( session => {
                    xrSession = session;
                }).catch(e => {
                    console.log(e);
                });
            });
        } catch (e) {
          return;
        }
      } else {
        return;
    }
  
    //   // We found an XRDevice! Bind a click listener on our "Enter AR" button
    //   // since the spec requires calling `device.requestSession()` within a
    //   // user gesture.
    //   document.querySelector('#enter-ar').addEventListener('click', this.onEnterAR);
}
