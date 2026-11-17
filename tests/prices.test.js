import test from 'node:test';
import assert from 'node:assert/strict';
import { readDNSPrice, validDNSProductURL } from '../scripts/dns-price.js';

const page = offer => `<script type="application/ld+json">${JSON.stringify({ '@type': 'Product', offers: offer })}</script>`;
test('Получение цены из структурированного предложения RUB', () => {
  assert.equal(readDNSPrice(page({ price: '18990', priceCurrency: 'RUB', availability: 'https://schema.org/InStock' })), 18990);
});
test('Отказ и отсутствие товара не становятся новой ценой', () => {
  assert.equal(readDNSPrice('<html>Access denied</html>'), null);
  assert.equal(readDNSPrice(page({ price: 0, priceCurrency: 'RUB' })), null);
  assert.equal(readDNSPrice(page({ price: 100, priceCurrency: 'USD' })), null);
  assert.equal(readDNSPrice(page({ price: 100, priceCurrency: 'RUB', availability: 'https://schema.org/OutOfStock' })), null);
});
test('Обновление обращается только к прямым страницам DNS', () => {
  assert.equal(validDNSProductURL('https://www.dns-shop.ru/product/93478ee7e957ed20/processor-amd-ryzen-5-7600-oem/'), true);
  assert.equal(validDNSProductURL('https://www.dns-shop.ru/search/?q=7600'), false);
  assert.equal(validDNSProductURL('https://www.dns-shop.ru.evil.example/product/93478ee7e957ed20/cpu/'), false);
  assert.equal(validDNSProductURL('http://127.0.0.1/product/93478ee7e957ed20/cpu/'), false);
});
