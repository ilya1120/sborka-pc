import test from 'node:test';
import assert from 'node:assert/strict';
import { lightingColors, validLightingMode } from '../src/lighting.js';

test('Новый RGB и режимы сохранённых ранее сборок поддерживаются', () => {
  for (const mode of ['static', 'breathe', 'rainbow', 'rgb']) assert.equal(validLightingMode(mode), mode);
  assert.equal(validLightingMode('unknown'), 'static');
});

test('Палитра содержит восемь разных основных цветов', () => {
  assert.equal(new Set(lightingColors.map(color => color.value)).size, 8);
  assert.ok(lightingColors.every(color => /^#[a-f0-9]{6}$/i.test(color.value) && color.name));
});
