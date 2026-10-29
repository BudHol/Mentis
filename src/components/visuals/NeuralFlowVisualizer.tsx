import React, { useState } from 'react';
import { Network, Info, CheckCircle2, ArrowRight } from 'lucide-react';

interface LayerNode {
  id: string;
  name: string;
  type: 'input' | 'hidden' | 'activation' | 'loss';
  shape: string;
  formula: string;
  description: string;
  slideRef: string;
}

const NODES: LayerNode[] = [
  {
    id: 'x',
    name: 'Input Layer X',
    type: 'input',
    shape: 'Batch (m, d)',
    formula: 'x ∈ ℝ^{m × d}',
    description: 'Raw feature matrix normalized to zero mean and unit variance.',
    slideRef: 'Lecture 05 · Slide 4',
  },
  {
    id: 'z1',
    name: 'Linear Transformation',
    type: 'hidden',
    shape: 'W₁ · X + b₁',
    formula: 'z₁ = W₁ x + b₁',
    description: 'Forward affine projection. Upstream gradient δz₁ = δa₁ ⊙ σ\'(z₁).',
    slideRef: 'Lecture 05 · Slide 9',
  },
  {
    id: 'a1',
    name: 'Nonlinear Activation',
    type: 'activation',
    shape: 'ReLU(z₁)',
    formula: 'a₁ = max(0, z₁)',
    description: 'Piecewise linear activation. Subgradient is 1 for z₁ > 0 and 0 for z₁ ≤ 0.',
    slideRef: 'Lecture 05 · Slide 12',
  },
  {
    id: 'loss',
    name: 'Objective / Loss J(θ)',
    type: 'loss',
    shape: 'Cross-Entropy / MSE',
    formula: 'J = -∑ y log(ŷ)',
    description: 'Scalar loss that seeds the backpropagation chain rule backwards.',
    slideRef: 'Lecture 05 · Slide 18',
  },
];

export const NeuralFlowVisualizer: React.FC = () => {
  const [activeNodeId, setActiveNodeId] = useState<string>('z1');

  const activeNode = NODES.find((n) => n.id === activeNodeId) || NODES[1];

  return (
    <div className="my-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
            <Network className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Interactive Computation Graph & Gradient Flow
            </h4>
            <p className="text-xs text-slate-500">
              Click any node in the computational pipeline to inspect its forward and reverse adjoint rules
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Node Pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3">
        {NODES.map((node, i) => {
          const isActive = node.id === activeNodeId;
          return (
            <button
              key={node.id}
              onClick={() => setActiveNodeId(node.id)}
              className={`p-3 rounded-lg border text-left transition-all relative ${
                isActive
                  ? 'border-violet-500 bg-violet-50/50 shadow-xs'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase font-semibold text-slate-500">
                  Node 0{i + 1}
                </span>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                )}
              </div>
              <div className="text-xs font-semibold text-slate-900 truncate">
                {node.name}
              </div>
              <div className="text-[11px] font-mono text-slate-600 mt-1">
                {node.shape}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Node Details Box */}
      <div className="rounded-lg bg-slate-900 text-slate-200 p-3.5 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
          <span className="font-semibold text-white text-sm">
            {activeNode.name}
          </span>
          <span className="font-mono text-violet-300 text-xs bg-violet-950 px-2 py-0.5 rounded border border-violet-800/60">
            {activeNode.slideRef}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Mathematical Formulation
            </span>
            <div className="font-mono text-amber-300 bg-slate-950 p-2 rounded border border-slate-800 text-xs">
              {activeNode.formula}
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Socratic Gradient Intuition
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {activeNode.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
