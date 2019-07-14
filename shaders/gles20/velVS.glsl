precision highp float;
precision highp sampler2D;

attribute vec3 aPos;
attribute vec2 aTexcoord;
attribute float aVertexID;

uniform sampler2D uPosTex;
uniform sampler2D uVelTex;
uniform sampler2D uGrabTex;

uniform float uImageSize;
uniform float uDeltaTime;

uniform vec3 uMousePos;
uniform float uAspect;
uniform float uRadius;

uniform mat4 uMMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;

uniform mat4 uInvMVPMatrix;

varying vec4 vColor;
varying vec2 vTexcoord;
varying vec3 vPos;


void main(void) {
    gl_PointSize = 1.0;
    vTexcoord = aTexcoord;
    vPos = aPos;

    vec2 uv = (vec2(mod(aVertexID, uImageSize), floor( aVertexID / uImageSize)) + 0.5 ) / uImageSize;

    vec4 dPos = uMMatrix * vec4(aPos.xyz, 1.0); 

    vec3 pos = texture2D(uPosTex, uv.xy).xyz;
    vec3 vel = texture2D(uVelTex, uv.xy).xyz;
    vel = vel.xyz - vel.xyz * uDeltaTime * 3.0;

    float grab = texture2D(uGrabTex, uv.xy).a;

    vec4 scrPos = uPMatrix * uVMatrix * vec4(pos, 1.0);
    scrPos.xyz /= scrPos.w;
    scrPos.xyz = scrPos.xyz * 0.5 + 0.5;

    vec4 mousePos = uInvMVPMatrix * vec4(uMousePos.xy, 0.0, 1.0);
    mousePos.xyz /= mousePos.w;
    
    vec3 off = scrPos.xyz - vec3(uMousePos.xy, -1.0);
    off.z = 0.0;

    float sqDist = length(off);

    vec3 scrVel = (off / max(sqDist, 0.1)) * uDeltaTime;

    // float pull = sqDist * 4.0;
    // pull = pull * pull * 50.0;
    scrVel = scrVel * (1.0 - grab) - ( off * 3.0) * grab;

    vec4 wVel = (uInvMVPMatrix * vec4(scrVel.xyz, 0.0));
    vel += wVel.xyz;

    vec3 adjOff =  (dPos.xyz - pos.xyz) * 2.0;
    vel.xyz += adjOff;
    
    vColor = vec4(vel, 1.0);

    gl_Position = vec4(uv.xy*2.0 - 1.0, 0.0, 1.0);
}
