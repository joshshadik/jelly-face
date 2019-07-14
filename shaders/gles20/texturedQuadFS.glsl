precision mediump float;

uniform sampler2D uColorTex;
uniform float uHover;

varying vec2 vTexcoord;
varying vec3 vColor;
varying vec2 vTexcoordLocal;


void main(void) {
    vec4 color = texture2D(uColorTex, vTexcoord);

    vec4 edge = vec4(smoothstep(0.95, 0.99, vTexcoordLocal), smoothstep(0.05, 0.01, vTexcoordLocal));


    float hover = max(edge.x, max(edge.y, max(edge.z, edge.w)));

    hover *= uHover;

    color = color * (1.0 - hover) + vec4(0.0, 1.0, 1.0, 1.0) * hover;
    
    gl_FragColor = color;

}