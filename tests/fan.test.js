import test from 'node:test';
import assert from 'node:assert/strict';
import { fanBladeGeometry } from '../src/graphics/fan.js';

test('Лопасть имеет закрытую объёмную поверхность и помещается в толщину вентилятора', () => {
  for (const [diameter,depth,count] of [[120,25,9],[92,25,9],[88,8,10],[140,25,7]]) {
    const geometry=fanBladeGeometry(diameter,depth,count);
    geometry.computeBoundingBox();
    const thickness=geometry.boundingBox.max.z-geometry.boundingBox.min.z;
    assert.ok(thickness>.02 && thickness<depth/100);
    assert.ok(geometry.attributes.normal.array.every(Number.isFinite));
    const edges=new Map(), index=geometry.index.array;
    for(let i=0;i<index.length;i+=3) for(let j=0;j<3;j++) {
      const a=index[i+j], b=index[i+(j+1)%3], key=[Math.min(a,b),Math.max(a,b)].join(':');
      edges.set(key,(edges.get(key)||0)+1);
    }
    assert.ok([...edges.values()].every(count=>count===2),'У лопасти не должно быть открытых рёбер');
    geometry.dispose();
  }
});
