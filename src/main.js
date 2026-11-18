import './style.css';
import { categories, initialProducts, defaultBuild, specLabels } from './catalog.js';
import { selectedProducts, totalPrice, estimatedPower, checkCompatibility } from './build.js';
import { database, loadCatalog, getProfile, explainError } from './api.js';
import { PCScene } from './scene.js';
import { productImages } from './product-images.js';
import { lightingColors, lightingModes, validLightingMode } from './lighting.js';
import { storeLinksMarkup } from './stores.js';

const paths = {
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 1v4m6-4v4M9 19v4m6-4v4M1 9h4m-4 6h4m14-6h4m-4 6h4"/>',
  board: '<rect x="4" y="2" width="16" height="20" rx="2"/><rect x="7" y="5" width="7" height="7" rx="1"/><path d="M17 5v10M7 16h7m-7 3h10"/>',
  ram: '<rect x="2" y="6" width="20" height="11" rx="2"/><path d="M6 9v5m4-5v5m4-5v5m4-5v5M5 17v3m4-3v3m6-3v3m4-3v3"/>',
  gpu: '<rect x="3" y="6" width="19" height="12" rx="2"/><circle cx="9" cy="12" r="3"/><circle cx="17" cy="12" r="3"/><path d="M3 3v18m4-3v3m4-3v3"/>',
  storage: '<rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="11" r="4"/><path d="m12 11 4 5M8 19h8"/>',
  psu: '<rect x="2" y="5" width="20" height="15" rx="2"/><circle cx="10" cy="12" r="4"/><path d="M10 8v8m-4-4h8m4-3h1m-1 4h1"/>',
  case: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 5h8M8 18h8"/><circle cx="12" cy="10" r="2"/>',
  fan: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/><path d="M12 10c-8-7 4-11 2 0m0 2c7-8 11 4 0 2m-2 0c8 7-4 11-2 0m0-2c-7 8-11-4 0-2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', close: '<path d="m6 6 12 12M18 6 6 18"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>', check: '<path d="m5 12 4 4L19 6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/>',
  power: '<path d="M12 2v10M6 5a9 9 0 1 0 12 0"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  layers: '<path d="m12 3 10 6-10 6L2 9l10-6Zm-9 11 9 5 9-5m-18 5 9 5 9-5"/>',
  save: '<path d="M5 3h12l4 4v14H3V3h2Z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
  edit: '<path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z"/>',
  external: '<path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/>',
};
const icon = (name, className = '') => `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.cpu}</svg>`;
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const money = value => new Intl.NumberFormat('ru-RU').format(value);
const categoryById = id => categories.find(category => category.id === id);
let catalog = initialProducts;
let user = null;
let profile = null;
let scene;
let powered = false;
let rgbColor = '#69f2b2';
let rgbMode = 'static';
let sideOpen = true;
let inspectionOpen = false;
let build = { ...defaultBuild };
let buildName = 'Моя первая сборка';
let currentBuildId = null;
let catalogCategory = 'cpu';
let toastTimer;
let cloudReady = false;
let dialogRevision = 0;
try {
  const draft = JSON.parse(localStorage.getItem('sborka-draft') || 'null');
  if (draft?.components && typeof draft.components === 'object') {
    build = Object.fromEntries(categories.map(({ id }) => [id, typeof draft.components[id] === 'string' ? draft.components[id] : null]));
    buildName = String(draft.name || buildName).slice(0, 80);
    if (/^#[0-9a-f]{6}$/i.test(draft.rgbColor)) rgbColor = draft.rgbColor;
    rgbMode = validLightingMode(draft.rgbMode);
  }
} catch { /* Повреждённый локальный черновик заменяется начальной сборкой. */ }

const app = document.querySelector('#app');
const panel = document.querySelector('#panel');
app.innerHTML = `
  <header class="header">
    <a class="logo" href="#" aria-label="СБОРКА, главная">${icon('case')}<span>СБОРКА<span class="logo-dot">.</span></span></a>
    <nav aria-label="Главное меню"><button class="nav-link" id="catalog-open">Каталог</button><button class="nav-link active" id="builder-open" aria-current="page">Сборщик ПК</button></nav>
    <div class="header-actions"><button class="text-button" id="saved-open">${icon('layers')}<span>Мои сборки</span></button><button class="account-button" id="account-open">${icon('user')}<span>Войти</span></button></div>
  </header>
  <main>
    <div class="page-heading"><div><div class="eyebrow"><span></span>КОНФИГУРАТОР КОМПЬЮТЕРА</div><h1>Твой ПК. <span>В деталях.</span></h1><p>Выбирай комплектующие. Собирай. Рассматривай со всех сторон.</p></div><button class="text-button reset-build" id="new-build">${icon('plus')} Новая сборка</button></div>
    <div class="workspace">
      <section class="visual-card" aria-label="Визуальная сборка компьютера">
        <div class="stage-top"><span class="stage-label"><span class="live-dot"></span>3D-просмотр</span><span class="power-label" id="power-label">Питание выключено</span></div>
        <div id="scene"></div>
        <div class="scene-fallback" id="scene-fallback" hidden>Браузер не смог запустить 3D. Каталог и сборка доступны в списке справа.</div>
        <div class="scene-tools"><button class="tool-button" id="camera-reset" title="Вернуть исходный ракурс" aria-label="Вернуть исходный ракурс">${icon('reset')}</button><button class="tool-button" id="side-toggle" title="Закрыть боковую стенку" aria-label="Закрыть боковую стенку" aria-pressed="false">${icon('layers')}</button><button class="inspection-button" id="inspection-toggle" title="Разнести детали для осмотра" aria-pressed="false">${icon('layers')}<span>Разнести детали</span></button></div>
        <div class="stage-bottom"><span class="gesture-hint">Перетаскивай, чтобы вращать <span>·</span> Прокручивай, чтобы приблизить</span><button class="power-button" id="power-toggle" aria-pressed="false">${icon('power')}<span>Включить ПК</span></button></div>
        <div class="lighting-bar">
          <div class="lighting-title">${icon('fan')} Подсветка</div>
          <div class="swatches" aria-label="Цвет подсветки">
            ${lightingColors.map(color => `<button class="swatch" data-color="${color.value}" style="--swatch:${color.value}" title="${color.name}" aria-label="${color.name}" aria-pressed="${color.value === rgbColor}"></button>`).join('')}
            <label class="custom-color" title="Свой цвет"><input id="custom-color" type="color" value="${rgbColor}" aria-label="Свой цвет подсветки"/>+</label>
          </div>
          <details class="lighting-mode" id="lighting-mode">
            <summary aria-label="Режим подсветки"><span id="rgb-mode-label">Постоянный</span>${icon('arrow')}</summary>
            <div class="lighting-menu" role="group" aria-label="Режимы подсветки">
              ${lightingModes.map(mode => `<button data-mode="${mode.id}" aria-pressed="${mode.id === rgbMode}">${mode.id === 'rgb' || mode.id === 'rainbow' ? '<span class="rainbow-indicator"></span>' : icon(mode.id === 'static' ? 'power' : 'fan')}<span>${mode.name}</span></button>`).join('')}
            </div>
          </details>
        </div>
      </section>
      <section class="build-card" aria-label="Комплектующие сборки">
        <div class="build-heading"><div><span class="eyebrow">КОНФИГУРАЦИЯ</span><h2 id="build-title"></h2></div><span id="parts-count"></span></div>
        <div id="parts-list"></div>
        <div id="compatibility"></div>
        <div class="build-total"><div><span>Стоимость сборки</span><strong id="total"></strong><small id="price-note"></small></div><button class="save-button" id="save-build">${icon('save')} Сохранить сборку</button></div>
      </section>
    </div>
    <section class="component-strip" aria-label="Категории комплектующих">${categories.map(category => `<button data-category="${category.id}"><span class="category-icon">${icon(category.icon)}</span><span>${category.short}</span>${icon('plus', 'small-plus')}</button>`).join('')}</section>
    <footer><span>СБОРКА <span class="footer-separator">/</span> Учебный проект</span><span id="connection-label">Каталог для знакомства · примерные цены</span><button class="footer-link" id="about-open">О проекте</button></footer>
  </main>`;

function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('visible'), 4500);
}

