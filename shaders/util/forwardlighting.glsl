uniform sampler2D uShadowTex;

uniform mat4 uLightSpace;

float calcShadow(vec3 lightPos) {
    vec4 shadowPos = texture(uShadowTex, lightPos.st);
    float alpha = shadowPos.a;

    shadowPos = uLightSpace * vec4(shadowPos.xyz, 1.0);
    shadowPos.xyz /= shadowPos.w;
    
    float off = smoothstep(0.001, 0.015, lightPos.z - shadowPos.z);

    return off * alpha;
}

vec4 calcLightPos(vec4 pos)
{
    vec4 lightPos = uLightSpace * vec4(pos.xyz, 1.0);

    lightPos.xyz = lightPos.xyz / lightPos.w;
    lightPos.xy = lightPos.xy * 0.5 + 0.5;

    return lightPos;
}

float calcShadowFactor(vec4 pos)
{
    vec4 lightPos = calcLightPos(pos);

    float factor = calcShadow(lightPos.xyz);   
    float offset = 0.0016;
    factor += calcShadow(vec3(lightPos.x + offset, lightPos.y + offset, lightPos.z));
    factor += calcShadow(vec3(lightPos.x - offset, lightPos.y + offset, lightPos.z));
    factor += calcShadow(vec3(lightPos.x + offset, lightPos.y - offset, lightPos.z));
    factor += calcShadow(vec3(lightPos.x - offset, lightPos.y - offset, lightPos.z));
    factor *= 0.2;

    return factor;

}
