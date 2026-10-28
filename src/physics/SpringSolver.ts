/**
 * SpringSolver.ts — Кастомный физический солвер для пружинного маятника
 * 
 * Использует интегратор Velocity Verlet для точного моделирования
 * гармонических колебаний без накопления ошибки энергии.
 * 
 * Уравнения движения:
 *   F = -kx - bv  (закон Гука + затухание)
 *   a = F/m
 *   x(t) = A·cos(ωt)·e^(-γt)  (при затухании)
 * 
 * where ω = √(k/m), γ = b/(2m)
 */

import { SpringParams, SpringState, DataPoint } from '../types';

// ============================================
// КОНФИГУРАЦИОННЫЕ КОНСТАНТЫ (для проверки формул)
// ============================================

/** Максимальный шаг интегрирования [с] — ограничение для стабильности */
const MAX_DT = 1 / 30;

/** Фиксированный шаг физики [с] — для детерминированности */
const FIXED_DT = 1 / 120;

/** Максимальная длина истории для графиков */
const MAX_HISTORY_POINTS = 600;

export class SpringSolver {
  private params: SpringParams;
  private state: SpringState;
  private history: DataPoint[];
  private accumulator: number;

  constructor(params: SpringParams) {
    this.params = { ...params };
    this.state = this.createInitialState();
    this.history = [];
    this.accumulator = 0;
  }

  /** Создание начального состояния (максимальное отклонение, нулевая скорость) */
  private createInitialState(): SpringState {
    const x = this.params.A;
    const F = -this.params.k * x;
    return {
      x,
      v: 0,
      a: F / this.params.m,
      t: 0,
      F,
      Ek: 0,
      Ep: 0.5 * this.params.k * x * x,
    };
  }

  /**
   * Вычисление ускорения по второму закону Ньютона
   * a = (-kx - bv) / m
   */
  private computeAcceleration(x: number, v: number): number {
    const F_spring = -this.params.k * x;
    const F_damping = -this.params.damping * v;
    return (F_spring + F_damping) / this.params.m;
  }

  /**
   * Velocity Verlet Integration
   * 
   * Алгоритм:
   * 1. x(t+dt) = x(t) + v(t)·dt + 0.5·a(t)·dt²
   * 2. a(t+dt) = F(x(t+dt), v(t+dt)) / m
   * 3. v(t+dt) = v(t) + 0.5·(a(t) + a(t+dt))·dt
   * 
   * Преимущества: сохранение энергии (симплектичность), O(dt²) точность
   */
  private stepVerlet(dt: number): void {
    const { x, v, a } = this.state;

    // Шаг 1: обновление позиции
    const xNew = x + v * dt + 0.5 * a * dt * dt;

    // Промежуточная скорость (для вычисления затухания)
    const vHalf = v + 0.5 * a * dt;

    // Шаг 2: новое ускорение
    const aNew = this.computeAcceleration(xNew, vHalf);

    // Шаг 3: обновление скорости
    const vNew = vHalf + 0.5 * aNew * dt;

    // Вычисление сил и энергий
    const F = -this.params.k * xNew;
    const Ek = 0.5 * this.params.m * vNew * vNew;
    const Ep = 0.5 * this.params.k * xNew * xNew;

    // Обновление состояния
    this.state = {
      x: xNew,
      v: vNew,
      a: aNew,
      t: this.state.t + dt,
      F,
      Ek,
      Ep,
    };
  }

  /**
   * Обновление симуляции с фиксированным шагом
   * @param realDt — реальное прошедшее время [с]
   */
  update(realDt: number): void {
    // Ограничение dt для стабильности при переключении вкладок
    const dt = Math.min(realDt, MAX_DT);
    this.accumulator += dt;

    // Фиксированный шаг интегрирования
    while (this.accumulator >= FIXED_DT) {
      this.stepVerlet(FIXED_DT);
      this.accumulator -= FIXED_DT;

      // Запись в историю (каждые ~4 кадра физики для экономии памяти)
      if (this.history.length === 0 || 
          this.state.t - this.history[this.history.length - 1].t >= 0.016) {
        this.history.push({
          t: this.state.t,
          x: this.state.x,
          F: this.state.F,
        });
        // Ограничение длины истории
        if (this.history.length > MAX_HISTORY_POINTS) {
          this.history.shift();
        }
      }
    }
  }

  /** Сброс симуляции к начальному состоянию */
  reset(): void {
    this.state = this.createInitialState();
    this.history = [];
    this.accumulator = 0;
  }

  /** Обновление параметров (без сброса состояния, если система в движении) */
  setParams(params: Partial<SpringParams>): void {
    Object.assign(this.params, params);
  }

  /** Полный сброс с новыми параметрами */
  resetWithParams(params: SpringParams): void {
    this.params = { ...params };
    this.reset();
  }

  // ============================================
  // ГЕТТЕРЫ
  // ============================================

  getState(): SpringState {
    return { ...this.state };
  }

  getHistory(): DataPoint[] {
    return [...this.history];
  }

  /** Теоретический период колебаний T = 2π√(m/k) */
  getTheoreticalPeriod(): number {
    return 2 * Math.PI * Math.sqrt(this.params.m / this.params.k);
  }

  /** Циклическая частота ω = √(k/m) */
  getAngularFrequency(): number {
    return Math.sqrt(this.params.k / this.params.m);
  }

  /** Частота f = 1/T */
  getFrequency(): number {
    return 1 / this.getTheoreticalPeriod();
  }

  /** Полная механическая энергия */
  getTotalEnergy(): number {
    return this.state.Ek + this.state.Ep;
  }

  getParams(): SpringParams {
    return { ...this.params };
  }
}
