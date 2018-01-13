var canvas;
var gl;

var leftDown = false;
var rightDown = false;
var lastMouseX = null;
var lastMouseY = null;

var mouseCoord = [];
var touches = []

var _jellyFace = null;
var _time = null;

var _started = true;
var _firstUpdate = true;
var _supportsWebGL2 = false;

var shaders = null;

// var stats = new Stats();

var isLoading = true;
var loadingElement = null;
var currLoad  = 0.0;

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

var modelIndex = 0;

//
// start
//
// called when body loads
// sets everything up
//
function start() {  
    // stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    // document.body.appendChild( stats.dom );

    loadingElement = document.getElementById("loadingText");

    canvas = document.getElementById("glcanvas");

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    
    initWebGL();

    // only continue if webgl is working properly
    if (gl) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        gl.clearDepth(1.0);                 // Clear everything
        gl.enable(gl.DEPTH_TEST);           // Enable depth testing
        gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
        
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.disable(gl.BLEND);

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
        shaders.load('initPosVS',       'initPos',      'vertex');
        shaders.load('posFS',           'pos',          'fragment');
        shaders.load('screenQuadVS',    'quad',         'vertex');
        shaders.load('shadowBufferFS',  'shadowBuffer', 'fragment');
        shaders.load('vColorFS',        'vColor',       'fragment');
        shaders.load('velVS',           'vel',          'vertex');

        if( _supportsWebGL2 )
        {
            shaders.load('faceFS',          'face',         'fragment');
            shaders.load('floorFS',         'floor',        'fragment');
        }
        else
        {
            shaders.load('facePosFS',       'face',         'fragment');
            shaders.load('floorPosFS',      'floor',        'fragment');
            shaders.load('faceColFS',       'faceCol',      'fragment');
            shaders.load('floorColFS',      'floorCol',     'fragment');            
        }

        _jellyFace = new JellyFace();
        var isMobile = window.orientation > -1;
        if(isMobile)
        {
            //_jellyFace._shadowsEnabled = false;
            _jellyFace._shadowFboSize = 768;
            _jellyFace._shadowScreenScale = 0.25;
        }

        shaders.shaderSetLoaded = function() {
            loadFace(modelIndex);
        }

        // start the core loop cycle
        requestAnimationFrame(tick);  
        
    }
    else
    {
        alert("sorry, your browser/device does not support the webgl compabilities this application needs.")
    }
}

function loadFace(index)
{
    isLoading = true;
    loadingElement.style.display = "";
    vertexAttributeToggler.currAttributes = 0x0;
    _jellyFace.loadFace("./assets/" + models[index], ready);
    document.getElementById("attributions").innerHTML = credits[index];
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


    }   

    isLoading = false;
    loadingElement.style.display = "none";
}


//
// render
//
// Draw the scene.
//
function render( ) 
{ 
    _jellyFace.render();
}

// 
// tick
//
// core loop function
// called every frame, updates & tells the scene to render
//
function tick( currentTime )
{
    // stats.begin();

    _time.update(currentTime);

    if(!(isLoading && _firstUpdate) && (_started || _firstUpdate) )
    {
        
        resize();
    
        _jellyFace.update();
        
        render();
       
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
            gl.clearColor(0.9, 0.9, 0.9, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
    }

    // stats.end();

    requestAnimationFrame( tick );
}


//
// initWebGL
//
// initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
function initWebGL() {
    gl = null;

    try {
        //throw "blah";
        gl = canvas.getContext("webgl2", { alpha: false });

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
        gl = canvas.getContext("experimental-webgl", { alpha: false });
        
        var extensions = gl.getSupportedExtensions();
        console.log(extensions);

        gl.getExtension('WEBGL_depth_texture');
    }

    console.log("supports webgl 2: " + _supportsWebGL2);

    // If we don't have a GL context, give up now

    if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
    }
}


function initUI()
{    
    document.getElementById('fileItem').addEventListener('change', handleLoadImage, false);
}

function tutorialOff()
{
    document.getElementById("overlayTutorial").style.display = "none";
    _started = true;
}

