import * as THREE from 'three';

// A pitched, swept airfoil with thickness, rather than an extruded flat petal.
export function fanBladeGeometry(diameter, depth, count) {
  const positions = [], indices = [], radial = 14, chord = 8;
  const root = diameter * .145, tip = diameter * .457, period = Math.PI * 2 / count;
  for (let side = 0; side < 2; side++) for (let i = 0; i <= radial; i++) {
    const t = i / radial, r = root + (tip - root) * t;
    const sweep = -.48 * t - .13 * t * t;
    const width = period * (.53 + .24 * Math.sin(t * Math.PI * .72));
    for (let j = 0; j <= chord; j++) {
      const v = j / chord, angle = sweep + (v - .5) * width;
      const pitch = (.55 - t * .23) * Math.min(1, depth / 20);
      const camber = Math.sin(v * Math.PI) * diameter * .018 * Math.sin(Math.PI * (.15 + t * .8));
      const z = (v - .5) * r * width * pitch + camber + (side ? -.32 : .32);
      positions.push(Math.cos(angle) * r / 100, Math.sin(angle) * r / 100, z / 100);
    }
  }
  const stride = chord + 1, layer = (radial + 1) * stride;
  for (let side = 0; side < 2; side++) for (let i = 0; i < radial; i++) for (let j = 0; j < chord; j++) {
    const a = side * layer + i * stride + j, b = a + stride;
    if (!side) indices.push(a,b,a+1,b,b+1,a+1); else indices.push(a,a+1,b,b,a+1,b+1);
  }
  function edge(a,b) { indices.push(a,a+layer,b,b,a+layer,b+layer); }
  for (let i = 0; i < radial; i++) { edge(i*stride,(i+1)*stride); edge((i+1)*stride+chord,i*stride+chord); }
  for (let j = 0; j < chord; j++) { edge(j+1,j); edge(radial*stride+j,radial*stride+j+1); }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

export function buildFan(ctx, parent, pos, diameter, options = {}) {
  const { rgb = false, color = '#24282d', axis = 'z', blades = 9, frame = true,
    label = '', depth = frame ? 25 : 10, paired = false, reverse = false } = options;
  const group = new THREE.Group(); group.position.set(...pos.map(n => n/100));
  const normals = { x:[1,0,0], '-x':[-1,0,0], y:[0,1,0], '-y':[0,-1,0], z:[0,0,1], '-z':[0,0,-1] };
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(...normals[axis])); parent.add(group);
  group.userData.fanDiameter = diameter; group.userData.bladeCount = blades;
  const plastic = ctx.mat(color,.04,.53), rubber = ctx.mat('#15191c',.01,.89);
  const bladeMat = rgb ? ctx.led() : ctx.mat(color,.03,.47);
  const R = diameter * .471, half = diameter / 2;
  if (frame) {
    const outline = new THREE.Shape();
    const r = 3;
    outline.moveTo(-half+r,-half); outline.lineTo(half-r,-half); outline.quadraticCurveTo(half,-half,half,-half+r);
    outline.lineTo(half,half-r); outline.quadraticCurveTo(half,half,half-r,half);
    outline.lineTo(-half+r,half); outline.quadraticCurveTo(-half,half,-half,half-r);
    outline.lineTo(-half,-half+r); outline.quadraticCurveTo(-half,-half,-half+r,-half);
    const aperture = new THREE.Path(); aperture.absarc(0,0,R,0,Math.PI*2,true); outline.holes.push(aperture);
    for (const x of [-1,1]) for (const y of [-1,1]) {
      const hole = new THREE.Path(); hole.absarc(x*diameter*.438,y*diameter*.438,2.15,0,Math.PI*2,true); outline.holes.push(hole);
      ctx.cylinder(group,4.5,1,[x*diameter*.438,y*diameter*.438,depth/2+.3],rubber);
      ctx.screw(group,[x*diameter*.438,y*diameter*.438,depth/2+1],'z',1.9);
    }
    const geometry = new THREE.ExtrudeGeometry(outline,{depth,bevelEnabled:true,bevelSize:.5,bevelThickness:.3,bevelSegments:2,curveSegments:32,steps:1});
    geometry.translate(0,0,-depth/2); geometry.scale(.01,.01,.01);
    const frameMesh = new THREE.Mesh(geometry,plastic); frameMesh.castShadow = frameMesh.receiveShadow = true; group.add(frameMesh);
    // Cylindrical air duct and front/rear lips surround the blade tips.
    for (const end of [-1,1]) ctx.torus(group,R+.3,.65,[0,0,end*(depth/2-1)],plastic);
  }
  // Swept motor struts sit on the exhaust face, leaving the intake unobstructed.
  const rear = -depth/2+1.8, hub = diameter * .143;
  for (let i=0;i<4;i++) {
    const angle = i*Math.PI/2+.3;
    const at = (r,a,z) => [Math.cos(a)*r,Math.sin(a)*r,z];
    ctx.tube(group,[at(hub,angle,rear),at(diameter*.29,angle+.15,rear),at(R,angle+.31,rear)],frame?1.7:1.1,plastic);
  }
  ctx.cylinder(group,hub*.92,3,[0,0,rear],rubber);
  ctx.label(group,'DC 12V',diameter*.15,diameter*.035,[0,0,rear-1.6],'#899096','-z');
  const rotor = new THREE.Group(); rotor.userData.dynamic = true;
  rotor.userData.rotationDirection = reverse ? 1 : -1; group.add(rotor); ctx.view.fans.push(rotor);
  const bladeGeometry = fanBladeGeometry(diameter,depth,blades);
  for (let i=0;i<blades;i++) {
    const blade = new THREE.Mesh(bladeGeometry,bladeMat); blade.rotation.z = i*Math.PI*2/blades;
    if (reverse) blade.scale.y = -1;
    blade.castShadow = blade.receiveShadow = true; blade.userData.detail = 'pitched-airfoil'; rotor.add(blade);
  }
  // Conical hub, bearing cap and moulded seam are separate from the blade roots.
  const hubDepth = Math.min(depth*.58,12);
  const hubMesh = new THREE.Mesh(new THREE.CylinderGeometry(hub*.91/100,hub/100,hubDepth/100,48),plastic);
  hubMesh.rotation.x = Math.PI/2; hubMesh.position.z = .005; hubMesh.castShadow = true; rotor.add(hubMesh);
  ctx.cylinder(rotor,hub*.83,.5,[0,0,hubDepth/2+1],plastic,'z',48);
  ctx.torus(rotor,hub*.84,.35,[0,0,hubDepth/2+1],rubber);
  if (label) ctx.label(rotor,label,hub*1.35,hub*.33,[0,0,hubDepth/2+1.3],rgb?'#60686c':'#9ca4aa');
  // TORX-style paired tip bridges only on the corresponding GPU profiles.
  if (paired) for (let i=0;i<Math.floor(blades/2);i++) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(diameter*.45/100,.65/100,5,16,Math.PI*2/blades*.82),bladeMat);
    arc.rotation.z = i*4*Math.PI/blades-.6; arc.position.z = .008; rotor.add(arc);
  }
  if (rgb && frame) {
    const diffuser = ctx.led();
    ctx.torus(group,R-.6,1.05,[0,0,depth/2-2],diffuser);
  }
  return group;
}
