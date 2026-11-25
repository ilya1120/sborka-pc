import * as THREE from 'three';

// Rear-facing sheet: local horizontal = global Z, local vertical = global Y.
export function rearSheet(parent, x, y, z, width, height, material, holes = []) {
  const shape = new THREE.Shape();
  shape.moveTo(-width/2,-height/2); shape.lineTo(width/2,-height/2); shape.lineTo(width/2,height/2); shape.lineTo(-width/2,height/2); shape.closePath();
  for (const item of holes) {
    const [cx,cy,w,h,type] = item, hole = new THREE.Path();
    const pts = type === 'hdmi' ? [[-w/2,h/2],[w/2,h/2],[w/2,-h*.12],[w*.32,-h/2],[-w*.32,-h/2],[-w/2,-h*.12]]
      : type === 'dp' ? [[-w/2,h/2],[w*.32,h/2],[w/2,h*.18],[w/2,-h/2],[-w/2,-h/2]]
      : [[-w/2,-h/2],[-w/2,h/2],[w/2,h/2],[w/2,-h/2]];
    pts.forEach(([a,b],i) => i ? hole.lineTo(cx+a,cy+b) : hole.moveTo(cx+a,cy+b)); hole.closePath(); shape.holes.push(hole);
  }
  const geometry = new THREE.ExtrudeGeometry(shape,{depth:.65,bevelEnabled:false,curveSegments:3}); geometry.scale(.01,.01,.01);
  const mesh = new THREE.Mesh(geometry,material); mesh.rotation.y = -Math.PI/2;
  mesh.position.set(x/100,y/100,z/100); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
}

export function rearSocket(ctx, parent, { x, y, z, type, color, depth = 16 }) {
  const dimensions = { usb:[13.2,5.6], hdmi:[14.1,5.1], dp:[16.1,4.9], lan:[13.6,12], usbc:[8.3,3.3], vga:[17.5,9.2] };
  const [w,h] = dimensions[type] || dimensions.usb;
  const steel = ctx.mat('#939da6',.82,.3), dark = ctx.mat('#090d11',.04,.84), gold = ctx.mat('#baa36b',.7,.4);
  const metal = new THREE.Group(); metal.userData.keep = true; metal.userData.connectorType = type; parent.add(metal);
  // Hollow pressed-steel can; the recess has actual depth and separate walls.
  rearSheet(metal,x,y,z,w+1.5,h+1.4,steel,[[0,0,w,h,type]]);
  ctx.box(metal,[.7,h,w],[x+depth,y,z],dark);
  for (const edge of [-1,1]) {
    ctx.box(metal,[depth,.45,w+1],[x+depth/2,y+edge*(h/2+.15),z],steel);
    ctx.box(metal,[depth,h,.45],[x+depth/2,y,z+edge*(w/2+.15)],steel);
  }
  if (type === 'usb') {
    ctx.box(metal,[depth*.66,1.25,w-2.2],[x+depth*.54,y-.65,z],ctx.mat(color || '#28578d',.02,.7));
    for (let i=0;i<4;i++) ctx.box(metal,[depth*.48,.22,.65],[x+depth*.45,y+.12,z-3.5+i*2.3],gold);
    for (const off of [-1,1]) ctx.box(metal,[3,.25,2],[x+4,y+h/2-.35,z+off*3.5],steel);
  } else if (type === 'lan') {
    ctx.box(metal,[depth*.6,1.8,w-2],[x+depth*.63,y-h/2+1.2,z],dark);
    for (let i=0;i<8;i++) ctx.tube(metal,[[x+3,y+h/2-1,z-4.4+i*1.25],[x+depth*.8,y+h/2-4,z-4.4+i*1.25]],.23,gold);
    for (const [off,c] of [[-1,'#7a9963'],[1,'#b19b46']]) ctx.box(metal,[.7,1.6,2],[x-.2,y-h/2-1,z+off*(w/2-1)],ctx.mat(c,.04,.6));
    ctx.box(metal,[depth*.6,2,5],[x+depth*.55,y-h/2+.4,z],dark);
  } else if (type === 'vga') {
    ctx.box(metal,[2,h-1,w-1],[x+1.2,y,z],ctx.mat('#335a8e',.03,.7),1);
    for(let row=0;row<3;row++) for(let col=0;col<5;col++) ctx.cylinder(metal,.43,.3,[x-.1,y+(row-1)*2.3,z+(col-2)*2.8+(row%2?.6:0)],dark,'-x',10);
    for(const side of [-1,1]) ctx.cylinder(metal,2.3,3,[x-.8,y,z+side*12],steel,'-x',6);
  } else {
    ctx.box(metal,[depth*.65,.95,w-2.5],[x+depth*.52,y,z],dark);
    const pins = type === 'hdmi' ? 19 : type === 'dp' ? 20 : 12;
    for (let i=0;i<pins;i++) ctx.box(metal,[depth*.4,.16,.27],[x+depth*.43,y+.53,z-(w-4)/2+i*(w-4)/(pins-1)],gold);
  }
  return { hole: [z,y,w+1.6,h+1.5,type], group:metal };
}

