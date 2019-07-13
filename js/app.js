var canvas;
var gl;

var _jellyFace = null;
var _time = null;

var _started = true;
var _firstUpdate = true;
var _supportsWebGL2 = false;
var _supportsUIntIndices = true;
var _isMobile = false;
var _backgroundColor = [0.9, 0.9, 0.9, 1.0];

var shaders = null;

var stats = null; //new Stats();

var isLoading = true;
var loadingElement = null;
var currLoad  = 0.0;

var animLoop = null;

var models = [
    "snoop",
    "charlize",
    "jackie",
    "shatner",
    "obama",
    "marilyn"
];

var credits = [
    '<a href="https://sketchfab.com/models/27c0788205264c7bac3b734e2733413c">Snoop Dogg</a> by <a href="https://sketchfab.com/tipatat">tipatat</a> is licensed under <a href="http://creativecommons.org/licenses/by/4.0">CC Attribution</a>',
    '<a href="https://sketchfab.com/models/687ee1b6d7234ac4a4797f09435d8ab3">Charlize Theron</a> by <a href="https://sketchfab.com/tipatat">tipatat</a> is licensed under <a href="http://creativecommons.org/licenses/by/4.0">CC Attribution</a>',
    '<a href="https://sketchfab.com/models/093b1edcac344c8bb272e1967aeac30c">Jackie Chan</a> by <a href="https://sketchfab.com/tipatat">tipatat</a> is licensed under <a href="http://creativecommons.org/licenses/by/4.0">CC Attribution</a>',
    '<a href="https://sketchfab.com/models/5a4534d44b2c4244be9cd0a75fa81866">William Shatner</a> by <a href="https://sketchfab.com/tipatat">tipatat</a> is licensed under <a href="http://creativecommons.org/licenses/by/4.0">CC Attribution</a>',
    '<a href="https://sketchfab.com/models/92589e6f710f409dbc1e9edbe26eb1bd">President Obama</a> by <a href="https://sketchfab.com/tipatat">tipatat</a> is licensed under <a href="http://creativecommons.org/licenses/by/4.0">CC Attribution</a>',
    '<a href="https://sketchfab.com/models/ab61515e456549fd9d6e4caff91060ae">Marilyn Monroe</a> by <a href="https://sketchfab.com/tipatat">tipatat</a> is licensed under <a href="http://creativecommons.org/licenses/by/4.0">CC Attribution</a>'
];

var sketchfabURLS = [
    'https://sketchfab.com/models/27c0788205264c7bac3b734e2733413c',
    'https://sketchfab.com/models/687ee1b6d7234ac4a4797f09435d8ab3',
    'https://sketchfab.com/models/093b1edcac344c8bb272e1967aeac30c',
    'https://sketchfab.com/models/5a4534d44b2c4244be9cd0a75fa81866',
    'https://sketchfab.com/models/92589e6f710f409dbc1e9edbe26eb1bd',
    'https://sketchfab.com/models/ab61515e456549fd9d6e4caff91060ae'
];

var modelIndex = 0;
var diaMode = false;

var grabCount = 0;


//
// start
//
// called when body loads
// sets everything up
//
function start() {  
    if( stats )
    {
        stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild( stats.dom );
    }

    _isMobile = window.orientation > -1;
    var screenScale = _isMobile ? 0.8 : 1.0;

    Tone.context.latencyHint = "fastest";

    loadingElement = document.getElementById("loadingText");

    canvas = document.getElementById("glcanvas");

    var displayWidth  = Math.floor(window.innerWidth * window.devicePixelRatio * screenScale);
    var displayHeight = Math.floor(window.innerHeight * window.devicePixelRatio * screenScale);

    canvas.width  = displayWidth;
    canvas.height = displayHeight;

    
    if (navigator.getVRDisplays) {
        initVR();
    } else {
        initWebGL(false);
    }
}

function loadFace(index)
{
    loadAvatarFace(models[index], diaMode ? "Created from artwork on display at the Detroit Institute of Arts" : credits[index]);
    modelIndex = index;
    
    gtag( 'event', 'load-face', { 'event_label' : models[modelIndex] } );
}

function loadAvatarFace(avatar, attribution = "")
{
    isLoading = true;
    loadingElement.style.display = "";
    _jellyFace.loadFace("./assets/" + avatar + "/", true, ready);
    document.getElementById("attributions").innerHTML = attribution;
}

