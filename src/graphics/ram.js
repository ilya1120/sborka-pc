import * as THREE from 'three';

// DIMM envelope dimensions; surface relief is interpreted from the product photos.
export const ramProfiles = {
  'ram-kingston-ddr5': { height: 42.23, thickness: 7.11, style: 'beast', rgb: true, color: '#24272a', label: 'FURY  BEAST' },
  'ram-xpg-ddr5': { height: 43.56, thickness: 8, style: 'lancer', rgb: true, color: '#e5e7e9', label: 'XPG  LANCER' },
  'ram-kingston-ddr4': { height: 34.1, thickness: 7.2, style: 'beast', rgb: false, color: '#222629', label: 'FURY  BEAST' },
  'ram-patriot-venom-32-6400': { height: 43, thickness: 7, style: 'venom', rgb: false, color: '#696b6c', label: 'VIPER' },
  'ram-adata-d35-32-3200': { height: 34, thickness: 5.9, style: 'd35', rgb: false, color: '#272a2d', label: 'XPG' },
  'ram-patriot-steel-32-3200': { height: 44.4, thickness: 7, style: 'steel', rgb: false, color: '#777c82', label: 'VIPER STEEL' },
  'ram-kingston-beast-64-5200': { height: 34.9, thickness: 6.62, style: 'beast', rgb: false, color: '#222629', label: 'FURY  BEAST' },
};

// Extruded Y/Z heatspreader outline. The stepped outer edge is not a plain cuboid.
function spreader(ctx, parent, x, y, base, p, material) {
  const points = p.style === 'lancer'
    ? [[5,-65],[p.height-6,-65],[p.height,-45],[p.height,46],[p.height-7,65],[5,65]]
    : [[6,-65],[p.height-6,-65],[p.height-6,-56],[p.height-2,-50],[p.height-2,-29],[p.height,-24],[p.height,22],[p.height-3,28],[p.height-3,51],[p.height-7,58],[p.height-7,65],[6,65]];
  const shape = new THREE.Shape(); points.forEach(([z, yy], i) => i ? shape.lineTo(z, yy) : shape.moveTo(z, yy)); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.3, bevelEnabled: true, bevelSegments: 1, bevelSize: 0.45, bevelThickness: 0.3, steps: 1 });
  geo.scale(.01,.01,.01);
  const mesh = new THREE.Mesh(geo, material); mesh.rotation.y = -Math.PI/2; mesh.position.set(x/100,y/100,base/100); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh);
}
function sideLabel(ctx, group, text, width, height, pos, color) {
  const label = ctx.label(group,text,width,height,pos,color,'x');
  if (label) label.rotateZ(Math.PI/2);
}

export function buildRAM(ctx, part) {
  if (!part) return null;
  const group = ctx.component('ram');
  const p = ramProfiles[part.id] || { height: 35, thickness: 7, style: 'beast', rgb: !!part.appearance?.rgb, color: part.appearance?.color || '#272a2d', label: part.brand || 'DDR' };
  const b = ctx.layout.board, length = 133.35;
  const slots = Math.max(1, ctx.parts.motherboard?.specs.ram_slots || 4);
  const sticks = Math.min(part.specs.sticks || 2, slots);
  const positions = b.dimmPositions || b.profile?.dimmPositions;
  const material = ctx.mat(p.color, .52, .4), pcb = ctx.mat('#17211e',.12,.76), gold = ctx.mat('#b49a58',.72,.32);
  group.userData.profile = part.id; group.userData.nominalDimensions = [length,p.height,p.thickness]; group.userData.occupiedSlots = [];
  for (let i=0; i<sticks; i++) {
    const slot = sticks<=2 && slots>=4 ? 1+i*2 : i;
    group.userData.occupiedSlots.push(slot);
    const d = positions?.[slot];
    const x = Array.isArray(d) ? d[0] : typeof d === 'number' ? d : d?.x ?? b.ramX + slot*8.5;
    const y = (Array.isArray(d) ? d[1] : d?.y) ?? b.ramTop-length/2;
    const base = (Array.isArray(d) ? d[2] : d?.z) ?? b.z+5;
    // Contacts stop at the DDR key notch rather than forming an unbroken gold stripe.
    const notch = part.specs.memory === 'DDR4' ? -4 : 2;
    ctx.box(group,[1.3,length,25.5],[x,y,base+16.25],pcb,.4);
    for(const [lo,hi] of [[-length/2,notch-1.7],[notch+1.7,length/2]]) ctx.box(group,[1.3,hi-lo,3.5],[x,y+(lo+hi)/2,base+1.75],pcb,.2);
    const contacts=[];
    for(let k=0;k<144;k++) { const yy=-63+k*.88; if(Math.abs(yy-notch)>1.7) for(const side of [-1,1]) contacts.push([x+side*.72,y+yy,base+2.8]); }
    ctx.boxes(group,[.12,.52,4.8],contacts,gold);
    for(const side of [-1,1]) {
      spreader(ctx,group,x+side*(p.thickness/2-1.3),y,base,p,material);
      const sx=x+side*(p.thickness/2+.15);
      for(let rib=0;rib<5;rib++) {
        const yy=y-45+rib*20;
        const stripe=ctx.box(group,[.75,12,p.style==='lancer'?19:12],[sx,yy,base+p.height*.56],ctx.mat(p.style==='lancer'?'#bbc0c4':'#40464b',.65,.35),.3);
        stripe.rotation.x=(p.style==='steel'?-1:1)*.48;
      }
      if(p.style==='venom') ctx.box(group,[.9,33,22],[sx,y+42,base+24],ctx.mat('#cdd0d0',.5,.45),1);
    }
    const face=x+p.thickness/2+1;
    sideLabel(ctx,group,p.label,p.style==='d35'?27:79,6,[face,y,base+p.height*.60],p.style==='venom'?'#a72b30':p.style==='lancer'?'#4e555b':'#c5c9cc');
    if(p.rgb) {
      const diffuser=ctx.mat('#d4d9df',.05,.32);
      ctx.box(group,[p.thickness-1,115,3.5],[x,y,base+p.height-1.5],diffuser,1.4);
      // Twelve contiguous diffuser segments allow RGB animation without fictitious LEDs on non-RGB RAM.
      for(let n=0;n<12;n++) ctx.box(group,[p.thickness-1.4,9.55,1.1],[x,y-52.6+n*9.56,base+p.height+.15],ctx.led(),.5);
    }
    // Small components remain visible at the ends of the black PCB.
    ctx.boxes(group,[1.5,3,2],[-59,59].map(yy=>[x+1,y+yy,base+11]),ctx.mat('#8d9294',.7,.4));
  }
  return group;
}
