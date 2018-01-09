#version 300 es
precision mediump float;
precision lowp sampler2D;

in vec4 vPos;

layout(location = 0) out vec4 position;
layout(location = 1) out vec4 color;

void main(void)
{
    position = vec4(vPos.xyz, 1.0);
    color = vec4(1.0, 1.0, 1.0, 1.0);
}