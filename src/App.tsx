/**
 * App.tsx — Главный компонент модуля «Пружинный маятник»
 * 
 * Архитектура потоков данных:
 * 1. Параметры (k, m, A, b) → SpringSolver
 * 2. SpringSolver → состояние (x, v, a, F, Ek, Ep)
 * 3. Состояние → SpringCanvas (визуализация)
 * 4. Состояние → Graph (графики x(t), F(x))
 * 5. Состояние → EnergyBar (энергии)
 * 
 * Цикл анимации: requestAnimationFrame → solver.update() → setState → render
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { SpringSolver } from './physics/SpringSolver';
import { SpringParams, SpringState, DataPoint } from './types';
import SpringCanvas from './components/SpringCanvas';
import Graph from './components/Graph';
import Controls from './components/Controls';
import EnergyBar from './components/EnergyBar';

// Начальные параметры по умолчанию
const DEFAULT_PARAMS: SpringParams = {
  k: 20,
  m: 1.0,
  A: 0.2,
  damping: 0,
};

export default function App() {
  // Параметры системы
  const [params, setParams] = useState<SpringParams>(DEFAULT_PARAMS);
  
  // Состояние для рендеринга
  const [displayState, setDisplayState] = useState<SpringState>({
    x: DEFAULT_PARAMS.A,
    v: 0,
    a: 0,
    t: 0,
    F: 0,
    Ek: 0,
    Ep: 0.5 * DEFAULT_PARAMS.k * DEFAULT_PARAMS.A * DEFAULT_PARAMS.A,
  });
  const [history, setHistory] = useState<DataPoint[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [graphMode, setGraphMode] = useState<'xt' | 'Fx'>('xt');

  // Ref для солвера (не вызывает ререндер)
  const solverRef = useRef<SpringSolver>(new SpringSolver(DEFAULT_PARAMS));
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Размеры canvas (адаптивные)
  const [canvasWidth, setCanvasWidth] = useState(350);
  const [graphWidth, setGraphWidth] = useState(350);

  // Измерение ширины контейнера
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        setCanvasWidth(Math.min(w - 32, 500));
        setGraphWidth(Math.min(w - 32, 500));
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Цикл анимации
  const animate = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = timestamp;
    }

    const dt = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    // Обновление физики
    const solver = solverRef.current;
    solver.update(dt);

    // Обновление отображения
    setDisplayState(solver.getState());
    setHistory(solver.getHistory());

    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // Запуск/остановка анимации
  useEffect(() => {
    if (isRunning) {
      lastTimeRef.current = 0;
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animFrameRef.current);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isRunning, animate]);

  // Обработчик изменения параметра
  const handleParamChange = useCallback((key: keyof SpringParams, value: number) => {
    setParams(prev => {
      const newParams = { ...prev, [key]: value };
      solverRef.current.setParams(newParams);
      return newParams;
    });
  }, []);

  // Сброс
  const handleReset = useCallback(() => {
    setIsRunning(false);
    solverRef.current.resetWithParams(params);
    setDisplayState(solverRef.current.getState());
    setHistory([]);
  }, [params]);

  // Переключение паузы
  const handleTogglePause = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  // Теоретический период для отображения на графике
  const theoreticalPeriod = 2 * Math.PI * Math.sqrt(params.m / params.k);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100" ref={containerRef}>
      {/* Шапка */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🔬</span>
            Пружинный маятник
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Закон Гука · Гармонические колебания · F = −kx
          </p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Визуализация пружины */}
        <section>
          <SpringCanvas
            state={displayState}
            params={params}
            width={canvasWidth}
            height={200}
          />
        </section>

        {/* Энергия */}
        <section className="bg-white rounded-xl p-3 border border-gray-200">
          <EnergyBar state={displayState} width={canvasWidth - 24} />
        </section>

        {/* График */}
        <section className="bg-white rounded-xl p-3 border border-gray-200">
          {/* Переключатель режима графика */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setGraphMode('xt')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all
                         ${graphMode === 'xt' 
                           ? 'bg-blue-600 text-white shadow-md' 
                           : 'bg-gray-100 text-gray-600'}`}
            >
              x(t) — Колебания
            </button>
            <button
              onClick={() => setGraphMode('Fx')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all
                         ${graphMode === 'Fx' 
                           ? 'bg-blue-600 text-white shadow-md' 
                           : 'bg-gray-100 text-gray-600'}`}
            >
              F(x) — Фазовый портрет
            </button>
          </div>
          <Graph
            data={history}
            mode={graphMode}
            width={graphWidth - 24}
            height={180}
            title={graphMode === 'xt' ? 'Смещение от времени' : 'Сила от смещения'}
            theoreticalPeriod={graphMode === 'xt' ? theoreticalPeriod : undefined}
          />
        </section>

        {/* Текущие значения */}
        <section className="bg-white rounded-xl p-3 border border-gray-200">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-sm font-bold text-red-600">
                {(displayState.x * 100).toFixed(1)}
              </div>
              <div className="text-[10px] text-gray-500">x, см</div>
            </div>
            <div>
              <div className="text-sm font-bold text-green-600">
                {displayState.F.toFixed(1)}
              </div>
              <div className="text-[10px] text-gray-500">F, Н</div>
            </div>
            <div>
              <div className="text-sm font-bold text-purple-600">
                {displayState.v.toFixed(2)}
              </div>
              <div className="text-[10px] text-gray-500">v, м/с</div>
            </div>
            <div>
              <div className="text-sm font-bold text-blue-600">
                {displayState.t.toFixed(1)}
              </div>
              <div className="text-[10px] text-gray-500">t, с</div>
            </div>
          </div>
        </section>

        {/* Управление */}
        <section className="bg-white rounded-xl p-4 border border-gray-200">
          <Controls
            params={params}
            onChange={handleParamChange}
            onReset={handleReset}
            isRunning={isRunning}
            onTogglePause={handleTogglePause}
          />
        </section>

        {/* Формулы */}
        <section className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
          <h3 className="text-sm font-bold text-indigo-800 mb-2">📐 Ключевые формулы</h3>
          <div className="space-y-1.5 text-xs text-indigo-700">
            <div className="flex justify-between">
              <span>Закон Гука:</span>
              <span className="font-mono font-bold">F = −kx</span>
            </div>
            <div className="flex justify-between">
              <span>Период:</span>
              <span className="font-mono font-bold">T = 2π√(m/k)</span>
            </div>
            <div className="flex justify-between">
              <span>Частота:</span>
              <span className="font-mono font-bold">ν = 1/T = ω/(2π)</span>
            </div>
            <div className="flex justify-between">
              <span>Цикл. частота:</span>
              <span className="font-mono font-bold">ω = √(k/m)</span>
            </div>
            <div className="flex justify-between">
              <span>Закон движения:</span>
              <span className="font-mono font-bold">x(t) = A·cos(ωt)</span>
            </div>
            <div className="flex justify-between">
              <span>Энергия:</span>
              <span className="font-mono font-bold">E = ½kA² = const</span>
            </div>
          </div>
        </section>

        {/* Инструкция */}
        <section className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-8">
          <h3 className="text-sm font-bold text-gray-700 mb-2">📖 Как пользоваться</h3>
          <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
            <li>Настройте параметры ползунками (k, m, A)</li>
            <li>Нажмите <strong>«Старт»</strong> для запуска анимации</li>
            <li>Наблюдайте колебания и график x(t)</li>
            <li>Переключите на F(x) для фазового портрета</li>
            <li>Добавьте затухание (b) для реального поведения</li>
            <li>Следите за перераспределением энергии Ek ↔ Ep</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
