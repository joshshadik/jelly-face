#version 300 es
precision highp float;
precision highp sampler2D;

in vec2 vTexcoord;

uniform sampler2D uPosTex;
uniform sampler2D uColTex;
uniform sampler2D uShadowTex;

uniform mat4 uLightSpace;

out vec4 color;

void main(void) {
    vec4 col = texture(uColTex, vTexcoord.st);
    vec4 pos = texture(uPosTex, vTexcoord.st);

    vec4 shadow = texture(uShadowTex, vTexcoord.st);
    col.rgb = col.rgb * 0.6 + col.rgb * shadow.rgb * 0.4;


    vec2 centerOffset = vec2(0.5, 0.5) - vTexcoord.xy;
    float off = dot(centerOffset, centerOffset);
    off = 1.0 - off;
    off = off * off;
    off = off * 2.0;
    float vignette = off;

    col *= vignette;

    color = col;
}