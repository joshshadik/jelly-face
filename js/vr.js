var vrDisplay = null;
var frameData = null;

var vrGamepads = [];
var gamepadPressed = [];

var controllerOffset =[[], []];
var grabPointOffset = [];

var quadMesh = null;

var faceButtonMaterials = [];

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

function initGLVR()
{
    quadMesh = new Mesh(quadVertices, quadVertexIndices);

    var vs = Material.createShader(shaders.vs.texturedQuad, gl.VERTEX_SHADER);
    var fs = Material.createShader(shaders.fs.texturedQuad, gl.FRAGMENT_SHADER);

    var self = this;
    loadImageFromUrl("./assets/vr_atlas.png", function(tex) {

        var scale = vec3.fromValues(0.05, 0.05, 0.05);
        var rot = quat.create();

        faceButtonMaterials.push( 
            new VRButton(
                vec3.fromValues(-0.15, 0.1, 0.0), rot, scale, 
                quadMesh, tex, new Material(vs, fs), [0, 0, 0.25, 0.5],
                function() { loadFace(0); }, 0.05
        ));

        mtx = [];
        faceButtonMaterials.push( 
            new VRButton(
                vec3.fromValues(0.0, 0.1, 0.0), rot, scale, 
                quadMesh, tex, new Material(vs, fs), [0.25, 0, 0.25, 0.5],
                function() { loadFace(1); }, 0.05
        ));

        mtx = [];
        faceButtonMaterials.push( 
            new VRButton(
                vec3.fromValues(0.15, 0.1, 0.0), rot, scale, 
                quadMesh, tex, new Material(vs, fs), [0.5, 0, 0.25, 0.5],
                function() { loadFace(2); }, 0.05
        ));

        mtx = [];
        faceButtonMaterials.push( 
            new VRButton(
                vec3.fromValues(-0.15, -0.05, 0.0), rot, scale, 
                quadMesh, tex, new Material(vs, fs), [0.75, 0, 0.25, 0.5],
                function() { loadFace(3); }, 0.05
        ));

        mtx = [];
        faceButtonMaterials.push( 
            new VRButton(
                vec3.fromValues(0.0, -0.05, 0.0), rot, scale, 
                quadMesh, tex, new Material(vs, fs), [0.0, 0.5, 0.25, 0.5],
                function() { loadFace(4); }, 0.05
        ));

        mtx = [];
        faceButtonMaterials.push( 
            new VRButton(
                vec3.fromValues(0.15, -0.05, 0.0), rot, scale, 
                quadMesh, tex, new Material(vs, fs), [0.25, 0.5, 0.25, 0.5],
                function() { loadFace(5); }, 0.05
        ));

        mtx = [];
        faceButtonMaterials.push(
            new VRButton(
                vec3.fromValues(0.0, -0.2, 0.0), rot, vec3.fromValues(0.1, 0.05, 0.5), 
                quadMesh, tex, new Material(vs, fs), [0.5, 0.5, 0.5, 0.5],
                function() { redirectToSketcfabModel(); }, 0.1
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
      }
    }

    if( !_jellyFace._hands[0].isLeapControlled() )
    {
        
        for( var g = 0; g < vrGamepads.length; ++g )
        {
            var mtx = [];

            if( vrGamepads[g].pose.hasPosition && vrGamepads[g].pose.position )
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

                if( gamepadPressed.length <= g )
                {
                    gamepadPressed.push(false);
                }

                if( !gamepadPressed[g] && vrGamepads[g].buttons[1].pressed )
                {
                    pressed = true;
                    gamepadPressed[g] = true;
                }
                else if ( gamepadPressed[g]  && !vrGamepads[g].buttons[1].pressed)
                {
                    gamepadPressed[g] = false;
                    _jellyFace.endToolUse(index);
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

                vec3.scale(forward, forward, 0.5);
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
        pos = vec3.fromValues(0.0, 1.4, -0.5);
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

    _jellyFace.resetData();
}

function onVRPresentChange () {
    resize();
    if (vrDisplay.isPresenting) {
        var pos = null;
        var rot = null;

        window.cancelAnimationFrame(animLoop);
        animLoop = vrDisplay.requestAnimationFrame(tick);

        setupVRScene();

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
