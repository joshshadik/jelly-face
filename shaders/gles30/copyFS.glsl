#version 300 es
precision highp float;

in vec2 vTexcoord;

uniform sampler2D uCopyTex;

out vec4 color;

void main(void) {
    vec4 col = texture(uCopyTex, vTexcoord.st);
    color = col;
}