function persistDraft() {
  try { localStorage.setItem('sborka-draft', JSON.stringify({ name: buildName, components: build, rgbColor, rgbMode })); }
  catch { /* При запрете хранилища текущая сборка продолжает работать в памяти. */ }
}

function renderBuild() {
  const parts = selectedProducts(build, catalog);
  const selected = Object.values(parts).filter(Boolean);
  document.querySelector('#build-title').textContent = buildName;
  document.querySelector('#parts-count').textContent = `${selected.length} / 8`;
  document.querySelector('#parts-list').innerHTML = categories.map(category => {
    const item = parts[category.id];
    return `<div class="part-row ${item ? '' : 'empty'}"><button class="part-select" data-category="${category.id}"><span class="part-thumb" style="--part-color:${item?.appearance.color || '#485251'}">${icon(category.icon)}</span><span class="part-copy"><span class="part-category">${category.name}</span><span class="part-name">${escape(item?.name || 'Выбрать компонент')}</span></span><span class="part-price">${item ? `${money(item.price)} <small>₽</small>` : icon('plus')}</span></button>${item ? `<button class="remove-part" data-remove="${category.id}" title="Убрать ${category.name.toLowerCase()}" aria-label="Убрать ${category.name.toLowerCase()}">${icon('close')}</button>` : ''}</div>`;
  }).join('');
  const issues = checkCompatibility(parts);
  document.querySelector('#compatibility').innerHTML = `<button class="compatibility ${issues.length ? 'warning' : ''}" id="compat-details">${icon(issues.length ? 'cpu' : 'check')}<span>${issues.length ? `Проверить совместимость · ${issues.length}` : selected.length === 8 ? 'Основные параметры совместимы' : 'Продолжи сборку'}<small>Потребление ≈ ${estimatedPower(parts)} Вт</small></span>${icon('arrow')}</button>`;
  document.querySelector('#compat-details').onclick = showCompatibility;
  document.querySelector('#total').innerHTML = `${money(totalPrice(parts))} <span>₽</span>`;
  const demo = selected.some(item => item.price_source === 'demo');
  document.querySelector('#price-note').textContent = demo ? 'Примерные цены · обновление DNS не подключено' : 'Цены и даты обновления — в карточках товаров';
  scene?.update(parts);
  if (powered && (selected.length < 8 || issues.length)) togglePower(false);
  persistDraft();
}

