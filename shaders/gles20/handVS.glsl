precision mediump float;
precision mediump int;
precision mediump sampler2D;

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
    float zd = max(pos.z / pos.w, 0.5 );

    float ortho = smoothstep(0.99, 1.0, pos.w);

    gl_PointSize = 5.0 * ortho + 5.0 * (1.0 - ortho) / zd;
}