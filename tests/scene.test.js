import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { PCScene } from '../src/scene.js';
import { buildDetailedPC } from '../src/scene-model.js';
import { initialProducts, defaultBuild } from '../src/catalog.js';

// Geometry checks run without WebGL; they do not replace a browser visual review.
const canvasDocument = { createElement: () => ({ getContext: () => ({ fillRect() {}, beginPath() {}, arc() {}, fill() {} }) }) };
function createView() {
  const view = Object.create(PCScene.prototype);
  Object.assign(view, {
    model: new THREE.Group(), fans: [], leds: [], inspectionPanels: [], openSide: true,
    renderer: { capabilities: { getMaxAnisotropy: () => 1 } },
    label() {},
  });
  return view;
}
const defaults = () => Object.fromEntries(Object.entries(defaultBuild).map(([category, id]) => [category, initialProducts.find(item => item.id === id)]));
function withCanvas(run) {
  const previous = globalThis.document;
  globalThis.document = canvasDocument;
  try { return run(); } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
}
function dispose(view) {
  view.model.traverse(object => {
    object.geometry?.dispose();
    if (object.material) { object.material.alphaMap?.dispose(); object.material.dispose(); }
  });
}

test('Каждая из 56 деталей строится без повреждённой геометрии', () => withCanvas(() => {
  for (const product of initialProducts) {
    const view = createView();
    buildDetailedPC(view, { ...defaults(), [product.category]: product });
    assert.equal(view.model.children.length, 8);
    view.model.traverse(object => {
      const positions = object.geometry?.attributes.position.array;
      if (positions) assert.ok(positions.every(Number.isFinite), product.id);
      if (object.isInstancedMesh) assert.ok(object.instanceMatrix.array.every(Number.isFinite), product.id);
    });
    assert.ok(new THREE.Box3().setFromObject(view.model).max.length() < 10);
    dispose(view);
  }
}));

test('Длина корпуса видеокарты совпадает с характеристикой в масштабе 100 мм', () => withCanvas(() => {
  for (const gpu of initialProducts.filter(item => item.category === 'gpu')) {
    const view = createView();
    buildDetailedPC(view, { gpu });
    const shroud = view.model.children[0].children[0];
    shroud.geometry.computeBoundingBox();
    const length = shroud.geometry.boundingBox.getSize(new THREE.Vector3()).x;
    assert.ok(Math.abs(length - gpu.specs.length / 100) < 0.001);
    dispose(view);
  }
}));

test('Осмотр прячет кожух БП, а боковая стенка сохраняет выбранное состояние', () => withCanvas(() => {
  const view = createView();
  buildDetailedPC(view, defaults());
  view.setSide(false);
  assert.equal(view.glass.visible, true);
  view.setInspection(true);
  assert.equal(view.glass.visible, false);
  assert.ok(view.inspectionPanels.every(panel => !panel.visible));
  view.setInspection(false);
  assert.equal(view.glass.visible, true);
  assert.ok(view.inspectionPanels.every(panel => panel.visible));
  dispose(view);
}));

test('Пустая сборка остаётся корректной сценой', () => withCanvas(() => {
  const view = createView();
  buildDetailedPC(view, {});
  assert.equal(view.model.children.length, 0);
}));
