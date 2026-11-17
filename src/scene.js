import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#161c1d');
    this.scene.fog = new THREE.Fog('#161c1d', 17, 33);
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
    this.camera.position.set(6.5, 3.5, 8.8);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label', 'Трёхмерная модель сборки ПК. Перетаскивайте для вращения, прокручивайте для приближения.');
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.1, 0);
    this.controls.enableDamping = true;
    this.controls.minDistance = 4.8;
    this.controls.maxDistance = 16;
    this.controls.enablePan = true;
    this.scene.add(new THREE.HemisphereLight(0xdbeafa, 0x27383b, 2.3));
    const key = new THREE.DirectionalLight(0xffffff, 4.5);
    key.position.set(3, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -5; key.shadow.camera.right = 5;
    key.shadow.camera.top = 6; key.shadow.camera.bottom = -5;
    key.shadow.normalBias = 0.03;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x8ca8c9, 3);
    rim.position.set(-5, 3, -4);
    this.scene.add(rim);
    const frontFill = new THREE.DirectionalLight(0xdfece6, 2.8);
    frontFill.position.set(-2, 1, 7);
    this.scene.add(frontFill);
    this.rgbLight = new THREE.PointLight(this.rgbColor, 0, 6, 2);
    this.rgbLight.position.set(0.3, 0.4, 1);
    this.scene.add(this.rgbLight);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), material('#161c1d', 0.15, 0.8));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.48;
    floor.receiveShadow = true;
    this.scene.add(floor);
    const grid = new THREE.GridHelper(20, 40, '#2d3a3b', '#233031');
    grid.position.y = -2.475;
    grid.material.transparent = true;
    grid.material.opacity = 0.42;
    this.scene.add(grid);
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
    const ring = new THREE.Mesh(new THREE.TorusGeometry(size * 0.39, size * 0.034, 8, 48), rgb ? this.led() : frame);
    ring.position.z = 0.035;
    group.add(ring);
    const rotor = new THREE.Group();
    group.add(rotor);
    const bladeMat = material(rgb ? '#ccd2d4' : '#454b51', 0.2, 0.6);
    for (let index = 0; index < 9; index++) {
      const blade = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), bladeMat);
      const angle = index / 9 * Math.PI * 2;
      blade.position.set(Math.cos(angle) * size * 0.22, Math.sin(angle) * size * 0.22, 0);
      blade.scale.set(size * 0.22, size * 0.085, 0.025);
      blade.rotation.z = angle + 0.5;
      rotor.add(blade);
    }
    this.cylinder(group, size * 0.11, 0.1, [0, 0, 0.04], frame);
    this.fans.push(rotor);
    return group;
  }

  label(parent, text, width, height, position, color = '#b4bcc0') {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const context = canvas.getContext('2d');
    context.fillStyle = color;
    context.font = '600 58px Arial';
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillText(text, 256, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
    label.position.set(...position);
    parent.add(label);
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
        materials.forEach(mat => { mat.map?.dispose(); mat.dispose(); });
      }
    });
    this.model.clear();
    this.fans = []; this.leds = []; this.glass = null;
    const dark = material('#171c22', 0.55, 0.4);
    const silver = material('#949da5', 0.8, 0.3);
    const pcb = material('#202b29', 0.2, 0.8);
    if (parts.case) {
      const group = this.component('case');
      const shell = material(parts.case.appearance.color, 0.55, 0.38);
      this.box(group, [2.9, 0.1, 2.25], [0, -2.16, 0], shell);
      this.box(group, [2.9, 0.1, 2.25], [0, 2.16, 0], shell);
      this.box(group, [2.9, 4.25, 0.07], [0, 0, -1.1], shell);
      this.box(group, [0.08, 4.25, 2.25], [-1.41, 0, 0], shell);
      for (const x of [-1.4, 1.4]) this.box(group, [0.065, 4.3, 0.065], [x, 0, 1.1], shell);
      for (const y of [-2.13, 2.13]) this.box(group, [2.86, 0.065, 0.065], [0, y, 1.1], shell);
      this.box(group, [2.83, 0.08, 2.1], [0, -1.22, 0], shell);
      this.box(group, [2.83, 0.8, 0.06], [0, -1.68, 1.035], shell);
      for (const x of [-1, 1]) for (const z of [-0.75, 0.75]) this.box(group, [0.3, 0.22, 0.35], [x, -2.31, z], dark);
      for (let index = 0; index < 3; index++) this.fan(group, [1.34, 1.3 - index * 1.28, 0], 1.16, parts.case.appearance.rgb, parts.case.appearance.color, Math.PI / 2);
      for (let index = 0; index < 20; index++) this.box(group, [0.035, 0.025, 1.96], [1.45, -1.98 + index * 0.205, 0], dark);
      this.glass = this.box(group, [2.72, 4.13, 0.025], [0, 0, 1.12], new THREE.MeshPhysicalMaterial({ color: '#b9d2d7', transparent: true, opacity: 0.17, metalness: 0, roughness: 0.12, side: THREE.DoubleSide, depthWrite: false }));
      this.glass.visible = !this.openSide;
      this.label(group, 'С Б О Р К А', 0.95, 0.22, [0, -1.69, 1.075]);
    }
    if (parts.motherboard) {
      const group = this.component('motherboard');
      this.box(group, [2.34, 2.72, 0.075], [-0.15, 0.38, -0.8], pcb);
      const trim = material(parts.motherboard.appearance.color, 0.7, 0.36);
      this.box(group, [0.35, 1.55, 0.23], [-1.12, 0.82, -0.64], trim);
      this.box(group, [0.65, 0.38, 0.2], [-0.52, 1.49, -0.64], trim);
      this.box(group, [0.57, 0.48, 0.12], [0.49, -0.4, -0.68], trim);
      for (let index = 0; index < 4; index++) this.box(group, [1.2, 0.065, 0.11], [-0.23, -0.14 - index * 0.25, -0.69], dark);
      for (let index = 0; index < 17; index++) {
        const x = -0.92 + (index % 5) * 0.42;
        const y = -0.77 + Math.floor(index / 5) * 0.18;
        this.cylinder(group, 0.035, 0.1, [x, y, -0.67], silver, 12);
      }
      for (const x of [-1.22, 0.92]) for (const y of [-0.84, 1.58]) this.cylinder(group, 0.045, 0.04, [x, y, -0.72], silver, 12);
      this.label(group, parts.motherboard.brand, 0.6, 0.13, [-0.63, -0.88, -0.73]);
    }
    if (parts.cpu) {
      const group = this.component('cpu');
      this.box(group, [0.65, 0.65, 0.12], [-0.3, 0.82, -0.62], dark);
      this.box(group, [0.48, 0.48, 0.045], [-0.3, 0.82, -0.53], silver);
      this.label(group, parts.cpu.brand, 0.39, 0.11, [-0.3, 0.82, -0.5], '#30353a');
    }
    if (parts.cooler) {
      const group = this.component('cooler');
      const coolerMat = material(parts.cooler.appearance.color, 0.6, 0.45);
      for (let index = 0; index < 20; index++) this.box(group, [0.94, 0.022, 0.66], [-0.3, 0.24 + index * 0.055, -0.13], silver);
      this.box(group, [0.94, 0.07, 0.67], [-0.3, 1.34, -0.13], coolerMat);
      this.fan(group, [-0.3, 0.8, 0.25], 1.02, parts.cooler.appearance.rgb, parts.cooler.appearance.color);
    }
    if (parts.ram) {
      const group = this.component('ram');
      const ramMat = material(parts.ram.appearance.color, 0.55, 0.4);
      for (let index = 0; index < parts.ram.specs.sticks; index++) {
        const x = 0.46 + index * 0.19;
        this.box(group, [0.09, 1.42, 0.26], [x, 0.82, -0.54], ramMat);
        this.box(group, [0.1, 1.33, 0.055], [x, 0.85, -0.37], parts.ram.appearance.rgb ? this.led() : ramMat);
      }
    }
    if (parts.gpu) {
      const group = this.component('gpu');
      const width = Math.min(parts.gpu.specs.length / 110, 2.6);
      const gpuMat = material(parts.gpu.appearance.color, 0.6, 0.4);
      this.box(group, [width, 0.36, 0.9], [-0.1, -0.37, -0.1], gpuMat);
      this.box(group, [width, 0.035, 0.9], [-0.1, -0.16, -0.1], dark);
      const fans = new THREE.Group();
      fans.position.set(-0.1, -0.57, -0.1);
      fans.rotation.x = Math.PI / 2;
      group.add(fans);
      for (let index = 0; index < parts.gpu.specs.fans; index++) this.fan(fans, [(index - (parts.gpu.specs.fans - 1) / 2) * width / parts.gpu.specs.fans, 0, 0], Math.min(0.73, width / parts.gpu.specs.fans), false, parts.gpu.appearance.color);
      this.label(group, parts.gpu.brand === 'Sapphire' ? 'RADEON' : 'GEFORCE RTX', width * 0.62, 0.14, [-0.13, -0.36, 0.36], parts.gpu.appearance.color === '#e4e7ed' ? '#363c42' : '#e4e8eb');
      this.box(group, [width * 0.75, 0.025, 0.03], [-0.1, -0.2, 0.37], parts.gpu.appearance.rgb ? this.led() : material(parts.gpu.appearance.accent || '#454d54'));
    }
    if (parts.storage) {
      const group = this.component('storage');
      if (parts.storage.specs.interface === 'SATA') {
        this.box(group, [0.84, 0.25, 1.1], [0.72, -1.75, 0], silver);
      } else {
        this.box(group, [0.85, 0.21, 0.04], [0.2, -0.89, -0.71], material(parts.storage.appearance.color));
        for (let index = 0; index < 3; index++) this.box(group, [0.18, 0.13, 0.035], [-0.07 + index * 0.25, -0.89, -0.67], dark);
      }
    }
    if (parts.psu) {
      const group = this.component('psu');
      this.box(group, [1.1, 0.7, 1.4], [-0.7, -1.68, -0.06], material(parts.psu.appearance.color));
      this.label(group, `${parts.psu.specs.watts} W`, 0.65, 0.17, [-0.71, -1.68, 0.66]);
      for (let index = 0; index < 4; index++) {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.1, -1.65, -0.1 - index * 0.06),
          new THREE.Vector3(0.85, -1.4, -0.5),
          new THREE.Vector3(0.94, -0.4 + index * 0.08, -0.52),
        ]);
        group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.023, 6, false), dark));
      }
    }
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

  setPower(powered) { this.powered = powered; }
  setRGB(color, mode) { this.rgbColor = color; this.rgbMode = mode; }
  setSide(open) { this.openSide = open; if (this.glass) this.glass.visible = !open; }
  resetCamera() { this.camera.position.set(6.5, 3.5, 8.8); this.controls.target.set(0, 0.1, 0); this.controls.update(); }
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
      installation.group.position.z = remaining * 0.65;
      installation.group.scale.setScalar(1 - remaining * 0.14);
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
