import React, { useState } from 'react';
import { Play, RotateCcw, AlertTriangle, CheckCircle2, Sliders } from 'lucide-react';

interface LossLandscapeDiagramProps {
  defaultLearningRate?: number;
  initialSteps?: number;
}

export const LossLandscapeDiagram: React.FC<LossLandscapeDiagramProps> = ({
  defaultLearningRate = 0.52,
  initialSteps = 6,
}) => {
  const [learningRate, setLearningRate] = useState<number>(defaultLearningRate);
  const [stepCount, setStepCount] = useState<number>(initialSteps);
  const [startX, setStartX] = useState<number>(-2.2);

  // Parabolic objective function: f(x) = 0.5 * k * x^2, where k = 1.6 (Lipschitz L = 1.6)
  // Gradient f'(x) = k * x
  // Update rule: x_{t+1} = x_t - eta * k * x_t = x_t * (1 - eta * k)
  // Critical convergence threshold: |1 - eta * k| < 1  =>  0 < eta < 2/k = 2 / 1.6 = 1.25
  const k = 1.6;

  // Compute trajectory
  const points: { x: number; y: number; step: number }[] = [];
  let currX = startX;
  for (let i = 0; i <= stepCount; i++) {
    const y = 0.5 * k * currX * currX;
    points.push({ x: currX, y, step: i });
    currX = currX - learningRate * (k * currX);
  }

  // Curve geometry mapping
  // World space: x in [-3, 3], y in [0, 8]
  const svgWidth = 560;
  const svgHeight = 220;
  const margin = { top: 20, right: 30, bottom: 35, left: 40 };
  const innerW = svgWidth - margin.left - margin.right;
  const innerH = svgHeight - margin.top - margin.bottom;

  const toSvgX = (x: number) => margin.left + ((x + 3) / 6) * innerW;
  const toSvgY = (y: number) => margin.top + innerH - (y / 8) * innerH;

  // Generate curve path
  const curvePoints: string[] = [];
  for (let x = -2.8; x <= 2.8; x += 0.1) {
    const y = 0.5 * k * x * x;
    curvePoints.push(`${toSvgX(x)},${toSvgY(y)}`);
  }
  const curvePath = `M ${curvePoints.join(' L ')}`;

  // Determine oscillation / convergence state
  const multiplier = Math.abs(1 - learningRate * k);
  let statusText = 'Stable Convergence';
  let statusTone = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  let statusIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;

  if (learningRate * k > 1.8) {
    statusText = 'Severe Divergence (Overshooting to ∞)';
    statusTone = 'text-rose-700 bg-rose-50 border-rose-200';
    statusIcon = <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
  } else if (learningRate * k > 1.0) {
    statusText = 'Oscillating (Bouncing Across Valley)';
    statusTone = 'text-amber-800 bg-amber-50 border-amber-200';
    statusIcon = <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
  }

  const handleReset = () => {
    setLearningRate(defaultLearningRate);
    setStepCount(initialSteps);
    setStartX(-2.2);
  };

  return (
    <div className="my-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Interactive Loss Surface: Step Overshoot Visualizer
            </h4>
            <p className="text-xs text-slate-500">
              Observe step trajectory vs learning rate η on loss J(θ) = 0.8 θ²
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border ${statusTone}`}>
            {statusIcon}
            <span>{statusText}</span>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 transition-colors"
            title="Reset parameters"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative mt-3 overflow-hidden rounded-lg bg-slate-50 border border-slate-100">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-[260px] select-none"
        >
          {/* Subtle grid lines */}
          <line
            x1={margin.left}
            y1={toSvgY(0)}
            x2={svgWidth - margin.right}
            y2={toSvgY(0)}
            stroke="#cbd5e1"
            strokeWidth="1"
          />
          <line
            x1={toSvgX(0)}
            y1={margin.top}
            x2={toSvgX(0)}
            y2={svgHeight - margin.bottom}
            stroke="#cbd5e1"
            strokeDasharray="3 3"
            strokeWidth="1"
          />

          {/* Target minimum marker */}
          <circle cx={toSvgX(0)} cy={toSvgY(0)} r="4" fill="#0284c7" />
          <text
            x={toSvgX(0)}
            y={toSvgY(0) + 18}
            textAnchor="middle"
            className="text-[10px] fill-slate-500 font-sans"
          >
            Global Minimum (θ* = 0)
          </text>

          {/* Loss Curve */}
          <path
            d={curvePath}
            fill="none"
            stroke="#64748b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Trajectory lines */}
          {points.map((pt, i) => {
            if (i === 0) return null;
            const prev = points[i - 1];
            return (
              <g key={`traj-${i}`}>
                <line
                  x1={toSvgX(prev.x)}
                  y1={toSvgY(prev.y)}
                  x2={toSvgX(pt.x)}
                  y2={toSvgY(pt.y)}
                  stroke={learningRate * k > 1.0 ? '#f59e0b' : '#0284c7'}
                  strokeWidth="1.8"
                  strokeDasharray={learningRate * k > 1.8 ? '4 3' : 'none'}
                />
              </g>
            );
          })}

          {/* Trajectory dots */}
          {points.map((pt, i) => {
            const isStart = i === 0;
            const isLatest = i === points.length - 1;
            return (
              <g key={`pt-${i}`}>
                <circle
                  cx={toSvgX(pt.x)}
                  cy={toSvgY(pt.y)}
                  r={isStart ? 5 : isLatest ? 4.5 : 3.5}
                  fill={isStart ? '#0f172a' : isLatest ? '#2563eb' : '#38bdf8'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                {(isStart || isLatest || i <= 3) && (
                  <text
                    x={toSvgX(pt.x)}
                    y={toSvgY(pt.y) - 8}
                    textAnchor="middle"
                    className="text-[9px] font-mono fill-slate-700 font-semibold"
                  >
                    t={i}
                  </text>
                )}
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={svgWidth - margin.right}
            y={svgHeight - 10}
            textAnchor="end"
            className="text-[10px] fill-slate-500 font-sans"
          >
            Parameter θ →
          </text>
          <text
            x={margin.left}
            y={margin.top - 6}
            textAnchor="start"
            className="text-[10px] fill-slate-500 font-sans"
          >
            Loss J(θ)
          </text>
        </svg>
      </div>

      {/* Control Sliders */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg bg-slate-50/70 p-3 border border-slate-200/80">
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-700">Learning Rate (η)</span>
            <span className="font-mono font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {learningRate.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.05"
            max="1.35"
            step="0.02"
            value={learningRate}
            onChange={(e) => setLearningRate(parseFloat(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>0.05 (Slow)</span>
            <span className="text-emerald-600 font-medium">0.62 (Optimal)</span>
            <span className="text-rose-600 font-medium">&gt;1.10 (Diverges)</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-700">Iteration Steps</span>
            <span className="font-mono font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {stepCount} steps
            </span>
          </div>
          <input
            type="range"
            min="2"
            max="12"
            step="1"
            value={stepCount}
            onChange={(e) => setStepCount(parseInt(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>2 steps</span>
            <span>Current: t={stepCount}</span>
            <span>12 steps</span>
          </div>
        </div>
      </div>

      {/* Real-time Math Summary */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-slate-700">Step Multiplier |1 - η·L|:</span>
          <span className="font-mono font-semibold text-slate-900">
            {multiplier.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400">
            ({multiplier < 1.0 ? 'shrinking' : 'growing each step'})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>Starting θ₀ = {startX}</span>
          <span aria-hidden="true">·</span>
          <span>End Loss = {points[points.length - 1].y.toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
};
