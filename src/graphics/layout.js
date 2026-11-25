import { motherboardProfiles } from './motherboard.js';
import { gpuProfiles } from './gpu.js';
import { psuProfiles } from './psu.js';
import { chassisProfiles } from './chassis.js';

const finite = (value, fallback) => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : fallback;

export function getLayout(parts) {
  const known = chassisProfiles[parts.case?.id];
  const ap201 = /ap201/.test(parts.case?.id || '');
  const cp = known || { D: finite(parts.case?.specs.depth, 405), W: finite(parts.case?.specs.width, 210), H: finite(parts.case?.specs.height, 425), front: 'mesh', fans: 3, rearFans: 1, slots: 4 };
  const base = -210;
  const chassis = { ...cp, D: cp.D, W: cp.W, H: cp.H, base, shellBase: base + 18, top: base + cp.H, rear: -cp.D / 2, front: cp.D / 2, ap201, profile: cp };
  const bp = motherboardProfiles[parts.motherboard?.id] || { width: 244, height: 244, cpuX: 102, cpuY: 76, ramX: 167, ramTop: 19, pcieY: 138, atxX: 230, atxY: 90, epsX: 36, epsY: 8 };
  const left = chassis.rear + 24, top = chassis.top - 22, z = -cp.W / 2 + 31;
  const board = {
    left, top, z, width: bp.width, height: bp.height, profile: bp,
    cpu: { x: left + bp.cpuX, y: top - bp.cpuY, z: z + 8 },
    ramX: left + bp.ramX, ramTop: top - (bp.ramTop || 19), dimmLength: 133.35,
    pcieY: top - bp.pcieY,
    dimmPositions: (bp.dimmXs || Array.from({ length: parts.motherboard?.specs.ram_slots || 4 }, (_, i) => bp.ramX + i * 8.5)).map(x => left + x),
    atx: { x: left + (bp.atxX || bp.width - 10), y: top - (bp.atxY || 95), z: z + 12 },
    eps: { x: left + (bp.epsX || 34), y: top - (bp.epsY || 8), z: z + 12 },
  };
  const gp = gpuProfiles[parts.gpu?.id] || { length: finite(parts.gpu?.specs.length, 240), height: 120, thickness: 42, powerAt: 0.65, powerType: '8pin', powerCount: 1 };
  const gr = chassis.rear + 2;
  const gpu = { rear: gr, x: gr + gp.length / 2, y: board.pcieY, z: z + 5, length: gp.length, height: gp.height, thickness: gp.thickness, profile: gp };
  gpu.power = { x: gr + gp.length * (gp.powerAt || 0.65), y: gpu.y - 3, z: gpu.z + gp.height + 0.5 };
  const pp = psuProfiles[parts.psu?.id] || { length: 140, width: 150, height: 86, modular: false };
  const psu = {
    x: ap201 ? chassis.front - 55 : chassis.rear + pp.length / 2 + 8,
    y: ap201 ? chassis.top - 95 : chassis.shellBase + pp.height / 2 + 4,
    z: 0, length: pp.length, width: pp.width, height: pp.height, profile: pp,
    orientation: ap201 ? 'vertical' : 'horizontal',
  };
  return { case: chassis, board, gpu, psu, storage: { x: chassis.front - 95, y: chassis.shellBase + 21, z: 0 } };
}
