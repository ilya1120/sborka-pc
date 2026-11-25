import * as THREE from 'three';

// External dimensions and power connectors are from manufacturer specification pages.
// Fine mouldings are interpreted from the catalogue photographs, not manufacturer CAD.
export const gpuProfiles = {
  'gpu-msi-4060': { length: 199, height: 120, thickness: 41, powerType: '8pin', powerCount: 1, powerAt: 0.68, fanCount: 2, fanDiameter: 88, blades: 9, style: 'ventus-black', pcbLength: 166 },
  'gpu-gigabyte-4070': { length: 300, height: 130, thickness: 57.6, powerType: '16pin', powerCount: 1, powerAt: 0.60, fanCount: 3, fanDiameter: 90, blades: 9, style: 'aero', pcbLength: 205 },
  'gpu-sapphire-7800': { length: 280, height: 128.75, thickness: 52.57, powerType: '8pin', powerCount: 2, powerAt: 0.57, fanCount: 2, fanDiameter: 100, blades: 9, style: 'pulse-7800', pcbLength: 236 },
  'gpu-palit-5060-dual': { length: 262.1, height: 126.3, thickness: 40.1, powerType: '8pin', powerCount: 1, powerAt: 0.64, fanCount: 2, fanDiameter: 95, blades: 9, style: 'palit-dual', pcbLength: 186 },
  'gpu-msi-5060ti-ventus': { length: 227, height: 126, thickness: 41, powerType: '8pin', powerCount: 1, powerAt: 0.68, fanCount: 2, fanDiameter: 95, blades: 7, style: 'ventus-silver', pcbLength: 187 },
  'gpu-gigabyte-5070-windforce': { length: 282, height: 110, thickness: 50, powerType: '16pin', powerCount: 1, powerAt: 0.62, fanCount: 3, fanDiameter: 80, blades: 9, style: 'windforce', pcbLength: 196 },
  'gpu-sapphire-9060xt-pulse': { length: 240, height: 111.25, thickness: 46.08, powerType: '8pin', powerCount: 1, powerAt: 0.65, fanCount: 2, fanDiameter: 95, blades: 9, style: 'pulse-9060', pcbLength: 198 },
};

function perimeter(length, height, cut = 8) {
  const s = new THREE.Shape();
  const a = length / 2, b = height / 2;
  s.moveTo(-a + cut, -b); s.lineTo(a - cut, -b); s.lineTo(a, -b + cut);
  s.lineTo(a, b - cut); s.lineTo(a - cut, b); s.lineTo(-a + cut, b);
  s.lineTo(-a, b - cut); s.lineTo(-a, -b + cut); s.closePath();
  return s;
}
function slotHole(shape, x, z, w, h) {
  const hole = new THREE.Path();
  hole.moveTo(x - w / 2, z - h / 2); hole.lineTo(x - w / 2, z + h / 2);
  hole.lineTo(x + w / 2, z + h / 2); hole.lineTo(x + w / 2, z - h / 2); hole.closePath();
  shape.holes.push(hole);
}
function plate(parent, shape, thickness, position, material) {
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: true, bevelSegments: 1, bevelSize: 0.3, bevelThickness: 0.3, curveSegments: 24, steps: 1 });
  geometry.scale(0.01, 0.01, 0.01);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(position[0] / 100, position[1] / 100, position[2] / 100);
  mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
}

