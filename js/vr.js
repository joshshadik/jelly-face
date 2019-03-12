"use strict";

var vrDisplay = null;
var frameData = null;

var vrGamepads = [];
var gPullPressed = [];
var gLockPressed = [];
var gResetPressed = [];

var controllerOffset =[[], []];
var grabPointOffset = [];

var quadMesh = null;

var faceButtonMaterials = [];

var gamepadType = null;

function initVR()
{
    frameData = new VRFrameData();
    navigator.getVRDisplays().then(function (displays) {
        if (displays.length > 0) {
            vrDisplay = displays[displays.length - 1];
            vrDisplay.depthNear = 0.1;
            vrDisplay.depthFar = 1024.0;
            initWebGL(vrDisplay.capabilities.hasExternalDisplay);
            if (vrDisplay.stageParameters &&
                vrDisplay.stageParameters.sizeX > 0 &&
                vrDisplay.stageParameters.sizeZ > 0) {
            }
            window.addEventListener('vrdisplaypresentchange', onVRPresentChange, false);
            window.addEventListener('vrdisplayactivate', onVRRequestPresent, false);
            window.addEventListener('vrdisplaydeactivate', onVRExitPresent, false);
            document.getElementById("vrContainer").hidden = false;
        } else {
            initWebGL(false);
        }
    }, 
    function () {
    });



}

function initGLVR()
{
    quadMesh = new Mesh(quadVertices, quadVertexIndices);

    var vs = Material.createShader(shaders.vs.texturedQuad, gl.VERTEX_SHADER);
    var fs = Material.createShader(shaders.fs.texturedQuad, gl.FRAGMENT_SHADER);

    var self = this;
    var atlasUrl = "./assets/vr_atlas.png";
    if(diaMode)
    {
        atlasUrl = "./assets/vr_atlas_dia.png";
    }
    loadImageFromUrl(atlasUrl, function(tex) {

        var scale = vec3.fromValues(0.05, 0.05, 0.05);
        var rot = quat.create();

        faceButtonMaterials.push( 
            new VRButton(
                vec3.fromValues(-0.15, 0.1, 0.0), rot, scale, 
                quadMesh, tex, new Material(vs, fs), [0, 0, 0.25, 0.25],
                function() { loadFace(0); }, 0.075
        ));

        faceButtonMaterials.push( 
            new VRButton(
                vec3.fromValues(0.0, 0.1, 0.0), rot, scale, 
                quadMesh, tex, new Material(vs, fs), [0.25, 0, 0.25, 0.25],
                function() { loadFace(1); }, 0.075
        ));

        faceButtonMaterials.push( 
            new VRButton(
                vec3.fromValues(0.15, 0.1, 0.0), rot, scale, 
                quadMesh, tex, new Material(vs, fs), [0.5, 0, 0.25, 0.25],
                function() { loadFace(2); }, 0.075
        ));

        faceButtonMaterials.push( 
            new VRButton(
                vec3.fromValues(-0.15, -0.05, 0.0), rot, scale, 
                quadMesh, tex, new Material(vs, fs), [0.75, 0, 0.25, 0.25],
                function() { loadFace(3); }, 0.075
        ));

        faceButtonMaterials.push( 
            new VRButton(
                vec3.fromValues(0.0, -0.05, 0.0), rot, scale, 
                quadMesh, tex, new Material(vs, fs), [0.0, 0.25, 0.25, 0.25],
                function() { loadFace(4); }, 0.075
        ));

        faceButtonMaterials.push( 
            new VRButton(
                vec3.fromValues(0.15, -0.05, 0.0), rot, scale, 
                quadMesh, tex, new Material(vs, fs), [0.25, 0.25, 0.25, 0.25],
                function() { loadFace(5); }, 0.075
        ));

        faceButtonMaterials.push(
            new VRButton(
                vec3.fromValues(0.0, -0.2, 0.0), rot, vec3.fromValues(0.1, 0.05, 0.05), 
                quadMesh, tex, new Material(vs, fs), [0.5, 0.25, 0.5, 0.25],
                null, 0.0 // function() { redirectToSketcfabModel(); }
        ));


        rot = [];
        quat.fromEuler(rot, 0.0, 130.0, 0.0);

        faceButtonMaterials.push(
            new VRButton(
                vec3.fromValues(-0.5, 0.0, 1.25), rot, vec3.fromValues(0.3, 0.15, 0.05), 
                quadMesh, tex, new Material(vs, fs), [0.0, 0.5, 1.0, 0.5],
                null, 0.0 // function() { redirectToSketcfabModel(); }
        ));


        _jellyFace.setVRButtons(faceButtonMaterials);
    })
}

