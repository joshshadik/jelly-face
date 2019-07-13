#version 300 es
precision highp float;
precision mediump int;
precision highp sampler2D;

layout( location = 0) in vec3 aPos;
layout( location = 1) in vec2 aTexcoord;
layout( location = 2) in float aVertexID;

uniform sampler2D uPosTex;
uniform sampler2D uVelTex;
uniform vec2 uTexelSize;

uniform float uImageSize;

uniform mat4 uMMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;

out vec3 vPos;
out vec2 vTexcoord;
out vec3 vColor;

void main(void) {
    vTexcoord.xy = aTexcoord.xy;
    vPos = aPos;

    vec2 uv = (vec2(mod(aVertexID, uImageSize), floor( aVertexID / uImageSize)) + 0.5 ) / uImageSize;
    vec3 pos = texture(uPosTex, uv.xy).xyz;
    vColor = pos;
    
    gl_Position = uPMatrix * uVMatrix * vec4(pos.xyz, 1.0);          
}