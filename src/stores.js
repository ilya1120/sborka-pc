// Четыре источника отобраны по доступности открытых данных 18.11.2026.
// Ссылки не являются предложениями конкретного товара; синхронизация отдельно.
export const comparisonStores = [
  { name: 'Ситилинк', url: 'https://www.citilink.ru/' },
  { name: 'Регард', url: 'https://www.regard.ru/' },
  { name: 'НИКС', url: 'https://www.nix.ru/' },
  { name: 'XCOM-SHOP', url: 'https://www.xcom-shop.ru/' },
];

export function storeLinksMarkup() {
  return `<section class="store-comparison" aria-label="Магазины комплектующих"><h3>Сравнить в магазинах</h3><p>Найдите эту же модель и проверьте цену и наличие. Цены магазинов пока не загружаются автоматически.</p><div class="store-links">${comparisonStores.map(store => `<a href="${store.url}" target="_blank" rel="noopener noreferrer">${store.name}<span aria-hidden="true">↗</span></a>`).join('')}</div></section>`;
}
