#version 300 es
precision highp float;

layout( location = 0) in vec3 aPos;

out vec2 vTexcoord;

void main(void)
{
    gl_Position = vec4(aPos.xy, 1.0, 1.0);
    vTexcoord = (aPos.xy + vec2(1.0, 1.0)) * 0.5;
}