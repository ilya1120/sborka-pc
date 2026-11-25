import { buildBoardRearIO } from './rear-io.js';

// Millimetres measured proportionally on each model's front photograph.
// Locations are visual references rather than manufacturing/CAD tolerances.
const profile = (id, data) => ({ width: 244, height: 244, dimmLength: 133.35,
  texture: `textures/motherboard/${id}.webp`, ...data });

export const motherboardProfiles = {
  'mb-msi-b650': profile('mb-msi-b650', { cpuX: 126, cpuY: 94, ramX: 209, ramTop: 27, dimmXs: [184,192.3,200.6,208.9], pcieY: 184, atxX: 237, atxY: 90, epsX: 50, epsY: 9, socket: 'AM5', heatsinks: [[34,72,57,111,24],[117,11,74,21,18],[104,164,91,22,8],[195,202,58,52,9]], m2: [[104,164],[111,219]], pci: [[184,89],[225,89]], battery: [30,184] }),
  'mb-asrock-b650': profile('mb-asrock-b650', { cpuX: 125, cpuY: 76, ramX: 217, ramTop: 17, dimmXs: [191,199.5,208,216.5], pcieY: 160, atxX: 237, atxY: 106, epsX: 44, epsY: 8, socket: 'AM5', silver: true, heatsinks: [[31,74,57,133,26],[119,8,111,13,14],[103,147,104,19,8],[202,183,57,37,12]], m2: [[103,147],[108,192],[116,230]], pci: [[160,89],[219,89]], battery: [144,183] }),
  'mb-msi-b760': profile('mb-msi-b760', { cpuX: 123, cpuY: 82, ramX: 218, ramTop: 21, dimmXs: [193,201.3,209.6,217.9], pcieY: 162, atxX: 237, atxY: 109, epsX: 42, epsY: 8, socket: 'LGA1700', heatsinks: [[181,196,29,37,12],[99,142,85,22,7]], m2: [[99,142],[111,226]], pci: [[162,89],[215,89],[190,24]], battery: [33,63] }),
  'mb-gigabyte-b760m-ds3h-d4': profile('mb-gigabyte-b760m-ds3h-d4', { cpuX: 127, cpuY: 82, ramX: 218, ramTop: 17, dimmXs: [193,201.3,209.6,217.9], pcieY: 157, atxX: 237, atxY: 103, epsX: 43, epsY: 7, socket: 'LGA1700', heatsinks: [[35,60,39,103,18],[106,19,68,16,16],[98,142,91,23,8],[187,194,35,36,8]], m2: [[98,142],[115,218]], pci: [[157,89],[212,89],[186,24]], battery: [80,187] }),
  'mb-asus-b760m-k-d4': profile('mb-asus-b760m-k-d4', { width: 211, cpuX: 119, cpuY: 80, ramX: 186, ramTop: 26, dimmXs: [177.5,186], pcieY: 160, atxX: 204, atxY: 106, epsX: 49, epsY: 9, socket: 'LGA1700', silver: true, heatsinks: [[48,73,20,112,16],[167,201,34,34,8]], m2: [[100,143],[101,209]], pci: [[160,89],[190,24],[223,24]], battery: [24,184] }),
  'mb-asus-b650m-r': profile('mb-asus-b650m-r', { width: 221, height: 236, cpuX: 122, cpuY: 88, ramX: 192, ramTop: 24, dimmXs: [183.5,192], pcieY: 173, atxX: 214, atxY: 108, epsX: 46, epsY: 8, socket: 'AM5', silver: true, heatsinks: [[47,72,29,106,20],[187,203,34,36,9]], m2: [[104,157],[104,209]], pci: [[173,89],[216,24]], battery: [46,205] }),
  'mb-gigabyte-b650m-d3hp-ax': profile('mb-gigabyte-b650m-d3hp-ax', { cpuX: 127, cpuY: 83, ramX: 218, ramTop: 25, dimmXs: [193,201.3,209.6,217.9], pcieY: 159, atxX: 237, atxY: 105, epsX: 44, epsY: 8, socket: 'AM5', heatsinks: [[45,62,40,98,22],[100,184,97,21,7],[187,197,36,37,11]], m2: [[101,143],[100,184]], pci: [[159,89],[217,89],[193,24]], battery: [38,183] }),
};

