precision mediump float;

uniform sampler2D uColorTex;

varying vec3 vPos;
varying vec2 vTexcoord;
varying vec3 vColor;


void main(void) {
    // prevent optimizing out attributes in vertex shader
    vec2 t = vTexcoord;
    vec3 p = vPos;
    /////
    
    gl_FragColor = vec4(vColor, 1.0);
}