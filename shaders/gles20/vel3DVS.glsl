precision highp float;
precision highp sampler2D;

attribute vec3 aPos;
attribute vec2 aTexcoord;
attribute float aVertexID;

uniform sampler2D uDesiredPosTex;
uniform sampler2D uPosTex;
uniform sampler2D uVelTex;

uniform sampler2D uGrabTex0;
uniform sampler2D uGrabTex1;

uniform float uImageSize;
uniform float uDeltaTime;

uniform vec3 uGrabPos0;
uniform vec3 uGrabPos1;

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
    vPos = aPos;
    vTexcoord = aTexcoord;

    float stiffness = 50.0;
    float damping = 2.5;

    vec2 uv = (vec2(mod(aVertexID, uImageSize), floor( aVertexID / uImageSize)) + 0.5 ) / uImageSize;

    vec4 dPos = texture2D(uDesiredPosTex, uv.xy); //uMMatrix * vec4(aPos.xyz, 1.0); 
    //dPos.xyz = texture2D(uDesiredPosTex, uv.xy).rgb; //uMMatrix * vec4(aPos.xyz, 1.0); 

    vec3 pos = texture2D(uPosTex, uv.xy).xyz;
    vec3 vel = texture2D(uVelTex, uv.xy).xyz;

    vec4 grab0 = texture2D(uGrabTex0, uv.xy);
    vec4 grab1 = texture2D(uGrabTex1, uv.xy);
    
    vec3 stretch = (uGrabPos0 + grab0.xyz) - pos.xyz;
    vec3 adjOff =  (dPos.xyz - pos.xyz);


    stretch = stretch * grab0.a + (( uGrabPos1 + grab1.xyz) - pos.xyz ) * grab1.a;
    
    stretch = stretch + adjOff * min(1.0 - grab0.a, 1.0 - grab1.a);
    vec3 acceleration = stretch * stiffness - vel * damping;


    // stretch = dPos.xyz - pos.xyz;
    // acceleration += stretch * stiffness - vel * damping;


    vel += acceleration * uDeltaTime;

    // float sqDist = length(off);

    // vec3 pullVel = (off * 1.0 / max(sqDist, 0.1))  * uDeltaTime;

    // pullVel = pullVel * (1.0 - grab) - ( off * 5.0) * grab;


    // vec4 wVel = vec4(pullVel.xyz, 0.0);
    // vel += wVel.xyz;


    //vel.xyz += adjOff;
    
    vColor = vec4(vel, 1.0);

    gl_Position = vec4(uv.xy*2.0 - 1.0, 0.0, 1.0);
}
