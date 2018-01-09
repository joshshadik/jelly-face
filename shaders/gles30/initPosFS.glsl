#version 300 es
precision highp float;

in vec2 vTexcoord;
in vec4 vColor;
in vec3 vPos;

out vec4 color;
void main(void) {
    color = vColor;
}