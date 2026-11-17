import test from 'node:test';
import assert from 'node:assert/strict';
import { initialProducts, defaultBuild } from '../src/catalog.js';
import { selectedProducts, totalPrice, checkCompatibility } from '../src/build.js';

test('Начальная конфигурация содержит восемь совместимых деталей', () => {
  const parts = selectedProducts(defaultBuild, initialProducts);
  assert.equal(Object.values(parts).filter(Boolean).length, 8);
  assert.deepEqual(checkCompatibility(parts), []);
  assert.equal(totalPrice(parts), 104420);
});

test('Замена процессора обнаруживает несовместимый сокет', () => {
  const parts = selectedProducts({ ...defaultBuild, cpu: 'cpu-i5-12400f' }, initialProducts);
  assert.ok(checkCompatibility(parts).some(issue => issue.includes('Сокеты')));
});

test('Фильтр замечает поколение памяти', () => {
  const parts = selectedProducts({ ...defaultBuild, ram: 'ram-kingston-ddr4' }, initialProducts);
  assert.ok(checkCompatibility(parts).some(issue => issue.includes('Тип памяти')));
});

test('Скрытые, удалённые и подставленные в чужую категорию товары исключаются', () => {
  const products = initialProducts.map(item => item.id === defaultBuild.gpu ? { ...item, active: false } : item);
  const parts = selectedProducts({ ...defaultBuild, cpu: defaultBuild.ram, storage: 'missing' }, products);
  assert.equal(parts.cpu, null);
  assert.equal(parts.gpu, null);
  assert.equal(parts.storage, null);
  assert.ok(Number.isFinite(totalPrice(parts)));
});

test('Превышение габаритов и мощности обнаруживается одновременно', () => {
  const parts = selectedProducts(defaultBuild, initialProducts);
  const modified = { ...parts, gpu: { ...parts.gpu, specs: { ...parts.gpu.specs, length: 500, tdp: 700 } } };
  const issues = checkCompatibility(modified);
  assert.ok(issues.some(issue => issue.includes('длиннее')));
  assert.ok(issues.some(issue => issue.includes('более мощный')));
});
