precision highp float;
precision mediump int;
precision highp sampler2D;

attribute vec3 aPos;

uniform mat4 uMMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;

varying vec4 vColor;
varying vec4 vPos;

void main(void) {
    vPos = uMMatrix * vec4(aPos, 1.0);
    vColor = vec4(1.0, 0.0, 0.0, 1.0);
    vec4 pos = uPMatrix * uVMatrix * vPos;
    gl_Position = pos;
    gl_PointSize = min(10.0 / pos.w, 10.0);
}