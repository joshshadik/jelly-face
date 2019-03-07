"use strict";
var leftDown = false;
var rightDown = false;
var lastMouseX = null;
var lastMouseY = null;

var lastTouchDist = -1;
var lastTouch2X = null;
var lastTouch2Y = null;

var leapController = null;
var leapFrame = null;

var mouseCoord = [];
var touches = [];


var pinchDown = [false, false];


function handlePointerMove(event, newX, newY, sculpt, rotate, zoomAmount) {
    

    var deltaX = newX - lastMouseX;
    var deltaY = newY - lastMouseY;

    if( !(vrDisplay && vrDisplay.isPresenting) )
    {
        if( zoomAmount == null )
        {
            zoomAmount = (deltaX + deltaY) * 0.05;
        }

        if( zoomAmount )
        {
            _jellyFace.handleZoom(zoomAmount);
        }
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
    if( sculpt && !(vrDisplay && vrDisplay.isPresenting))
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
        //_jellyFace.copyPosToDesired();
    }

    //_jellyFace.copyPosToDesired();
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
    
    if( sculpting )
    {
        gtag( 'event', 'grab', { 'event_label' : models[modelIndex], 'value' : ++grabCount, method : 'mouse'} );
    }

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
    if(!(vrDisplay && vrDisplay.isPresenting ))
    {
        _jellyFace.handleZoom( event.wheel );
    }
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

    if( touches.length == 1 )
    {
        gtag( 'event', 'grab', { 'event_label' : models[modelIndex], 'value' : ++grabCount, method : 'touch'} );
    }

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

        var avgMoveX = (touches[1].clientX - lastTouch2X + touches[0].clientX - lastMouseX ) / 2.0;

        if( lastTouchDist >= 0 && touchDist > avgMoveX )
        {
            zoomDelta = touchDist - lastTouchDist;
        }

        lastTouchDist = touchDist;

        lastTouch2X = touches[1].clientX;
        lastTouch2Y = touches[1].clientY;
    }

    handlePointerMove(event, newX, newY, 
        touches.length == 1,
        touches.length >= 2,
        zoomDelta * 0.03
    );

    return false;
}

function updateHand(index, frame)
{
    var hand = frame.hands[index];

    if(hand.type == "left")
    {
        index = 0;
    }
    else
    {
        index = 1;
    }

    var startPinch = false;

    var strength = Math.max(hand.grabStrength, hand.pinchStrength);
    if( strength > 0.3 )
    {
        if( !pinchDown[index] )
        {
            startPinch = true;
            pinchDown[index] = true;
        }
    }
    else
    {
        if( pinchDown[index])
        {
            _jellyFace.endToolUse(index);
        }
        pinchDown[index] = false;
    }

    if( startPinch )
    {
        gtag( 'event', 'grab', { 'event_label' : models[modelIndex], 'value' : ++grabCount, method : 'leap'} );
    }
    _jellyFace.updateLeapHand(index, hand, startPinch);

    return index;
}

function leapAnimate(frame)
{
    if( frame.hands.length > 0 )
    {
        var index = updateHand(0, frame);
        if( frame.hands.length > 1 )
        {
            updateHand(1, frame);
        }
        else
        {
            _jellyFace.updateLeapHand(index == 0 ? 1 : 0, null, false);
            _jellyFace.endToolUse(index == 0 ? 1 : 0);
        }
    }
    else
    {
        _jellyFace.updateLeapHand(0, null, false);
        _jellyFace.updateLeapHand(1, null, false);

        for( var i = 0; i < 2; ++i )
        {
            if( pinchDown[i] )
            {
                _jellyFace.endToolUse(i);
                pinchDown[i] = false;
            }
        }
    }
}