export function buildGPU(ctx, part) {
  if (!part) return null;
  const group = ctx.component('gpu');
  const fallback = { length: part.specs.length || 240, height: 120, thickness: 42, powerType: '8pin', powerCount: 1, powerAt: 0.65, fanCount: part.specs.fans || 2, fanDiameter: 90, blades: 9, style: 'generic', pcbLength: 180 };
  const p = { ...fallback, ...gpuProfiles[part.id] };
  group.userData.profile = part.id;
  group.userData.nominalDimensions = [p.length, p.height, p.thickness];
  const at = ctx.layout.gpu;
  const x = at.x, y = at.y, z = at.z;
  const length = p.length, height = p.height, thickness = p.thickness;
  const rear = at.rear ?? (x - length / 2);
  const centerZ = z + height / 2;
  const plastic = ctx.mat(part.appearance.color, 0.12, 0.56);
  const black = ctx.mat('#15191d', 0.1, 0.68);
  const pcbMat = ctx.mat('#18231f', 0.15, 0.8);
  const silver = ctx.mat('#a1a7ae', 0.82, 0.3);
  const copper = ctx.mat('#9c6943', 0.72, 0.36);
  const gold = ctx.mat('#bb9653', 0.7, 0.35);
  const backMat = ctx.mat(p.style === 'aero' ? '#d9dce0' : p.style === 'ventus-silver' ? '#7f858c' : '#30343a', 0.62, 0.42);
  const accent = ctx.mat('#a52c37', 0.22, 0.48);

  // Actual PCB thickness and edge connector sit on the selected motherboard's slot.
  ctx.box(group, [Math.min(p.pcbLength, length - 8), 1.6, height - 13], [rear + Math.min(p.pcbLength, length - 8) / 2 + 2, y, z + (height - 13) / 2], pcbMat, 0.7);
  const contacts = Array.from({ length: 56 }, (_, i) => [rear + 20 + i * 1.6, y - 0.1, z + 0.8]);
  ctx.boxes(group, [0.8, 1.9, 5], contacts, gold);
  ctx.box(group, [5, 3, 6], [rear + 51, y, z], black);
  // The fin packs remain exposed through both long sides and the fan openings.
  const finPositions = Array.from({ length: Math.max(20, Math.floor((length - 12) / 1.75)) }, (_, i) => [rear + 6 + i * (length - 12) / (Math.floor((length - 12) / 1.75) - 1), y - thickness / 2 + 0.5, centerZ]);
  ctx.boxes(group, [0.32, thickness - 13, height - 11], finPositions, silver);
  const pipeCount = p.style === 'aero' ? 6 : p.style.startsWith('pulse') ? 4 : 3;
  for (let n = 0; n < pipeCount; n++) {
    const rz = z + 20 + n * (height - 40) / Math.max(1, pipeCount - 1);
    ctx.tube(group, [[rear + 7, y - 10, rz], [rear + 25, y - 6, rz], [rear + length - 25, y - 6, rz], [rear + length - 7, y - 13, rz]], 2.7, copper);
  }

  // Moulded front shroud is one perforated plate, not a closed block.
  const fanPositions = Array.from({ length: p.fanCount }, (_, i) => (i - (p.fanCount - 1) / 2) * (length - 18) / p.fanCount);
  const shroud = perimeter(length, height, p.style === 'aero' ? 13 : p.style === 'palit-dual' ? 11 : 7);
  fanPositions.forEach(fx => { const hole = new THREE.Path(); hole.absarc(fx, 0, p.fanDiameter * 0.48, 0, Math.PI * 2, true); shroud.holes.push(hole); });
  plate(group, shroud, 3, [x, y - thickness + 4, centerZ], plastic);
  // Rounded end caps, corner facets and long side rails leave the heatsink open.
  for (const end of [-1, 1]) ctx.box(group, [3.3, thickness - 6, height - 14], [x + end * (length / 2 - 2), y - thickness / 2, centerZ], plastic, 1.2);
  for (const edge of [-1, 1]) {
    ctx.box(group, [length - 7, 5.2, 3.5], [x, y - thickness + 8, centerZ + edge * (height / 2 - 3)], plastic, 1.4);
    ctx.box(group, [length - 8, 5, 2], [x, y - 7, centerZ + edge * (height / 2 - 5)], plastic, 0.7);
  }
  for (let n = 0; n < p.fanCount; n++) {
    const fx = x + fanPositions[n];
    ctx.fan(group, [fx, y - thickness + 5.5, centerZ], p.fanDiameter, { axis: '-y', frame: false, depth: 8, rgb: false, blades: p.blades, color: p.style === 'aero' ? '#e0e3e6' : '#282d33', label: part.brand.toUpperCase() });
    for (const edge of [-1, 1]) ctx.screw(group, [fx + edge * p.fanDiameter * 0.38, y - thickness + 2, centerZ + (n % 2 ? -1 : 1) * p.fanDiameter * 0.36], '-y', 1.45);
  }
  // MSI diagonal facets, Palit curved lines and Sapphire red perimeter trim are distinct.
  if (p.style.startsWith('ventus')) {
    const trim = ctx.mat(p.style === 'ventus-silver' ? '#c5c8cd' : '#4d545c', 0.45, 0.4);
    for (const end of [-1, 1]) {
      const diagonal = ctx.box(group, [22, 2.3, 5], [x + end * (length / 2 - 17), y - thickness + 0.5, centerZ + 42], trim, 0.8);
      diagonal.rotation.y = end * 0.65;
      const lower = ctx.box(group, [22, 2.3, 4], [x + end * (length / 2 - 17), y - thickness + 0.5, centerZ - 42], trim, 0.8);
      lower.rotation.y = end * 0.65;
    }
  } else if (p.style.startsWith('pulse')) {
    for (const side of [-1, 1]) ctx.box(group, [length - 32, 1.6, 1.5], [x, y - thickness + 0.8, centerZ + side * (height / 2 - 8)], accent, 0.5);
    if (p.style === 'pulse-9060') {
      for (const fx of fanPositions) ctx.torus(group, p.fanDiameter * 0.49, 0.7, [x + fx, y - thickness + 0.8, centerZ], accent, 'y');
    }
  } else if (p.style === 'palit-dual') {
    const rib = ctx.mat('#4b5058', 0.1, 0.55);
    for (let i = 0; i < 5; i++) {
      ctx.tube(group, [[rear + 7, y - thickness + 0.8, z + 8 + i * 3], [rear + 48, y - thickness + 0.8, z + 5 + i * 3], [rear + 104, y - thickness + 0.8, z + 19 + i * 3]], 0.65, rib);
    }
  }

  // Perforated metal backplate, with a real pass-through region past the short PCB.
  const back = perimeter(length - 2, height - 4, 6);
  const ventStart = Math.max(p.pcbLength + 4, length * 0.70);
  const ventLength = Math.max(12, length - ventStart - 8);
  for (let i = 0; i < 7; i++) slotHole(back, -length / 2 + ventStart + ventLength / 2, -height / 2 + 22 + i * 12, ventLength, 6);
  plate(group, back, 1.6, [x, y + 4, centerZ], backMat);
  const screwXs = [rear + 12, rear + Math.min(p.pcbLength, length) * 0.55, rear + length - 13];
  for (const sx of screwXs) for (const sz of [z + 13, z + height - 13]) ctx.screw(group, [sx, y + 4.6, sz], 'y', 1.8);
  ctx.label(group, p.style === 'aero' ? 'AERO' : part.brand.toUpperCase(), Math.min(70, length * 0.3), 10, [rear + length * 0.37, y + 4.9, centerZ], p.style === 'aero' ? '#767d84' : '#a5abb1', 'y');

  const sideY = y - Math.min(16, thickness * 0.38);
  const sidePlate = ctx.box(group, [length * 0.66, 11, 1.7], [x - 5, sideY, z + height - 0.4], plastic, 0.6);
  sidePlate.userData.detail = 'side-brand-rail';
  const text = part.brand === 'Sapphire' ? 'SAPPHIRE  RADEON' : p.style === 'aero' ? 'GIGABYTE  AERO' : 'GEFORCE RTX';
  ctx.label(group, text, length * 0.56, 7, [x - 5, sideY, z + height + 0.7], p.style === 'aero' ? '#59616b' : '#c0c6cc');
  if (part.appearance.rgb) {
    const diffuser = ctx.led();
    ctx.box(group, [p.style === 'aero' ? 50 : 55, 2.2, 1], [rear + length * 0.40, sideY - 5, z + height + 1], diffuser, 0.4);
  }

  // PCIe bracket: actual two-slot geometry, ventilating slots and four output openings.
  const bracketX = rear - 2;
  ctx.box(group, [1.1, Math.min(40, thickness), 116], [bracketX, y - 14, z + 52], silver, 0.4);
  const portZs = [z + 14, z + 41, z + 68, z + 95];
  portZs.forEach((pz, i) => {
    ctx.box(group, [2.1, i === 0 ? 5.5 : 6.5, 17.8], [bracketX - 0.8, y - 8, pz], black, 1);
    ctx.box(group, [2.3, i === 0 ? 2.8 : 3.8, 13.2], [bracketX - 1.4, y - 8, pz], ctx.mat('#62594d', 0.7, 0.4), 0.4);
  });
  ctx.boxes(group, [1.6, 2.5, 12], Array.from({ length: 8 }, (_, i) => [bracketX - 0.7, y - 27, z + 11 + i * 13]), black);
  ctx.box(group, [9, 1.3, 15], [bracketX - 3, y + 5, z + height - 7], silver, 0.3);
  ctx.screw(group, [bracketX - 3, y + 5.7, z + height - 7], 'y', 2.1);

  // Power sockets sit on the outward PCB edge and provide exact endpoints for cables.
  const socketWidth = p.powerType === '16pin' ? 21 : 18;
  const powerX = rear + length * p.powerAt;
  for (let n = 0; n < p.powerCount; n++) {
    const px = powerX + n * (socketWidth + 3);
    ctx.box(group, [socketWidth, 10, 12], [px, y - 3, z + height - 6], black, 0.8);
    const pinCount = p.powerType === '16pin' ? 6 : 4;
    ctx.boxes(group, [2.5, 2.6, 1], Array.from({ length: pinCount * 2 }, (_, i) => [px - (pinCount - 1) * 1.65 + (i % pinCount) * 3.3, y - 5.2 + Math.floor(i / pinCount) * 4.1, z + height + 0.1]), silver);
    if (p.powerType === '16pin') ctx.boxes(group, [1.5, 1, 1], Array.from({ length: 4 }, (_, i) => [px - 4.5 + i * 3, y + 3, z + height + 0.1]), silver);
    ctx.box(group, [7, 1.8, 4], [px, y + 3, z + height - 6], black, 0.3);
    ctx.ports[n ? 'gpuPower2' : 'gpuPower'] = [px, y - 3, z + height + 0.5];
  }
  return group;
}
