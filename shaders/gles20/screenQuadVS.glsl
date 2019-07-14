precision mediump float;

attribute vec3 aPos;

varying vec2 vTexcoord;

void main(void)
{
    gl_Position = vec4(aPos.xy, 1.0, 1.0);
    vTexcoord = (aPos.xy + vec2(1.0, 1.0)) * 0.5;
}