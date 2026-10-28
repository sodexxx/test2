/**
 * EnergyBar.tsx — Визуализация энергии системы
 * 
 * Показывает кинетическую и потенциальную энергию в виде стека
 * для наглядной демонстрации закона сохранения энергии
 */

import { SpringState } from '../types';

interface EnergyBarProps {
  state: SpringState;
  width: number;
}

export default function EnergyBar({ state, width }: EnergyBarProps) {
  const total = state.Ek + state.Ep;
  const maxEnergy = total > 0 ? total : 1;
  const ekPercent = (state.Ek / maxEnergy) * 100;
  const epPercent = (state.Ep / maxEnergy) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-gray-600">Энергия</span>
        <span className="text-xs text-gray-500">
          E = {(total * 1000).toFixed(1)} мДж
        </span>
      </div>
      
      {/* Стек энергии */}
      <div className="h-6 rounded-full overflow-hidden flex bg-gray-100 border border-gray-200"
           style={{ width }}>
        <div
          className="h-full bg-orange-400 transition-all duration-75 flex items-center justify-center"
          style={{ width: `${ekPercent}%` }}
        >
          {ekPercent > 15 && (
            <span className="text-[9px] font-bold text-white">Ek</span>
          )}
        </div>
        <div
          className="h-full bg-blue-500 transition-all duration-75 flex items-center justify-center"
          style={{ width: `${epPercent}%` }}
        >
          {epPercent > 15 && (
            <span className="text-[9px] font-bold text-white">Ep</span>
          )}
        </div>
      </div>

      {/* Числовые значения */}
      <div className="flex justify-between text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-400"></div>
          <span className="text-gray-600">
            Ek = {(state.Ek * 1000).toFixed(1)} мДж
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-gray-600">
            Ep = {(state.Ep * 1000).toFixed(1)} мДж
          </span>
        </div>
      </div>
    </div>
  );
}