function openPanel(title, subtitle = '', wide = false) {
  dialogRevision++;
  panel.className = wide ? 'wide-panel' : '';
  panel.innerHTML = `<div class="panel-heading"><div><span class="eyebrow">СБОРКА</span><h2 id="panel-title">${escape(title)}</h2>${subtitle ? `<p>${escape(subtitle)}</p>` : ''}</div><button class="close-button" aria-label="Закрыть">${icon('close')}</button></div><div id="panel-content"></div>`;
  panel.querySelector('.close-button').onclick = () => panel.close();
  if (!panel.open) panel.showModal();
  panel.scrollTop = 0;
  return panel.querySelector('#panel-content');
}

function sourceURL(value) {
  try { const parsed = new URL(value); return parsed.protocol === 'https:' ? parsed.href : null; } catch { return null; }
}

function productPhoto(item, className = '') {
  const photo = productImages[item.id];
  const url = sourceURL(item.appearance?.image_url) || (photo ? `${import.meta.env.BASE_URL}${photo.path}` : null);
  return `<div class="product-art ${className}" style="--product-color:${escape(item.appearance.color)}">
    <span class="photo-fallback">${icon(categoryById(item.category).icon)}</span>
    ${url ? `<img src="${escape(url)}" alt="${escape(item.name)}" loading="lazy" decoding="async"/>` : '<span class="photo-missing">Фото пока нет</span>'}
    ${item.appearance.rgb ? '<span class="rgb-tag">RGB</span>' : ''}
  </div>`;
}

function showCatalog(category = catalogCategory) {
  catalogCategory = category;
  const body = openPanel('Каталог комплектующих', 'Выбери деталь — она появится в твоей сборке.', true);
  body.innerHTML = `<div class="catalog-toolbar"><label class="search-field">${icon('search')}<input id="catalog-search" placeholder="Название или производитель" aria-label="Поиск комплектующих"/></label><select id="catalog-sort" aria-label="Сортировка"><option value="default">По названию</option><option value="cheap">Сначала дешевле</option><option value="expensive">Сначала дороже</option></select></div><div class="category-tabs">${categories.map(item => `<button data-tab="${item.id}" class="${item.id === category ? 'selected' : ''}">${icon(item.icon)}${item.short}</button>`).join('')}</div><div class="catalog-filters"><label><input id="compatible-only" type="checkbox"/> Подходящие к сборке</label><span id="catalog-count"></span></div><div id="product-grid"></div>`;
  const renderProducts = () => {
    const search = body.querySelector('#catalog-search').value.toLocaleLowerCase('ru');
    let products = catalog.filter(item => item.active !== false && item.category === catalogCategory && `${item.name} ${item.brand}`.toLocaleLowerCase('ru').includes(search));
    if (body.querySelector('#compatible-only').checked) products = products.filter(item => checkCompatibility(selectedProducts({ ...build, [item.category]: item.id }, catalog)).length === 0);
    const sort = body.querySelector('#catalog-sort').value;
    products.sort((a, b) => sort === 'cheap' ? a.price - b.price : sort === 'expensive' ? b.price - a.price : a.name.localeCompare(b.name, 'ru'));
    body.querySelector('#catalog-count').textContent = `Найдено ${products.length}`;
    body.querySelector('#product-grid').innerHTML = products.length ? products.map(item => {
      const selected = build[item.category] === item.id;
      return `<article class="product-card">${productPhoto(item)}<div class="product-brand">${escape(item.brand)}</div><h3>${escape(item.name)}</h3><p class="product-summary">${escape(Object.entries(item.specs).slice(0, 3).map(([key, value]) => `${specLabels[key] || key} ${Array.isArray(value) ? value.join(', ') : value}`).join(' · '))}</p><button class="details-link" data-details="${escape(item.id)}">Характеристики ${icon('arrow')}</button><div class="product-bottom"><div><strong>${money(item.price)} ₽</strong><small>${item.price_source === 'demo' ? 'Примерная цена' : 'Цена из каталога'}</small></div><button class="choose-button ${selected ? 'chosen' : ''}" data-choose="${escape(item.id)}">${selected ? icon('check') + 'В сборке' : icon('plus') + 'Выбрать'}</button></div></article>`;
    }).join('') : '<div class="empty-state">Нет подходящих товаров. Измените поиск или отключите фильтр совместимости.</div>';
  };
  body.querySelector('#catalog-search').oninput = renderProducts;
  body.querySelector('#catalog-sort').onchange = renderProducts;
  body.querySelector('#compatible-only').onchange = renderProducts;
  body.querySelectorAll('[data-tab]').forEach(button => { button.onclick = () => {
    catalogCategory = button.dataset.tab;
    body.querySelectorAll('[data-tab]').forEach(tab => tab.classList.toggle('selected', tab === button));
    renderProducts();
  }; });
  body.addEventListener('click', event => {
    const choose = event.target.closest('[data-choose]');
    if (choose) {
      const item = catalog.find(product => product.id === choose.dataset.choose);
      if (!item) return;
      build[item.category] = item.id;
      renderBuild(); panel.close();
      toast(`${item.name} добавлен в сборку`);
    }
    const details = event.target.closest('[data-details]');
    if (details) showProduct(details.dataset.details);
  });
  renderProducts();
}

