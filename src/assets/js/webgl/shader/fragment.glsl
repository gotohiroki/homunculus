varying vec2 vUv;
varying float vWave;

uniform sampler2D uTexture;

void main() {

  gl_FragColor = vec4(vUv, 0.0, 1.0);
}