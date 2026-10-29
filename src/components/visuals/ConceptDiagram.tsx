import React from 'react';
import { ArrowRight, Network } from 'lucide-react';
import { MessageVisualPayload } from '../../types';

interface ConceptDiagramProps {
  data: NonNullable<MessageVisualPayload['conceptDiagram']>;
}

export const ConceptDiagram: React.FC<ConceptDiagramProps> = ({ data }) => (
  <div className="my-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
    <div className="mb-3 flex items-start gap-2 border-b border-slate-100 pb-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
        <Network className="h-4 w-4" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-900">{data.title}</h4>
        <p className="mt-0.5 text-xs text-slate-500">{data.summary}</p>
      </div>
    </div>
    <div className="flex flex-wrap items-stretch justify-center gap-2">
      {data.nodes.map((node, index) => (
        <React.Fragment key={node.id}>
          <div className="min-w-[140px] max-w-[190px] flex-1 rounded-lg border border-violet-200 bg-violet-50/60 p-3">
            <div className="text-xs font-semibold text-violet-950">{node.label}</div>
            <div className="mt-1 text-[11px] leading-relaxed text-slate-600">{node.detail}</div>
          </div>
          {index < data.nodes.length - 1 && (
            <div className="flex items-center text-violet-400" aria-hidden="true">
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
);
