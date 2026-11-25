import * as THREE from 'three';

// ATX dimensions in mm: length along X, width along Z, height along Y.
export const psuProfiles = {
  'psu-deepcool-650': { length: 140, width: 150, height: 86, modular: false, fanDiameter: 120, grille: 'wire', model: 'PK650D' },
  'psu-corsair-750': { length: 140, width: 150, height: 86, modular: true, fanDiameter: 120, grille: 'triangle', model: 'RM750e' },
  'psu-montech-850': { length: 140, width: 150, height: 86, modular: true, fanDiameter: 120, grille: 'slots', model: 'CENTURY G5 850' },
  'psu-msi-a650bn': { length: 140, width: 150, height: 86, modular: false, fanDiameter: 120, grille: 'hex-bars', model: 'MAG A650BN' },
  'psu-chieftec-bdf750c': { length: 160, width: 150, height: 86, modular: true, fanDiameter: 140, grille: 'wire', model: 'PROTON BDF-750C' },
  'psu-seasonic-bc850': { length: 140, width: 150, height: 86, modular: false, fanDiameter: 120, grille: 'diagonal', model: 'CORE BC-850' },
  'psu-deepcool-pl650d': { length: 140, width: 150, height: 86, modular: false, fanDiameter: 120, grille: 'wire', model: 'PL650D' },
};

