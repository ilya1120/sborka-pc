import * as THREE from 'three';

// Routes terminate at component anchors (mm); long runs follow the tray.
export function buildCables(ctx) {
  const root = ctx.view.model.children.find(g => g.userData.category === 'case') || ctx.view.model.children.find(g => g.userData.category === 'psu');
  if (!root) return;
  const group = new THREE.Group(); group.userData.keep = true; root.add(group);
  ctx.view.inspectionPanels.push(group);
  const p = ctx.ports, c = ctx.layout.case, b = ctx.layout.board;
  const insulation = ctx.mat(/white/.test(ctx.parts.case?.id || '') ? '#c3c7c8' : '#242a30', .02, .82);
  const black = ctx.mat('#151a1e', .04, .75), comb = ctx.mat('#3b4248', .1, .57);
  const rearZ = b.z - 15, sideX = Math.min(c.front - (c.ap201 ? 102 : 56), b.left + b.width + 17);
  function loom(name, from, to, via, wires = 4, radius = .75, pitch = 1.7) {
    if (!from || !to) return;
    const points = [from, ...via, to];
    ctx.routes.push({ name, from: [...from], to: [...to], points });
    for (let i = 0; i < wires; i++) {
      const columns = wires >= 8 ? wires / 2 : wires;
      const dx = (i % columns - (columns - 1) / 2) * pitch;
      const row = wires >= 8 ? (Math.floor(i / columns) - .5) * 2.2 : 0;
      const path = points.map((point, index) => {
        if (index === points.length - 1 && name === 'ATX 24 pin') return [point[0] + row * 1.7, point[1] + dx * 2.2, point[2]];
        return [point[0] + dx, point[1] + (index === points.length - 1 ? row : 0), point[2] + (index === points.length - 1 ? 0 : row)];
      });
      ctx.tube(group, path, radius, wires > 7 ? insulation : black);
    }
    if (wires >= 8) for (const point of via.slice(-2, -1)) ctx.box(group, [wires / 2 * pitch + 3, 3, radius * 2 + 5], point, comb, .8);
  }
  if (ctx.parts.psu) {
    const source = p.psuExit, sy = c.ap201 ? ctx.layout.psu.y - 85 : c.shellBase + 55;
    if (c.ap201 && p.psuAC) {
      const acRear = [c.rear - 1, c.top - 30, -54];
      ctx.box(group, [3, 27, 33], acRear, black, 2);
      loom('AP201 AC extension', p.psuAC, acRear, [[p.psuAC[0], p.psuAC[1] - 14, p.psuAC[2]], [c.front - 98, c.shellBase + 18, -25], [c.front - 110, c.shellBase + 18, rearZ], [c.rear + 15, c.shellBase + 18, rearZ], [c.rear + 15, c.top - 30, rearZ]], 1, 3.3);
    }
    loom('ATX 24 pin', p.psuATX || source, p.atx24, [[sideX, sy, rearZ], [sideX, b.atx.y, rearZ], [sideX, b.atx.y, b.z + 21], [b.atx.x + 13, b.atx.y, b.z + 28]], 24, .8, 1.9);
    if (p.atx24) ctx.box(group, [10, 51, 9], [p.atx24[0], p.atx24[1], p.atx24[2] + 2], black, .7);
    if (p.eps8) ctx.box(group, [19, 10, 8], [p.eps8[0], p.eps8[1], p.eps8[2] + 2], black, .6);
    loom('EPS CPU 8 pin', p.psuCPU || source, p.eps8, [[sideX - 20, sy, rearZ - 2], [sideX - 20, c.top - 14, rearZ - 2], [b.eps.x, c.top - 14, rearZ], [b.eps.x, b.eps.y + 8, b.z + 24]], 8, .8, 1.8);
    if (ctx.parts.gpu) for (const [index, key] of ['gpuPower', 'gpuPower2'].entries()) {
      const end = p[key]; if (!end) continue;
      const exit = p.shroudExit || [ctx.layout.gpu.power.x, c.shellBase + 23, 35];
      loom(`GPU power ${index + 1}`, p.psuGPU || source, end, [[sideX - 15, sy, rearZ], [exit[0] + index * 14, exit[1] - 13, 20], [exit[0] + index * 14, exit[1] + 20, 40], [end[0], end[1] - 48, end[2] + 18], [end[0], end[1] - 12, end[2] + 20]], ctx.layout.gpu.profile.powerType === '16pin' ? 12 : 8, .85, 1.8);
    }
    loom('SATA power', source, p.sataPower, [[sideX, sy, rearZ], [sideX, c.shellBase + 21, -25]], 5, .65, 1.4);
  }
  loom('CPU fan', p.cpuFanPlug, p.cpuFan, [[b.cpu.x + 45, b.cpu.y + 20, b.z + 30], [b.cpu.x + 48, b.top - 18, b.z + 18]], 4, .45, 1.1);
  loom('SATA data', p.sataData, p.sataDataDrive, [[sideX - 5, b.top - b.height - 8, b.z + 12], [sideX, c.shellBase + 25, -16]], 1, 2.1);
  loom('Front panel', p.frontPanelLead, p.frontPanel, [[sideX, c.top - 33, rearZ], [sideX, b.top - b.height - 10, rearZ], [b.left + b.width - 25, b.top - b.height - 10, b.z + 12]], 4, .45, 1.2);
  loom('USB 3 front', p.usbFrontLead, p.usb3, [[sideX + 5, c.top - 40, rearZ], [sideX + 5, b.top - b.height + 55, rearZ], [b.left + b.width + 7, b.top - b.height + 55, b.z + 20]], 1, 2.8);
  const hub = [sideX - 8, b.top - b.height + 65, rearZ - 2];
  if (ctx.parts.case && ctx.parts.motherboard) {
    ctx.box(group, [28, 43, 7], hub, black, 2);
    for (const key of Object.keys(p).filter(key => /^caseFan|^caseARGB/.test(key))) {
      const end = p[key]; loom(key, end, hub, [[sideX, end[1], b.z - 2], [sideX, end[1], rearZ], [sideX, hub[1], rearZ]], 3, .4, 1);
    }
    loom('Cooler ARGB', p.coolerARGB, hub, [[b.cpu.x + 48, b.cpu.y + 18, b.z + 23], [sideX, b.cpu.y + 20, rearZ]], 3, .4, 1);
  }
}
