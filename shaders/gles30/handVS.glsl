#version 300 es
precision highp float;
precision mediump int;
precision highp sampler2D;

layout( location = 0) in vec3 aPos;
layout( location = 1) in vec2 aTexcoord;
layout( location = 2) in float aVertexID;


uniform mat4 uMMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;

out vec4 vColor;
out vec4 vPos;

void main(void) {
    vPos = uMMatrix * vec4(aPos, 1.0);
    vColor = vec4(0.8, 0.1, 0.1, 1.0);
    vec4 pos = uPMatrix * uVMatrix * vPos;
    gl_Position = pos;
    float zd = max(pos.z / pos.w, 0.5 );

    float ortho = smoothstep(0.99, 1.0, pos.w);

    gl_PointSize = 5.0 * ortho + 5.0 * (1.0 - ortho) / zd;
}