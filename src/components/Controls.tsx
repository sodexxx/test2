/**
 * Controls.tsx — Панель управления параметрами системы
 * 
 * Крупные ползунки для мобильного UX:
 * - k: жёсткость пружины [Н/м]
 * - m: масса груза [кг]
 * - A: амплитуда [м]
 * - b: коэффициент затухания
 */

import { SpringParams, SliderConfig } from '../types';

interface ControlsProps {
  params: SpringParams;
  onChange: (key: keyof SpringParams, value: number) => void;
  onReset: () => void;
  isRunning: boolean;
  onTogglePause: () => void;
}

// Конфигурация ползунков (вынесена для проверки формул)
const SLIDER_CONFIGS: SliderConfig[] = [
  {
    label: 'Жёсткость k',
    unit: 'Н/м',
    min: 1,
    max: 100,
    step: 1,
    defaultValue: 20,
    paramKey: 'k',
  },
  {
    label: 'Масса m',
    unit: 'кг',
    min: 0.1,
    max: 10,
    step: 0.1,
    defaultValue: 1.0,
    paramKey: 'm',
  },
  {
    label: 'Амплитуда A',
    unit: 'м',
    min: 0.05,
    max: 0.5,
    step: 0.01,
    defaultValue: 0.2,
    paramKey: 'A',
  },
  {
    label: 'Затухание b',
    unit: 'Н·с/м',
    min: 0,
    max: 5,
    step: 0.1,
    defaultValue: 0,
    paramKey: 'damping',
  },
];

export default function Controls({ params, onChange, onReset, isRunning, onTogglePause }: ControlsProps) {
  return (
    <div className="space-y-4">
      {/* Заголовок с расчётными величинами */}
      <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
        <div className="text-xs text-blue-600 font-medium mb-1">Расчётные величины:</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-blue-700">
              {(2 * Math.PI * Math.sqrt(params.m / params.k)).toFixed(2)}
            </div>
            <div className="text-[10px] text-blue-500">T, с</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-700">
              {Math.sqrt(params.k / params.m).toFixed(1)}
            </div>
            <div className="text-[10px] text-blue-500">ω, рад/с</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-700">
              {(1 / (2 * Math.PI * Math.sqrt(params.m / params.k))).toFixed(2)}
            </div>
            <div className="text-[10px] text-blue-500">ν, Гц</div>
          </div>
        </div>
        <div className="text-[10px] text-blue-400 mt-1 text-center">
          T = 2π√(m/k) | ω = √(k/m) | ν = 1/T
        </div>
      </div>

      {/* Ползунки */}
      {SLIDER_CONFIGS.map((config) => (
        <div key={config.paramKey} className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">
              {config.label}
            </label>
            <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
              {params[config.paramKey].toFixed(config.step < 1 ? 1 : 0)} {config.unit}
            </span>
          </div>
          <input
            type="range"
            min={config.min}
            max={config.max}
            step={config.step}
            value={params[config.paramKey]}
            onChange={(e) => onChange(config.paramKey, parseFloat(e.target.value))}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer
                       accent-blue-600 touch-manipulation"
            style={{ WebkitAppearance: 'none' }}
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>{config.min}</span>
            <span>{config.max}</span>
          </div>
        </div>
      ))}

      {/* Кнопки управления */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onTogglePause}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-95
                     ${isRunning 
                       ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' 
                       : 'bg-green-500 text-white shadow-lg shadow-green-200'
                     }`}
        >
          {isRunning ? '⏸ Пауза' : '▶ Старт'}
        </button>
        <button
          onClick={onReset}
          className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-gray-100 text-gray-700
                     border border-gray-200 transition-all active:scale-95 hover:bg-gray-200"
        >
          ↺ Сброс
        </button>
      </div>
    </div>
  );
}
