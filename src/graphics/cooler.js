// Dimensions below are millimetres, mapped by airflow direction rather than
// the manufacturers' inconsistent L/W labels. Fin-depth is estimated from
// dimension drawings/photos where a separate heatsink depth is not published.
export const coolerProfiles = {
  'cooler-ag400': { height: 150, width: 125, widthY: 120, depth: 92, depthX: 92, finDepth: 57, fanDiameter: 120, heatpipes: 4, fins: 50, style: 'matrix', cap: false, offsetX: -4, blades: 9 },
  'cooler-ag400-white': { height: 150, width: 125, widthY: 120, depth: 92, depthX: 92, finDepth: 57, fanDiameter: 120, heatpipes: 4, fins: 50, style: 'matrix-white', cap: false, offsetX: -4, blades: 9 },
  'cooler-ak400': { height: 155, width: 127, widthY: 120, depth: 97, depthX: 97, finDepth: 45, fanDiameter: 120, heatpipes: 4, fins: 54, style: 'ak', cap: true, offsetX: -7, blades: 9 },
  'cooler-id-se214xt': { height: 150, width: 124, widthY: 120, depth: 72, depthX: 72, finDepth: 47, fanDiameter: 120, heatpipes: 4, fins: 45, style: 'id-basic', cap: false, offsetX: -5, blades: 9 },
  'cooler-id-se224xts': { height: 151, width: 120, widthY: 120, depth: 75, depthX: 75, finDepth: 50, fanDiameter: 120, heatpipes: 4, fins: 55, style: 'id-xts', cap: false, offsetX: -5, blades: 9 },
  'cooler-deepcool-ag200': { height: 133, width: 119, widthY: 94, depth: 77, depthX: 77, finDepth: 52, fanDiameter: 92, heatpipes: 2, fins: 40, style: 'matrix-small', cap: false, offsetX: -2, blades: 9 },
  'cooler-deepcool-ak500': { height: 158, width: 127, widthY: 120, depth: 117, depthX: 117, finDepth: 90, fanDiameter: 120, heatpipes: 5, fins: 56, style: 'ak500', cap: true, offsetX: -19, blades: 9 },
};

