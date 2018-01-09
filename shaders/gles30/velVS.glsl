#version 300 es
precision highp float;
precision highp sampler2D;

layout( location = 0) in vec3 aPos;
layout( location = 2) in float aVertexID;

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

out vec4 vColor;


void main(void) {
    gl_PointSize = 1.0;

    vec2 uv = (vec2(mod(aVertexID, uImageSize), floor( aVertexID / uImageSize)) + 0.5 ) / uImageSize;

    vec4 dPos = uMMatrix * vec4(aPos.xyz, 1.0); 

    vec3 pos = texture(uPosTex, uv.xy).xyz;
    vec3 vel = texture(uVelTex, uv.xy).xyz;
    vel = vel.xyz - vel.xyz * uDeltaTime * 3.0;

    float grab = texture(uGrabTex, uv.xy).x;

    vec4 scrPos = uPMatrix * uVMatrix * vec4(pos, 1.0);
    scrPos.xyz /= scrPos.w;
    scrPos.xyz = scrPos.xyz * 0.5 + 0.5;

    vec4 mousePos = uInvMVPMatrix * vec4(uMousePos.xy, 0.0, 1.0);
    mousePos.xyz /= mousePos.w;
    
    vec3 off = scrPos.xyz - vec3(uMousePos.xy, -1.0);
    off.z = 0.0;

    float sqDist = length(off);

    vec3 scrVel = (off * 1.0 / max(sqDist, 0.1))  * uDeltaTime;

    float pull = sqDist * 4.0;
    pull = pull * pull * 50.0;
    scrVel = scrVel * (1.0 - grab) - ( off * 3.0) * grab;

    vec4 wVel = (uInvMVPMatrix * vec4(scrVel.xyz, 0.0));
    vel += wVel.xyz;

    vec3 adjOff =  (dPos.xyz - pos.xyz) * 2.0;
    vel.xyz += adjOff;
    
    vColor = vec4(vel, 1.0);

    gl_Position = vec4(uv.xy*2.0 - 1.0, 0.0, 1.0);
}
