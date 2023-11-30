varying vec2 vUv;
varying float vWave;

uniform sampler2D uTexture;

void main() {
  vec4 color = texture2D(uTexture, vUv);
  gl_FragColor = vec4(vUv, 0.0, 1.0);
  gl_FragColor = color;
}