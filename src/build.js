export function selectedProducts(build, products) {
  return Object.fromEntries(Object.entries(build).map(([category, id]) => [
    category, products.find(product => product.id === id && product.category === category && product.active !== false) || null,
  ]));
}

export function totalPrice(parts) {
  return Object.values(parts).reduce((total, item) => total + (Number(item?.price) || 0), 0);
}

export function estimatedPower(parts) {
  return Object.values(parts).reduce((sum, item) => sum + (Number(item?.specs?.tdp) || 0), 45);
}

export function checkCompatibility(parts) {
  const { cpu, motherboard, ram, gpu, psu, cooler } = parts;
  const chassis = parts.case;
  const issues = [];
  if (cpu && motherboard && cpu.specs.socket !== motherboard.specs.socket) issues.push('Сокеты процессора и материнской платы различаются.');
  if (ram && motherboard && ram.specs.memory !== motherboard.specs.memory) issues.push('Тип памяти не подходит материнской плате.');
  if (ram && motherboard && ram.specs.sticks > motherboard.specs.ram_slots) issues.push('На плате недостаточно слотов для модулей памяти.');
  if (chassis && motherboard && !chassis.specs.forms.includes(motherboard.specs.form)) issues.push('Формат материнской платы не подходит корпусу.');
  if (chassis && gpu && gpu.specs.length > chassis.specs.max_gpu) issues.push('Видеокарта длиннее допустимого для корпуса.');
  if (cpu && cooler && !cooler.specs.sockets.includes(cpu.specs.socket)) issues.push('Крепление кулера не подходит сокету процессора.');
  if (chassis && cooler && cooler.specs.height > chassis.specs.max_cooler) issues.push('Кулер выше допустимого для корпуса.');
  if (cpu && cooler && cpu.specs.tdp > cooler.specs.cooling_watts) issues.push('Расчётной мощности охлаждения недостаточно для процессора.');
  if (chassis && psu && chassis.specs.psu_form !== psu.specs.form) issues.push('Формат блока питания не подходит корпусу.');
  if (psu && psu.specs.watts < Math.ceil(estimatedPower(parts) * 1.3)) issues.push('Рекомендуется более мощный блок питания с запасом 30%.');
  return issues;
}
