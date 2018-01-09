precision mediump float;
precision lowp sampler2D;

varying vec4 vPos;

void main(void)
{
    gl_FragColor = vec4(vPos.xyz, 1.0);
}