export function buildPSU(ctx, part) {
  if (!part) return null;
  const p = psuProfiles[part.id] || { length: 140, width: 150, height: 86, modular: false, fanDiameter: 120, grille: 'wire', model: part.name };
  const group = ctx.component('psu');
  group.userData.profile = part.id;
  group.userData.nominalDimensions = { length: p.length, width: p.width, height: p.height };
  const centre = ctx.layout.psu;
  const body = new THREE.Group();
  body.position.set(centre.x / 100, centre.y / 100, centre.z / 100);
  const vertical = centre.orientation === 'vertical';
  body.rotation.z = vertical ? Math.PI / 2 : 0;
  group.add(body);
  const port = (name, v) => {
    ctx.ports[name] = vertical
      ? [centre.x - v[1], centre.y + v[0], centre.z + v[2]]
      : [centre.x + v[0], centre.y + v[1], centre.z + v[2]];
  };
  const shell = ctx.mat('#22272c', 0.58, 0.63);
  const edge = ctx.mat('#343b42', 0.66, 0.43);
  const plastic = ctx.mat('#101317', 0.06, 0.7);
  const recess = ctx.mat('#080b0e', 0.03, 0.87);
  const steel = ctx.mat('#747d85', 0.8, 0.33);
  const gold = ctx.mat('#a58a55', 0.72, 0.43);
  const L = p.length, W = p.width, H = p.height, rear = -L / 2, front = L / 2, bottom = -H / 2;
  // Folded steel enclosure, with a genuine open intake instead of a solid
  // dark cube covering the fan. Fan and guard sit below the interior cavity.
  ctx.box(body, [L, 1.1, W], [0, H / 2 - 0.55, 0], shell);
  for (const z of [-1, 1]) {
    ctx.box(body, [L, H - 1, 1.1], [0, 0, z * (W / 2 - 0.55)], shell);
    ctx.box(body, [L - 3, 2, 1.7], [0, bottom + 1.5, z * (W / 2 - 1)], edge);
  }
  const aperture = p.fanDiameter - 8;
  const marginX = (L - aperture) / 2, marginZ = (W - aperture) / 2;
  for (const side of [-1, 1]) {
    ctx.box(body, [marginX, 1.1, W], [side * (aperture / 2 + marginX / 2), bottom + 0.55, 0], shell);
    ctx.box(body, [aperture, 1.1, marginZ], [0, bottom + 0.55, side * (aperture / 2 + marginZ / 2)], shell);
  }
  ctx.fan(body, [0, bottom + 14, 0], p.fanDiameter, { axis: '-y', depth: 25, frame: false, color: '#171c21', blades: 7, label: part.brand.toUpperCase() });
  const guardY = bottom - 0.3;
  const r = p.fanDiameter * 0.45;
  ctx.torus(body, r, 1.05, [0, guardY, 0], edge, 'y');
  if (p.grille === 'wire') {
    for (let radius = 12; radius < r; radius += 6) ctx.torus(body, radius, 0.75, [0, guardY, 0], steel, 'y');
    for (const z of [-1, 1]) ctx.box(body, [r * 1.8, 1.4, 1.5], [0, guardY, z * r * 0.43], edge);
  } else {
    const positions = [];
    for (let z = -r + 4; z < r; z += p.grille === 'triangle' ? 6 : 5) {
      const width = 2 * Math.sqrt(r * r - z * z);
      const bar = ctx.box(body, [width, 1.4, 1.5], [0, guardY, z], edge);
      if (p.grille === 'diagonal') {
        // All strips are cut to the circular aperture before rotating together.
        bar.rotation.y = Math.PI / 4;
        bar.position.x = Math.sin(Math.PI / 4) * z / 100;
        bar.position.z = Math.cos(Math.PI / 4) * z / 100;
      }
      if (p.grille === 'triangle') for (let x = -width / 2 + 4; x < width / 2 - 2; x += 9) positions.push([x, guardY, z + 2]);
    }
    if (positions.length) {
      // Alternating links give the Corsair stamped triangular grille its
      // photographed tessellated pattern; no grille is a solid decal.
      for (let parity = 0; parity < 2; parity++) {
        const points = positions.filter((_, i) => i % 2 === parity);
        const links = ctx.boxes(body, [1.25, 1.4, 6.8], points, edge);
        if (links) {
          const transform = new THREE.Object3D();
          points.forEach((v, i) => {
            transform.position.set(...v.map(n => n / 100));
            transform.rotation.y = (parity ? 1 : -1) * Math.PI / 6;
            transform.updateMatrix(); links.setMatrixAt(i, transform.matrix);
          });
          links.instanceMatrix.needsUpdate = true;
        }
      }
    }
    if (p.grille === 'hex-bars') {
      const outline = [];
      for (let n = 0; n <= 6; n++) outline.push([Math.cos(n * Math.PI / 3) * (r + 3), guardY, Math.sin(n * Math.PI / 3) * (r + 3)]);
      ctx.tube(body, outline, 1.4, edge);
    }
  }
  for (const x of [-1, 1]) for (const z of [-1, 1]) ctx.screw(body, [x * p.fanDiameter * 0.435, bottom - 0.7, z * p.fanDiameter * 0.435], '-y', 2.2);

  // Rear outlet: open perforated sheet, recessed IEC C14 socket and rocker.
  ctx.box(body, [1.1, H, W], [rear + 0.55, 0, 0], recess);
  if (ctx.holePanel) ctx.holePanel(body, [W - 7, H - 7], [rear - 0.15, 0, 0], shell, '-x', 5, 3.4);
  ctx.box(body, [2.5, 34, 34], [rear - 1, -10, 43], shell, 2);
  ctx.box(body, [3.1, 25, 29], [rear - 2, -10, 43], plastic, 2);
  ctx.box(body, [3.5, 19, 22], [rear - 2.3, -10, 43], recess, 1.8);
  for (const [y, z] of [[-7, 37], [-7, 49], [-15, 43]]) ctx.box(body, [4, 1.8, 2.9], [rear - 3.8, y, z], gold, 0.3);
  port('psuAC', [rear - 4, -10, 43]);
  for (const y of [-25, 5]) ctx.screw(body, [rear - 2.5, y, 43], '-x', 1.8);
  ctx.box(body, [3, 20, 13], [rear - 1.7, -9, 12], plastic, 1.8);
  ctx.box(body, [3.6, 16, 9], [rear - 2.1, -9, 12], edge, 1.3);
  ctx.label(body, 'I   O', 10, 4, [rear - 4.1, -9, 12], '#d5d9dc', '-x');
  for (const [y, z] of [[H / 2 - 6, -W / 2 + 7], [-H / 2 + 6, -W / 2 + 7], [H / 2 - 6, W / 2 - 7], [-H / 2 + 6, W / 2 - 7]]) ctx.screw(body, [rear - 0.9, y, z], '-x', 2.1);

  ctx.box(body, [1.2, H - 1, W - 1], [front - 0.6, 0, 0], shell);
  const socket = (y, z, columns, label) => {
    const width = columns * 4.2 + 3;
    ctx.box(body, [4, 12.2, width], [front + 1, y, z], plastic, 0.8);
    const holes = [], pins = [];
    for (let row = 0; row < 2; row++) for (let col = 0; col < columns; col++) {
      const py = y + (row - 0.5) * 4.2, pz = z + (col - (columns - 1) / 2) * 4.2;
      holes.push([front + 3.1, py, pz]); pins.push([front + 3.3, py, pz]);
    }
    ctx.boxes(body, [0.6, 3.2, 3.2], holes, recess);
    ctx.boxes(body, [0.4, 0.7, 0.7], pins, gold);
    ctx.box(body, [2, 2, 8], [front + 2, y + 7, z], plastic);
    ctx.label(body, label, width + 2, 3, [front + 3.5, y + 11, z], '#aeb5bc', 'x');
    return [front + 6, y, z];
  };
  if (p.modular) {
    const atx = socket(-19, -35, 9, 'M/B');
    socket(-19, 10, 5, 'M/B');
    const gpu = socket(9, -39, 4, 'CPU / PCI-E');
    socket(9, -12, 4, 'CPU / PCI-E'); socket(9, 16, 4, 'CPU / PCI-E');
    socket(-19, 39, 3, 'SATA'); socket(9, 42, 3, 'SATA');
    port('psuATX', atx); port('psuGPU', gpu); port('psuExit', [front + 7, -15, -20]);
  } else {
    const exit = [front + 6, -20, -43];
    ctx.cylinder(body, 10, 4, [front + 1, -20, -43], recess, 'x');
    ctx.torus(body, 9.3, 1.5, [front + 3, -20, -43], plastic, 'x');
    // Short individually sleeved leads end at the wiring anchor. Root routes
    // the harness onwards to the selected board, graphics card and drives.
    for (let n = 0; n < 12; n++) {
      const angle = n * Math.PI * 2 / 12;
      const y = -20 + Math.sin(angle) * 5.2, z = -43 + Math.cos(angle) * 5.2;
      ctx.tube(body, [[front + 1, y, z], [front + 5, y, z], [front + 8, -20 + Math.sin(angle) * 4, -43 + Math.cos(angle) * 4]], 0.9, plastic);
    }
    port('psuExit', exit); port('psuATX', exit); port('psuGPU', exit);
  }
  // Product-specific side label, on both exposed enclosure sides.
  const labelWidth = L - 20;
  for (const side of [-1, 1]) {
    const axis = side > 0 ? 'z' : '-z', z = side * (W / 2 + 0.12);
    ctx.box(body, [labelWidth, 43, 0.3], [0, 0, z], plastic, 0.4);
    const stripe = p.grille === 'diagonal' ? '#a2aab1' : '#d0d3d5';
    ctx.box(body, [labelWidth - 8, 1.3, 0.4], [0, -10, z + side * 0.25], ctx.mat(stripe, 0.3, 0.65));
    ctx.label(body, part.brand.toUpperCase(), labelWidth - 12, 6.5, [0, 12, z + side * 0.4], '#aeb7bf', axis);
    ctx.label(body, p.model, labelWidth - 12, 11, [0, 0, z + side * 0.4], '#e5e8e9', axis);
    ctx.label(body, `${part.specs?.watts || ''} W`, 38, 6.5, [labelWidth / 2 - 25, -17, z + side * 0.4], '#cbd1d5', axis);
    for (const x of [-1, 1]) ctx.screw(body, [x * (L / 2 - 5), H / 2 - 6, side * (W / 2 + 0.5)], axis, 1.8);
  }
  return group;
}
