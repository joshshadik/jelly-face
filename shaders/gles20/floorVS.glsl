precision highp float;
precision lowp sampler2D;

attribute vec3 aPos;

uniform mat4 uMMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;

varying vec4 vPos;

void main(void) {
    vPos = uMMatrix * vec4(aPos, 1.0);
    gl_Position = uPMatrix * uVMatrix * vPos;
}