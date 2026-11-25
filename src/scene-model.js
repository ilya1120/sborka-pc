import { createModelContext, consolidateStaticModel } from './graphics/context.js';
import { getLayout } from './graphics/layout.js';
import { buildChassis } from './graphics/chassis.js';
import { buildMotherboard } from './graphics/motherboard.js';
import { buildCPU } from './graphics/cpu.js';
import { buildRAM } from './graphics/ram.js';
import { buildGPU } from './graphics/gpu.js';
import { buildStorage } from './graphics/storage.js';
import { buildCooler } from './graphics/cooler.js';
import { buildPSU } from './graphics/psu.js';
import { buildCables } from './graphics/cables.js';

// One scene unit = 100 mm. Manufacturer dimensions and photo-based profiles;
// unseen fine geometry is an approximation, not manufacturer CAD.
export function buildDetailedPC(view, parts) {
  const ctx = createModelContext(view, parts, getLayout(parts));
  for (const [category, build] of [
    ['case', buildChassis], ['motherboard', buildMotherboard], ['cpu', buildCPU],
    ['ram', buildRAM], ['gpu', buildGPU], ['storage', buildStorage],
    ['cooler', buildCooler], ['psu', buildPSU],
  ]) build(ctx, parts[category]);
  buildCables(ctx);
  consolidateStaticModel(view.model);
  view.modelLayout = ctx.layout;
  view.modelPorts = ctx.ports;
  view.cableRoutes = ctx.routes;
}
