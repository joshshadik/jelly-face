precision mediump float;

attribute vec3 aPos;
attribute vec2 aTexcoord;
attribute float aVertexID;

uniform sampler2D uPosTex;
uniform sampler2D uScreenPosTex;

uniform float uImageSize;

uniform vec3 uGrabPos;
uniform vec3 uMousePos;
uniform float uAspect;
uniform float uRadius;

varying vec4 vColor;
varying vec3 vPos;
varying vec2 vTexcoord;

void main(void) {
    gl_PointSize = 1.0;
    vPos = aPos;
    vTexcoord = aTexcoord;

    vec2 uv = (vec2(mod(aVertexID, uImageSize), floor( aVertexID / uImageSize)) + 0.5 ) / uImageSize;

    vec3 pos = texture2D(uPosTex, uv.xy).xyz;

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