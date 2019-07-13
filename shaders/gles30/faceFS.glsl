#version 300 es
precision highp float;

uniform sampler2D uColorTex;

in vec3 vPos;
in vec2 vTexcoord;
in vec3 vColor;

layout(location = 0) out vec4 position;
layout(location = 1) out vec4 color;

void main(void) {
    color = texture(uColorTex, vec2(vTexcoord.x, 1.0 - vTexcoord.y));
    position = vec4(vColor, 1.0);
}