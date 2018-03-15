#version 300 es
precision highp float;
precision highp sampler2D;

in vec2 vTexcoord;

uniform sampler2D uPosTex;
uniform sampler2D uColTex;
uniform sampler2D uShadowTex;

uniform mat4 uLightSpace;

uniform float uAspect;

out vec4 color;

void main(void) {
    vec4 col = texture(uColTex, vTexcoord.st);
    //vec4 pos = texture(uPosTex, vTexcoord.st);

    vec4 shadow = texture(uShadowTex, vTexcoord.st);
    col.rgb = col.rgb * 0.6 + col.rgb * shadow.rgb * 0.4;


    vec2 centerOffset = (vec2(0.5, 0.5) - vTexcoord.xy);
    centerOffset.x /= max(uAspect, 1.0);
    centerOffset.y *= clamp(uAspect, 0.0, 1.0);
    float vignette  = 1.0 - smoothstep(0.05, 0.4, dot(centerOffset, centerOffset)) * 0.5;
    col *= vignette;

    color = col;
}