function ready()
{

    if(_firstUpdate )
    {
        document.onmousedown = handleMouseDown;     
        document.onmouseup = handleMouseUp;
        document.onmousemove = handleMouseMove;
        canvas.oncontextmenu = handleRightClick;
        canvas.addEventListener("onmousewheel" in document ? "mousewheel" : "wheel", function(e) {
            e.wheel = e.wheelDelta ?  e.wheelDelta/40 : -e.deltaY;
            handleMouseWheel(e);
          });

        canvas.addEventListener('touchmove', function(event) {
            event.preventDefault();
            handleTouchMove(event);
        }, false); 
    

        canvas.addEventListener('touchstart', function(event) {
            event.preventDefault();
            handleTouchStart(event);
        }, false); 
    
        canvas.addEventListener('touchend', function(event) {
            event.preventDefault();
            handleTouchEnd(event);
        }, false); 

        window.addEventListener("resize", resize, false);

    }   

    isLoading = false;
    loadingElement.style.display = "none";
}


//
// render
//
// Draw the scene.
//
function render(isVR = false, viewMatrix = null, projMatrix = null, rect = null) 
{ 
    if(isVR)
    {
        _jellyFace.renderVR(viewMatrix, projMatrix, rect);
    }
    else
    {
        _jellyFace.render();
    }
    
}