export function buildCooler(ctx, part) {
  if (!part) return null;
  const known = coolerProfiles[part.id];
  const p = known || { height: Number(part.specs.height) || 150, widthY: 120, depth: 80, finDepth: 50, fanDiameter: Number(part.specs.fan_diameter) || 120, heatpipes: Number(part.specs.heatpipes) || 4, fins: 48, cap: true, offsetX: -4, style: 'generic', blades: 9 };
  const group = ctx.component('cooler');
  group.userData.profile = part.id;
  group.userData.nominalDimensions = { height: p.height, width: p.width || p.widthY, depth: p.depth };
  const cpu = ctx.layout.board.cpu;
  const cx = cpu.x + p.offsetX, cy = cpu.y, contact = cpu.z;
  const white = part.id === 'cooler-ag400-white';
  const alloy = ctx.mat(white ? '#e4e6e8' : '#acb1b7', white ? 0.23 : 0.78, 0.36);
  const topAlloy = ctx.mat(white ? '#f0f0ee' : '#b8bec4', white ? 0.2 : 0.82, 0.3);
  const nickel = ctx.mat(white ? '#e4e7e9' : '#a7a9ad', 0.85, 0.28);
  const copper = ctx.mat('#b27b50', 0.82, 0.28);
  const black = ctx.mat('#202428', 0.12, 0.66);
  const frameColor = white ? '#e8e9e6' : '#22272c';

  // The contact plate sits on the CPU lid; four spring screws clamp the
  // crossbar to the socket's mounting rails, rather than floating above it.
  ctx.box(group, [36, 40, 3], [cpu.x, cy, contact + 1.5], nickel, 0.7);
  ctx.box(group, [47, 10, 4], [cpu.x, cy, contact + 6], nickel, 0.8);
  for (const side of [-1, 1]) {
    ctx.box(group, [52, 8, 3], [cpu.x, cy + side * 30, contact - 3], nickel, 1.5);
    for (const x of [-23, 23]) {
      const sx = cpu.x + x, sy = cy + side * 30;
      ctx.cylinder(group, 3.4, 4, [sx, sy, contact + 2], nickel, 'z', 20);
      const spring = Array.from({ length: 65 }, (_, i) => {
        const a = i / 64 * Math.PI * 12;
        return [sx + Math.cos(a) * 2.9, sy + Math.sin(a) * 2.9, contact + 4 + i / 64 * 8];
      });
      ctx.tube(group, spring, 0.43, nickel);
      ctx.screw(group, [sx, sy, contact + 13], 'z', 2.7);
    }
  }

  const finStart = contact + (p.fanDiameter === 92 ? 31 : 34);
  const finEnd = contact + p.height - (p.cap ? 5 : 6);
  const finSpacing = (finEnd - finStart) / (p.fins - 1);
  const positions = Array.from({ length: p.fins }, (_, i) => [cx, cy, finStart + i * finSpacing]);
  ctx.boxes(group, [p.finDepth, p.widthY, 0.38], positions, alloy);
  // Alternating edge reliefs reproduce the family matrix/notched fin edge
  // without replacing the whole tower by an oversized rectangular block.
  for (const side of [-1, 1]) {
    const edge = [];
    for (let i = 0; i < p.fins; i++) for (let n = 0; n < 8; n++) {
      edge.push([cx + side * (p.finDepth / 2 + (i % 2 ? 0.7 : 0.1)), cy - p.widthY / 2 + 7 + n * ((p.widthY - 14) / 7), finStart + i * finSpacing]);
    }
    ctx.boxes(group, [1.2, p.widthY / 10, 0.38], edge, alloy);
  }

  // Each continuous U-pipe crosses the direct-contact base and has two legs
  // passing through the fin pack, with the correct model-specific tip count.
  const pipeMat = white ? topAlloy : (p.style === 'matrix-small' ? copper : nickel);
  for (let i = 0; i < p.heatpipes; i++) {
    const px = (i / (p.heatpipes - 1) - 0.5) * Math.min(36, p.finDepth * 0.67);
    const legY = Math.min(37, p.widthY * 0.29);
    const top = contact + p.height - 2;
    ctx.tube(group, [
      [cx + px, cy - legY, top], [cx + px, cy - legY, contact + 37],
      [cpu.x + px, cy - 13, contact + 7], [cpu.x + px, cy + 13, contact + 7],
      [cx + px, cy + legY, contact + 37], [cx + px, cy + legY, top],
    ], 2.9, pipeMat);
    if (!p.cap) for (const side of [-1, 1]) {
      const py = cy + side * legY;
      ctx.cylinder(group, p.style.startsWith('id') ? 4.1 : 3.3, p.style.startsWith('id') ? 4 : 2, [cx + px, py, top], p.style.startsWith('id') ? black : pipeMat, 'z', 20);
    }
  }

  if (p.cap) {
    ctx.box(group, [p.finDepth + 2.5, p.widthY + 2, 2.3], [cx, cy, contact + p.height - 1.15], black, 1.6);
    const lines = Array.from({ length: p.style === 'ak500' ? 10 : 6 }, (_, i) => [cx - p.finDepth / 2 + 5 + i * ((p.finDepth - 10) / (p.style === 'ak500' ? 9 : 5)), cy, contact + p.height + 0.05]);
    ctx.boxes(group, [0.5, p.widthY - 12, 0.15], lines, ctx.mat('#343a40', 0.25, 0.7));
    ctx.label(group, part.brand.toUpperCase(), Math.min(40, p.finDepth * 0.83), 6.2, [cx, cy, contact + p.height + 0.25], '#a5b0b4');
  } else if (p.style.startsWith('matrix')) {
    const tiles = [];
    for (let x = 0; x < 5; x++) for (let y = 0; y < 7; y++) if ((x + y) % 2 === 0) tiles.push([cx - p.finDepth * 0.4 + x * p.finDepth * 0.2, cy - p.widthY * 0.4 + y * p.widthY * 0.8 / 6, finEnd + 0.3]);
    ctx.boxes(group, [p.finDepth * 0.17, p.widthY * 0.105, 0.35], tiles, topAlloy);
  }

  const fanZ = contact + p.height - p.fanDiameter / 2 - 5;
  const fanX = cx + p.finDepth / 2 + 12.5;
  ctx.fan(group, [fanX, cy, fanZ], p.fanDiameter, { depth: 25, rgb: Boolean(part.appearance.rgb), color: frameColor, axis: 'x', blades: p.blades, label: part.brand === 'DeepCool' ? 'DC' : 'ID' });
  // Wire clips catch the rear fin edge and pass through the fan's side tabs.
  for (const side of [-1, 1]) {
    const sy = cy + side * (p.widthY / 2 + 1.2);
    ctx.tube(group, [[fanX + 10, sy, fanZ - p.fanDiameter * 0.28], [fanX + 8, sy + side * 2, fanZ - p.fanDiameter * 0.32], [cx + p.finDepth / 2 - 5, sy + side * 2, fanZ - p.fanDiameter * 0.2], [cx - p.finDepth / 2 + 5, sy, fanZ - p.fanDiameter * 0.12], [cx - p.finDepth / 2 + 5, sy, fanZ + p.fanDiameter * 0.12], [fanX + 8, sy + side * 2, fanZ + p.fanDiameter * 0.32], [fanX + 10, sy, fanZ + p.fanDiameter * 0.28]], 0.65, nickel);
  }
  // Real fan lead exits the frame; root wiring continues it to CPU_FAN.
  const lead = [fanX - 8, cy - p.fanDiameter / 2 + 5, fanZ - p.fanDiameter * 0.31];
  ctx.ports.cpuFanPlug = lead;
  if (part.appearance.rgb) ctx.ports.coolerARGB = [lead[0], lead[1] - 2.5, lead[2] + 2.5];
  return group;
}
