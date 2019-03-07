#version 300 es
precision highp float;
precision highp sampler2D;

layout( location = 0) in vec3 aPos;
layout( location = 2) in float aVertexID;

uniform sampler2D uDesiredPosTex;
uniform sampler2D uPosTex;
uniform sampler2D uVelTex;
uniform sampler2D uGrabTex;

uniform float uImageSize;
uniform float uDeltaTime;

uniform vec3 uMousePos;
uniform float uAspect;
uniform float uRadius;
uniform vec2 uCanvasSize;

uniform mat4 uMMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;

uniform mat4 uInvMVPMatrix;

out vec4 vColor;


void main(void) {
    gl_PointSize = 1.0;

    float stiffness = 50.0;
    float damping = 2.5;

    vec2 uv = (vec2(mod(aVertexID, uImageSize), floor( aVertexID / uImageSize)) + 0.5 ) / uImageSize;

    //vec4 dPos = uMMatrix * vec4(aPos.xyz, 1.0); 
    vec4 dPos = texture(uDesiredPosTex, uv.xy); //uMMatrix * vec4(aPos.xyz, 1.0); 

    vec3 pos = texture(uPosTex, uv.xy).xyz;
    vec3 vel = texture(uVelTex, uv.xy).xyz;
    vel = vel.xyz - vel.xyz * uDeltaTime * 3.0;

    vec4 grab = texture(uGrabTex, uv.xy);

    vec4 scrPos = uPMatrix * uVMatrix * vec4(pos, 1.0);
    scrPos.xyz /= scrPos.w;
    scrPos.xyz = scrPos.xyz * 0.5 + 0.5;

    vec4 grabOffset = (uPMatrix * uVMatrix * vec4(grab.xyz, 0.0));
    // grabOffset.xyz /= grabOffset.w;
    // grabOffset.xyz = grabOffset.xyz * 0.5 + 0.5;

    vec4 screenStretch = vec4(uMousePos.xy + grabOffset.xy - scrPos.xy, 0.0, 0.0);
    
    vec3 adjOff = (dPos.xyz - pos.xyz);

    vec4 stretch = (uInvMVPMatrix * vec4(uMousePos.xyz*2.0 - 1.0, 1.0));
    //stretch.z = -stretch.z;
    stretch.xyz /= stretch.w;
    stretch.xyz = stretch.xyz + grab.xyz - pos.xyz;
    stretch.xyz = (stretch.xyz * grab.a) + adjOff * 2.0 * (1.0 - grab.a); // + adjOff * grab;

    vec3 acceleration = stretch.xyz * stiffness - vel * damping;

    vel.xyz += acceleration * uDeltaTime;
    
    vColor = vec4(vel, 1.0);

    gl_Position = vec4(uv.xy*2.0 - 1.0, 0.0, 1.0);
}
