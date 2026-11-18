// Основные цвета встречаются в пресетах подсветки оборудования DNS.
export const lightingColors = [
  { name: 'Красный', value: '#ff3838' },
  { name: 'Оранжевый', value: '#ff8a24' },
  { name: 'Жёлтый', value: '#ffe33d' },
  { name: 'Зелёный', value: '#44ee70' },
  { name: 'Голубой', value: '#34d9ff' },
  { name: 'Синий', value: '#4777ff' },
  { name: 'Фиолетовый', value: '#b65dff' },
  { name: 'Белый', value: '#ffffff' },
];

export const lightingModes = [
  { id: 'static', name: 'Постоянный' },
  { id: 'breathe', name: 'Дыхание' },
  { id: 'rgb', name: 'RGB · смена цветов' },
  { id: 'rainbow', name: 'Радуга · многоцветная' },
];

export function validLightingMode(mode) {
  return lightingModes.some(item => item.id === mode) ? mode : 'static';
}
