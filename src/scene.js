import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildDetailedPC } from './scene-model.js';

const material = (color, metalness = 0.35, roughness = 0.45) => new THREE.MeshStandardMaterial({ color, metalness, roughness });

export class PCScene {
  constructor(container, onSelect) {
    this.container = container;
    this.onSelect = onSelect;
    this.powered = false;
    this.rgbColor = '#69f2b2';
    this.rgbMode = 'static';
    this.openSide = true;
    this.fans = [];
    this.leds = [];
    this.textureCache = new Map();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#161c1d');
    this.scene.fog = new THREE.Fog('#161c1d', 17, 33);
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
    this.camera.position.set(6.1, 3.15, 8.6);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    const studio = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.environment = pmrem.fromScene(studio, 0.04);
    this.scene.environment = this.environment.texture;
    this.scene.environmentIntensity = 0.4;
    studio.dispose(); pmrem.dispose();
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label', 'Трёхмерная модель сборки ПК. Перетаскивайте для вращения, прокручивайте для приближения.');
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, -0.15, 0);
    this.controls.enableDamping = true;
    this.controls.minDistance = 3;
    this.controls.maxPolarAngle = Math.PI * 0.94;
    this.controls.maxDistance = 16;
    this.controls.enablePan = true;
    this.exploded = false;
    this.inspectionPanels = [];
    this.scene.add(new THREE.HemisphereLight(0xe4edf3, 0x27383b, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(3, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -5; key.shadow.camera.right = 5;
    key.shadow.camera.top = 6; key.shadow.camera.bottom = -5;
    key.shadow.normalBias = 0.005;
    key.shadow.bias = -0.00015;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xb8cedf, 1.4);
    rim.position.set(-5, 3, -4);
    this.scene.add(rim);
    const frontFill = new THREE.DirectionalLight(0xdfece6, 1.1);
    frontFill.position.set(-2, 1, 7);
    this.scene.add(frontFill);
    this.rgbLight = new THREE.PointLight(this.rgbColor, 0, 6, 2);
    this.rgbLight.position.set(0.3, 0.4, 1);
    this.scene.add(this.rgbLight);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), material('#161c1d', 0.15, 0.8));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.11;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.model = new THREE.Group();
    this.scene.add(this.model);
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.down = null;
    this.onPointerDown = event => { this.down = [event.clientX, event.clientY]; };
    this.onPointerUp = event => {
      if (!this.down || Math.hypot(event.clientX - this.down[0], event.clientY - this.down[1]) > 5) return;
      const bounds = this.renderer.domElement.getBoundingClientRect();
      this.pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hit = this.raycaster.intersectObjects(this.model.children, true).find(item => {
        let object = item.object;
        while (object) { if (object.userData.category) return true; object = object.parent; }
        return false;
      });
      if (!hit) return;
      let object = hit.object;
      while (object && !object.userData.category) object = object.parent;
      if (object) this.onSelect(object.userData.category);
    };
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.addEventListener('pointerup', this.onPointerUp);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.clock = new THREE.Clock();
    this.time = 0;
    this.renderer.setAnimationLoop(() => this.animate());
  }

  box(parent, size, position, mat) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  cylinder(parent, radius, depth, position, mat, segments = 32) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, segments), mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(...position);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  led() {
    const led = material('#d8e9e0', 0.15, 0.3);
    this.leds.push(led);
    return led;
  }

  fan(parent, position, size, rgb, color = '#292d32', rotationY = 0) {
    const group = new THREE.Group();
    group.position.set(...position);
    group.rotation.y = rotationY;
    parent.add(group);
    const frame = material(color);
    for (const x of [-1, 1]) this.box(group, [size * 0.09, size, 0.1], [x * size * 0.46, 0, 0], frame);
    for (const y of [-1, 1]) this.box(group, [size, size * 0.09, 0.1], [0, y * size * 0.46, 0], frame);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(size * 0.39, size * 0.023, 12, 80), rgb ? this.led() : frame);
    ring.position.z = 0.035;
    group.add(ring);
    const rotor = new THREE.Group();
    group.add(rotor);
    const bladeMat = material(rgb ? '#d5dbe0' : '#30363c', 0.15, 0.58);
    const shape = new THREE.Shape();
    shape.moveTo(size * 0.09, -size * 0.035);
    shape.bezierCurveTo(size * 0.23, -size * 0.11, size * 0.39, -size * 0.04, size * 0.4, size * 0.1);
    shape.bezierCurveTo(size * 0.31, size * 0.16, size * 0.21, size * 0.08, size * 0.09, size * 0.035);
    shape.closePath();
    const bladeGeometry = new THREE.ExtrudeGeometry(shape, { depth: 0.018, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, steps: 1, curveSegments: 12 });
    for (let index = 0; index < 9; index++) {
      const blade = new THREE.Mesh(bladeGeometry, bladeMat);
      blade.rotation.z = index / 9 * Math.PI * 2;
      blade.position.z = 0.015;
      rotor.add(blade);
    }
    for (const x of [-1, 1]) for (const y of [-1, 1]) {
      this.cylinder(group, size * 0.025, 0.018, [x * size * 0.435, y * size * 0.435, 0.064], material('#9da4ac'), 12);
    }
    this.cylinder(group, size * 0.11, 0.1, [0, 0, 0.04], frame);
    this.fans.push(rotor);
    return group;
  }

  label(parent, text, width, height, position, color = '#b4bcc0') {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 256;
    const context = canvas.getContext('2d');
    context.fillStyle = color;
    context.font = `600 ${Math.min(116, 1550 / Math.max(text.length, 1))}px Arial`;
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillText(text, 512, 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    const label = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
    label.position.set(...position);
    parent.add(label);
    return label;
  }

  textureFor(path, crop) {
    if (!this.textureCache) return null;
    const key = `${path}:${crop || ''}`;
    if (!this.textureCache.has(key)) {
      const texture = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}${path}`);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      texture.userData.cached = true;
      if (crop) { texture.offset.set(crop[0], crop[1]); texture.repeat.set(crop[2] - crop[0], crop[3] - crop[1]); }
      this.textureCache.set(key, texture);
    }
    return this.textureCache.get(key);
  }

  component(category) {
    const group = new THREE.Group();
    group.userData.category = category;
    this.model.add(group);
    return group;
  }

  update(parts) {
    const changed = new Set(Object.keys(parts).filter(category => this.previousParts?.[category] !== parts[category]?.id));
    this.previousParts = Object.fromEntries(Object.entries(parts).map(([category, item]) => [category, item?.id]));
    this.model.traverse(object => {
      object.geometry?.dispose();
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(mat => { if (!mat.map?.userData.cached) mat.map?.dispose(); mat.alphaMap?.dispose(); mat.dispose(); });
      }
    });
    this.model.clear();
    this.fans = []; this.leds = []; this.glass = null;
    this.inspectionPanels = [];
    buildDetailedPC(this, parts);
    this.applyInspection();
    this.installations = [];
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.model.children.forEach(group => {
        if (changed.has(group.userData.category) && group.userData.category !== 'case') {
          group.position.z = 0.65;
          group.scale.setScalar(0.86);
          this.installations.push({ group, progress: 0 });
        }
      });
    }
    this.setPower(this.powered);
  }

  applyInspection() {
    this.inspectionPanels.forEach(panel => { panel.visible = !this.exploded; });
    if (this.glass) this.glass.visible = !this.openSide && !this.exploded;
  }
  setInspection(enabled) { this.exploded = enabled; this.applyInspection(); }
  setPower(powered) { this.powered = powered; }
  setRGB(color, mode) { this.rgbColor = color; this.rgbMode = mode; }
  setSide(open) { this.openSide = open; this.applyInspection(); }
  resetCamera() { this.camera.position.set(6.1, 3.15, 8.6); this.controls.target.set(0, -0.15, 0); this.controls.update(); }
  resize() {
    const { width, height } = this.container.getBoundingClientRect();
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  animate() {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.time += delta;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.installations?.forEach(installation => {
      installation.progress = Math.min(1, installation.progress + delta * 2.5);
      const remaining = Math.pow(1 - installation.progress, 3);
      installation.group.userData.installOffset = remaining * 0.65;
      installation.group.scale.setScalar(1 - remaining * 0.14);
    });
    const offsets = { cooler: [0, 0.35, 1.65], cpu: [0, 0, 0.72], ram: [0.35, 0.12, 0.7], gpu: [0, -0.24, 1.3], storage: [0, -0.1, 0.8], psu: [-0.2, -0.2, 0.65] };
    this.model.children.forEach(group => {
      const target = this.exploded ? (offsets[group.userData.category] || [0, 0, 0]) : [0, 0, 0];
      const amount = reduced ? 1 : 1 - Math.exp(-delta * 8);
      const offset = group.userData.inspectionOffset || (group.userData.inspectionOffset = new THREE.Vector3());
      offset.lerp(new THREE.Vector3(...target), amount);
      group.position.copy(offset);
      group.position.z += group.userData.installOffset || 0;
    });
    if (this.powered && !reduced) this.fans.forEach(fan => { fan.rotation.z -= delta * 13; });
    const color = new THREE.Color(this.rgbColor);
    if (this.rgbMode === 'rgb' || this.rgbMode === 'rainbow') color.setHSL(reduced ? 0.35 : (this.time * 0.08) % 1, 0.95, 0.5);
    const intensity = this.powered ? (this.rgbMode === 'breathe' && !reduced ? 0.2 + (Math.sin(this.time * 2) + 1) * 0.6 : 1.25) : 0;
    this.leds.forEach((led, index) => {
      const ledColor = color.clone();
      if (this.rgbMode === 'rainbow') ledColor.offsetHSL(index / Math.max(this.leds.length, 1), 0, 0);
      led.emissive.copy(ledColor);
      led.emissiveIntensity = intensity;
      led.color.set(this.powered ? ledColor : '#bdc6c8');
      if (this.powered) led.color.multiplyScalar(0.1);
      led.toneMapped = !this.powered;
    });
    this.rgbLight.color.copy(color);
    this.rgbLight.intensity = this.leds.length ? intensity * 1.6 : 0;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
