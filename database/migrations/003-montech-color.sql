-- Исправление ошибочно указанного цвета стартового товара, с сохранением ID сборок.
update public.products
set name = 'Montech Century G5 850',
    description = 'Чёрный модульный блок питания для мощной сборки.',
    appearance = jsonb_set(appearance, '{color}', '"#25282c"')
where id = 'psu-montech-850' and name = 'Montech Century G5 850 White';
