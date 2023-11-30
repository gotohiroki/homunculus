import { PlaneGeometry, ShaderMaterial, TextureLoader } from 'three';
import { RippleRenderer } from './RippleRenderer';

const RipplePass = {

}

export class RenderPass {
  constructor() {
    this.Ripple = new RippleRenderer();
  }

  shader() {
    this.material = new ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        u_displacement: { value: null }
      },
      vertexShader,
      fragmentShader,
    });
  }

  update() {
    this.material.uniforms.u_displacement.value = 
    this.Ripple()
  }

  dispose() {

  }


}