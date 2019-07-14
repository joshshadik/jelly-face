#version 300 es
precision highp float;

layout( location = 0) in vec3 aPos;
layout( location = 1) in vec2 aTexcoord;
layout( location = 2) in float aVertexID;


out vec2 vTexcoord;

void main(void)
{
    gl_Position = vec4(aPos.xy, 1.0, 1.0);
    vTexcoord = (aPos.xy + vec2(1.0, 1.0)) * 0.5;
}