precision mediump float;
precision mediump int;
precision mediump sampler2D;

attribute vec3 aPos;
attribute vec2 aTexcoord;
attribute float aVertexID;

uniform sampler2D uPosTex;
uniform sampler2D uVelTex;
uniform vec2 uTexelSize;

uniform float uImageSize;

uniform mat4 uMMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;

varying vec2 vTexcoord;
varying vec3 vColor;
varying vec3 vPos; // hack to pass so doesn't get optimized out


void main(void) {
    vPos = aPos;
    vTexcoord.xy = aTexcoord.xy;

    vec2 uv = (vec2(mod(aVertexID, uImageSize), floor( aVertexID / uImageSize)) + 0.5 ) / uImageSize;
    vec3 pos = texture2D(uPosTex, uv.xy).xyz;
    vColor = pos;
    
    gl_Position = uPMatrix * uVMatrix * vec4(pos.xyz, 1.0);          
}