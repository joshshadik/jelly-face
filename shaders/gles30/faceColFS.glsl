#version 300 es
precision highp float;

uniform sampler2D uColorTex;

$forwardlighting

in vec2 vTexcoord;
in vec3 vColor;

layout(location = 0) out vec4 color;

void main(void) {
    color = texture(uColorTex, vec2(vTexcoord.x, 1.0 - vTexcoord.y));
    float factor = calcShadowFactor(vec4(vColor, 1.0)) * 0.4;
    color.xyz *= 1.0 - factor;
}