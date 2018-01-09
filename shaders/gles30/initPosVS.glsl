#version 300 es
precision highp float;

layout( location = 0) in vec3 aPos;
layout( location = 2) in float aVertexID;

uniform float uImageSize;

uniform mat4 uMMatrix;

out vec4 vColor;

void main(void) {
    gl_PointSize = 1.0;
    vColor = uMMatrix * vec4(aPos.xyz, 1.0);

    vec2 uv = ( vec2(mod(aVertexID, uImageSize), floor( aVertexID / uImageSize)) + 0.5 ) / uImageSize;
    gl_Position = vec4(uv.xy*2.0 - 1.0, 0.0, 1.0);
}