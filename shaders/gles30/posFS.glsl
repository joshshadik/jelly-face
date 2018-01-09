#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D uPosTex;
uniform sampler2D uVelTex;

uniform float uImageSize;
uniform float uDeltaTime;

in vec2 vTexcoord;

out vec4 color;

void main(void) {
    vec3 lastPos = texture(uPosTex, vTexcoord.xy).xyz;
    vec3 vel = texture(uVelTex, vTexcoord.xy).xyz;

    vec4 c = vec4(lastPos + vel * uDeltaTime, 1.0);  
    
    color = c;
}