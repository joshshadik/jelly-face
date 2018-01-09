precision highp float;

varying vec2 vTexcoord;
varying vec4 vColor;
varying vec3 vPos;

void main(void) {
    vec2 t = vTexcoord;
    vec3 p = vPos;

    gl_FragColor = vColor;
}