function showProduct(id) {
  const item = catalog.find(product => product.id === id);
  if (!item) return;
  const body = openPanel(item.name, categoryById(item.category).name);
  const source = sourceURL(item.source_url);
  body.innerHTML = `${productPhoto(item, 'large-art')}<p class="description">${escape(item.description)}</p><dl class="spec-list">${Object.entries(item.specs).map(([key, value]) => `<div><dt>${escape(specLabels[key] || key)}</dt><dd>${escape(Array.isArray(value) ? value.join(', ') : value)}</dd></div>`).join('')}<div><dt>Цвет модели</dt><dd><span class="color-chip" style="background:${escape(item.appearance.color)}"></span>${escape(item.appearance.color)}</dd></div><div><dt>Подсветка</dt><dd>${item.appearance.rgb ? 'Есть' : 'Нет'}</dd></div></dl><div class="price-box"><strong>${money(item.price)} ₽</strong><p>${item.price_source === 'demo' ? 'Примерная учебная цена. Автоматическое обновление из DNS пока не подключено.' : `Источник: ${escape(item.price_source)}. Обновлено: ${item.price_updated_at ? new Date(item.price_updated_at).toLocaleString('ru-RU') : 'дата не указана'}.`}</p>${source ? `<a class="details-link" href="${escape(source)}" target="_blank" rel="noopener noreferrer">${item.price_source === 'demo' ? 'Найти в DNS' : 'Открыть источник'} ${icon('external')}</a>` : ''}</div>${storeLinksMarkup()}<p class="muted">Детализированная параметрическая 3D-модель. Геометрия и оттенки могут отличаться от реального товара. Перед покупкой сверяйте данные с производителем.</p><button class="primary-button" id="detail-choose">${icon('plus')} Добавить в сборку</button><button class="secondary-button" id="back-catalog">Вернуться в каталог</button>`;
  body.querySelector('#detail-choose').onclick = () => { build[item.category] = item.id; renderBuild(); panel.close(); toast('Комплектующее добавлено'); };
  body.querySelector('#back-catalog').onclick = () => showCatalog(item.category);
}

function showCompatibility() {
  const parts = selectedProducts(build, catalog);
  const issues = checkCompatibility(parts);
  const missing = categories.filter(category => !parts[category.id]);
  const body = openPanel('Совместимость сборки');
  body.innerHTML = `<div class="compat-banner ${issues.length ? 'warning' : ''}">${icon(issues.length ? 'cpu' : 'check')} ${issues.length ? 'Есть несовпадения' : 'Основные проверки пройдены'}</div>${issues.map(issue => `<p class="issue">${escape(issue)}</p>`).join('')}${missing.length ? `<p class="description">Осталось выбрать ${missing.map(item => item.name.toLowerCase()).join(', ')}.</p>` : ''}<dl class="spec-list"><div><dt>Оценка потребления</dt><dd>${estimatedPower(parts)} Вт</dd></div><div><dt>Мощность БП с запасом 30%</dt><dd>от ${Math.ceil(estimatedPower(parts) * 1.3)} Вт</dd></div></dl><p class="muted">Проверяются сокет, поколение и слоты памяти, форматы платы и БП, габариты GPU и кулера, мощность охлаждения и запас питания. Версию BIOS, разъёмы питания и все физические зазоры нужно сверять по документации производителей.</p>`;
}

function togglePower(force) {
  const next = typeof force === 'boolean' ? force : !powered;
  if (next) {
    const parts = selectedProducts(build, catalog);
    if (Object.values(parts).filter(Boolean).length < 8) return toast('Для включения выбери все восемь компонентов');
    if (checkCompatibility(parts).length) { showCompatibility(); return; }
  }
  powered = next;
  scene?.setPower(powered);
  document.querySelector('#power-label').textContent = powered ? 'Компьютер включён' : 'Питание выключено';
  document.querySelector('#power-label').classList.toggle('on', powered);
  const button = document.querySelector('#power-toggle');
  button.setAttribute('aria-pressed', powered);
  button.classList.toggle('on', powered);
  button.querySelector('span').textContent = powered ? 'Выключить ПК' : 'Включить ПК';
}

function setLighting(color = rgbColor, mode = rgbMode) {
  rgbColor = color; rgbMode = validLightingMode(mode);
  scene?.setRGB(rgbColor, rgbMode);
  document.querySelectorAll('.swatch').forEach(button => button.setAttribute('aria-pressed', button.dataset.color === rgbColor));
  document.querySelector('#custom-color').value = rgbColor;
  document.querySelector('#rgb-mode-label').textContent = lightingModes.find(item => item.id === rgbMode).name;
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', button.dataset.mode === rgbMode));
  persistDraft();
}

