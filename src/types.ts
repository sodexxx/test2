/**
 * Типы данных для модуля «Пружинный маятник»
 * Разделение интерфейсов: параметры, состояние, результаты
 */

/** Физические параметры системы (задаются пользователем) */
export interface SpringParams {
  /** Жёсткость пружины [Н/м] */
  k: number;
  /** Масса груза [кг] */
  m: number;
  /** Начальная амплитуда (смещение от равновесия) [м] */
  A: number;
  /** Коэффициент затухания [Н·с/м] (0 = идеальная система) */
  damping: number;
}

/** Мгновенное состояние системы */
export interface SpringState {
  /** Смещение от положения равновесия [м] */
  x: number;
  /** Скорость [м/с] */
  v: number;
  /** Ускорение [м/с²] */
  a: number;
  /** Время от начала [с] */
  t: number;
  /** Сила упругости [Н] */
  F: number;
  /** Кинетическая энергия [Дж] */
  Ek: number;
  /** Потенциальная энергия [Дж] */
  Ep: number;
}

/** Точка данных для графика */
export interface DataPoint {
  t: number;
  x: number;
  F: number;
}

/** Диапазон ползунка */
export interface SliderConfig {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  paramKey: keyof SpringParams;
}
