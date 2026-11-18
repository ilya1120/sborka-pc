export const categories = [
  { id: 'cpu', name: 'Процессор', short: 'CPU', icon: 'cpu' },
  { id: 'motherboard', name: 'Материнская плата', short: 'Плата', icon: 'board' },
  { id: 'ram', name: 'Оперативная память', short: 'RAM', icon: 'ram' },
  { id: 'gpu', name: 'Видеокарта', short: 'GPU', icon: 'gpu' },
  { id: 'storage', name: 'Накопитель', short: 'SSD / HDD', icon: 'storage' },
  { id: 'psu', name: 'Блок питания', short: 'Питание', icon: 'psu' },
  { id: 'case', name: 'Корпус', short: 'Корпус', icon: 'case' },
  { id: 'cooler', name: 'Охлаждение', short: 'Кулер', icon: 'fan' },
];

function product(id, category, name, brand, price, description, specs, appearance = {}) {
  return {
    id, category, name, brand, price, description, specs,
    appearance: { color: '#25282c', rgb: false, ...appearance },
    active: true, price_source: 'demo', price_updated_at: null,
    source_url: `https://www.dns-shop.ru/search/?q=${encodeURIComponent(name)}`,
  };
}

// Начальные демонстрационные цены. Подтверждённые предложения хранятся отдельно.
export const initialProducts = [
  product('cpu-r5-7600', 'cpu', 'AMD Ryzen 5 7600', 'AMD', 18990, 'Шестиядерный процессор для современной игровой сборки на AM5.', { socket: 'AM5', cores: 6, threads: 12, tdp: 65, memory: 'DDR5' }, { color: '#adb4bd' }),
  product('cpu-r7-7700', 'cpu', 'AMD Ryzen 7 7700', 'AMD', 27990, 'Восемь ядер для игр, монтажа и работы с несколькими приложениями.', { socket: 'AM5', cores: 8, threads: 16, tdp: 65, memory: 'DDR5' }, { color: '#adb4bd' }),
  product('cpu-i5-12400f', 'cpu', 'Intel Core i5-12400F', 'Intel', 11990, 'Шесть ядер и двенадцать потоков. Требуется дискретная видеокарта.', { socket: 'LGA1700', cores: 6, threads: 12, tdp: 117, memory: 'DDR4 / DDR5' }, { color: '#aeb5bf' }),
  product('mb-msi-b650', 'motherboard', 'MSI PRO B650M-A WIFI', 'MSI', 16990, 'Компактная плата AM5 с Wi-Fi и четырьмя слотами DDR5.', { socket: 'AM5', memory: 'DDR5', form: 'mATX', ram_slots: 4, m2_slots: 2, sata_ports: 4 }, { color: '#272a2d' }),
  product('mb-asrock-b650', 'motherboard', 'ASRock B650M Pro RS', 'ASRock', 15990, 'Плата с серебристыми радиаторами для светлой сборки.', { socket: 'AM5', memory: 'DDR5', form: 'mATX', ram_slots: 4, m2_slots: 3, sata_ports: 4 }, { color: '#b6bbc4', rgb: true }),
  product('mb-msi-b760', 'motherboard', 'MSI PRO B760M-P DDR4', 'MSI', 10990, 'Материнская плата LGA1700 с поддержкой памяти DDR4.', { socket: 'LGA1700', memory: 'DDR4', form: 'mATX', ram_slots: 4, m2_slots: 2, sata_ports: 4 }, { color: '#282a2f' }),
  product('ram-kingston-ddr5', 'ram', 'Kingston FURY Beast RGB 32 ГБ', 'Kingston', 11990, 'Комплект из двух планок DDR5 с настраиваемой подсветкой.', { memory: 'DDR5', capacity: 32, speed: 6000, sticks: 2, tdp: 10 }, { color: '#26292d', rgb: true }),
  product('ram-xpg-ddr5', 'ram', 'XPG LANCER RGB White 32 ГБ', 'ADATA', 12490, 'Белые радиаторы и световая полоса на каждой планке.', { memory: 'DDR5', capacity: 32, speed: 6000, sticks: 2, tdp: 10 }, { color: '#eceef2', rgb: true }),
  product('ram-kingston-ddr4', 'ram', 'Kingston FURY Beast 16 ГБ', 'Kingston', 4490, 'Две планки DDR4 с низкопрофильными чёрными радиаторами.', { memory: 'DDR4', capacity: 16, speed: 3200, sticks: 2, tdp: 8 }),
  product('gpu-msi-4060', 'gpu', 'MSI GeForce RTX 4060 VENTUS 2X', 'MSI', 32990, 'Компактная видеокарта с двумя вентиляторами и 8 ГБ видеопамяти.', { vram: 8, tdp: 115, length: 199, fans: 2 }, { color: '#30353b' }),
  product('gpu-gigabyte-4070', 'gpu', 'GIGABYTE RTX 4070 SUPER AERO OC', 'GIGABYTE', 72990, 'Белая видеокарта с тремя вентиляторами и подсветкой логотипа.', { vram: 12, tdp: 220, length: 300, fans: 3 }, { color: '#e4e7ed', rgb: true }),
  product('gpu-sapphire-7800', 'gpu', 'Sapphire PULSE Radeon RX 7800 XT', 'Sapphire', 56990, '16 ГБ видеопамяти и двухвентиляторная система охлаждения.', { vram: 16, tdp: 263, length: 280, fans: 2 }, { color: '#242629', accent: '#b83d38' }),
  product('ssd-samsung-980', 'storage', 'Samsung 980 1 ТБ', 'Samsung', 7990, 'Накопитель NVMe формата M.2 для системы и игр.', { capacity: 1000, interface: 'M.2 NVMe', read: 3500, tdp: 6 }),
  product('ssd-kingston-nv2', 'storage', 'Kingston NV2 1 ТБ', 'Kingston', 5490, 'Компактный накопитель M.2 с интерфейсом PCIe 4.0.', { capacity: 1000, interface: 'M.2 NVMe', read: 3500, tdp: 6 }, { color: '#315876' }),
  product('hdd-wd-blue', 'storage', 'WD Blue 2 ТБ', 'Western Digital', 6490, 'Жёсткий диск 3.5 дюйма для хранения файлов.', { capacity: 2000, interface: 'SATA', rpm: 7200, tdp: 9 }, { color: '#a8aeb5' }),
  product('psu-deepcool-650', 'psu', 'DeepCool PK650D', 'DeepCool', 5990, 'Блок питания 650 Вт с сертификацией 80 PLUS Bronze.', { watts: 650, certificate: '80 PLUS Bronze', form: 'ATX' }),
  product('psu-corsair-750', 'psu', 'Corsair RM750e', 'Corsair', 11990, 'Модульный блок питания 750 Вт с сертификатом 80 PLUS Gold.', { watts: 750, certificate: '80 PLUS Gold', form: 'ATX' }),
  product('psu-montech-850', 'psu', 'Montech Century G5 850', 'Montech', 14990, 'Чёрный модульный блок питания для мощной сборки.', { watts: 850, certificate: '80 PLUS Gold', form: 'ATX' }, { color: '#25282c' }),
  product('case-matx-black', 'case', 'Montech AIR 100 ARGB Black', 'Montech', 6490, 'Чёрный корпус с сетчатой передней панелью, стеклом и ARGB-вентиляторами.', { forms: ['mATX', 'Mini-ITX'], max_gpu: 330, max_cooler: 161, psu_form: 'ATX', hdd_bays: 2 }, { color: '#23272b', rgb: true }),
  product('case-matx-white', 'case', 'Montech AIR 100 ARGB White', 'Montech', 6990, 'Белый корпус со стеклянной стенкой и ARGB-вентиляторами.', { forms: ['mATX', 'Mini-ITX'], max_gpu: 330, max_cooler: 161, psu_form: 'ATX', hdd_bays: 2 }, { color: '#e2e5e8', rgb: true }),
  product('case-ap201', 'case', 'ASUS Prime AP201 Black', 'ASUS', 8490, 'Компактный сетчатый корпус для плат mATX.', { forms: ['mATX', 'Mini-ITX'], max_gpu: 338, max_cooler: 170, psu_form: 'ATX', hdd_bays: 1 }, { color: '#33363b' }),
  product('cooler-ag400', 'cooler', 'DeepCool AG400 ARGB', 'DeepCool', 2990, 'Башенный кулер с четырьмя тепловыми трубками и ARGB-вентилятором.', { sockets: ['AM5', 'LGA1700'], height: 150, cooling_watts: 180, tdp: 4 }, { color: '#41464c', rgb: true }),
  product('cooler-ag400-white', 'cooler', 'DeepCool AG400 WH ARGB', 'DeepCool', 3490, 'Белая версия башенного кулера с адресной подсветкой.', { sockets: ['AM5', 'LGA1700'], height: 150, cooling_watts: 180, tdp: 4 }, { color: '#e6e8eb', rgb: true }),
  product('cooler-ak400', 'cooler', 'DeepCool AK400', 'DeepCool', 2990, 'Башенный кулер с алюминиевым радиатором и чёрным вентилятором.', { sockets: ['AM5', 'LGA1700'], height: 155, cooling_watts: 180, tdp: 4 }, { color: '#30363a' }),
];

export const defaultBuild = Object.fromEntries(categories.map(category => [
  category.id,
  initialProducts.find(item => item.category === category.id).id,
]));

export const specLabels = {
  socket: 'Сокет', cores: 'Ядра', threads: 'Потоки', tdp: 'Потребление, Вт',
  memory: 'Тип памяти', form: 'Форм-фактор', ram_slots: 'Слоты памяти',
  m2_slots: 'Слоты M.2', sata_ports: 'Порты SATA', capacity: 'Объём, ГБ',
  speed: 'Частота, МТ/с', sticks: 'Количество модулей', vram: 'Видеопамять, ГБ',
  length: 'Длина, мм', fans: 'Вентиляторы', interface: 'Интерфейс',
  read: 'Чтение, МБ/с', rpm: 'Обороты, об/мин', watts: 'Мощность, Вт',
  certificate: 'Сертификат', forms: 'Форматы плат', max_gpu: 'Длина GPU до, мм',
  max_cooler: 'Высота кулера до, мм', psu_form: 'Формат БП',
  hdd_bays: 'Места для HDD', sockets: 'Сокеты', height: 'Высота, мм',
  cooling_watts: 'Отвод тепла, Вт',
};
