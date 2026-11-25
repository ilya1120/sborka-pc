export const storageProfiles = {
  'ssd-samsung-980': { type:'nvme', length:80, width:22, height:2.38, pcb:'#222b26', label:'#202124', text:'SAMSUNG  980', brand:'Samsung', ink:'#e3e4e5' },
  'ssd-kingston-nv2': { type:'nvme', length:80, width:22, height:2.2, pcb:'#294f76', label:'#d7dadc', text:'Kingston  NV2', brand:'Kingston', ink:'#22292f' },
  'hdd-wd-blue': { type:'hdd', length:147, width:101.6, height:26.1, brand:'WD', text:'WD Blue  2 TB', accent:'#2376aa' },
  'ssd-samsung-990-evo-plus': { type:'nvme', length:80, width:22, height:2.38, pcb:'#202923', label:'#1f2022', text:'990 EVO Plus', brand:'Samsung', ink:'#e1e4e7' },
  'ssd-kingston-nv3': { type:'nvme', length:80, width:22, height:2.3, pcb:'#254e78', label:'#dfe2e3', text:'Kingston  NV3', brand:'Kingston', ink:'#245c8e' },
  'ssd-crucial-p3-plus': { type:'nvme', length:80, width:22, height:2.4, pcb:'#222c26', label:'#24272a', text:'crucial P3 Plus', brand:'Crucial', ink:'#e1e5e8' },
  'hdd-seagate-barracuda-2tb': { type:'hdd', length:146.99, width:101.85, height:20.2, brand:'Seagate', text:'BarraCuda  2 TB', accent:'#68a949' },
};

export function buildStorage(ctx, part) {
  if(!part) return null;
  const group=ctx.component('storage');
  const p=storageProfiles[part.id] || {type:part.specs.interface==='SATA'?'hdd':'nvme',length:80,width:22,height:2.4,pcb:'#26312c',label:'#282b2e',ink:'#ddd',text:part.name,brand:part.brand};
  group.userData.profile=part.id; group.userData.nominalDimensions=[p.length,p.width,p.height];
  const black=ctx.mat('#151a1d',.15,.67), gold=ctx.mat('#b69a51',.76,.32), steel=ctx.mat('#a8b0b6',.84,.32);
  if(p.type==='nvme') {
    const b=ctx.layout.board, mount=b.m2 || b.profile?.m2;
    const x=mount?.x ?? b.left+b.width*.54, y=mount?.y ?? b.top-b.height*.62, z=mount?.z ?? b.z+5;
    ctx.box(group,[80,22,.8],[x,y,z],ctx.mat(p.pcb,.16,.7),1.1);
    ctx.box(group,[5,20,.82],[x-38,y,z],black,.4);
    const contacts=[];
    for(let i=0;i<28;i++) if(i!==5 && i!==6) contacts.push([x-38.5,y-9.5+i*.7,z+.5]);
    ctx.boxes(group,[4.5,.38,.13],contacts,gold);
    ctx.boxes(group,[15,14,1.1],[-18,4,23].map(xx=>[x+xx,y,z+.95]),black);
    ctx.boxes(group,[1.3,.75,.6],Array.from({length:16},(_,i)=>[x-28+i*3.7,y+(i%2?8:-8),z+.8]),ctx.mat('#8b8d81',.52,.5));
    ctx.box(group,[61,18,.17],[x+1,y,z+1.6],ctx.mat(p.label,.05,.85),.5);
    ctx.label(group,p.text,48,5.4,[x-3,y+2,z+1.73],p.ink);
    ctx.label(group,`${part.specs.capacity} GB  NVMe`,34,2.7,[x-5,y-5,z+1.74],p.ink);
    // Small printed certification/barcode field, distinct from invented QR data.
    const bars=Array.from({length:14},(_,i)=>[x+23+i*.45,y-2,z+1.77]);
    ctx.boxes(group,[.18,7,.03],bars,ctx.mat(p.ink,.05,.85));
    ctx.cylinder(group,2,3,[x+37,y,z-.7],steel);
    ctx.screw(group,[x+37,y,z+1.5],'z',1.8);
    group.userData.mount=[x,y,z];
  } else {
    const c=ctx.layout.case, mount=ctx.layout.storage;
    const x=mount?.x ?? c.front-87, y=mount?.y ?? c.base+34, z=mount?.z ?? 0;
    ctx.box(group,[p.length,p.height,p.width],[x,y,z],black,2);
    ctx.box(group,[p.length-2,1.4,p.width-2],[x,y+p.height/2,z],steel,2);
    // Stamped lid relief, perimeter flange, spindle depression and mounting screws.
    ctx.box(group,[p.length-13,1.4,p.width-12],[x,y+p.height/2+1,z],ctx.mat('#969fa7',.8,.38),5);
    ctx.cylinder(group,19,.9,[x+37,y+p.height/2+2,z],steel,'y');
    ctx.torus(group,18,.65,[x+37,y+p.height/2+2.6,z],ctx.mat('#757f89',.8,.4),'y');
    for(const xx of [-1,1]) for(const zz of [-1,1]) ctx.screw(group,[x+xx*(p.length/2-7),y+p.height/2+2,z+zz*(p.width/2-7)],'y',2.1,'hex');
    ctx.screw(group,[x+40,y+p.height/2+3,z-28],'y',1.7);
    ctx.box(group,[86,.12,76],[x-13,y+p.height/2+2.1,z],ctx.mat('#e0e2df',.03,.9),2);
    ctx.box(group,[86,.13,15],[x-13,y+p.height/2+2.22,z-27],ctx.mat(p.accent,.08,.7),1);
    ctx.label(group,p.brand,46,9,[x-21,y+p.height/2+2.34,z-26],'#fff','y');
    ctx.label(group,p.text,70,9,[x-13,y+p.height/2+2.34,z-3],'#252a2d','y');
    ctx.label(group,'SATA  6 Gb/s',46,5,[x-18,y+p.height/2+2.34,z+17],'#555b5c','y');
    const rear=x-p.length/2;
    // SATA data (7 contacts) and power (15 contacts), two separate keyed connectors.
    const py=y-p.height/2+6;
    ctx.box(group,[5,5,39],[rear-1,py,z-12],black,.6);
    ctx.box(group,[5,5,18],[rear-1,py,z+22],black,.6);
    for(const [count,center,width] of [[15,z-12,34],[7,z+22,14]]) {
      ctx.boxes(group,[4,.35,.75],Array.from({length:count},(_,i)=>[rear-1,py+1,center-width/2+i*width/(count-1)]),gold);
      ctx.box(group,[4,3,1.4],[rear-1,py-1,center-width/2-1],black);
    }
    ctx.ports.sataPower=[rear-4,py,z-12]; ctx.ports.sataDataDrive=[rear-4,py,z+22];
    // Threaded side mounting holes are visible on the drive casting.
    for(const side of [-1,1]) for(const xx of [-50,0,50]) ctx.screw(group,[x+xx,y,z+side*(p.width/2+.2)],side>0?'z':'-z',1.7,'hex');
    group.userData.mount=[x,y,z];
  }
  return group;
}
