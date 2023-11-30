import {
  Color,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  TextureLoader,
  Vector3,
  WebGLRenderer,
  DoubleSide,
  MeshBasicMaterial,
  Clock,
  Vector4,
  SphereGeometry,
  AdditiveBlending,
  Vector2,
  OrthographicCamera,
  WebGLRenderTarget,
  LinearFilter,
  RGBAFormat,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { CustomPass } from './CustomPass';

import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import { DotScreenShader } from 'three/examples/jsm/shaders/DotScreenShader.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// import { getProject, types as t } from '@theatre/core'
// import studio from '@theatre/studio'

// studio.initialize();
// const project = getProject('THREE.js x Theatre.js');
// const sheet = project.sheet('Scene');

// const distortion = sheet.object('Distortion', {
//   // Note that the rotation is in radians
//   // (full rotation: 2 * Math.PI)
//   // rotation: types.compound({
//   //   x: types.number(mesh.rotation.x, { range: [-2, 2] }),
//   //   y: types.number(mesh.rotation.y, { range: [-2, 2] }),
//   //   z: types.number(mesh.rotation.z, { range: [-2, 2] }),
//   // }),
//   progress: t.number(0,{range:[0,1]}),
//   bar: true,
//   baz: 'A string'
// });

import vertexShader from "./shader/vertex.glsl";
import fragmentShader from "./shader/fragment.glsl";
import GUI from "lil-gui";

export default class webGL {
  // コンストラクタ
  constructor(containerSelector) {
    // canvasタグが配置されるコンテナを取得
    this.container = document.querySelector(containerSelector);
    
    this.renderParam = {
      clearColor: 0x111111,
      width: window.innerWidth,
      height: window.innerHeight,
    };

    this.cameraParam = {
      fov: 45,
      aspect: window.innerWidth / window.innerHeight,
      near: 0.1,
      far: 100,
      fovRad: null,
      dist: null,
      lookAt: new Vector3(0, 0, 0),
      x: 0,
      y: 0,
      z: 2,
    };

    this.images = [
      "assets/img/image01.jpg",
      "assets/img/image02.jpg",
      "assets/img/image03.jpg"
    ];
    this.brush = "assets/img/burash01.png";

    this.mouse = new Vector2(0, 0);
    this.prevMouse = new Vector2(0, 0);
    this.currentWave = 0;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.loader = null;
    this.texture = null;
    this.geometry = null;
    this.material = null;
    this.mesh = null;
    this.uniforms = null;
    this.composer = null;
    this.time = 0;
    this.clock = new Clock();
  }

  init() {
    this._setScene();
    this._setRender();
    this._setCamera();
    this._setGui();
    this._setContorols();
    this._setTexture();
    this._createMesh();
    this._ripple();
    this._setPost();
    this.mouseEvents();
  }

  _setScene() {
    this.scene = new Scene();
    this.scene1 = new Scene();
  }

  _setRender() {
    this.renderer = new WebGLRenderer({
      antialias: true,
      transparent: true,
    });
    this.renderer.setClearColor(new Color(this.renderParam.clearColor));
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.renderParam.width, this.renderParam.height);

    this.baseTexture = new WebGLRenderTarget(
      this.renderParam.width, this.renderParam.height, {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBAFormat,
      }
    )

    this.container.appendChild(this.renderer.domElement);
  }

  _setCamera() {
    // ウィンドウとwebGLの座標を一致させるため、描画がウィンドウぴったりになるようカメラを調整
    this.camera = new PerspectiveCamera(
      this.cameraParam.fov, 
      this.cameraParam.aspect, 
      this.cameraParam.near, 
      this.cameraParam.far
    );

    this.camera1 = new OrthographicCamera (
      this.renderParam.height * this.cameraParam.aspect / - 2,
      this.renderParam.height * this.cameraParam.aspect / 2,
      this.renderParam.height / 2,
      this.renderParam.height / - 2,
      -1000,
      1000
    );

    this.camera.position.set(
      this.cameraParam.x,
      this.cameraParam.y,
      this.cameraParam.z
    );

    this.cameraParam.fovRad = (this.cameraParam.fov / 2) * (Math.PI / 180);
    this.cameraParam.dist = this.renderParam.height / 2 / Math.tan(this.cameraParam.fovRad);
    // this.camera.position.z = this.cameraParam.dist;
  }

  _setGui() {
    let that = this;
    this.settings = {
      progress: 0,
      scale: 1.0
    }
    this.gui = new GUI();
    this.gui.add(this.settings, 'progress', 0, 1, 0.01);
    this.gui.add(this.settings, 'scale', 0, 10, 0.01);
    // this.gui.add(this)
  }

  _setContorols() {
    this.contorols = new OrbitControls(this.camera, this.renderer.domElement);
  }

  _setTexture() {
    // this.texture = new TextureLoader().load(this.image);
    this.textures = this.images.map(image => new TextureLoader().load(image))
  }

  _createMesh() {
    this.geometry = new PlaneGeometry(1.9 / 2, 1 / 2, 32, 32);
    this.material = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vector4(0,0,0,0) },
        uTexture: { value: this.textures[0] },
        uNoiseFreq: { value: 3.5 },
        uNoiseAmp: { value: 0.15 },
      },
      vertexShader,
      fragmentShader,
      // wireframe: true,
      side: DoubleSide,
    });

    this.meshs = [];

    this.textures.forEach((t, i) => {
      let m = this.material.clone();
      m.uniforms.uTexture.value = t;
      let mesh = new Mesh(this.geometry, m);
      this.scene.add(mesh);
      this.meshs.push(mesh);
      mesh.position.x = i - 1;
      // mesh.position.y = -1;
    });
  }

  mouseEvents() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX - this.renderParam.width / 2;
      this.mouse.y = this.renderParam.height / 2 - e.clientY;
    })
  }

  _ripple() {
    this.max = 50;

    this.rippleGeometry = new PlaneGeometry(.25, .25, 32, 32);
    this.rippleMesh = [];
    for( let i = 0; i < this.max; i++ ) {
      let mate = new MeshBasicMaterial({
        map: new TextureLoader().load(this.brush),
        transparent: true,
        blending: AdditiveBlending,
        depthTest: false,
        depthWrite: false
      });
      let rMesh = new Mesh(this.rippleGeometry, mate);
      rMesh.rotation.z = 2 * Math.PI * Math.random();
      this.scene.add(rMesh);
      this.rippleMesh.push(rMesh);
    }
  }

  _setPost() {
    this.composer = new EffectComposer( this.renderer );
    this.composer.addPass( new RenderPass( this.scene, this.camera ) );
    this.effect1 = new ShaderPass( CustomPass );
    this.composer.addPass( this.effect1 );
  }

  _render() {
    this.renderer.render(this.scene, this.camera);
    // this.renderer.render(this.scene1, this.camera1);

    // this.renderer.setRenderTarget(this.baseTexture);
    // this.renderer.render(this.scene, this.camera);
    // // this.material.uniforms.uDisplacement.value = this.baseTexture.texture;
    // this.renderer.setRenderTarget(null);
    // this.renderer.clear();
    // this.renderer.render(this.scene1, this.camera1);

  }

  setNewWave(x, y, index) {
    let mesh = this.rippleMesh[index];
    mesh.visible = true;
    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = 0.1;
  }

  trackMousePos() {
    if(Math.abs(this.mouse.x - this.prevMouse.x) < 4 && Math.abs(this.mouse.y - this.prevMouse.y) < 4 ) {

    } else {
      this.currentWave = (this.currentWave + 1) % this.max;
      this.setNewWave(this.mouse.x, this.mouse.y, this.currentWave);
      console.log(this.currentWave)
    }

    this.prevMouse.x = this.mouse.x;
    this.prevMouse.y = this.mouse.y;
  }
  
  // 毎フレーム呼び出す
  update() {
    this.meshs.forEach((m, i) => {
      // m.position.y = -this.settings.progress;
      m.rotation.z = this.settings.progress * Math.PI / 2;
    })
    this.time += 0.01;
    this.material.uniforms.uTime.value = this.time;
    this.effect1.uniforms[ 'time' ].value = this.time;
    this.effect1.uniforms[ 'scale' ].value = this.settings.scale;
    this.effect1.uniforms[ 'progress' ].value = this.settings.progress;
    this.composer.render();

    this.rippleMesh.forEach(mesh => {
      // mesh.position.x = this.mouse.x;
      // mesh.position.y = this.mouse.y;
      // console.log(mesh.position)
    });

    this.trackMousePos();

    // this._render();

    // distortion.onValuesChange((newValues)=> {
    //   console.log(newValues);
    //   this.effect1.uniforms[ 'progress' ].value = newValues.progress;
    // })
    requestAnimationFrame(this.update.bind(this));
  }

  onResize() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    this.camera.aspect = windowWidth / windowHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(windowWidth, windowHeight);
    this.cameraParam.fovRad = (this.cameraParam.fov / 2) * (Math.PI / 180);
    this.cameraParam.dist = windowHeight / 2 / Math.tan(this.cameraParam.fovRad);
    this.camera.position.z = this.cameraParam.dist;
    this._render();
    this.composer.render();
  }
}
