import * as THREE from 'three';

// Outer dimensions, supplied fans and panel families follow the makers' pages.
export const chassisProfiles = {
  'case-matx-black': { D: 405, W: 210, H: 425, front: 'fine-mesh', fans: 3, rearFans: 1, slots: 4, io: 'air100', side: 'glass', source: 'https://www.montechpc.com/air-100-ARGB' },
  'case-matx-white': { D: 405, W: 210, H: 425, front: 'fine-mesh', fans: 3, rearFans: 1, slots: 4, io: 'air100', side: 'glass', source: 'https://www.montechpc.com/air-100-ARGB' },
  'case-ap201': { D: 460, W: 205, H: 350, front: 'ap201', fans: 0, rearFans: 1, slots: 4, io: 'ap201', side: 'mesh', source: 'https://www.asus.com/motherboards-components/cases/prime/asus-prime-ap201-microatx-case/' },
  'case-asus-ap201-white': { D: 460, W: 205, H: 350, front: 'ap201', fans: 0, rearFans: 1, slots: 4, io: 'ap201', side: 'mesh', source: 'https://www.asus.com/motherboards-components/cases/prime/asus-prime-ap201-microatx-case/' },
  'case-deepcool-ch370': { D: 413, W: 215, H: 431, front: 'squares', fans: 0, rearFans: 1, slots: 4, io: 'deepcool', side: 'glass', source: 'https://global.deepcool.com/products/Cases/CH370-Micro-ATX-Case/2022/15949.shtml' },
  'case-deepcool-cc360': { D: 418, W: 215, H: 431, front: 'mesh', fans: 2, rearFans: 1, slots: 4, io: 'deepcool', side: 'glass', source: 'https://global.deepcool.com/products/Cases/CC360-ARGB-Micro-ATX-Case/2023/17131.shtml' },
  'case-zalman-s2tg': { D: 424, W: 196, H: 462, front: 'ribs', fans: 2, rearFans: 1, slots: 7, io: 'zalman', side: 'glass', source: 'https://www.zalman.com/EN/Product/CompProduct.do?compProductSeqArr=1051&compProductSeqArr=937' },
};

function roundedRect(shape, x, y, w, h, radius = 0) {
  const r = Math.min(radius, w / 2, h / 2);
  shape.moveTo(x + r, y); shape.lineTo(x + w - r, y); shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r); shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h); shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y); shape.closePath();
}

function sheet(ctx, parent, width, height, pos, axis, mat, holes = []) {
  const shape = new THREE.Shape(); roundedRect(shape, -width / 2, -height / 2, width, height, 1.5);
  for (const [x, y, w, h, r = 0] of holes) { const hole = new THREE.Path(); roundedRect(hole, x - w / 2, y - h / 2, w, h, r); shape.holes.push(hole); }
  const geom = new THREE.ExtrudeGeometry(shape, { depth: 0.8, bevelEnabled: false, curveSegments: 8 }); geom.scale(0.01, 0.01, 0.01);
  const mesh = new THREE.Mesh(geom, mat); mesh.position.set(...pos.map(v => v / 100));
  const target = { z: [0, 0, 1], '-x': [-1, 0, 0], x: [1, 0, 0], y: [0, 1, 0] }[axis] || [0, 0, 1];
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...target));
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}

