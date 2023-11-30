import { AdditiveBlending, Mesh, MeshBasicMaterial, OrthographicCamera, PlaneGeometry, Scene, TextureLoader, Vector2, WebGLRenderTarget } from 'three';

export class RippleRenderer {
  constructor() {
    this.meshs = [];
    this.texture = new TextureLoader().load('assets/img/burash01.png');

    /** 波紋の最大描画数 */
    this.max = 100;

    /** 1フレームでマウスがどれだけ移動したら描画するか */
    this.frequecy = 5;

    /** マウス座標 */
    this.mouse = new Vector2(0, 0);

    /** 前のフレームでのマウス座標 */
    this.prevMouse = new Vector2(0, 0);

    /** 現在のフレームで描画された波紋のインデックス */
    this.currentWave = 0;

    this.scene = new Scene();
    this.target = new WebGLRenderTarget(window.innerWidth, window.innerHeight);

    const { width, height, near, far } = this.cameraPos();
    this.camera = new OrthographicCamera( -width, width, height, -height, near, far );
    this.camera.position.set(0, 0, 2);

    this.handleMouseMove = (e) => {
      this.mouse.x = e.clientX - window.innerWidth / 2;
      this.mouse.y = window.innerHeight / 2 - e.clientY;
    }

    this.createMesh();

    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('resize', this.handleResize)
  }

  cameraPos() {
    const frustumSize = window.innerHeight;
    const aspect = window.innerWidth / window.innerHeight;
    const [w, h] = [(frustumSize * aspect) / 2, frustumSize / 2];
    return { width: w, height: h, near: -1000, far: 1000 };
  }

  createMesh() {
    const size = 64;
    const geometry = new PlaneGeometry(size, size);
    const material = new MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false
    });
    for( let i = 0; i < this.max; i++ ) {
      const mesh = new Mesh(geometry.clone(), material.clone());
      mesh.rotation.z = 2 * Math.PI * Math.random();
      mesh.visible = false;
      this.scene.add(mesh);
      this.meshs.push(mesh);
    };
  }

  handleResize() {
    const { width, height } = this.cameraPos();
    this.camera.left = -width;
    this.camera.right = width;
    this.camera.top = height;
    this.camera.bottom = -height;
    this.camera.updateProjectionMatrix();
    this.target.setSize(window.innerWidth, window.innerHeight);
  }

  setNewWave() {
    const mesh = this.meshs[this.currentWave];
    mesh.visible = true;
    mesh.position.set(this.mouse.x, this.mouse.y, 0);
    mesh.scale.x = mesh.scale.y = 0.2;
    mesh.material.opacity = 0.5;
  }

  trackMousePos() {
    // 今のマウス座標と前回のフレームのマウス座標の距離
    const distance = this.mouse.distanceTo(this.prevMouse);
    if(this.frequecy < distance) {
      this.setNewWave();
      this.currentWave = (this.currentWave + 1) % this.max;
    }
    this.prevMouse.x = this.mouse.x;
    this.prevMouse.y = this.mouse.y;
  }

  update(gl, uTexture) {
    this.trackMousePos();
    gl.setRenderTarget(this.target);
    gl.render(this.scene, this.camera);
    uTexture.value = this.target.texture;
    gl.setRenderTarget(null);
    gl.clear();
    this.meshs.forEach((mesh) => {
      if(mesh.visible) {
        const material = mesh.material;
        mesh.rotation.z += 0.02;
        material.opacity *= 0.97;
        mesh.scale.x = 0.98 * mesh.scale.x + 0.17;
        mesh.scale.y = mesh.scale.x;
        if(material.opacity < 0.002) {
          mesh.visible = false;
        }
      }
    });
  }

  dispose() {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);
  }

}