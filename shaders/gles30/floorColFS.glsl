#version 300 es
precision mediump float;
precision lowp sampler2D;

in vec4 vPos;

$forwardlighting

layout(location = 0) out vec4 color;


void main(void)
{
    color = vec4(1.0, 1.0, 1.0, 1.0);
    float factor = calcShadowFactor(vPos);

    color.xyz *= 1.0 - factor * 0.6;

    vec4 lightPos = calcLightPos(vPos);
    float rad = length(lightPos.xy - vec2(0.5, 0.5));

    rad = smoothstep(0.37, 0.5, rad);
    rad = 1.0 - rad;
    rad = rad * rad * rad * rad;
    

    color.xyz = color.xyz * vec3(rad, rad, rad) * 0.7 + 0.1;
}