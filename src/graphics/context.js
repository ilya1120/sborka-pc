import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const U = 0.01;
const axes = { x: [1, 0, 0], '-x': [-1, 0, 0], y: [0, 1, 0], '-y': [0, -1, 0], z: [0, 0, 1], '-z': [0, 0, -1] };
const normal = axis => new THREE.Vector3(...(axes[axis] || axes.z));
function orient(mesh, axis, source = new THREE.Vector3(0, 0, 1)) {
  mesh.quaternion.setFromUnitVectors(source, normal(axis));
  return mesh;
}

export function createModelContext(view, parts, layout) {
  const materials = new Map(), geometries = new Map();
  const ctx = { view, parts, layout, ports: {}, routes: [], profileSources: [] };
  const geo = (key, make) => { if (!geometries.has(key)) geometries.set(key, make()); return geometries.get(key); };
  const mesh = (parent, geometry, material, pos, axis) => {
    const result = new THREE.Mesh(geometry, material);
    result.position.set(...pos.map(v => v * U));
    if (axis) orient(result, axis);
    result.castShadow = true; result.receiveShadow = true; parent.add(result); return result;
  };
  ctx.mat = (color, metalness = 0.25, roughness = 0.55) => {
    const key = `${color}:${metalness}:${roughness}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, metalness, roughness }));
    return materials.get(key);
  };
  ctx.component = category => { const group = view.component(category); group.userData.profile = parts[category]?.id; return group; };
  ctx.box = (parent, size, pos, material, radius = 0) => {
    const key = `box:${size.join(':')}:${radius}`;
    return mesh(parent, geo(key, () => radius > 0
      ? new RoundedBoxGeometry(...size.map(v => v * U), 2, Math.min(radius, ...size.map(v => v / 3)) * U)
      : new THREE.BoxGeometry(...size.map(v => v * U))), material, pos);
  };
  ctx.boxes = (parent, size, positions, material) => {
    if (!positions.length) return null;
    const geometry = geo(`box:${size.join(':')}:0`, () => new THREE.BoxGeometry(...size.map(v => v * U)));
    const result = new THREE.InstancedMesh(geometry, material, positions.length);
    const transform = new THREE.Object3D();
    positions.forEach((pos, i) => { transform.position.set(...pos.map(v => v * U)); transform.updateMatrix(); result.setMatrixAt(i, transform.matrix); });
    result.castShadow = true; result.receiveShadow = true; parent.add(result); return result;
  };
  ctx.cylinder = (parent, radius, depth, pos, material, axis = 'z', segments = 32) => {
    const geometry = geo(`cylinder:${radius}:${depth}:${segments}`, () => new THREE.CylinderGeometry(radius * U, radius * U, depth * U, segments));
    const result = mesh(parent, geometry, material, pos);
    return orient(result, axis, new THREE.Vector3(0, 1, 0));
  };
  ctx.torus = (parent, radius, tube, pos, material, axis = 'z') => mesh(parent,
    geo(`torus:${radius}:${tube}`, () => new THREE.TorusGeometry(radius * U, tube * U, 8, 64)), material, pos, axis);
  ctx.tube = (parent, points, radius, material) => {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p.map(v => v * U))), false, 'centripetal');
    const geometry = new THREE.TubeGeometry(curve, Math.max(24, points.length * 8), radius * U, 7, false);
    return mesh(parent, geometry, material, [0, 0, 0]);
  };
  ctx.screw = (parent, pos, axis = 'z', radius = 2, kind = 'phillips') => {
    const group = new THREE.Group(); group.position.set(...pos.map(v => v * U)); orient(group, axis); parent.add(group);
    const steel = ctx.mat('#7c858e', 0.8, 0.28), recess = ctx.mat('#11151a', 0.08, 0.8);
    ctx.cylinder(group, radius, 1.5, [0, 0, 0], steel, 'z', kind === 'hex' ? 6 : 20);
    ctx.torus(group, radius * 0.87, radius * 0.11, [0, 0, 0.75], steel);
    if (kind === 'hex') ctx.cylinder(group, radius * 0.42, 0.05, [0, 0, 0.79], recess, 'z', 6);
    else {
      ctx.box(group, [radius * 1.25, radius * 0.25, 0.06], [0, 0, 0.79], recess);
      ctx.box(group, [radius * 0.25, radius * 1.25, 0.065], [0, 0, 0.79], recess);
    }
    return group;
  };
  ctx.label = (parent, text, width, height, pos, color = '#b9bdc1', axis = 'z') => {
    const label = view.label(parent, text, width * U, height * U, pos.map(v => v * U), color);
    if (label) { orient(label, axis); label.userData.keep = true; }
    return label || null;
  };
  ctx.photo = (parent, path, width, height, pos, options = {}) => {
    if (!view.textureFor || !path) return null;
    const texture = view.textureFor(path, options.crop);
    const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.78, metalness: 0.08, polygonOffset: true, polygonOffsetFactor: -1 });
    const result = mesh(parent, new THREE.PlaneGeometry(width * U, height * U), material, pos, options.axis || 'z');
    result.userData.keep = true; result.castShadow = false; return result;
  };
  ctx.led = () => view.led();
  ctx.fan = (parent, pos, diameter, options = {}) => {
    const { rgb = false, color = '#24282d', axis = 'z', blades = 9, frame = true, label = '', ledSegments = 12, depth = frame ? 25 : 10 } = options;
    const group = new THREE.Group(); group.position.set(...pos.map(v => v * U)); orient(group, axis); parent.add(group);
    const plastic = ctx.mat(color, 0.08, 0.58), dark = ctx.mat('#161b20', 0.05, 0.75), tip = ctx.mat(rgb ? '#c5d0d4' : '#343a40', 0.05, 0.58);
    const R = diameter * 0.435;
    if (frame) {
      for (const x of [-1, 1]) ctx.box(group, [diameter * 0.065, diameter, depth - 1], [x * diameter * 0.465, 0, 0], plastic, 1.7);
      for (const y of [-1, 1]) ctx.box(group, [diameter, diameter * 0.065, depth - 1], [0, y * diameter * 0.465, 0], plastic, 1.7);
      for (const x of [-1, 1]) for (const y of [-1, 1]) {
        ctx.box(group, [diameter * 0.14, diameter * 0.14, depth], [x * diameter * 0.42, y * diameter * 0.42, 0], dark, 2.2);
        ctx.screw(group, [x * diameter * 0.438, y * diameter * 0.438, depth / 2 + .5], 'z', 2.1);
      }
    }
    ctx.torus(group, R, 1.6, [0, 0, depth * .24], plastic);
    // Rear support struts stay fixed; only the actual impeller rotates.
    const supports = new THREE.Group(); supports.position.z = (-depth / 2 + 2) * U; group.add(supports);
    for (let i = 0; i < 4; i++) {
      const bar = ctx.box(supports, [R, 4.5, 3], [R / 2, 0, 0], dark, 0.8);
      bar.rotation.z = i * Math.PI / 2; bar.position.set(Math.cos(i * Math.PI / 2) * R / 2 * U, Math.sin(i * Math.PI / 2) * R / 2 * U, 0);
    }
    if (rgb) {
      for (let i = 0; i < ledSegments; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry((R - 1.5) * U, 1.8 * U, 8, 8, Math.PI * 2 / ledSegments + 0.012), ctx.led());
        ring.rotation.z = i * Math.PI * 2 / ledSegments; ring.position.z = 7 * U; group.add(ring);
      }
    }
    const rotor = new THREE.Group(); rotor.userData.dynamic = true; group.add(rotor); view.fans.push(rotor);
    const bladeShape = new THREE.Shape();
    const d = diameter * U;
    bladeShape.moveTo(d * 0.105, -d * 0.028);
    bladeShape.bezierCurveTo(d * 0.21, -d * 0.11, d * 0.39, -d * 0.10, d * 0.42, d * 0.065);
    bladeShape.bezierCurveTo(d * 0.36, d * 0.15, d * 0.23, d * 0.075, d * 0.10, d * 0.033); bladeShape.closePath();
    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 1.3 * U, bevelEnabled: true, bevelSize: 0.45 * U, bevelThickness: 0.4 * U, bevelSegments: 2, curveSegments: 12, steps: 1 });
    for (let i = 0; i < blades; i++) { const blade = new THREE.Mesh(bladeGeo, tip); blade.rotation.z = i * Math.PI * 2 / blades; blade.position.z = 1.5 * U; blade.castShadow = true; rotor.add(blade); }
    ctx.cylinder(rotor, diameter * 0.105, Math.min(12, depth - 2), [0, 0, 0], plastic);
    ctx.cylinder(rotor, diameter * 0.074, 0.6, [0, 0, Math.min(6, depth / 2 - 1) + .4], dark);
    if (label) ctx.label(rotor, label, diameter * 0.14, diameter * 0.047, [0, 0, Math.min(6, depth / 2 - 1) + .8], '#c5cbd0');
    group.userData.fanDiameter = diameter; return group;
  };
  ctx.holePanel = (parent, size, pos, material, axis = 'z', pitch = 4, hole = 2.4, square = false) => {
    if (typeof document === 'undefined') return orient(ctx.box(parent, [size[0], size[1], 0.8], pos, material), axis);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const context = canvas.getContext('2d'); context.fillStyle = '#fff'; context.fillRect(0, 0, 128, 128); context.fillStyle = '#000';
    const ratio = hole / pitch;
    for (let y = 16; y < 128; y += 32) for (let x = 16; x < 128; x += 32) {
      if (square) context.fillRect(x - 16 * ratio, y - 16 * ratio, 32 * ratio, 32 * ratio);
      else { context.beginPath(); context.arc(x, y, 16 * ratio, 0, Math.PI * 2); context.fill(); }
    }
    const alpha = new THREE.CanvasTexture(canvas); alpha.wrapS = alpha.wrapT = THREE.RepeatWrapping;
    alpha.repeat.set(size[0] / pitch / 4, size[1] / pitch / 4); alpha.anisotropy = view.renderer?.capabilities.getMaxAnisotropy() || 1;
    const panelMat = material.clone(); panelMat.alphaMap = alpha; panelMat.alphaTest = 0.45; panelMat.alphaToCoverage = true; panelMat.side = THREE.DoubleSide;
    const result = mesh(parent, new THREE.PlaneGeometry(size[0] * U, size[1] * U), panelMat, pos, axis);
    result.castShadow = false; result.userData.keep = true; return result;
  };
  return ctx;
}

// Collapse fixed details per material while preserving rotors, side panels and labels.
export function consolidateStaticModel(model) {
  const originals = new Set();
  model.traverse(object => { if (object.geometry) originals.add(object.geometry); });
  for (const component of model.children) {
    component.updateMatrixWorld(true);
    const batches = new Map(), inverse = component.matrixWorld.clone().invert();
    function collect(object, dynamic = false) {
      dynamic ||= !!object.userData.dynamic || !!object.userData.keep;
      if (object.isMesh && !object.isInstancedMesh && !dynamic && !Array.isArray(object.material) && !object.material.transparent && !object.material.map && !object.material.alphaMap) {
        if (!batches.has(object.material)) batches.set(object.material, []);
        batches.get(object.material).push(object);
      }
      for (const child of object.children) collect(child, dynamic);
    }
    collect(component);
    for (const [material, objects] of batches) {
      if (objects.length < 3) continue;
      const sources = objects.map(object => {
        let geometry = object.geometry.clone();
        if (geometry.index) { const expanded = geometry.toNonIndexed(); geometry.dispose(); geometry = expanded; }
        geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld)); return geometry;
      });
      const merged = mergeGeometries(sources, false); sources.forEach(source => source.dispose());
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, material); mesh.castShadow = true; mesh.receiveShadow = true; component.add(mesh);
      objects.forEach(object => object.removeFromParent());
    }
  }
  const retained = new Set();
  model.traverse(object => { if (object.geometry) retained.add(object.geometry); });
  originals.forEach(geometry => { if (!retained.has(geometry)) geometry.dispose(); });
}
