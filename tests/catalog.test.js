import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { categories, initialProducts } from '../src/catalog.js';
import { additionalProducts } from '../src/catalog-expansion.js';
import { productImages } from '../src/product-images.js';

test('В каждой категории добавлено ровно четыре товара, без повторов ID', () => {
  assert.equal(additionalProducts.length, 32);
  assert.equal(initialProducts.length, 56);
  assert.equal(new Set(initialProducts.map(item => item.id)).size, 56);
  for (const category of categories) {
    assert.equal(additionalProducts.filter(item => item.category === category.id).length, 4, category.id);
    assert.equal(initialProducts.filter(item => item.category === category.id).length, 7, category.id);
  }
});

test('У всех новых товаров есть реальные файлы фотографий с источником Ситилинка', async () => {
  for (const item of additionalProducts) {
    const photo = productImages[item.id];
    assert.ok(photo, item.id);
    assert.equal(photo.source, item.source_url);
    assert.equal(new URL(photo.source).hostname, 'www.citilink.ru');
    assert.equal(new URL(photo.image_url).hostname, 'cdn.citilink.ru');
    assert.ok(photo.checked_at);
    const content = await readFile(new URL(`../public/${photo.path}`, import.meta.url));
    assert.equal(content.toString('ascii', 0, 4), 'RIFF', item.id);
    assert.equal(content.toString('ascii', 8, 12), 'WEBP', item.id);
    assert.ok(content.length > 1000, item.id);
    assert.equal(item.price_source, 'demo');
  }
});