function showAuth(register = false) {
  const body = openPanel(register ? 'Создать аккаунт' : 'С возвращением', 'Вход по электронной почте и паролю.');
  if (!database) {
    body.innerHTML = '<div class="empty-state">Авторизация появится после подключения проекта Supabase. Пока можно собрать ПК и рассмотреть его в 3D. Текущий черновик сохраняется в этом браузере.</div>';
    return;
  }
  body.innerHTML = `<form id="auth-form"><label class="field-label">Электронная почта<input name="email" type="email" autocomplete="email" placeholder="you@example.com" required maxlength="254"/></label><label class="field-label">Пароль<input name="password" type="password" autocomplete="${register ? 'new-password' : 'current-password'}" required minlength="8" maxlength="128" placeholder="Не менее 8 символов"/></label>${register ? '<label class="field-label">Повторите пароль<input name="confirmation" type="password" autocomplete="new-password" required minlength="8" maxlength="128"/></label>' : ''}<p class="muted">${register ? 'Создадим аккаунт клиента. Можно сразу сохранять свои сборки.' : 'Войдите, чтобы открыть сохранённые сборки.'}</p><button class="primary-button" type="submit">${register ? 'Зарегистрироваться' : 'Войти'}</button><p id="auth-status" role="status"></p></form><button class="secondary-button" id="auth-switch">${register ? 'У меня уже есть аккаунт' : 'Создать аккаунт'}</button>`;
  body.querySelector('#auth-switch').onclick = () => showAuth(!register);
  body.querySelector('#auth-form').onsubmit = async event => {
    event.preventDefault();
    const button = event.submitter;
    const status = body.querySelector('#auth-status');
    button.disabled = true; status.textContent = register ? 'Создаём аккаунт…' : 'Выполняем вход…';
    try {
      const values = new FormData(event.target);
      const email = values.get('email').trim();
      const password = values.get('password');
      if (register && password !== values.get('confirmation')) {
        status.textContent = 'Пароли не совпадают.';
        return;
      }
      const { data, error } = register
        ? await database.auth.signUp({ email, password })
        : await database.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (register && !data.session) {
        status.textContent = 'Не удалось сразу войти. Если аккаунт уже существует, перейдите к форме входа.';
        return;
      }
      if (panel.open) panel.close();
      toast(register ? 'Аккаунт создан' : 'Вход выполнен');
    } catch (error) { status.textContent = explainError(error); }
    finally { button.disabled = false; }
  };
}

function showAccount() {
  if (!user) return showAuth();
  const body = openPanel('Мой профиль');
  body.innerHTML = `<p class="account-email">${escape(user.email)}</p><p class="role-label">${profile?.role === 'admin' ? 'Администратор' : 'Клиент'}</p><button class="primary-button" id="profile-builds">Мои сборки ${icon('arrow')}</button>${profile?.role === 'admin' ? '<button class="secondary-button" id="admin-open">Панель администратора</button>' : ''}<button class="secondary-button" id="set-password">Установить или изменить пароль</button><button class="secondary-button" id="sign-out">Выйти из аккаунта</button>`;
  body.querySelector('#profile-builds').onclick = showSaved;
  body.querySelector('#admin-open')?.addEventListener('click', showAdmin);
  body.querySelector('#set-password').onclick = showPasswordForm;
  body.querySelector('#sign-out').onclick = async event => {
    event.target.disabled = true;
    const { error } = await database.auth.signOut();
    if (error) { toast(explainError(error)); event.target.disabled = false; return; }
    currentBuildId = null; panel.close(); toast('Вы вышли из аккаунта');
  };
}

function showPasswordForm() {
  if (!user) return showAuth();
  const body = openPanel('Пароль аккаунта', 'Установите пароль для последующих входов.');
  body.innerHTML = '<form id="password-form"><label class="field-label">Новый пароль<input name="password" type="password" autocomplete="new-password" required minlength="8" maxlength="128"/></label><label class="field-label">Повторите пароль<input name="confirmation" type="password" autocomplete="new-password" required minlength="8" maxlength="128"/></label><button class="primary-button" type="submit">Сохранить пароль</button><p id="password-status" role="status"></p></form>';
  body.querySelector('form').onsubmit = async event => {
    event.preventDefault();
    const values = new FormData(event.target);
    const status = body.querySelector('#password-status');
    if (values.get('password') !== values.get('confirmation')) { status.textContent = 'Пароли не совпадают.'; return; }
    event.submitter.disabled = true;
    const { error } = await database.auth.updateUser({ password: values.get('password') });
    if (error) { status.textContent = explainError(error); event.submitter.disabled = false; return; }
    panel.close(); toast('Пароль сохранён');
  };
}

function showSave() {
  if (!user) return showAuth(true);
  if (!cloudReady) return toast('Дождитесь подключения каталога');
  const body = openPanel('Сохранить сборку');
  body.innerHTML = `<form id="save-form"><label class="field-label">Название сборки<input name="name" required maxlength="80" value="${escape(buildName)}"/></label><p class="muted">Сохраним выбранные детали, цвет и режим подсветки в вашем аккаунте.</p><button class="primary-button" type="submit">Сохранить</button>${currentBuildId ? '<button type="button" class="secondary-button" id="save-copy">Сохранить как новую</button>' : ''}<p id="save-status" role="status"></p></form>`;
  const save = async (event, copy = false) => {
    event.preventDefault();
    const form = body.querySelector('form');
    if (!form.reportValidity()) return;
    const buttons = form.querySelectorAll('button');
    buttons.forEach(button => { button.disabled = true; });
    const name = form.elements.name.value.trim();
    if (!name) { buttons.forEach(button => { button.disabled = false; }); return; }
    const payload = { name, components: build, rgb_color: rgbColor, rgb_mode: rgbMode, user_id: user.id };
    let query = database.from('builds');
    query = currentBuildId && !copy ? query.update(payload).eq('id', currentBuildId).eq('user_id', user.id) : query.insert(payload);
    const { data, error } = await query.select('id').single();
    if (error) { body.querySelector('#save-status').textContent = explainError(error); buttons.forEach(button => { button.disabled = false; }); return; }
    currentBuildId = data.id; buildName = name;
    renderBuild(); panel.close(); toast('Сборка сохранена в вашем аккаунте');
  };
  body.querySelector('form').onsubmit = save;
  body.querySelector('#save-copy')?.addEventListener('click', event => save(event, true));
}

