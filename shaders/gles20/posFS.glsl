precision highp float;
precision highp sampler2D;

uniform sampler2D uPosTex;
uniform sampler2D uVelTex;

uniform float uImageSize;
uniform float uDeltaTime;

varying vec2 vTexcoord;

void main(void) {
    vec3 lastPos = texture2D(uPosTex, vTexcoord.xy).xyz;
    vec3 vel = texture2D(uVelTex, vTexcoord.xy).xyz;

    vec4 c = vec4(lastPos + vel * uDeltaTime, 1.0);  
    
    gl_FragColor = c;
}