import { createClient } from '@supabase/supabase-js';
import { readDNSPrice, validDNSProductURL } from './dns-price.js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Настройте SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в Secrets репозитория.');
  process.exit(1);
}
const database = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: products, error } = await database.from('products').select('id, source_url, updated_at').eq('active', true);
if (error) { console.error('Каталог базы недоступен.'); process.exit(1); }
const linked = products.filter(product => validDNSProductURL(product.source_url));
if (!linked.length) {
  console.error('Нет прямых ссылок на товары DNS. Добавьте их через админ-панель.');
  process.exit(1);
}
let updated = 0;
for (const product of linked) {
  try {
    const response = await fetch(product.source_url, {
      signal: AbortSignal.timeout(20000),
      redirect: 'error',
      headers: { 'User-Agent': 'Sborka-Educational-Catalog/1.0', Accept: 'text/html' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const price = readDNSPrice(await response.text());
    if (price === null) throw new Error('В открытых данных страницы нет доступной цены RUB');
    const { data, error: updateError } = await database.from('products').update({
      price, price_source: 'DNS', price_updated_at: new Date().toISOString(),
    }).eq('id', product.id).eq('updated_at', product.updated_at).select('id');
    if (updateError) throw new Error('Не удалось сохранить цену');
    if (data.length) { updated++; console.log(`${product.id}: цена обновлена`); }
    else console.log(`${product.id}: товар изменён администратором, пропущено`);
  } catch (failure) {
    console.warn(`${product.id}: ${failure.message}. Предыдущая цена и дата сохранены.`);
  }
  await new Promise(resolve => setTimeout(resolve, 1500));
}
console.log(`Обновлено ${updated} из ${linked.length} товаров.`);
if (!updated) process.exitCode = 1;
