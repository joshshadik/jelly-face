precision highp float;

uniform sampler2D uColorTex;

varying vec2 vTexcoord;
varying vec3 vColor;
varying vec3 vPos;

void main(void) {
    vec3 p = vPos;
    vec3 c = vColor;
    
    gl_FragColor = texture2D(uColorTex, vec2(vTexcoord.x, 1.0 - vTexcoord.y)) * 0.5;
}