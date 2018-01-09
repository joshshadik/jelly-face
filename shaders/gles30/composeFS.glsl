#version 300 es
precision highp float;
precision highp sampler2D;

in vec2 vTexcoord;

uniform sampler2D uPosTex;
uniform sampler2D uColTex;
uniform sampler2D uShadowTex;

uniform mat4 uLightSpace;

out vec4 color;

const float EPSILON = 0.0013;

vec4 calcShadow(vec2 uv, vec2 offset) {
    vec4 color = vec4(0.0);
    vec2 off1 = vec2(1.411764705882353) * offset;
    vec2 off2 = vec2(3.2941176470588234) * offset;
    vec2 off3 = vec2(5.176470588235294) * offset;
    color += texture(uShadowTex, uv) * 0.1964825501511404;
    color += texture(uShadowTex, uv + (off1 )) * 0.2969069646728344;
    color += texture(uShadowTex, uv - (off1)) * 0.2969069646728344;
    color += texture(uShadowTex, uv + (off2 )) * 0.09447039785044732;
    color += texture(uShadowTex, uv - (off2 )) * 0.09447039785044732;
    color += texture(uShadowTex, uv + (off3 )) * 0.010381362401148057;
    color += texture(uShadowTex, uv - (off3 )) * 0.010381362401148057;
    return color;
}

void main(void) {
    vec4 col = texture(uColTex, vTexcoord.st);
    vec4 pos = texture(uPosTex, vTexcoord.st);

    vec4 shadow = calcShadow(vTexcoord.st, vec2(EPSILON, EPSILON));
    col.rgb = col.rgb * 0.7 + col.rgb * shadow.rgb * 0.3;


    vec2 centerOffset = vec2(0.5, 0.5) - vTexcoord.xy;
    float off = dot(centerOffset, centerOffset);
    off = 1.0 - off;
    off = off * off;
    off = off * 2.0;
    float vignette = off;

    col *= vignette;

    color = col;
}