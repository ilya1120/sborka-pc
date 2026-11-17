export function readDNSPrice(html) {
  const scripts = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const script of scripts) {
    let document;
    try { document = JSON.parse(script[1]); } catch { continue; }
    const nodes = Array.isArray(document) ? document : [document];
    const expanded = nodes.flatMap(node => Array.isArray(node?.['@graph']) ? node['@graph'] : [node]);
    for (const node of expanded) {
      if (![node?.['@type']].flat().includes('Product')) continue;
      const offers = Array.isArray(node.offers) ? node.offers : [node.offers];
      for (const offer of offers) {
        if (offer?.priceCurrency !== 'RUB' || !offer.price || /OutOfStock|Discontinued/.test(offer.availability || '')) continue;
        const price = Number(offer.price);
        if (Number.isFinite(price) && price > 0 && price < 10000000) return price;
      }
    }
  }
  return null;
}

export function validDNSProductURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ['www.dns-shop.ru', 'dns-shop.ru'].includes(url.hostname)
      && !url.username && !url.password && !url.port
      && /^\/product\/[a-f0-9]{16}\/[a-z0-9-]+\/?$/.test(url.pathname);
  } catch { return false; }
}