function handleLoadImage( evt ) {
   var files = evt.target.files;
   var f = files[0];
   
   var reader = new FileReader();

    // Only process image files.
    if (f.type.match('image.*')) {
        reader.onload = (function(theFile) {
            return function(e) {
                loadVoxelTexture( e.target.result );
            };
        })(f);

        reader.readAsDataURL(f);
    }
    else if( f.name.endsWith('.vox')) { // or magica voxel files ( not perfectly atm)
        reader.onload = (function(theFile) {
            return function(e) {
                var cubeTexture = gl.createTexture();

                _jellyFace.handleTextureLoaded(importMagicaVoxel( e.target.result, "" ), cubeTexture );
            };
        })(f);

        reader.readAsArrayBuffer(f);
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
                        loadVoxelTexture( e.target.result );
                        callback();
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

function loadVoxelTexture(dataSource) {
    var cubeTexture = gl.createTexture();
    var cubeImage = new Image();
    cubeImage.onload = function() { _jellyFace.handleTextureLoaded(cubeImage, cubeTexture); }
    cubeImage.src = dataSource;
}


function saveVoxelTexture() {
    var pixels = _jellyFace.getVoxTextureCPU();
    var bmpEncoder = new BMPEnc(pixels, JellyFace.RT_TEX_SIZE, JellyFace.RT_TEX_SIZE, true);
    var blob = new Blob([bmpEncoder.encode()], {type: "image/bmp"});

    saveAs(blob, "voxsculpt.bmp");
}


function resize() 
{

  var displayWidth  = window.innerWidth;
  var displayHeight = window.innerHeight;

  // Check if the canvas is not the same size.
  if (canvas.width  != displayWidth ||
      canvas.height != displayHeight) {

    // Make the canvas the same size
    canvas.width  = displayWidth;
    canvas.height = displayHeight;

    _jellyFace.handleResize();
  }
}

function handlePointerMove(event, newX, newY, sculpt, rotate, zoomAmount) {
    

    var deltaX = newX - lastMouseX;
    var deltaY = newY - lastMouseY;

    if( zoomAmount == null )
    {
        zoomAmount = (deltaX + deltaY) * 0.05;
    }


    if( zoomAmount )
    {
        _jellyFace.handleZoom(zoomAmount);
    }
    
    if( rotate )
    {
        _jellyFace.handleRotate(( deltaX / window.innerWidth ), 0 ); //( deltaY / window.innerHeight ));
    }

    var nX = ( newX / window.innerWidth) * 2.0 - 1.0;
    var nY = 1.0 - ( newY / window.innerHeight ) * 2.0;       
    if( sculpt)
    {
         
        mouseCoord = vec4.fromValues( nX, nY, -1.0, 1.0);       

        _jellyFace.handleToolUse(nX, nY );
    }

    _jellyFace.handleMouseMove(nX,nY);


    lastMouseX = newX;
    lastMouseY = newY;
}

function handlePointerStart(event, sculpt, rotate, zoom)
{    
    if( sculpt )
    {
        var nX = ( (lastMouseX / window.innerWidth) ) * 2.0 - 1.0;
        var nY = 1.0 - ( lastMouseY / ( window.innerHeight ) ) * 2.0;
        mouseCoord = vec4.fromValues( nX, nY, -1.0, 1.0);    

        handlePointerMove(event, lastMouseX, lastMouseY, true, false, 0);

        _jellyFace.startToolUse();
    }
    
}

function handlePointerEnd(event, sculpt)
{
    if(sculpt)
    {
        _jellyFace.endToolUse();
    }
}

function handleMouseDown(event) {
    
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;

    var rightclick;
    if (event.which) rightclick = (event.which == 3);
    else if (event.button) rightclick = (event.button == 2);

    var leftclick;
    if (event.which) leftclick = (event.which == 1);
    else if (event.button) leftclick = (event.button == 0);

    if( rightclick )
    {
        rightDown = true;
    }
    else
    {
        leftDown = true;
    }
    
    var altKey = event.altKey == 1;
    
    var sculpting = leftclick;
    var rotating = rightclick && !altKey;
    var zooming = rightclick && altKey;
    
    
    handlePointerStart(event, 
        sculpting,
        rotating,
        zooming
    );
}

function handleMouseUp(event) {
    var rightclick;
    if (event.which) rightclick = (event.which == 3);
    else if (event.button) rightclick = (event.button == 2);

    var leftclick;
    if (event.which) leftclick = (event.which == 1);
    else if (event.button) leftclick = (event.button == 0);

    var altKey = event.altKey == 1;

    var sculpting = leftDown;
    var rotating = rightDown && !altKey;
    var zooming = rightDown && altKey;
    
    if( leftclick )
    {
        leftDown = false;
    }
    else
    {
        rightDown = false;
    }

    handlePointerEnd(event, 
        sculpting && !leftDown
    );
}

function handleMouseMove(event) {


    var altKey = event.altKey == 1;

    var sculpting = leftDown;
    var rotating = rightDown && !altKey;
    var zooming = rightDown && altKey;

    handlePointerMove(event, event.clientX, event.clientY, 
    sculpting, 
    rotating, 
    zooming ? null : 0
    );
}


function handleMouseWheel(event) 
{
    _jellyFace.handleZoom( event.wheel );
}

function handleRightClick(event) {
    event.preventDefault();
    return false;
}



function handleTouchStart(event) {
    touches = event.touches;

    var rightclick = false;

    if( touches.length == 1 )
    {
        lastMouseX = touches[0].clientX;
        lastMouseY = touches[0].clientY;
    }
    else 
    {
        if( touches.length >= 2 )
        {
            rightclick = true;
            lastMouseX = (touches[1].clientX + touches[0].clientX) / 2.0;
            lastMouseY = (touches[1].clientY + touches[0].clientY) / 2.0;
        }

        handlePointerEnd(event, true);
    }

    lastTouchDist = -1;

    handlePointerStart(event, 
    touches.length == 1,
    touches.length == 3,
    touches.length == 2);
}

function handleTouchEnd(event) {
    touches = event.touches;

    if( touches.length != 1 )
    {
        handlePointerEnd(event, true);
    }
}

var lastTouchDist = -1;

function handleTouchMove(event) {
    touches = event.touches;

    var newX, newY;

    if( touches.length  == 1 )
    {
        leftDown = true;
        rightDown = false;
        newX = touches[0].clientX / 1.0;
        newY = touches[0].clientY / 1.0;
    }
    else if ( touches.length >= 2 )
    {
        leftDown = false;
        rightDown = true;
        newX = touches[0].clientX; //(touches[1].clientX + touches[0].clientX) / 2.0;
        newY = touches[0].clientY; //(touches[1].clientY + touhces[0].clientY) / 2.0;
    }
    else
    {
        leftDown = false;
        rightDown = false;
        newX = lastMouseX;
        newY = lastMouseY;

        return;
    }

    var zoomDelta = 0;

    if( touches.length == 2 )
    {
        var distX = touches[1].clientX - touches[0].clientX;
        var distY = touches[1].clientY - touches[0].clientY;

        var touchDist = Math.sqrt(distX * distX + distY * distY);

        if( lastTouchDist >= 0)
        {
            zoomDelta = touchDist - lastTouchDist;
        }

        lastTouchDist = touchDist;
    }

    handlePointerMove(event, newX, newY, 
        touches.length == 1,
        touches.length == 3,
        zoomDelta * 0.03
    );

    return false;
}