async function showSaved() {
  if (!user) return showAuth();
  const body = openPanel('Мои сборки', 'Сохранённые конфигурации твоего компьютера.');
  const revision = dialogRevision;
  body.innerHTML = '<p class="muted">Загружаем сборки…</p>';
  const { data, error } = await database.from('builds').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
  if (revision !== dialogRevision) return;
  if (error) { body.textContent = explainError(error); return; }
  body.innerHTML = data.length ? data.map(item => `<article class="saved-card"><div>${icon('case')}<h3>${escape(item.name)}</h3></div><p>${Object.values(item.components).filter(Boolean).length} компонентов · ${money(totalPrice(selectedProducts(item.components, catalog)))} ₽ по текущему каталогу</p><small>${new Date(item.updated_at).toLocaleDateString('ru-RU')}</small><div class="saved-actions"><button class="choose-button" data-load="${item.id}">Открыть ${icon('arrow')}</button><button class="text-button" data-delete-build="${item.id}" aria-label="Удалить сборку ${escape(item.name)}">${icon('trash')}</button></div></article>`).join('') : '<div class="empty-state">Здесь появятся сохранённые сборки. Подбери комплектующие и нажми «Сохранить сборку».</div>';
  body.onclick = async event => {
    const load = event.target.closest('[data-load]');
    if (load) {
      const item = data.find(row => row.id === load.dataset.load);
      build = Object.fromEntries(categories.map(({ id }) => [id, item.components[id] || null]));
      buildName = item.name; currentBuildId = item.id;
      setLighting(item.rgb_color, item.rgb_mode);
      togglePower(false); renderBuild(); panel.close();
      const unavailable = Object.values(item.components).filter(Boolean).filter(id => !catalog.some(product => product.id === id && product.active));
      toast(unavailable.length ? 'Сборка открыта. Некоторые товары уже недоступны — выбери замену.' : 'Сборка открыта');
    }
    const remove = event.target.closest('[data-delete-build]');
    if (remove) {
      const item = data.find(row => row.id === remove.dataset.deleteBuild);
      if (!confirm(`Удалить сборку «${item.name}»?`)) return;
      remove.disabled = true;
      const { data: deleted, error: deleteError } = await database.from('builds').delete().eq('id', item.id).eq('user_id', user.id).select('id');
      if (deleteError || !deleted?.length) { toast(deleteError ? explainError(deleteError) : 'Сборка уже удалена'); remove.disabled = false; return; }
      if (currentBuildId === item.id) currentBuildId = null;
      showSaved(); toast('Сборка удалена');
    }
  };
}

async function showAdmin() {
  if (profile?.role !== 'admin') return toast('Доступно администратору');
  const body = openPanel('Управление каталогом', 'Товары, характеристики и внешний вид.', true);
  const revision = dialogRevision;
  body.innerHTML = '<p class="muted">Загружаем каталог…</p>';
  const { data, error } = await database.from('products').select('*').order('category').order('name');
  if (revision !== dialogRevision) return;
  if (error) { body.textContent = explainError(error); return; }
  body.innerHTML = `<button class="primary-button compact" id="add-product">${icon('plus')} Добавить комплектующее</button><div class="admin-list">${data.map(item => `<div class="admin-row"><span class="category-icon">${icon(categoryById(item.category)?.icon)}</span><div><strong>${escape(item.name)}</strong><small>${categoryById(item.category)?.name} · ${money(item.price)} ₽ · ${item.active ? 'В каталоге' : 'Скрыто'}</small></div><button class="tool-button" data-edit="${escape(item.id)}" aria-label="Редактировать ${escape(item.name)}">${icon('edit')}</button><button class="tool-button" data-archive="${escape(item.id)}" aria-label="${item.active ? 'Скрыть' : 'Вернуть'} товар">${icon(item.active ? 'trash' : 'plus')}</button></div>`).join('')}</div>`;
  body.querySelector('#add-product').onclick = () => showProductEditor();
  body.onclick = async event => {
    const edit = event.target.closest('[data-edit]');
    if (edit) showProductEditor(data.find(item => item.id === edit.dataset.edit));
    const archive = event.target.closest('[data-archive]');
    if (!archive) return;
    const item = data.find(row => row.id === archive.dataset.archive);
    archive.disabled = true;
    const { data: updated, error: updateError } = await database.from('products').update({ active: !item.active }).eq('id', item.id).select('id');
    if (updateError || !updated?.length) { toast(updateError ? explainError(updateError) : 'Товар уже изменён'); archive.disabled = false; return; }
    await refreshCatalog(); showAdmin(); toast(item.active ? 'Товар скрыт из каталога' : 'Товар возвращён в каталог');
  };
}

