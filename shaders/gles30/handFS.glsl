#version 300 es
precision highp float;

in vec2 vTexcoord;
in vec4 vColor;
in vec4 vPos;

layout(location = 0) out vec4 position;
layout(location = 1) out vec4 color;

void main(void) {
    position = vPos;
    color = vColor;
}