function updateVR()
{
    vrDisplay.getFrameData(frameData);

    vrGamepads = [];
    var gamepads = navigator.getGamepads();

    for (var i = 0; i < gamepads.length; ++i) {
      var gamepad = gamepads[i];
      if (gamepad) {
        if (gamepad.pose || gamepad.displayId)
          vrGamepads.push(gamepad);

        if( !gamepadType )
        {
            var id = gamepad.id;
            if( id.startsWith("Spatial Controller (Spatial Interaction Source)"))
            {
                var rot = quat.create();
                quat.rotateX(rot, rot, -0.3);
                quat.rotateZ(rot, rot, 0.778);
            
                mat4.fromRotationTranslation(controllerOffset[0], rot, vec3.fromValues(-35.0, 10.0, 30));
            
                rot = quat.create();
                quat.rotateX(rot, rot, -0.3);
                quat.rotateZ(rot, rot, -0.778);
            
                mat4.fromRotationTranslation(controllerOffset[1], rot, vec3.fromValues(35.0, 10.0, 30));
            
                grabPointOffset = vec3.fromValues(0.0, 0.0, 0.0);
            }
            else if( id.startsWith("OpenVR Gamepad"))
            {
                var rot = quat.create();
                quat.rotateX(rot, rot, -0.3);
                quat.rotateZ(rot, rot, 0.778);
            
                mat4.fromRotationTranslation(controllerOffset[0], rot, vec3.fromValues(-35.0, 10.0, 110));
            
                rot = quat.create();
                quat.rotateX(rot, rot, -0.3);
                quat.rotateZ(rot, rot, -0.778);
            
                mat4.fromRotationTranslation(controllerOffset[1], rot, vec3.fromValues(35.0, 10.0, 110));
            
                grabPointOffset = vec3.fromValues(0.0, -0.02, 0.055);
            }
            else // going in blind here. only have tested on Windows MR & OpenVR
            {
                var rot = quat.create();
                quat.rotateX(rot, rot, -0.3);
                quat.rotateZ(rot, rot, 0.778);
            
                mat4.fromRotationTranslation(controllerOffset[0], rot, vec3.fromValues(-35.0, 10.0, 30));
            
                rot = quat.create();
                quat.rotateX(rot, rot, -0.3);
                quat.rotateZ(rot, rot, -0.778);
            
                mat4.fromRotationTranslation(controllerOffset[1], rot, vec3.fromValues(35.0, 10.0, 30));
            
                grabPointOffset = vec3.fromValues(0.0, 0.0, 0.0);
            }
        }
      }
    }

    if( !_jellyFace._hands[0].isLeapControlled() )
    {
        
        for( var g = 0; g < vrGamepads.length; ++g )
        {
            var mtx = [];

            if( vrGamepads[g].pose != null && vrGamepads[g].pose.hasPosition && vrGamepads[g].pose.position )
            {
                var pp = vrGamepads[g].pose.position;
                var pos = vec3.fromValues(pp[0], pp[1], pp[2]);
                
                mat4.fromRotationTranslationScale(mtx, vrGamepads[g].pose.orientation, pos, vec3.fromValues(0.001, 0.001, 0.001 ));

                var pressed = false;

                var index = g;

                if( vrGamepads[g].hand == "left" )
                {
                    index = 0;
                }
                else
                {
                    index = 1;
                }

                if( gPullPressed.length <= g )
                {
                    gPullPressed.push(false);
                    gLockPressed.push(false);
                }

                // "OpenVR Gamepad"


                var pullDown = vrGamepads[g].buttons[1].pressed;
                var lockDown = (vrGamepads[g].buttons[3].pressed || vrGamepads[g].buttons[2].pressed);
                var resetDown = vrGamepads[g].buttons[0].pressed || (vrGamepads[g].buttons.length > 4 &&  vrGamepads[g].buttons[4].pressed);

                if( !gPullPressed[g] && pullDown )
                {
                    pressed = true;
                    gPullPressed[g] = true;
                }
                else if ( gPullPressed[g]  && !pullDown)
                {
                    gPullPressed[g] = false;
                    _jellyFace.endToolUse(index);
                }

                if(!gLockPressed[g] && lockDown )
                {
                    gLockPressed[g] = true;
                    _jellyFace.copyPosToDesired();
                }
                else if( gLockPressed && !lockDown )
                {
                    gLockPressed[g] = false;
                }

                if( !gResetPressed[g] && resetDown )
                {
                    setupVRScene();
                    _jellyFace.resetPositionData(true);
                    _jellyFace.resetJiggleSound(1.5);
                    gResetPressed[g] = true;
                }
                else if( gResetPressed[g] && !resetDown)
                {
                    gResetPressed[g] = false;
                }


                if(  vrDisplay.stageParameters )
                {
                    mat4.multiply(mtx, vrDisplay.stageParameters.sittingToStandingTransform, mtx );
                
                    var tempMtx = [];

                    var offset = [];
                    vec3.transformQuat(offset, grabPointOffset, vrGamepads[g].pose.orientation);
                    vec3.add(pos, pos, offset);
                    
                    mat4.fromTranslation(tempMtx, pos);
                    mat4.multiply(tempMtx, vrDisplay.stageParameters.sittingToStandingTransform, tempMtx);
      
                    mat4.getTranslation(pos, tempMtx);
                }

                mat4.multiply(mtx, mtx, controllerOffset[index]);

                _jellyFace.updateVRHand(index, mtx, pos, pressed, vrGamepads[g].buttons[1].pressed);
            }
        }
    }

    if( frameData.pose )
    {
        if( frameData.pose.position && frameData.pose.orientation )
        {
            var rotation = [];
            quat.fromEuler(rotation, 90.0, 180.0, 0.0);

            quat.multiply(rotation, frameData.pose.orientation, rotation);
            var handMtx  = [];
            _jellyFace.setHandRootTransform(frameData.pose.position, rotation, vec3.fromValues(0.001, 0.001, 0.001 ), true );
        }
    }
}

