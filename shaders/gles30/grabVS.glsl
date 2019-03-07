#version 300 es
precision highp float;

layout( location = 2) in float aVertexID;

uniform sampler2D uPosTex;
uniform sampler2D uScreenPosTex;

uniform float uImageSize;

uniform vec3 uMousePos;
uniform float uAspect;
uniform float uRadius;

out vec4 vColor;

void main(void) {
    gl_PointSize = 1.0;

    vec2 uv = (vec2(mod(aVertexID, uImageSize), floor( aVertexID / uImageSize)) + 0.5 ) / uImageSize;

    vec3 pos = texture(uPosTex, uv.xy).xyz;
    vec3 hoverPos = texture(uScreenPosTex, uMousePos.xy).xyz;

    vec3 off = pos.xyz - hoverPos;

    float dist = length(off);

    float strength =  1.0 - (smoothstep(0.0, uRadius, dist));
    //strength = strength * strength * strength * strength;


    float outerStrength = max(1.0 - dist, 0.0);
    outerStrength = outerStrength * outerStrength;


    strength = strength * 0.95 + outerStrength * 0.05;
    
    vColor = vec4(off, strength);

    gl_Position = vec4(uv.xy*2.0 - 1.0, 0.0, 1.0);
}