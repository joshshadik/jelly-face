precision highp float;


attribute vec3 aPos;

uniform mat4 uMMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;

uniform vec2 uTexcoordOffset;
uniform vec2 uTexcoordScale;

varying vec2 vTexcoord;
varying vec3 vColor;
varying vec2 vTexcoordLocal;

void main(void) {
    vec2 texcoord = (aPos.xy + vec2(1.0, 1.0)) * 0.5;

    vTexcoordLocal = texcoord;
    
    texcoord *= vec2(uTexcoordScale.x, -uTexcoordScale.y);
    texcoord += vec2(uTexcoordOffset.x, uTexcoordOffset.y + uTexcoordScale.y );

    vTexcoord = texcoord;

    vec4 pos = uMMatrix * vec4(aPos.xyz, 1.0);
    vColor = pos.xyz;
    
    gl_Position = uPMatrix * uVMatrix * pos;          
}