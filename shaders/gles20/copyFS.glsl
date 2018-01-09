precision highp float;

varying vec2 vTexcoord;

uniform sampler2D uCopyTex;

void main(void) {
    vec4 col = texture2D(uCopyTex, vTexcoord.st);
    gl_FragColor = col;
}