precision highp float;
precision highp sampler2D;

varying vec2 vTexcoord;

uniform sampler2D uPosTex;
uniform sampler2D uShadowTex;

uniform mat4 uLightSpace;

const float EPSILON = 0.002;

vec4 calcShadow(vec2 uv, vec2 offset) {
    vec4 color = texture2D(uShadowTex, uv);
    return color; 
}

float calcShadowFactor( highp vec3 lightPos )
{
    float factor = 0.0;

    vec4 shadowPos = calcShadow(lightPos.xy, vec2(EPSILON, EPSILON));   
    float alpha = shadowPos.a;

    shadowPos = uLightSpace * vec4(shadowPos.xyz, 1.0);
    shadowPos.xyz /= shadowPos.w;
    
    float off = smoothstep(0.001, 0.01, lightPos.z - shadowPos.z);

    factor += off * alpha;

    float rad = length(lightPos.xy - vec2(0.5, 0.5));

    rad = smoothstep(0.4, 0.5, rad);
    rad *= rad;

    factor = factor * (1.0 - rad);

    return factor;

}

void main(void) {
    vec4 col = vec4(1.0, 1.0, 1.0, 1.0);
    vec4 pos = texture2D(uPosTex, vTexcoord.st);

    vec4 lightPos = uLightSpace * vec4(pos.xyz, 1.0);

    lightPos.xyz = lightPos.xyz / lightPos.w;
    lightPos.xy = lightPos.xy * 0.5 + 0.5;

    col.rgba *= 1.0 - calcShadowFactor(lightPos.xyz);

    gl_FragColor = col;
}  