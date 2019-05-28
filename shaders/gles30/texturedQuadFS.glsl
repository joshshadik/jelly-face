#version 300 es
precision highp float;

uniform sampler2D uColorTex;
uniform float uHover;

in vec2 vTexcoord;
in vec3 vColor;
in vec2 vTexcoordLocal;

layout(location = 0) out vec4 color;

void main(void) {
    color = texture(uColorTex, vTexcoord);
    color += texture(uColorTex, vTexcoord + vec2(0.001, 0.001));
    color += texture(uColorTex, vTexcoord + vec2(0.001, -0.001));
    color += texture(uColorTex, vTexcoord + vec2(-0.001, 0.001));
    color += texture(uColorTex, vTexcoord + vec2(-0.001, -0.001));
    color *= 0.2;

    vec4 edge = vec4(smoothstep(0.95, 0.99, vTexcoordLocal), smoothstep(0.05, 0.01, vTexcoordLocal));


    float hover = max(edge.x, max(edge.y, max(edge.z, edge.w)));

    hover *= uHover;

    color = color * (1.0 - hover) + vec4(0.0, 1.0, 1.0, 1.0) * hover;

}