function renderVR()
{
    var lvm = [];
    var rvm = [];

    if(  vrDisplay.stageParameters )
    {
        var invStand = [];
        mat4.invert(invStand, vrDisplay.stageParameters.sittingToStandingTransform );
        mat4.multiply(lvm, frameData.leftViewMatrix, invStand);
        mat4.multiply(rvm, frameData.rightViewMatrix, invStand);
    }
    else
    {
        lvm = frameData.leftViewMatrix;
        rvm = frameData.rightViewMatrix;
    }

    render(lvm, frameData.leftProjectionMatrix, [0, 0, canvas.width * 0.5, canvas.height]);
    render(rvm, frameData.rightProjectionMatrix, [canvas.width * 0.5, 0, canvas.width * 0.5, canvas.height]);
}

function onVRRequestPresent () {
    vrDisplay.requestPresent([{ source: canvas }]).then(function () {
    }, function (err) {
        var errMsg = "requestPresent failed.";
        if (err && err.message) {
            errMsg += "<br/>" + err.message
        }
        console.error(errMsg);
    });
}

function onVRExitPresent () {
    if (!vrDisplay.isPresenting)
        return;
    vrDisplay.exitPresent().then(function () {
    }, function () {
        console.error("exitPresent failed.");
    });
}

function setupVRScene()
{

    var pos = null;
    var rot = null;

    if( vrDisplay.capabilities.hasPosition )
    {
        vrDisplay.getFrameData(frameData);
        var p = frameData.pose.position;
        if( p )
        {
            pos = vec3.fromValues(p[0], p[1], p[2]);

            if( vrDisplay.capabilities.hasOrientation )
            {
                var forward = [0];
                vec3.transformQuat(forward, vec3.fromValues(0.0, 0.0, -1.0), frameData.pose.orientation);
                forward[1] = 0.0;
                vec3.normalize(forward, forward);

                rot = [];
                quat.rotationTo(rot, vec3.fromValues(0.0, 0.0, -1.0), forward);

                vec3.scale(forward, forward, 0.65);
                vec3.add(forward, forward, vec3.fromValues(0.0, -0.1, 0.0));
                vec3.add(pos, pos, forward);             
            }

            if(  vrDisplay.stageParameters )
            {
                var invStand = [];
                mat4.invert(invStand, vrDisplay.stageParameters.sittingToStandingTransform );

                var mMtx = [];
                mat4.fromTranslation(mMtx, pos);

                mat4.multiply(mMtx, vrDisplay.stageParameters.sittingToStandingTransform, mMtx);

                mat4.getTranslation(pos, mMtx);
            }

        }
    }

    if( !pos )
    {
        pos = vec3.fromValues(0.0, 1.4, -0.65);
    }

    if( !rot )
    {
        rot = _jellyFace._modelRotation;
    }

    
    var floorPos = null;
    if(!vrDisplay.stageParameters )
    {
        floorPos = vec3.fromValues(pos[0], -1.0, pos[2]);           
    }
    else
    {
        floorPos = vec3.fromValues(pos[0], 0.0, pos[2]);
    }

    if( pos[1] < floorPos[1] + 0.5 )
    {
        pos[1] = floorPos[1] + 0.5;
    }

    _jellyFace.setModelTransform(pos, rot, _jellyFace._modelScale);
    _jellyFace.setCameraTransform(vec3.fromValues(0.0, 0.0, 0.0), _jellyFace._cameraRotation);

    _jellyFace.setFloorPosition(floorPos);

    
}

