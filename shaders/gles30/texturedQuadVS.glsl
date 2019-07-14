#version 300 es
precision highp float;
precision mediump int;
precision highp sampler2D;

layout( location = 0) in vec3 aPos;
layout( location = 1) in vec2 aTexcoord;
layout( location = 2) in float aVertexID;


uniform mat4 uMMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;

uniform vec2 uTexcoordOffset;
uniform vec2 uTexcoordScale;

out vec2 vTexcoord;
out vec3 vColor;
out vec2 vTexcoordLocal;

void main(void) {
    vec2 texcoord = (aPos.xy + vec2(1.0, 1.0)) * 0.5;

    vTexcoordLocal = texcoord;
    
    texcoord *= vec2(uTexcoordScale.x, -uTexcoordScale.y);
    texcoord += vec2(uTexcoordOffset.x, uTexcoordOffset.y + uTexcoordScale.y );

    vTexcoord = texcoord;

    vec4 pos = uMMatrix * vec4(aPos.xyz, 1.0);
    vColor = pos.xyz;
    
    gl_Position = uPMatrix * uVMatrix * pos;          
}