#version 300 es
precision highp float;
precision mediump int;
precision highp sampler2D;

layout( location = 0) in vec3 aPos;

uniform mat4 uMMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;

out vec4 vColor;
out vec4 vPos;

void main(void) {
    vPos = uMMatrix * vec4(aPos, 1.0);
    vColor = vec4(1.0, 0.0, 0.0, 1.0);
    vec4 pos = uPMatrix * uVMatrix * vPos;
    gl_Position = pos;
    gl_PointSize = 10.0 / pos.w;
}