function onVRPresentChange () {
    resize();
    if (vrDisplay.isPresenting) {
        var pos = null;
        var rot = null;

        window.cancelAnimationFrame(animLoop);
        animLoop = vrDisplay.requestAnimationFrame(tick);
        
        setupVRScene();
        _jellyFace.resetData();

        _jellyFace.stopSounds();

    } else {    
        _jellyFace.setModelTransform(vec3.fromValues(0.0, 0.5, 0.0), quat.fromValues(0.0, 0.0, 0.0, 1.0), _jellyFace._modelScale);
        _jellyFace.setCameraTransform(vec3.fromValues(0.0, 0.6, 1.0), _jellyFace._cameraRotation);
        _jellyFace.setFloorPosition(vec3.fromValues(0.0, 0.0, 0.0));
        _jellyFace.setHandRootTransform(vec3.fromValues(0.0, 0.25, 0.25), _jellyFace._modelRotation, vec3.fromValues(0.001, 0.001, 0.001));
        _jellyFace.resetData();

        _jellyFace.updateLeapHand(0, null, false);
        _jellyFace.updateLeapHand(1, null, false);
    }
}


function toggleVR() {
    if( vrDisplay)
    {
        if( vrDisplay.isPresenting )
        {

            onVRExitPresent();
        }
        else
        {

            onVRRequestPresent();
        }

    }
}