function showProductEditor(existing = null) {
  const body = openPanel(existing ? 'Редактировать товар' : 'Новое комплектующее');
  const item = existing || { category: 'cpu', name: '', brand: '', price: 0, description: '', specs: { ...initialProducts[0].specs }, appearance: { color: '#25282c', rgb: false }, source_url: '', active: true };
  const field = (label, name, value, type = 'text', extra = '') => `<label class="field-label">${label}<input type="${type}" name="${name}" value="${escape(value)}" ${extra}/></label>`;
  body.innerHTML = `<form id="product-form"><label class="field-label">Категория<select name="category" ${existing ? 'disabled' : ''}>${categories.map(category => `<option value="${category.id}" ${category.id === item.category ? 'selected' : ''}>${category.name}</option>`).join('')}</select></label>${field('Название', 'name', item.name, 'text', 'required maxlength="160"')}${field('Производитель', 'brand', item.brand, 'text', 'required maxlength="80"')}${field('Цена, ₽', 'price', item.price, 'number', 'min="0" max="10000000" step="0.01" required')}<label class="field-label">Описание<textarea name="description" maxlength="2000" required>${escape(item.description)}</textarea></label><div class="editor-subheading">Характеристики</div><div id="spec-fields"></div><div class="form-grid">${field('Цвет', 'color', item.appearance.color, 'color')}<label class="checkbox-field"><input type="checkbox" name="rgb" ${item.appearance.rgb ? 'checked' : ''}/> Есть RGB-подсветка</label></div>${field('Фотография товара — прямая ссылка HTTPS', 'image_url', item.appearance.image_url || '', 'url')}${field('Ссылка на товар в магазине', 'source_url', item.source_url || '', 'url')}<p class="muted">Цвет и характеристики управляют параметрической 3D-моделью. После изменения цены источником станет ручное обновление администратора.</p><button class="primary-button" type="submit">Сохранить товар</button><button class="secondary-button" type="button" id="editor-back">Вернуться к каталогу</button><p id="editor-status" role="status"></p></form>`;
  const form = body.querySelector('form');
  const renderSpecs = specs => {
    body.querySelector('#spec-fields').innerHTML = Object.entries(specs).map(([key, value]) => field(specLabels[key] || key, `spec_${key}`, Array.isArray(value) ? value.join(', ') : value, typeof value === 'number' ? 'number' : 'text', `required ${typeof value === 'number' ? 'min="0" max="10000000" step="1"' : 'maxlength="160"'}`)).join('');
  };
  renderSpecs(item.specs);
  form.elements.category.onchange = () => renderSpecs(initialProducts.find(product => product.category === form.elements.category.value).specs);
  body.querySelector('#editor-back').onclick = showAdmin;
  form.onsubmit = async event => {
    event.preventDefault();
    const submit = event.submitter;
    submit.disabled = true;
    try {
      const values = new FormData(form);
      const category = existing?.category || values.get('category');
      const template = initialProducts.find(product => product.category === category).specs;
      const specs = Object.fromEntries(Object.entries(template).map(([key, value]) => {
        const input = String(values.get(`spec_${key}`) ?? '').trim();
        return [key, Array.isArray(value) ? input.split(',').map(part => part.trim()).filter(Boolean) : typeof value === 'number' ? Number(input) : input];
      }));
      const payload = {
        id: existing?.id || crypto.randomUUID(), category,
        name: values.get('name').trim(), brand: values.get('brand').trim(), description: values.get('description').trim(),
        price: Number(values.get('price')), specs,
        appearance: { ...item.appearance, color: values.get('color'), rgb: values.get('rgb') === 'on', image_url: sourceURL(values.get('image_url')) },
        source_url: sourceURL(values.get('source_url')),
        active: item.active,
        price_source: existing?.price === Number(values.get('price')) ? existing.price_source : 'manual',
        price_updated_at: existing?.price === Number(values.get('price')) ? existing.price_updated_at : new Date().toISOString(),
      };
      if (!payload.name || !payload.brand || !payload.description) throw new Error('Заполните название, производителя и описание.');
      const query = existing ? database.from('products').update(payload).eq('id', existing.id) : database.from('products').insert(payload);
      const { data, error } = await query.select('id').single();
      if (error || !data) throw error || new Error('Товар не сохранён');
      await refreshCatalog(); showAdmin(); toast('Комплектующее сохранено');
    } catch (error) { body.querySelector('#editor-status').textContent = explainError(error); submit.disabled = false; }
  };
}

async function refreshCatalog() {
  const rows = await loadCatalog();
  if (rows !== null) { catalog = rows; cloudReady = true; renderBuild(); }
}

