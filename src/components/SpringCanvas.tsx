/**
 * SpringCanvas.tsx — Визуализация пружинного маятника на Canvas
 * 
 * Рисует: стену крепления, пружину (зигзаг), груз, 
 * положение равновесия и текущее смещение
 */

import { useRef, useEffect, useCallback } from 'react';
import { SpringState, SpringParams } from '../types';

interface SpringCanvasProps {
  state: SpringState;
  params: SpringParams;
  width: number;
  height: number;
}

export default function SpringCanvas({ state, params, width, height }: SpringCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Масштабирование canvas для Retina
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Очистка
    ctx.clearRect(0, 0, width, height);

    // Координатная система
    const wallX = 40; // позиция стены
    const equilibriumX = width * 0.5; // положение равновесия
    const centerY = height * 0.5;

    // Масштаб: 1 метр = сколько пикселей (адаптивно)
    const maxDisplacement = params.A * 1.5 || 0.3;
    const pixelsPerMeter = (width * 0.35) / maxDisplacement;
    const currentX = equilibriumX + state.x * pixelsPerMeter;

    // === Рисуем стену ===
    ctx.fillStyle = '#374151';
    ctx.fillRect(0, centerY - 60, wallX, 120);
    // Штриховка стены
    ctx.strokeStyle = '#6B7280';
    ctx.lineWidth = 1;
    for (let i = -60; i < 120; i += 10) {
      ctx.beginPath();
      ctx.moveTo(0, centerY - 60 + i);
      ctx.lineTo(wallX, centerY - 60 + i + 10);
      ctx.stroke();
    }

    // === Рисуем пружину (зигзаг) ===
    const springStartX = wallX;
    const springEndX = currentX - 25; // до груза
    const springLength = springEndX - springStartX;
    const coils = 12;
    const coilAmplitude = 14;

    ctx.beginPath();
    ctx.moveTo(springStartX, centerY);

    // Прямой участок в начале
    const straightPart = 10;
    ctx.lineTo(springStartX + straightPart, centerY);

    // Зигзаг
    const zigzagLength = springLength - 2 * straightPart;
    const segmentLength = zigzagLength / (coils * 2);

    for (let i = 0; i < coils * 2; i++) {
      const xPos = springStartX + straightPart + segmentLength * (i + 1);
      const yPos = centerY + (i % 2 === 0 ? -coilAmplitude : coilAmplitude);
      ctx.lineTo(xPos, yPos);
    }

    // Прямой участок в конце
    ctx.lineTo(springEndX, centerY);

    // Цвет пружины зависит от силы (красный = растянута, синий = сжата)
    const normalizedForce = Math.abs(state.x) / (params.A || 0.1);
    const hue = state.x > 0 ? 0 : 220; // красный / синий
    const saturation = Math.min(normalizedForce * 80, 80);
    ctx.strokeStyle = `hsl(${hue}, ${saturation}%, 50%)`;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // === Рисуем груз ===
    const boxSize = 50;
    const boxX = currentX - boxSize / 2;
    const boxY = centerY - boxSize / 2;

    // Тень
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(boxX + 3, boxY + 3, boxSize, boxSize);

    // Основной прямоугольник
    const gradient = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxSize);
    gradient.addColorStop(0, '#3B82F6');
    gradient.addColorStop(1, '#1D4ED8');
    ctx.fillStyle = gradient;
    // Рисуем груз (скруглённый прямоугольник вручную для совместимости)
    const r = 6;
    ctx.beginPath();
    ctx.moveTo(boxX + r, boxY);
    ctx.lineTo(boxX + boxSize - r, boxY);
    ctx.quadraticCurveTo(boxX + boxSize, boxY, boxX + boxSize, boxY + r);
    ctx.lineTo(boxX + boxSize, boxY + boxSize - r);
    ctx.quadraticCurveTo(boxX + boxSize, boxY + boxSize, boxX + boxSize - r, boxY + boxSize);
    ctx.lineTo(boxX + r, boxY + boxSize);
    ctx.quadraticCurveTo(boxX, boxY + boxSize, boxX, boxY + boxSize - r);
    ctx.lineTo(boxX, boxY + r);
    ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
    ctx.closePath();
    ctx.fill();

    // Подпись массы
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${params.m.toFixed(1)} кг`, currentX, centerY);

    // === Линия равновесия (пунктир) ===
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(equilibriumX, centerY - 70);
    ctx.lineTo(equilibriumX, centerY + 70);
    ctx.stroke();
    ctx.setLineDash([]);

    // Подпись равновесия
    ctx.fillStyle = '#6B7280';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('x = 0', equilibriumX, centerY + 85);

    // === Стрелка смещения ===
    if (Math.abs(state.x) > 0.001) {
      const arrowY = centerY + 55;
      ctx.strokeStyle = '#EF4444';
      ctx.fillStyle = '#EF4444';
      ctx.lineWidth = 2;

      // Линия
      ctx.beginPath();
      ctx.moveTo(equilibriumX, arrowY);
      ctx.lineTo(currentX, arrowY);
      ctx.stroke();

      // Наконечник
      const dir = state.x > 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(currentX, arrowY);
      ctx.lineTo(currentX - dir * 8, arrowY - 4);
      ctx.lineTo(currentX - dir * 8, arrowY + 4);
      ctx.closePath();
      ctx.fill();

      // Подпись
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`x = ${(state.x * 100).toFixed(1)} см`, (equilibriumX + currentX) / 2, arrowY - 10);
    }

    // === Вектор силы ===
    if (Math.abs(state.F) > 0.01) {
      const forceArrowY = centerY - 45;
      const forceScale = pixelsPerMeter * 0.3; // масштаб для силы
      const forceEndX = currentX + state.F * forceScale;

      ctx.strokeStyle = '#10B981';
      ctx.fillStyle = '#10B981';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(currentX, forceArrowY);
      ctx.lineTo(forceEndX, forceArrowY);
      ctx.stroke();

      // Наконечник
      const fDir = state.F > 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(forceEndX, forceArrowY);
      ctx.lineTo(forceEndX - fDir * 8, forceArrowY - 5);
      ctx.lineTo(forceEndX - fDir * 8, forceArrowY + 5);
      ctx.closePath();
      ctx.fill();

      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`F = ${state.F.toFixed(1)} Н`, (currentX + forceEndX) / 2, forceArrowY - 10);
    }

    // === Пол (горизонтальная линия) ===
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY + boxSize / 2 + 5);
    ctx.lineTo(width, centerY + boxSize / 2 + 5);
    ctx.stroke();

  }, [state, params, width, height]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="rounded-xl bg-gray-50 border border-gray-200"
    />
  );
}
