import * as THREE from 'three';

const cpuModels = {
  'cpu-r5-7600': ['AMD RYZEN 5','7600','AM5'],
  'cpu-r7-7700': ['AMD RYZEN 7','7700','AM5'],
  'cpu-r5-7500f': ['AMD RYZEN 5','7500F','AM5'],
  'cpu-r5-9600x': ['AMD RYZEN 5','9600X','AM5'],
  'cpu-i5-12400f': ['intel CORE i5','i5-12400F','LGA1700'],
  'cpu-i5-13400f': ['intel CORE i5','i5-13400F','LGA1700'],
  'cpu-i3-14100': ['intel CORE i3','i3-14100','LGA1700'],
};

export function buildCPU(ctx,part) {
  if(!part)return null;
  const group=ctx.component('cpu'), c=ctx.layout.board.cpu;
  const [brand,model,socket]=cpuModels[part.id] || [part.brand || '',part.name || '',String(part.specs?.socket || 'AM5')];
  const am5=socket==='AM5',width=am5?40:37.5,height=am5?40:45;
  const z=c.z-8;
  const pos=(x,y,d)=>[c.x+x,c.y+y,z+d];
  const black=ctx.mat('#202528',.08,.7),steel=ctx.mat('#979fa5',.82,.27),nickel=ctx.mat('#b8bdc1',.82,.32);
  const box=(size,x,y,d,mat,r=0)=>ctx.box(group,size,pos(x,y,d),mat,r);
  group.userData.nominalDimensions=[width,height,8];
  // Real socket and independent load plate, not a solid block over the processor.
  box([width+10,height+10,2.3],0,0,1.2,black,1);
  box([width,height,1.25],0,0,3.2,ctx.mat('#244e43',.25,.62),.5);
  const rimX=width/2+3,rimY=height/2+3;
  for(const x of [-rimX,rimX])box([3.5,height+8,2],x,0,4.9,steel,.6);
  for(const y of [-rimY,rimY])box([width+5,3,2],0,y,4.9,steel,.6);
  for(const x of [-rimX,rimX])for(const y of [-rimY,rimY])ctx.screw(group,pos(x,y,5.8),'z',1.7);
  const leverX=rimX+4;
  ctx.tube(group,[pos(leverX,-rimY,4.5),pos(leverX+1,0,5),pos(leverX+1,rimY+2,5),pos(leverX-1,rimY+7,5.5),pos(leverX-5,rimY+8,5.5)],.9,steel);
  ctx.cylinder(group,1.5,7,pos(leverX,-rimY+1,4.5),steel,'y',16);
  if(am5) {
    // AM5 heat spreader has eight conspicuous recesses exposing the substrate.
    const outline=[[-18,-18],[-13,-18],[-13,-14],[-2,-14],[-2,-18],[2,-18],[2,-14],[13,-14],[13,-18],[18,-18],[18,-13],[14,-13],[14,-2],[18,-2],[18,2],[14,2],[14,13],[18,13],[18,18],[13,18],[13,14],[2,14],[2,18],[-2,18],[-2,14],[-13,14],[-13,18],[-18,18],[-18,13],[-14,13],[-14,2],[-18,2],[-18,-2],[-14,-2],[-14,-13],[-18,-13]];
    const shape=new THREE.Shape();outline.forEach(([x,y],i)=>i?shape.lineTo(x*.01,y*.01):shape.moveTo(x*.01,y*.01));shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:.034,bevelEnabled:true,bevelThickness:.002,bevelSize:.003,bevelSegments:2,steps:1});
    const mesh=new THREE.Mesh(geometry,nickel);mesh.position.set(c.x*.01,c.y*.01,(z+4.4)*.01);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
    const components=[];
    for(const side of [-1,1])for(const k of [-8,8]) {
      components.push(pos(k,side*16,4.15),pos(side*16,k,4.15));
    }
    ctx.boxes(group,[2.5,1.1,.8],components,ctx.mat('#b6a98a',.45,.57));
  } else {
    box([30.5,38,4.1],0,0,5.9,nickel,2.2);
    box([34,41,.7],0,0,3.9,steel,1.5);
    // Two opposing substrate keying notches characteristic of LGA1700.
    for(const x of [-width/2,width/2])box([1.5,3,1.5],x,-height*.24,3.3,black);
  }
  // Label lies on the actual IHS top, and disappears naturally beneath a cooler.
  ctx.label(group,brand,23,3.4,pos(0,5.5,8.13),'#62696d');
  ctx.label(group,model,22,3.8,pos(0,0,8.14),'#596064');
  ctx.label(group,socket,14,2.2,pos(0,-6,8.13),'#777e82');
  const triangle=new THREE.Shape();triangle.moveTo(0,0);triangle.lineTo(.02,0);triangle.lineTo(0,.02);triangle.closePath();
  const marker=new THREE.Mesh(new THREE.ShapeGeometry(triangle),ctx.mat('#cbb777',.55,.43));marker.position.set((c.x-width/2+1)*.01,(c.y-height/2+1)*.01,(z+3.9)*.01);group.add(marker);
  return group;
}