export function buildMotherboard(ctx, part) {
  if (!part) return null;
  const p = motherboardProfiles[part.id] || motherboardProfiles['mb-msi-b650'];
  const b = ctx.layout.board, group = ctx.component('motherboard');
  group.userData.nominalDimensions = [p.width,p.height,1.6];
  const pos = (x,y,z=0) => [b.left+x,b.top-y,b.z+z];
  const black = ctx.mat('#15191c',.08,.72), dark = ctx.mat('#252a2d',.35,.54);
  const silver = ctx.mat('#a8afb5',.78,.29), gold = ctx.mat('#b5a05b',.7,.43);
  const box = (size,x,y,z,mat=black,r=0) => ctx.box(group,size,pos(x,y,z),mat,r);
  box([p.width,p.height,1.6],p.width/2,p.height/2,-.8,ctx.mat('#242a29',.12,.8));
  ctx.photo(group,p.texture,p.width,p.height,pos(p.width/2,p.height/2,.04));

  // The PCB photograph retains the exact silkscreen, traces and SMD distribution.
  // Geometry adds the parts that must still read correctly from an oblique angle.
  for (const [x,y,w,h,d] of p.heatsinks) {
    const metal = p.silver ? silver : dark;
    box([w,h,d*.72],x,y,d*.36,metal,1);
    const fins=[];
    if (h>w) for(let i=0;i<Math.floor(w/3);i++) fins.push(pos(x-w/2+1.5+i*3,y,d*.84));
    else for(let i=0;i<Math.floor(h/3);i++) fins.push(pos(x,y-h/2+1.5+i*3,d*.84));
    ctx.boxes(group,h>w?[1.5,h-2,d*.28]:[w-2,1.5,d*.28],fins,metal);
    ctx.screw(group,pos(x-w*.38,y-h*.38,d+.6),'z',1.25);
    ctx.screw(group,pos(x+w*.38,y+h*.38,d+.6),'z',1.25);
  }
  // DIMM sockets: two independent walls, contacts, key and hinged catches.
  for (const x of p.dimmXs) {
    const cy=p.ramTop+p.dimmLength/2;
    box([5.7,p.dimmLength,3],x,cy,1.6,black);
    for(const dx of [-2.1,2.1]) box([1.15,p.dimmLength,5.6],x+dx,cy,4.3,black);
    const contacts=[];
    for(let i=0;i<62;i++) for(const dx of [-.9,.9]) contacts.push(pos(x+dx,p.ramTop+4+i*2,3.6));
    ctx.boxes(group,[.45,.68,2.3],contacts,gold);
    box([3.7,2.2,5],x,p.ramTop+60,3.4,black);
    for(const y of [p.ramTop-2,p.ramTop+p.dimmLength+2]) box([7.3,6,8],x,y,4,black,1);
  }
  // PCIe connectors preserve each board's actual x16/x1 arrangement.
  for(const [y,len] of p.pci) {
    const x=40+len/2;
    box([len,7.5,8],x,y,4,black);
    box([len-3,2.1,.3],x,y,8.2,ctx.mat('#080b0d',.1,.9));
    if(y===p.pcieY && p.socket==='AM5') for(const dy of [-3.6,3.6]) box([len,0.65,6.5],x,y+dy,5.1,silver);
    box([5,8,6],x+len/2+1,y,5,black,1);
  }
  for(const [x,y] of p.m2) {
    box([5,22,4],x-42,y,2,black);
    for(const distance of [42,60,80]) {
      ctx.cylinder(group,1.8,2.6,pos(x-42+distance,y,1.4),silver);
      ctx.screw(group,pos(x-42+distance,y,3),'z',1.1);
    }
  }
  const [bx,by]=p.battery;
  ctx.cylinder(group,10.7,3,pos(bx,by,1.8),black);
  ctx.cylinder(group,9.7,2.3,pos(bx,by,3.5),silver);
  ctx.label(group,'CR2032',12,2.5,pos(bx,by,4.75),'#666c70');
  box([4,9,1],bx+8,by,5,silver);

  // Exposed VRM chokes/capacitors next to the socket (not hidden random filler).
  const caps=[],chokes=[];
  for(let i=0;i<6;i++) { caps.push([p.cpuX-43,p.cpuY-29+i*11]);chokes.push(pos(p.cpuX-53,p.cpuY-29+i*11,3.7)); }
  for(let i=0;i<4;i++) caps.push([p.cpuX-20+i*11,p.cpuY-44]);
  ctx.boxes(group,[7.5,7.5,6.8],chokes,ctx.mat('#52575a',.3,.55));
  for(const [x,y] of caps) {
    ctx.cylinder(group,2.8,6.6,pos(x,y,3.5),silver,'z',16);
    box([3,.3,.05],x,y,6.85,dark);
  }
  buildBoardRearIO(ctx, group, part);
  function connector(x,y,columns,rows,pitch,vertical=true) {
    const sx=vertical?rows*pitch+2:columns*pitch+2,sy=vertical?columns*pitch+2:rows*pitch+2;
    box([sx,sy,9],x,y,4.5,black);
    const holes=[];
    for(let i=0;i<columns;i++)for(let j=0;j<rows;j++) holes.push(pos(x+(vertical?j-(rows-1)/2:i-(columns-1)/2)*pitch,y+(vertical?i-(columns-1)/2:j-(rows-1)/2)*pitch,9.05));
    ctx.boxes(group,[2.5,2.5,.2],holes,ctx.mat('#050708',.05,.9));
    box(vertical?[2,9,4]:[9,2,4],x+(vertical?sx/2:0),y+(vertical?0:sy/2),6,black);
  }
  connector(p.atxX,p.atxY,12,2,4.2);
  connector(p.epsX,p.epsY,4,2,4.2,false);
  const ports={atx24:pos(p.atxX,p.atxY,10),eps8:pos(p.epsX,p.epsY,10),cpuFan:pos(p.cpuX+38,13,7),frontPanel:pos(p.width-24,p.height-7,5),usb3:pos(p.width-8,p.height-57,8),sataData:pos(p.width-6,p.height-31,8)};
  Object.assign(ctx.ports,ports);
  connector(p.width-8,p.height-57,10,2,2,true);
  for(const [name,columns] of [['cpuFan',4],['frontPanel',5]]) {
    const at=ports[name];ctx.box(group,[columns*2.54+2,5.7,2],[at[0],at[1],b.z+1.2],black);
    const pins=[];for(let i=0;i<columns;i++)for(let j=0;j<(name==='cpuFan'?1:2);j++)pins.push([at[0]+(i-(columns-1)/2)*2.54,at[1]+j*2.54,b.z+4]);
    ctx.boxes(group,[.6,.6,5],pins,gold);
  }
  for(const dy of [-6,6]) box([13,10,8],p.width-7,p.height-31+dy,4,black);
  for(const [x,y] of [[7,7],[p.width-7,7],[7,158],[p.width-7,158],[7,p.height-7],[p.width-7,p.height-7]]) {
    ctx.torus(group,3.2,.55,pos(x,y,.2),gold);
    ctx.screw(group,pos(x,y,1),'z',2.25);
  }
  // An empty socket remains visible when the processor has not been selected.
  if(!ctx.parts.cpu) {
    box([p.socket==='AM5'?48:46,p.socket==='AM5'?48:58,4],p.cpuX,p.cpuY,2,black);
    box([p.socket==='AM5'?38:34,p.socket==='AM5'?38:44,.3],p.cpuX,p.cpuY,4.2,ctx.mat('#514c3e',.6,.5));
  }
  return group;
}
