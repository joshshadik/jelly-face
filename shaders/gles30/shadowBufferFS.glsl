#version 300 es
precision highp float;
precision highp sampler2D;

in vec2 vTexcoord;

uniform sampler2D uPosTex;
uniform sampler2D uShadowTex;

uniform mat4 uLightSpace;

out vec4 color;


float calcShadow(vec3 lightPos) {
    vec4 shadowPos = texture(uShadowTex, lightPos.st);
    float alpha = shadowPos.a;

    shadowPos = uLightSpace * vec4(shadowPos.xyz, 1.0);
    shadowPos.xyz /= shadowPos.w;
    
    float off = smoothstep(0.001, 0.01, lightPos.z - shadowPos.z);

    return off * alpha;
}

vec4 calcLightPos(vec4 pos)
{
    vec4 lightPos = uLightSpace * vec4(pos.xyz, 1.0);

    lightPos.xyz = lightPos.xyz / lightPos.w;
    lightPos.xy = lightPos.xy * 0.5 + 0.5;

    return lightPos;
}

float calcShadowFactor( vec2 uv )
{
    float factor = 0.0;
    vec4 pos = texture(uPosTex, uv.st);   
    vec4 lightPos = calcLightPos(pos);

    factor += calcShadow(lightPos.xyz);   

    float rad = length(lightPos.xy - vec2(0.5, 0.5));

    rad = smoothstep(0.4, 0.5, rad);
    rad *= rad;
    factor = factor * (1.0 - rad);

    return factor;

}

void main(void) {
    vec4 col = vec4(1.0, 1.0, 1.0, 1.0);

    vec2 ddx = dFdx(vTexcoord.st);
    vec2 ddy = dFdy(vTexcoord.st);

    vec2 w = max(abs(ddx), abs(ddy));

    float factor = calcShadowFactor(vTexcoord.st);
    factor += calcShadowFactor(vTexcoord.st + w * 0.5);
    factor += calcShadowFactor(vTexcoord.st - w * 0.5);

    factor *= 0.3333;

    col.rgba *= 1.0 - factor;

    color = col;
}  