// 
// tick
//
// core loop function
// called every frame, updates & tells the scene to render
//
function tick( currentTime )
{
    if( stats )
        stats.begin();

    _time.update(currentTime);


    if( vrDisplay && vrDisplay.isPresenting ) {
        animLoop = vrDisplay.requestAnimationFrame(tick);

        updateVR();
    }
    else
    {
        animLoop = window.requestAnimationFrame(tick);
    }

    if(!(isLoading && _firstUpdate) && (_started || _firstUpdate) )
    {
        
        //resize();
        
        gl.clear( gl.COLOR_BUFFER_BIT );

        _jellyFace.update();


        gl.clearColor(_backgroundColor[0], _backgroundColor[1], _backgroundColor[2], 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        if( vrDisplay && vrDisplay.isPresenting ) 
        {
            renderVR();
        }
        else
        {
            render();
        }
       
        _jellyFace.postUpdate();

        _firstUpdate = false;
    }

    if( isLoading)
    {
        currLoad = (currLoad + Time.deltaTime()) % 1.0;

        var dots = Math.floor(currLoad*4.0);
        var loadStr = "l o a d i n g ";
        for( var d = 0; d < dots; ++d )
        {
            loadStr += ". ";
        }
        loadingElement.innerText =  loadStr;

        if(_firstUpdate)
        {
            gl.clearColor(_backgroundColor[0], _backgroundColor[1], _backgroundColor[2], 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
    }
    

    if( vrDisplay && vrDisplay.isPresenting ) {
        vrDisplay.submitFrame();
    }

    

    if(stats)
    {
        stats.end();
    }
        
}


//
// initWebGL
//
// initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
function initWebGL(preserveBuffer = false) {
    gl = null;

    console.log("initing webgl");

    var glAttribs = {
        alpha: false,
        preserveDrawingBuffer: preserveBuffer
    };

    try {
        gl = canvas.getContext("webgl2", glAttribs);

        var extensions = gl.getSupportedExtensions();
        console.log(extensions);

        //gl.getExtension('WEBGL_depth_texture');
    }
    catch(e) {
    }

    if(gl)
    {
        _supportsWebGL2 = true;
    }
    else
    {
        gl = canvas.getContext("experimental-webgl", glAttribs);
        
        var extensions = gl.getSupportedExtensions();
        console.log(extensions);

        gl.getExtension('WEBGL_depth_texture');
    }

    console.log("supports webgl 2: " + _supportsWebGL2);

    // If we don't have a GL context, give up now

    if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
    }

    if (gl) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        gl.clearDepth(1.0);                 // Clear everything
        gl.enable(gl.DEPTH_TEST);           // Enable depth testing
        gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
        
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.disable(gl.BLEND);

        gl.lineWidth(5);

        _time = new Time();

        var shaderPath = "./shaders/gles20";
        if( _supportsWebGL2 )
        {
            shaderPath = "./shaders/gles30"
        }

        shaders = new ShaderLoader(shaderPath, "./shaders/util");

        shaders.load('composeFS',       'compose',      'fragment');
        shaders.load('copyFS',          'copy',         'fragment');
        shaders.load('faceVS',          'face',         'vertex');
        shaders.load('floorVS',         'floor',        'vertex');
        shaders.load('grabVS',          'grab',         'vertex');
        shaders.load('grab3DVS',        'grab3D',       'vertex');
        shaders.load('initPosVS',       'initPos',      'vertex');
        shaders.load('posFS',           'pos',          'fragment');
        shaders.load('screenQuadVS',    'quad',         'vertex');
        shaders.load('shadowBufferFS',  'shadowBuffer', 'fragment');
        shaders.load('vColorFS',        'vColor',       'fragment');
        shaders.load('velVS',           'vel',          'vertex');
        shaders.load('vel3DVS',         'vel3D',        'vertex');
        shaders.load('handVS',          'hand',         'vertex');
        shaders.load('handFS',          'hand',         'fragment');
        shaders.load('texturedQuadVS',  'texturedQuad', 'vertex');
        shaders.load('texturedQuadFS',  'texturedQuad', 'fragment');
        shaders.load('faceColFS',       'faceCol',      'fragment');
        shaders.load('floorColFS',      'floorCol',     'fragment');    

        if( _supportsWebGL2 )
        {
            shaders.load('faceFS',          'face',         'fragment');
            shaders.load('floorFS',         'floor',        'fragment');
        }
        else
        {
            shaders.load('facePosFS',       'face',         'fragment');
            shaders.load('floorPosFS',      'floor',        'fragment');
        
        }

        _jellyFace = new JellyFace();
        
        if(_isMobile)
        {
            //_jellyFace._shadowsEnabled = false;
            _jellyFace._shadowFboSize = 384;
            _jellyFace._shadowScreenScale = 0.5;
        }

        shaders.shaderSetLoaded = function() {
            if(window.location.hash) {
                var hash = window.location.hash.substring(1); //Puts hash in variable, and removes the # character
                if(window.location.hash == "#dia")
                {
                    models = [ "dia0", "dia1", "dia2", "dia3", "dia4", "dia5"];
                    for(var i = 0; i < 6; ++i)
                    {
                        var tagId = "icon" + i.toString();
                        document.getElementById(tagId).src = "./icons/" + models[i] + ".jpg";
                    }
                    diaMode = true;
                    loadFace(modelIndex);
                }
                else
                {
                    loadAvatarFace(hash);
                }
            } else {
                loadFace(modelIndex);
            }
            
            initGLVR();
        }
        
        // start the core loop cycle
        animLoop = requestAnimationFrame(tick);  

        Leap.loop(leapAnimate);
    }
}


function loadImageFromUrl(url, callback) {
    var req = new XMLHttpRequest();

    req.onreadystatechange = function()
    {
        if( req.readyState == req.DONE ) 
        {
            if( req.status == 200 && req.response )
            {
                var reader = new FileReader();
                reader.onload = (function(theFile) {
                    return function(e) {
                        loadTexture( e.target.result, callback );
                    };
                })(req.response);
        
                reader.readAsDataURL(req.response);
            }
        }
    }

    req.open("GET", url, true);
    req.responseType = "blob";    
    req.send();
}

function loadTexture(dataSource, callback) {
    var texture = gl.createTexture();
    var image = new Image();
    image.onload = function() { 
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
        callback(texture); 
    }
    image.src = dataSource;
}

function redirectToSketcfabModel() {
    window.location.href = sketchfabURLS[modelIndex];
}


function resize() 
{
    var screenScale = _isMobile ? 0.8 : 1.0;

    if (vrDisplay && vrDisplay.isPresenting) {
        var leftEye = vrDisplay.getEyeParameters("left");
        var rightEye = vrDisplay.getEyeParameters("right");

        if(_isMobile)
        {screenScale = 0.6;}
        
        canvas.width = Math.max(leftEye.renderWidth * screenScale, rightEye.renderWidth * screenScale) * 2;
        canvas.height = Math.max(leftEye.renderHeight * screenScale, rightEye.renderHeight * screenScale);

        _jellyFace.handleResize(canvas.width/2, canvas.height);
    }
    else{
        var displayWidth  = Math.floor(window.innerWidth * window.devicePixelRatio * screenScale);
        var displayHeight = Math.floor(window.innerHeight * window.devicePixelRatio * screenScale);

        // Make the canvas the same size
        canvas.width  = displayWidth;
        canvas.height = displayHeight;

        _jellyFace.handleResize(displayWidth, displayHeight);
    }

}