app.addEventListener('click', event => {
  const category = event.target.closest('[data-category]');
  if (category) showCatalog(category.dataset.category);
  const remove = event.target.closest('[data-remove]');
  if (remove) { build[remove.dataset.remove] = null; renderBuild(); }
  const color = event.target.closest('[data-color]');
  if (color) setLighting(color.dataset.color, 'static');
  const mode = event.target.closest('[data-mode]');
  if (mode) {
    setLighting(rgbColor, mode.dataset.mode);
    document.querySelector('#lighting-mode').open = false;
  }
});
document.querySelector('#catalog-open').onclick = () => showCatalog();
document.querySelector('#builder-open').onclick = () => { if (panel.open) panel.close(); };
document.querySelector('#account-open').onclick = showAccount;
document.querySelector('#saved-open').onclick = showSaved;
document.querySelector('#save-build').onclick = showSave;
document.querySelector('#power-toggle').onclick = () => togglePower();
document.querySelector('#camera-reset').onclick = () => scene?.resetCamera();
document.querySelector('#inspection-toggle').onclick = event => {
  inspectionOpen = !inspectionOpen;
  scene?.setInspection(inspectionOpen);
  event.currentTarget.setAttribute('aria-pressed', String(inspectionOpen));
  event.currentTarget.querySelector('span').textContent = inspectionOpen ? 'Собрать обратно' : 'Разнести детали';
  event.currentTarget.title = inspectionOpen ? 'Собрать детали обратно' : 'Разнести детали для осмотра';
};
document.querySelector('#side-toggle').onclick = event => {
  sideOpen = !sideOpen; scene?.setSide(sideOpen);
  const button = event.currentTarget;
  button.setAttribute('aria-pressed', !sideOpen);
  button.setAttribute('aria-label', sideOpen ? 'Закрыть боковую стенку' : 'Открыть боковую стенку');
  button.title = button.getAttribute('aria-label');
};
document.querySelector('#custom-color').oninput = event => setLighting(event.target.value, 'static');
document.addEventListener('click', event => {
  if (!event.target.closest('#lighting-mode')) document.querySelector('#lighting-mode').open = false;
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') document.querySelector('#lighting-mode').open = false;
});
document.addEventListener('error', event => {
  if (event.target instanceof HTMLImageElement && event.target.closest('.product-art')) {
    event.target.closest('.product-art').classList.add('photo-unavailable');
  }
}, true);
document.querySelector('#new-build').onclick = () => {
  const body = openPanel('Новая сборка');
  body.innerHTML = '<p class="description">Текущий черновик будет заменён. Сохранённые в аккаунте сборки останутся доступны.</p><button class="primary-button" id="start-empty">Начать с пустого корпуса</button><button class="secondary-button" id="start-example">Открыть пример сборки</button>';
  const start = example => {
    const first = Object.fromEntries(categories.map(({ id }) => [id, catalog.find(item => item.category === id && item.active)?.id || null]));
    build = example ? (cloudReady ? first : { ...defaultBuild }) : Object.fromEntries(categories.map(({ id }) => [id, id === 'case' ? first.case : null]));
    buildName = 'Моя сборка'; currentBuildId = null; togglePower(false); renderBuild(); panel.close();
  };
  body.querySelector('#start-empty').onclick = () => start(false);
  body.querySelector('#start-example').onclick = () => start(true);
};
document.querySelector('#about-open').onclick = () => {
  const body = openPanel('О проекте');
  body.innerHTML = '<p class="description">СБОРКА — учебный каталог комплектующих с визуальным конфигуратором ПК. Соберите компьютер, проверьте основные параметры совместимости и сохраните конфигурацию.</p><p class="muted">3D-модели параметрические: учитываются длина видеокарты, высота кулера, количество вентиляторов и цвет. Точные формы конкретного артикула нужно сверять с производителем. Расчёт мощности приблизительный.</p><p class="muted">Начальные цены демонстрационные. Для DNS доступна ссылка на поиск. Автоматическое получение цен требует подключения источника данных.</p><p class="muted">Черновик хранится в этом браузере. Сохранённые сборки доступны после входа, хранятся в PostgreSQL и доступны только владельцу.</p>';
};
panel.addEventListener('click', event => { if (event.target === panel) { const rect = panel.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) panel.close(); } });

try { scene = new PCScene(document.querySelector('#scene'), showCatalog); }
catch (error) { console.error('3D initialization failed', error); document.querySelector('#scene-fallback').hidden = false; }
renderBuild(); setLighting();

let authRevision = 0;
async function updateSession(session) {
  const revision = ++authRevision;
  user = session?.user || null; profile = null;
  if (user) {
    try { const nextProfile = await getProfile(user); if (revision !== authRevision) return; profile = nextProfile; }
    catch { if (revision === authRevision) toast('Не удалось загрузить профиль. Повторите вход позже.'); }
  }
  if (revision !== authRevision) return;
  document.querySelector('#account-open span').textContent = user ? (profile?.role === 'admin' ? 'Администратор' : 'Мой профиль') : 'Войти';
}

if (database) {
  database.auth.onAuthStateChange((event, session) => {
    // Запрос профиля выполняется после завершения внутреннего обработчика Auth.
    setTimeout(() => {
      updateSession(session);
      if (event === 'SIGNED_IN') { if (panel.open) panel.close(); toast('Вход выполнен'); }
      if (event === 'SIGNED_OUT') currentBuildId = null;
    }, 0);
  });
  refreshCatalog().then(() => {
    document.querySelector('#connection-label').textContent = 'PostgreSQL подключена · личные сборки в облаке';
  }).catch(() => { toast('Каталог базы недоступен. Показан учебный пример.'); });
  const authError = new URLSearchParams(location.hash.slice(1)).get('error_description');
  if (authError) toast('Ссылка для входа устарела. Запросите новую.');
}
