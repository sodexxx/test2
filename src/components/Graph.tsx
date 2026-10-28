/**
 * Graph.tsx — Компонент графика в реальном времени
 * 
 * Поддерживает два режима:
 * 1. x(t) — зависимость смещения от времени
 * 2. F(x) — фазовый портрет (сила от смещения)
 */

import { useRef, useEffect, useCallback } from 'react';
import { DataPoint } from '../types';

interface GraphProps {
  data: DataPoint[];
  mode: 'xt' | 'Fx';
  width: number;
  height: number;
  title: string;
  theoreticalPeriod?: number;
}

export default function Graph({ data, mode, width, height, title, theoreticalPeriod }: GraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Очистка
    ctx.clearRect(0, 0, width, height);

    // Отступы
    const padding = { top: 30, right: 15, bottom: 30, left: 45 };
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    if (data.length < 2) {
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Ожидание данных...', width / 2, height / 2);
      return;
    }

    // Определение диапазонов
    let xMin: number, xMax: number, yMin: number, yMax: number;
    let xLabel: string, yLabel: string;

    if (mode === 'xt') {
      xMin = data[0].t;
      xMax = data[data.length - 1].t;
      if (xMax - xMin < 0.1) xMax = xMin + 2;
      const xValues = data.map(d => d.x);
      const maxAbs = Math.max(...xValues.map(Math.abs), 0.01);
      yMin = -maxAbs * 1.2;
      yMax = maxAbs * 1.2;
      xLabel = 't, с';
      yLabel = 'x, м';
    } else {
      // F(x) — фазовый портрет
      const xValues = data.map(d => d.x);
      const fValues = data.map(d => d.F);
      const maxXAbs = Math.max(...xValues.map(Math.abs), 0.01);
      const maxFAbs = Math.max(...fValues.map(Math.abs), 0.01);
      xMin = -maxXAbs * 1.2;
      xMax = maxXAbs * 1.2;
      yMin = -maxFAbs * 1.2;
      yMax = maxFAbs * 1.2;
      xLabel = 'x, м';
      yLabel = 'F, Н';
    }

    // Функции преобразования координат
    const toScreenX = (val: number) => padding.left + ((val - xMin) / (xMax - xMin)) * plotW;
    const toScreenY = (val: number) => padding.top + plotH - ((val - yMin) / (yMax - yMin)) * plotH;

    // === Фон графика ===
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(padding.left, padding.top, plotW, plotH);

    // === Сетка ===
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 0.5;

    // Горизонтальные линии
    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
      const y = padding.top + (plotH / ySteps) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + plotW, y);
      ctx.stroke();
    }

    // Вертикальные линии
    const xSteps = 5;
    for (let i = 0; i <= xSteps; i++) {
      const x = padding.left + (plotW / xSteps) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + plotH);
      ctx.stroke();
    }

    // === Нулевая ось ===
    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 1;
    const zeroY = toScreenY(0);
    if (zeroY >= padding.top && zeroY <= padding.top + plotH) {
      ctx.beginPath();
      ctx.moveTo(padding.left, zeroY);
      ctx.lineTo(padding.left + plotW, zeroY);
      ctx.stroke();
    }
    const zeroX = toScreenX(0);
    if (zeroX >= padding.left && zeroX <= padding.left + plotW) {
      ctx.beginPath();
      ctx.moveTo(zeroX, padding.top);
      ctx.lineTo(zeroX, padding.top + plotH);
      ctx.stroke();
    }

    // === Период (для x(t)) ===
    if (mode === 'xt' && theoreticalPeriod && theoreticalPeriod > 0) {
      const t0 = data[0].t;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      // Рисуем вертикальные линии периода
      let periodTime = t0 + theoreticalPeriod;
      while (periodTime < xMax) {
        const px = toScreenX(periodTime);
        ctx.beginPath();
        ctx.moveTo(px, padding.top);
        ctx.lineTo(px, padding.top + plotH);
        ctx.stroke();
        periodTime += theoreticalPeriod;
      }
      ctx.setLineDash([]);
    }

    // === Линия данных ===
    ctx.beginPath();
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      const sx = mode === 'xt' ? toScreenX(point.t) : toScreenX(point.x);
      const sy = mode === 'xt' ? toScreenY(point.x) : toScreenY(point.F);

      // Ограничение областью графика
      if (i === 0) {
        ctx.moveTo(sx, sy);
      } else {
        ctx.lineTo(sx, sy);
      }
    }
    ctx.stroke();

    // === Текущая точка (маркер) ===
    if (data.length > 0) {
      const last = data[data.length - 1];
      const lx = mode === 'xt' ? toScreenX(last.t) : toScreenX(last.x);
      const ly = mode === 'xt' ? toScreenY(last.x) : toScreenY(last.F);

      ctx.beginPath();
      ctx.arc(lx, ly, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#EF4444';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // === Подписи осей ===
    ctx.fillStyle = '#6B7280';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';

    // Подписи X
    for (let i = 0; i <= xSteps; i++) {
      const val = xMin + (xMax - xMin) * (i / xSteps);
      const x = padding.left + (plotW / xSteps) * i;
      ctx.fillText(val.toFixed(mode === 'xt' ? 1 : 2), x, height - 8);
    }

    // Подписи Y
    ctx.textAlign = 'right';
    for (let i = 0; i <= ySteps; i++) {
      const val = yMax - (yMax - yMin) * (i / ySteps);
      const y = padding.top + (plotH / ySteps) * i;
      ctx.fillText(val.toFixed(mode === 'xt' ? 2 : 1), padding.left - 5, y + 3);
    }

    // Названия осей
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(xLabel, padding.left + plotW / 2, height - 2);

    ctx.save();
    ctx.translate(12, padding.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();

    // === Заголовок ===
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(title, padding.left, 18);

  }, [data, mode, width, height, title, theoreticalPeriod]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="rounded-xl bg-white border border-gray-200"
    />
  );
}
