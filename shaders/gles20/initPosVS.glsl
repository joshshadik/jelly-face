precision mediump float;

attribute vec3 aPos;
attribute vec2 aTexcoord;
attribute float aVertexID;

uniform float uImageSize;

uniform mat4 uMMatrix;

varying vec4 vColor;
varying vec2 vTexcoord;
varying vec3 vPos;

void main(void) {
    gl_PointSize = 1.0;
    vPos = aPos;
    vTexcoord = aTexcoord;
    vColor = uMMatrix * vec4(aPos.xyz, 1.0);

    vec2 uv = ( vec2(mod(aVertexID, uImageSize), floor( aVertexID / uImageSize)) + 0.5 ) / uImageSize;
    gl_Position = vec4(uv.xy*2.0 - 1.0, 0.0, 1.0);
}