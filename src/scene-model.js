import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const surface = (color, metalness = 0.5, roughness = 0.4) => new THREE.MeshStandardMaterial({ color, metalness, roughness });

// Размеры сцены: одна единица = 100 мм. Это параметрическая визуализация,
// а не CAD-модели производителей; длина GPU и высота кулера берутся из каталога.
export function buildDetailedPC(view, parts) {
  const black = surface('#15191e', 0.3, 0.55);
  const rubber = surface('#101318', 0.05, 0.85);
  const silver = surface('#a7afb8', 0.85, 0.3);
  const gold = surface('#bb9654', 0.75, 0.3);
  const pcb = surface('#202a29', 0.2, 0.75);
  const copper = surface('#9b623d', 0.75, 0.3);
  const isAP201 = parts.case?.id === 'case-ap201';
  const depth = isAP201 ? 4.6 : 4.05;
  const height = isAP201 ? 3.5 : 4.25;
  const breadth = isAP201 ? 2.05 : 2.1;
  const rear = -depth / 2;
  const front = depth / 2;
  const base = -2.12;
  const top = base + height;
  const boardZ = -breadth / 2 + 0.3;
  const boardX = rear + 1.55;
  const boardY = top - 1.53;
  const cpuX = boardX - 0.18, cpuY = boardY + 0.44;

  function round(parent, size, pos, mat, radius = 0.025) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(...size, 2, Math.min(radius, ...size.map(n => n / 3))), mat);
    mesh.position.set(...pos); mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  }
  function boxes(parent, size, positions, mat) {
    if (!positions.length) return;
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(...size), mat, positions.length);
    const transform = new THREE.Object3D();
    positions.forEach((pos, index) => { transform.position.set(...pos); transform.updateMatrix(); mesh.setMatrixAt(index, transform.matrix); });
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function screw(parent, x, y, z, radius = 0.025) {
    view.cylinder(parent, radius, 0.012, [x, y, z], silver, 12);
    view.box(parent, [radius * 1.3, 0.006, 0.003], [x, y, z + 0.008], black);
    view.box(parent, [0.006, radius * 1.3, 0.003], [x, y, z + 0.009], black);
  }
  function tube(parent, points, radius, mat) {
    const curve = new THREE.CatmullRomCurve3(points.map(pos => new THREE.Vector3(...pos)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, radius, 8, false), mat);
    mesh.castShadow = true; parent.add(mesh);
  }
  function grille(parent, width, tall, pos, rotation) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = 'black';
    for (let y = 8; y < 128; y += 16) for (let x = 8; x < 128; x += 16) { ctx.beginPath(); ctx.arc(x, y, 5.8, 0, Math.PI * 2); ctx.fill(); }
    const alphaMap = new THREE.CanvasTexture(canvas);
    alphaMap.wrapS = alphaMap.wrapT = THREE.RepeatWrapping;
    alphaMap.repeat.set(width * 2.8, tall * 2.8);
    alphaMap.anisotropy = view.renderer.capabilities.getMaxAnisotropy();
    const mat = new THREE.MeshStandardMaterial({ color: parts.case?.appearance.color || '#33363b', alphaMap, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.7, metalness: 0.45 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, tall), mat);
    mesh.position.set(...pos); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
  }

  if (parts.case) {
    const group = view.component('case');
    const shell = surface(parts.case.appearance.color, 0.55, 0.42);
    // Отдельные направляющие и штампованные панели вместо цельного куба.
    for (const y of [base, top]) {
      for (const z of [-breadth / 2, breadth / 2]) round(group, [depth, 0.065, 0.065], [0, y, z], shell);
      for (const x of [rear, front]) round(group, [0.07, 0.07, breadth], [x, y, 0], shell);
    }
    for (const x of [rear, front]) for (const z of [-breadth / 2, breadth / 2]) round(group, [0.07, height, 0.07], [x, base + height / 2, z], shell);
    view.box(group, [depth - 0.1, height - 0.1, 0.035], [0, base + height / 2, -breadth / 2], shell);
    view.box(group, [depth - 0.1, 0.045, breadth - 0.08], [0, base, 0], shell);
    grille(group, depth - 0.22, breadth - 0.16, [0, top - 0.012, 0], [-Math.PI / 2, 0, 0]);
    grille(group, breadth - 0.14, height - 0.12, [front + 0.005, base + height / 2, 0], [0, Math.PI / 2, 0]);
    // У AIR 100 три передних и один задний вентилятор; AP201 — задний.
    if (!isAP201) for (let i = 0; i < 3; i++) view.fan(group, [front - 0.16, top - 0.69 - i * 1.23, 0], 1.18, parts.case.appearance.rgb, parts.case.appearance.color, Math.PI / 2);
    view.fan(group, [rear + 0.13, top - 0.76, 0], 1.16, parts.case.appearance.rgb, parts.case.appearance.color, -Math.PI / 2);
    grille(group, 1.22, 1.22, [rear - 0.008, top - 0.76, 0], [0, Math.PI / 2, 0]);
    // Задняя панель, посадочные места PCIe и разъёмы передней панели.
    view.box(group, [0.05, 0.65, breadth - 0.1], [rear, base + 0.36, 0], shell);
    for (let i = 0; i < 4; i++) {
      view.box(group, [0.045, 0.105, 1.1], [rear, base + 0.91 + i * 0.16, 0.25], black);
      boxes(group, [0.01, 0.025, 0.1], Array.from({ length: 7 }, (_, n) => [rear - 0.028, base + 0.91 + i * 0.16, -0.2 + n * 0.14]), silver);
    }
    for (const x of [rear + 0.38, front - 0.38]) for (const z of [-0.72, 0.72]) round(group, [0.38, 0.22, 0.32], [x, base - 0.12, z], rubber);
    const io = new THREE.Group(); io.position.set(front - 0.32, top + 0.032, 0); io.rotation.x = -Math.PI / 2; group.add(io);
    view.cylinder(io, 0.075, 0.015, [0, 0.52, 0], black);
    view.cylinder(io, 0.045, 0.018, [0, 0.52, 0.004], silver);
    for (const y of [-0.1, 0.15]) { round(io, [0.11, 0.18, 0.01], [0, y, 0], black); view.box(io, [0.07, 0.1, 0.012], [0, y, 0.006], surface('#3251a1')); }
    for (const y of [-0.37, -0.55]) view.cylinder(io, 0.037, 0.018, [0, y, 0], black);
    if (!isAP201) {
      view.box(group, [depth - 0.12, 0.035, breadth - 0.1], [0, base + 0.88, 0], shell);
      const shroud = view.box(group, [depth - 0.12, 0.83, 0.03], [0, base + 0.44, breadth / 2 - 0.1], shell);
      view.inspectionPanels.push(shroud);
      view.label(group, 'MONTECH', 0.68, 0.12, [front - 0.65, base + 0.39, breadth / 2 - 0.078]);
    }
    view.glass = isAP201
      ? grille(group, depth - 0.1, height - 0.1, [0, base + height / 2, breadth / 2], [0, 0, 0])
      : view.box(group, [depth - 0.1, height - 0.1, 0.02], [0, base + height / 2, breadth / 2], new THREE.MeshPhysicalMaterial({ color: '#a6b7bf', transparent: true, opacity: 0.12, metalness: 0, roughness: 0.08, side: THREE.DoubleSide, depthWrite: false }));
    view.glass.visible = !view.openSide;
    for (const x of [rear + 0.14, front - 0.14]) for (const y of [base + 0.13, top - 0.13]) screw(group, x, y, breadth / 2 + 0.025, 0.035);
  }

  if (parts.motherboard) {
    const group = view.component('motherboard');
    const boardSize = parts.motherboard.specs.form === 'Mini-ITX' ? 1.7 : 2.44;
    view.box(group, [boardSize, boardSize, 0.035], [boardX, boardY, boardZ], pcb);
    const trim = surface(parts.motherboard.appearance.color, 0.7, 0.38);
    // Дорожки, SMD-элементы и металлизированные крепления.
    const traces = [];
    for (let i = 0; i < 48; i++) traces.push([boardX - 1.1 + (i % 16) * 0.14, boardY - 0.98 + Math.floor(i / 16) * 0.12, boardZ + 0.019]);
    boxes(group, [0.006, 0.28, 0.002], traces, surface('#52655a', 0.4, 0.65));
    const chips = [];
    for (let i = 0; i < 44; i++) chips.push([boardX - 1.05 + (i % 11) * 0.19, boardY - 0.96 + Math.floor(i / 11) * 0.13, boardZ + 0.04]);
    boxes(group, [0.065, 0.038, 0.035], chips, black);
    for (const x of [-1.1, 0, 1.1]) for (const y of [-1.1, 1.1]) screw(group, boardX + x, boardY + y, boardZ + 0.04);
    // VRM-радиаторы с рёбрами и дросселями.
    round(group, [0.33, 1.08, 0.19], [cpuX - 0.74, cpuY + 0.04, boardZ + 0.11], trim);
    round(group, [0.96, 0.22, 0.17], [cpuX - 0.1, cpuY + 0.61, boardZ + 0.1], trim);
    boxes(group, [0.025, 1.03, 0.075], Array.from({ length: 8 }, (_, i) => [cpuX - 0.87 + i * 0.035, cpuY + 0.04, boardZ + 0.235]), trim);
    boxes(group, [0.07, 0.08, 0.07], Array.from({ length: 8 }, (_, i) => [cpuX - 0.5, cpuY - 0.43 + i * 0.12, boardZ + 0.06]), silver);
    for (let i = 0; i < 8; i++) view.cylinder(group, 0.032, 0.09, [cpuX - 0.39, cpuY - 0.43 + i * 0.12, boardZ + 0.07], silver, 16);
    // DIMM: четыре слота, защёлки и центральный паз.
    for (let i = 0; i < Math.min(parts.motherboard.specs.ram_slots || 4, 4); i++) {
      const x = boardX + 0.42 + i * 0.16;
      round(group, [0.105, 1.48, 0.1], [x, cpuY - 0.04, boardZ + 0.065], black, 0.01);
      view.box(group, [0.018, 1.32, 0.012], [x, cpuY - 0.04, boardZ + 0.12], rubber);
      for (const y of [-0.77, 0.7]) round(group, [0.11, 0.1, 0.13], [x, cpuY + y, boardZ + 0.1], silver, 0.01);
    }
    for (let i = 0; i < 3; i++) {
      const y = boardY - 0.35 - i * 0.25;
      round(group, [1.1, 0.085, 0.09], [boardX - 0.4, y, boardZ + 0.07], i === 0 ? silver : black, 0.01);
      view.box(group, [0.92, 0.014, 0.015], [boardX - 0.4, y, boardZ + 0.12], rubber);
    }
    round(group, [0.4, 0.4, 0.12], [boardX + 0.55, boardY - 0.55, boardZ + 0.08], trim);
    view.label(group, parts.motherboard.brand, 0.34, 0.085, [boardX + 0.55, boardY - 0.55, boardZ + 0.145]);
    view.cylinder(group, 0.105, 0.025, [boardX - 0.95, boardY - 0.82, boardZ + 0.04], silver);
    // 24-pin и SATA-колодки.
    round(group, [0.14, 0.53, 0.17], [boardX + 1.1, boardY + 0.15, boardZ + 0.1], black, 0.01);
    for (let i = 0; i < 4; i++) round(group, [0.17, 0.13, 0.13], [boardX + 1.06, boardY - 0.65 + i * 0.16, boardZ + 0.08], black, 0.01);
    for (let i = 0; i < 6; i++) round(group, [0.16, 0.18, 0.29], [boardX - 1.2, boardY - 0.1 + i * 0.22, boardZ + 0.14], silver, 0.01);
    if (parts.motherboard.appearance.rgb) view.box(group, [0.35, 0.02, 0.03], [boardX + 0.55, boardY - 0.79, boardZ + 0.07], view.led());
  }

  if (parts.cpu) {
    const group = view.component('cpu');
    const intel = parts.cpu.specs.socket === 'LGA1700';
    round(group, [0.55, intel ? 0.68 : 0.55, 0.045], [cpuX, cpuY, boardZ + 0.05], black, 0.012);
    round(group, [0.4, intel ? 0.5 : 0.4, 0.035], [cpuX, cpuY, boardZ + 0.09], pcb, 0.008);
    round(group, [0.37, intel ? 0.47 : 0.37, 0.04], [cpuX, cpuY, boardZ + 0.125], silver, 0.025);
    view.label(group, intel ? 'intel CORE' : 'AMD RYZEN', 0.31, 0.055, [cpuX, cpuY + 0.03, boardZ + 0.147], '#41454b');
    view.label(group, parts.cpu.name.split(' ').slice(-1)[0], 0.2, 0.04, [cpuX, cpuY - 0.07, boardZ + 0.148], '#41454b');
    tube(group, [[cpuX + 0.29, cpuY - 0.29, boardZ + 0.1], [cpuX + 0.31, cpuY + 0.28, boardZ + 0.1], [cpuX + 0.38, cpuY + 0.3, boardZ + 0.08]], 0.009, silver);
  }
  if (parts.cooler) {
    const group = view.component('cooler');
    const finish = surface(parts.cooler.appearance.color, 0.65, 0.38);
    const coolerHeight = Math.min(Math.max(Number(parts.cooler.specs.height) || 150, 80), 200) / 100;
    const frontZ = boardZ + coolerHeight;
    // Башня растёт перпендикулярно плате; пакеты алюминиевых пластин и U-трубки.
    boxes(group, [1.12, 1.1, 0.012], Array.from({ length: 42 }, (_, i) => [cpuX, cpuY, boardZ + 0.25 + i * (coolerHeight - 0.3) / 42]), silver);
    round(group, [1.12, 1.1, 0.045], [cpuX, cpuY, frontZ], finish);
    for (const x of [-0.4, -0.13, 0.13, 0.4]) {
      tube(group, [[cpuX + x, cpuY - 0.35, frontZ + 0.02], [cpuX + x, cpuY - 0.35, boardZ + 0.23], [cpuX + x, cpuY, boardZ + 0.17], [cpuX + x, cpuY + 0.35, boardZ + 0.23], [cpuX + x, cpuY + 0.35, frontZ + 0.02]], 0.028, parts.cooler.id.includes('white') ? finish : copper);
    }
    view.fan(group, [cpuX + 0.66, cpuY, boardZ + coolerHeight / 2 + 0.1], 1.16, parts.cooler.appearance.rgb, parts.cooler.appearance.color, Math.PI / 2);
    view.label(group, 'DEEPCOOL', 0.62, 0.1, [cpuX, cpuY, frontZ + 0.028]);
    for (const x of [-0.54, 0.54]) for (const y of [-0.5, 0.5]) screw(group, cpuX + x, cpuY + y, frontZ + 0.026, 0.018);
  }
  if (parts.ram) {
    const group = view.component('ram');
    const finish = surface(parts.ram.appearance.color, 0.5, 0.45);
    const sticks = Math.min(Math.max(Number(parts.ram.specs.sticks) || 1, 1), 4);
    for (let i = 0; i < sticks; i++) {
      const slot = sticks <= 2 ? 1 + i * 2 : i;
      const x = boardX + 0.42 + slot * 0.16;
      round(group, [0.07, 1.34, 0.28], [x, cpuY - 0.04, boardZ + 0.2], finish, 0.012);
      view.box(group, [0.04, 1.25, 0.03], [x, cpuY - 0.04, boardZ + 0.065], gold);
      round(group, [0.074, 1.29, 0.05], [x, cpuY - 0.04, boardZ + 0.365], parts.ram.appearance.rgb ? view.led() : finish, 0.012);
      boxes(group, [0.075, 0.025, 0.18], Array.from({ length: 9 }, (_, n) => [x, cpuY - 0.56 + n * 0.13, boardZ + 0.23]), finish);
    }
  }
  if (parts.gpu) {
    const group = view.component('gpu');
    const length = Math.min(Math.max(Number(parts.gpu.specs.length) || 240, 150), 420) / 100;
    const x = rear + 0.2 + length / 2, y = boardY - 0.37;
    const finish = surface(parts.gpu.appearance.color, 0.6, 0.4);
    const light = parts.gpu.appearance.color === '#e4e7ed';
    // Открытый кожух: рёбра видны в боковых проёмах, а не скрыты сплошным кубом.
    round(group, [length, 0.045, 1.12], [x, y - 0.29, boardZ + 0.68], finish);
    for (const end of [-1, 1]) round(group, [0.065, 0.35, 1.12], [x + end * (length / 2 - 0.035), y - 0.12, boardZ + 0.68], finish);
    round(group, [length - 0.08, 0.12, 0.035], [x, y - 0.08, boardZ + 1.235], finish, 0.01);
    boxes(group, [0.018, 0.22, 0.99], Array.from({ length: 48 }, (_, i) => [x - length / 2 + 0.05 + i * (length - 0.1) / 48, y - 0.12, boardZ + 0.7]), silver);
    round(group, [length, 0.035, 1.1], [x, y + 0.095, boardZ + 0.68], finish);
    const fanGroup = new THREE.Group(); fanGroup.position.set(x, y - 0.34, boardZ + 0.7); fanGroup.rotation.x = Math.PI / 2; group.add(fanGroup);
    const count = Math.min(Math.max(Number(parts.gpu.specs.fans) || 2, 1), 3);
    for (let i = 0; i < count; i++) view.fan(fanGroup, [(i - (count - 1) / 2) * length / count, 0, 0], Math.min(0.94, length / count - 0.05), false, parts.gpu.appearance.color);
    view.label(group, parts.gpu.brand === 'Sapphire' ? 'SAPPHIRE · RADEON' : 'GEFORCE RTX', length * 0.65, 0.1, [x, y - 0.08, boardZ + 1.248], light ? '#343b43' : '#c1c8d1');
    view.box(group, [length * 0.76, 0.025, 0.028], [x, y + 0.035, boardZ + 1.25], parts.gpu.appearance.rgb ? view.led() : surface(parts.gpu.appearance.accent || '#49515b'));
    for (const offset of [-length * 0.4, length * 0.4]) screw(group, x + offset, y - 0.17, boardZ + 1.25, 0.018);
    // Два слота на задней планке, HDMI/DisplayPort и колодка питания.
    view.box(group, [0.035, 0.42, 1.15], [rear + 0.17, y - 0.1, boardZ + 0.7], silver);
    round(group, [0.22, 0.11, 0.15], [x + length * 0.28, y + 0.14, boardZ + 1.08], black, 0.008);
    boxes(group, [length * 0.16, 0.009, 0.01], Array.from({ length: 7 }, (_, n) => [x + length * 0.27, y + 0.118, boardZ + 0.45 + n * 0.045]), black);
  }
  if (parts.storage) {
    const group = view.component('storage');
    if (parts.storage.specs.interface === 'SATA') {
      round(group, [1.02, 0.24, 1.47], [front - 0.73, base + 0.23, 0.03], silver);
      view.box(group, [0.8, 0.015, 0.9], [front - 0.73, base + 0.36, 0], surface('#e4e8ec'));
      view.label(group, 'WD BLUE · 2 TB', 0.7, 0.1, [front - 0.73, base + 0.23, 0.77], '#275b9d');
    } else {
      const x = boardX - 0.1, y = boardY - 0.9;
      round(group, [0.8, 0.22, 0.025], [x, y, boardZ + 0.06], surface(parts.storage.appearance.color), 0.008);
      boxes(group, [0.14, 0.14, 0.025], [0, 1, 2].map(i => [x - 0.23 + i * 0.19, y, boardZ + 0.09]), black);
      view.label(group, parts.storage.brand.toUpperCase(), 0.57, 0.08, [x, y, boardZ + 0.105]);
      screw(group, x + 0.36, y, boardZ + 0.08, 0.025);
    }
  }
  if (parts.psu) {
    const group = view.component('psu');
    const x = isAP201 ? front - 0.9 : rear + 0.85;
    const y = isAP201 ? top - 0.9 : base + 0.43;
    const finish = surface(parts.psu.appearance.color, 0.5, 0.5);
    round(group, [1.5, 0.86, 1.5], [x, y, 0], finish);
    view.label(group, parts.psu.brand.toUpperCase(), 0.9, 0.14, [x, y + 0.13, 0.76]);
    view.label(group, `${parts.psu.specs.watts} W`, 0.54, 0.17, [x, y - 0.13, 0.76]);
    for (const dx of [-0.65, 0.65]) for (const dy of [-0.33, 0.33]) screw(group, x + dx, y + dy, 0.76);
    const intake = view.fan(group, [x, y - 0.445, 0], 1.18, false); intake.rotation.x = Math.PI / 2;
    // Аккуратные жгуты: 24-pin, EPS и питание GPU.
    if (parts.motherboard) for (let i = 0; i < 6; i++) tube(group, [[x + 0.65, y, -0.2 + i * 0.035], [boardX + 1.27, base + 0.78, -0.67], [boardX + 1.29, boardY + 0.13, boardZ + 0.18], [boardX + 1.12, boardY + 0.13, boardZ + 0.2]], 0.012, rubber);
    if (parts.gpu) for (let i = 0; i < 4; i++) tube(group, [[x + 0.65, y + 0.08, 0.12 + i * 0.033], [boardX + 1.18, base + 0.96, 0.4 + i * 0.033], [boardX + 0.8, boardY - 0.12, 0.4 + i * 0.033]], 0.014, black);
  }
}