export function buildBoardRearIO(ctx, parent, part) {
  const b = ctx.layout.board, c = ctx.layout.case;
  const x = c.rear - 1.1, z0 = b.z, top = b.top - 3.5;
  const steel = ctx.mat('#939ca4',.72,.38), dark = ctx.mat('#171d22',.05,.7);
  const holes = [], panelCY = top - 79.5, panelCZ = z0 + 22.25;
  const panel = new THREE.Group(); panel.userData.keep = true; parent.add(panel);
  function socket(type, down, across, color) {
    const result = rearSocket(ctx,panel,{x:x-.65,y:b.top-down,z:z0+across,type,color,depth:22});
    const [z,y,w,h,t] = result.hole; holes.push([z-panelCZ,y-panelCY,w,h,t]);
  }
  const msiB650 = part.id === 'mb-msi-b650', asrock = part.id === 'mb-asrock-b650';
  const d3hp = /d3hp/.test(part.id), wifi = msiB650 || d3hp;
  const grid = rows => rows.flatMap(down=>[[down,11],[down,32]]);
  const profiles = {
    'mb-msi-b650': {video:[['dp',24,11],['hdmi',24,32]],usb:grid([48,68,88,108]),flash:true},
    'mb-asrock-b650': {video:[['dp',24,11],['hdmi',24,32]],usb:[...grid([48,68,88]),[108,11]],usbc:[108,32],flash:true},
    'mb-asus-b650m-r': {video:[['hdmi',25,22]],usb:grid([49,72,94]),flash:true},
    'mb-asus-b760m-k-d4': {video:[['vga',20,22],['hdmi',43,22]],usb:grid([65,85,105]),ps2:true},
    'mb-msi-b760': {video:[['vga',20,22],['dp',43,11],['hdmi',43,32]],usb:[...grid([66,86]),[108,11]],usbc:[108,32],ps2:true},
    'mb-gigabyte-b760m-ds3h-d4': {video:[['vga',20,22],['dp',43,11],['hdmi',43,32],['dp',64,11]],usb:[[64,32],...grid([84,104])],usbc:[120,32],ps2:true},
    'mb-gigabyte-b650m-d3hp-ax': {video:[['dp',29,11],['dp',29,32],['hdmi',48,11]],usb:[[48,32],...grid([70,91])],usbc:[112,32],ps2:true},
  };
  const profile = profiles[part.id] || profiles['mb-msi-b650'];
  profile.video.forEach(([type,down,across])=>socket(type,down,across));
  profile.usb.forEach(([down,across],i)=>socket('usb',down,across,msiB650 && i>3?'#94352f':i>1?'#265981':'#20282e'));
  if(profile.usbc) socket('usbc',...profile.usbc);
  if(profile.ps2) {
    const yy=b.top-135,zz=z0+33;
    holes.push([zz-panelCZ,yy-panelCY,12,12]);
    ctx.cylinder(panel,6.3,15,[x+6,yy,zz],steel,'-x');
    ctx.cylinder(panel,5.2,1,[x-1.8,yy,zz],ctx.mat('#66576f',.04,.7),'-x');
    for(let i=0;i<6;i++) ctx.cylinder(panel,.6,.5,[x-2.4,yy+Math.sin(i*Math.PI/3)*2.7,zz+Math.cos(i*Math.PI/3)*2.7],dark,'-x',10);
  }
  if(profile.flash) { ctx.box(panel,[2.5,4.5,5.5],[x-1,b.top-10,z0+12],dark,1); ctx.label(panel,'BIOS',8,2,[x-1.8,b.top-15,z0+12],'#8c959e','-x'); }
  socket('lan',129,12);
  for (const [i,color] of ['#66989c','#7ca783','#b9859d'].entries()) {
    const yy = b.top-153, zz=z0+7+i*14;
    holes.push([zz-panelCZ,yy-panelCY,7,7]);
    ctx.cylinder(panel,3.6,8,[x+2,yy,zz],steel,'-x');
    ctx.cylinder(panel,2.95,.8,[x-2.2,yy,zz],ctx.mat(color,.06,.6),'-x');
    ctx.cylinder(panel,1.8,1,[x-2.7,yy,zz],ctx.mat('#080c10',.02,.9),'-x');
    ctx.torus(panel,2.9,.32,[x-2.8,yy,zz],steel,'-x');
  }
  if (wifi) for (let n=0;n<2;n++) {
    const yy=d3hp?b.top-10:b.top-125-n*13,zz=d3hp?z0+11+n*21:z0+33;
    holes.push([zz-panelCZ,yy-panelCY,6.5,6.5]);
    const gold=ctx.mat('#b39d64',.73,.35);
    ctx.cylinder(panel,3.5,2,[x-1,yy,zz],gold,'-x',6);
    ctx.cylinder(panel,2.4,5,[x-3.3,yy,zz],gold,'-x',24);
    ctx.cylinder(panel,1.4,.4,[x-6,yy,zz],dark,'-x');
    for (let i=0;i<4;i++) ctx.torus(panel,2.4,.17,[x-2-i*.8,yy,zz],gold,'-x');
  }
  if(asrock) for(const down of [126,139]) ctx.cylinder(panel,3.1,.8,[x-1,b.top-down,z0+33],dark,'-x');
  rearSheet(panel,x,panelCY,panelCZ,44.5,159,msiB650?dark:steel,holes);
  // Folded shield lip and spring fingers meet the chassis opening.
  for (const yy of [top,top-159]) ctx.box(panel,[1.5,.9,44.5],[x+.3,yy,panelCZ],steel);
  for (const zz of [z0,z0+44.5]) ctx.box(panel,[1.5,159,.9],[x+.3,panelCY,zz],steel);
  for (const down of [38,60,82,104,144]) ctx.box(panel,[3,2,.45],[x+2,b.top-down,z0+44],steel);
  return panel;
}