export function buildChassis(ctx, part) {
  if (!part) return null;
  const group = ctx.component('case');
  const c = ctx.layout.case, b = ctx.layout.board, p = c.profile;
  const { D, W, base, shellBase, top, rear, front } = c;
  const white = /white/i.test(part.id);
  const shell = ctx.mat(white ? '#dfe3e4' : '#24292d', 0.12, 0.57), steel = ctx.mat(white ? '#d9dfe0' : '#30363a', 0.35, 0.5);
  const dark = ctx.mat('#14191d', 0.02, 0.8), rubber = ctx.mat('#0c1013', 0.02, 0.91);
  group.userData.nominalDimensions = { depth: D, width: W, height: c.H };
  // Feet are included in published total height; sheet-metal shell starts 18mm up.
  for (const x of [rear + 39, front - 40]) for (const z of [-W * 0.34, W * 0.34]) {
    ctx.box(group, [30, 14, 26], [x, base + 7, z], dark, 3);
    ctx.box(group, [26, 2, 22], [x, base + 1, z], rubber, 1.5);
  }
  for (const y of [shellBase + 3, top - 3]) {
    for (const z of [-W / 2 + 5, W / 2 - 5]) ctx.box(group, [D - 20, 8, 8], [-8, y, z], shell, 1.3);
    for (const x of [rear + 4, front - 23]) ctx.box(group, [8, 8, W - 10], [x, y, 0], shell, 1.3);
  }
  for (const x of [rear + 4, front - 23]) for (const z of [-W / 2 + 5, W / 2 - 5]) ctx.box(group, [8, top - shellBase, 8], [x, (shellBase + top) / 2, z], shell, 1.3);
  ctx.box(group, [D - 24, top - shellBase - 4, 0.9], [-9, (shellBase + top) / 2, -W / 2 + 0.6], shell);
  ctx.box(group, [D - 22, 1, W - 5], [-9, shellBase, 0], steel);

  // Actual tray: CPU backplate opening and separate cable grommets.
  const trayLeft = rear + 12, trayRight = front - (c.ap201 ? 107 : 48);
  const trayBottom = c.ap201 ? shellBase + 10 : shellBase + 88, trayTop = top - 13;
  const tx = (trayLeft + trayRight) / 2, ty = (trayBottom + trayTop) / 2, tz = b.z - 8;
  const holes = [[b.cpu.x - tx, b.cpu.y - ty, 90, 90, 7]];
  const grommetX = Math.min(trayRight - 15, b.left + b.width + 17);
  for (const y of [b.atx.y, b.atx.y - 88]) {
    if (y - 26 > trayBottom && y + 26 < trayTop) holes.push([grommetX - tx, y - ty, 20, 48, 7]);
  }
  sheet(ctx, group, trayRight - trayLeft, trayTop - trayBottom, [tx, ty, tz], 'z', steel, holes);
  for (const [x, y, w, h, r] of holes.slice(1)) {
    sheet(ctx, group, w + 5, h + 5, [x + tx, y + ty, tz + 0.7], 'z', rubber, [[0, 0, w - 3, h - 3, r]]);
  }
  for (const x of [b.left + 10, b.left + b.width - 9]) for (const y of [b.top - 10, b.top - b.height + 10]) ctx.cylinder(group, 3.3, 6, [x, y, b.z - 4], ctx.mat('#8e8057', 0.7, 0.4), 'z', 6);

  // Roof filter and solid rim; front mouldings differ visibly for each chassis.
  const roofW = D - (c.ap201 ? 30 : 70);
  ctx.holePanel(group, [roofW, W - 34], [-10, top - 0.4, 0], shell, 'y', c.ap201 ? 3 : 4, c.ap201 ? 1.65 : 2.6);
  for (const z of [-1, 1]) ctx.box(group, [D - 18, 1.4, 13], [-8, top, z * (W / 2 - 7)], shell, 0.8);
  for (const x of [rear + 10, front - 32]) ctx.box(group, [16, 1.4, W - 18], [x, top, 0], shell, 0.8);
  const panelBottom = shellBase + (c.ap201 ? 17 : 10), panelTop = top - (c.ap201 ? 55 : 12);
  const ph = panelTop - panelBottom, py = (panelTop + panelBottom) / 2;
  // Rounded front edge profile and recessed perforated centre.
  for (const z of [-1, 1]) ctx.box(group, [22, top - shellBase, 12], [front - 11, (top + shellBase) / 2, z * (W / 2 - 6)], shell, 3.5);
  ctx.box(group, [22, 10, W - 10], [front - 11, top - 5, 0], shell, 2);
  ctx.box(group, [22, 12, W - 10], [front - 11, shellBase + 6, 0], shell, 2);
  if (p.front === 'ribs') {
    ctx.holePanel(group, [W - 24, ph], [front - 7, py, 0], dark, 'x', 4, 2.7);
    const fins = Array.from({ length: 27 }, (_, i) => [front - 1.8, py, -W / 2 + 14 + i * (W - 28) / 26]);
    ctx.boxes(group, [7, ph - 3, 2.7], fins, shell);
  } else {
    const square = p.front === 'squares';
    ctx.holePanel(group, [W - (square ? 42 : 24), ph - (square ? 12 : 0)], [front - 1, py, 0], shell, 'x', square ? 9 : c.ap201 ? 3 : 4, square ? 6.3 : c.ap201 ? 1.65 : 2.8, square);
  }
  if (c.ap201) {
    ctx.box(group, [1.3, 45, W - 22], [front - 0.5, top - 30, 0], shell, 1.5);
    ctx.label(group, 'ASUS', 28, 6, [front + 0.2, shellBase + 26, 0], white ? '#a4a9ad' : '#767d81', 'x');
  } else ctx.label(group, part.brand.toUpperCase(), 28, 5.5, [front + 0.2, shellBase + 28, 0], white ? '#a1a9ad' : '#7d858a', 'x');

  // Fan centre locations and full 25mm frames match the supplied arrangement.
  for (let i = 0; i < p.fans; i++) {
    const fy = p.fans === 3 ? top - 75 - i * 121 : top - 103 - i * 121;
    ctx.fan(group, [front - 37, fy, 0], 120, { rgb: !!part.appearance.rgb, color: white ? '#e5e7e7' : '#242a30', axis: 'x', label: part.brand === 'Montech' ? 'M' : '' });
    ctx.ports[`caseFan${i}`] = [front - 49, fy - 52, -46];
    if (part.appearance.rgb) ctx.ports[`caseARGB${i}`] = [front - 49, fy - 49, -43];
  }
  const rearFanY = top - 78, rearFanZ = 25;
  if (p.rearFans) {
    ctx.fan(group, [rear + 15, rearFanY, rearFanZ], 120, { rgb: !!part.appearance.rgb, color: white ? '#e5e7e7' : '#242a30', axis: '-x' });
    ctx.ports.caseFanRear = [rear + 28, rearFanY - 52, rearFanZ - 48];
  }

  // Rear cutouts: IO shield, fan, expansion bays and PSU AC inlet remain open.
  const backCY = (shellBase + top) / 2, backH = top - shellBase;
  const backHoles = [[b.z + 18, b.top - 83 - backCY, 47, 159, 1], [rearFanZ, rearFanY - backCY, 116, 116, 4], [22, ctx.layout.gpu.y - 32 - backCY, 125, p.slots * 20.3, 1]];
  if (!c.ap201) backHoles.push([0, ctx.layout.psu.y - backCY, 151, 87, 1]);
  sheet(ctx, group, W - 2, backH, [rear - 0.4, backCY, 0], '-x', steel, backHoles);
  ctx.holePanel(group, [116, 116], [rear - 0.9, rearFanY, rearFanZ], shell, '-x', 6, 4.2);
  for (let slot = Math.ceil(ctx.layout.gpu.thickness / 20.3); slot < p.slots; slot++) {
    const sy = ctx.layout.gpu.y - slot * 20.3 - 4;
    ctx.holePanel(group, [113, 16.5], [rear - 1.2, sy, 22], steel, '-x', 5, 2.6);
    ctx.screw(group, [rear - 2, sy, 85], '-x', 2.1);
  }

  // PSU tunnel is a removable assembly for inspection, not an opaque scene block.
  if (!c.ap201) {
    const tunnel = new THREE.Group(); tunnel.userData.keep = true; group.add(tunnel); ctx.view.inspectionPanels.push(tunnel);
    const y = shellBase + 94;
    const exitX = ctx.layout.gpu.power.x;
    const ventX = front - 100;
    const openings = [[exitX + 23, -32, 35, 22, 5]];
    if (Math.abs(ventX - exitX) > 70) openings.push([ventX + 23, -8, 78, 68, 4]);
    sheet(ctx, tunnel, D - 68, W - 18, [-23, y, 0], 'y', shell, openings);
    ctx.box(tunnel, [D - 38, 93, 1], [-8, shellBase + 47, W / 2 - 11], shell);
    if (openings.length > 1) ctx.holePanel(tunnel, [78, 68], [ventX, y + 0.6, 8], shell, 'y', 6, 3.4);
    // Cable exit toward GPU, with a rubber lined opening.
    ctx.ports.shroudExit = [ctx.layout.gpu.power.x, y + 1, 32];
  }
  // Rear cable comb rails are visible when rotated to the opposite side.
  for (const y of [b.top - 45, b.top - 145, b.top - 225]) {
    ctx.box(group, [35, 6, 2], [grommetX - 25, y, tz - 3], dark, 0.7);
    ctx.screw(group, [grommetX - 38, y, tz - 4], '-z', 1.5);
  }

  // Front IO switches and sockets have recesses rather than printed rectangles.
  const io = new THREE.Group(); group.add(io);
  const ix = c.ap201 ? front + 0.7 : front - 28;
  const iy = c.ap201 ? top - 28 : top + 1;
  const plane = c.ap201 ? 'x' : 'y';
  const at = offset => c.ap201 ? [ix, iy, offset] : [ix, iy, offset];
  ctx.cylinder(io, 5.5, 1.2, at(56), dark, plane);
  ctx.cylinder(io, 4.2, 1.4, at(56), shell, plane);
  const powerLED = ctx.led(); ctx.cylinder(io, 0.8, 1.6, at(44), powerLED, plane, 12);
  for (const off of [10, 30]) {
    const size = c.ap201 ? [1.3, 6.6, 14] : [6.6, 1.3, 14];
    ctx.box(io, size, at(off), dark, 1.1);
    ctx.box(io, c.ap201 ? [1.6, 2.5, 10] : [2.5, 1.6, 10], at(off), ctx.mat('#215087', 0.05, 0.7), 0.3);
  }
  for (const off of [-16, -30]) { ctx.cylinder(io, 3.1, 1.5, at(off), ctx.mat('#7e878d', 0.7, 0.3), plane, 24); ctx.cylinder(io, 2.2, 1.8, at(off), dark, plane, 20); }
  if (c.ap201) ctx.box(io, [1.5, 3, 8.5], at(-49), dark, 1.4);
  ctx.ports.frontPanelLead = [front - 28, top - 18, -W / 2 + 13];
  ctx.ports.usbFrontLead = [front - 32, top - 20, -W / 2 + 10];

  // Removable side panel: screws travel with glass, rear hinge remains on chassis.
  const side = new THREE.Group(); side.userData.keep = true; group.add(side);
  const sideD = D - 30, sideH = top - shellBase - 14, sideY = (shellBase + top) / 2;
  if (p.side === 'mesh') ctx.holePanel(side, [sideD, sideH], [-8, sideY, W / 2 - 0.8], shell, 'z', 3, 1.65);
  else {
    const glass = new THREE.MeshPhysicalMaterial({ color: white ? '#c9d7da' : '#a5bdc3', transparent: true, opacity: 0.16, roughness: 0.08, metalness: 0, depthWrite: false, side: THREE.DoubleSide, clearcoat: 1 });
    ctx.box(side, [sideD, sideH, 3], [-8, sideY, W / 2 - 1], glass, 1.2).castShadow = false;
    for (const x of [rear + 14, front - 31]) for (const y of [shellBase + 12, top - 12]) { ctx.cylinder(side, 4, 1.2, [x, y, W / 2 + 1], rubber); ctx.screw(side, [x, y, W / 2 + 2], 'z', 2.8); }
  }
  for (const y of [shellBase + 42, top - 42]) ctx.cylinder(group, 3.3, 16, [rear + 8, y, W / 2 - 4], steel, 'y');
  ctx.view.glass = side; side.visible = !ctx.view.openSide;
  return group;
}
