#version 300 es
precision highp float;

layout( location = 0) in vec3 aPos;
layout( location = 1) in vec2 aTexcoord;
layout( location = 2) in float aVertexID;


uniform sampler2D uPosTex;
uniform sampler2D uScreenPosTex;

uniform float uImageSize;

uniform vec3 uGrabPos;
uniform vec3 uMousePos;
uniform float uAspect;
uniform float uRadius;

out vec3 vPos;
out vec4 vColor;

void main(void) {
    gl_PointSize = 1.0;
    vPos = aPos;

    vec2 uv = (vec2(mod(aVertexID, uImageSize), floor( aVertexID / uImageSize)) + 0.5 ) / uImageSize;

    vec3 pos = texture(uPosTex, uv.xy).xyz;

    vec3 off = pos.xyz - uGrabPos;

    float dist = length(off);

    float strength =  1.0 - (smoothstep(0.0, uRadius, dist));
    strength = strength * strength * strength * strength;


    float outerStrength = max(1.0 - dist, 0.0);
    outerStrength = outerStrength * outerStrength;


    strength = strength * 0.9 + outerStrength * 0.1;

    vColor = vec4(off, strength);
    
    //vColor = vec4(strength, 0.0, 1.0, 1.0);

    gl_Position = vec4(uv.xy*2.0 - 1.0, 0.0, 1.0);
}