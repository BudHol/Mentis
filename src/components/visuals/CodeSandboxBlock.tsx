import React, { useState } from 'react';
import { CodeBlockData } from '../../types';
import { Terminal, Copy, Check } from 'lucide-react';

interface CodeSandboxBlockProps {
  data: CodeBlockData;
}

export const CodeSandboxBlock: React.FC<CodeSandboxBlockProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = data.code.trim().split('\n');

  return (
    <div className="my-4 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 overflow-hidden shadow-xs">
      {/* Code Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/90 border-b border-slate-700 text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-sky-400" />
          <span className="font-mono text-slate-300 font-medium">
            {data.filename || `${data.language}_implementation.py`}
          </span>
          <span className="text-slate-500 font-mono">({data.language})</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code lines */}
      <div className="p-4 font-mono text-xs overflow-x-auto leading-relaxed">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-slate-800/50">
                <td className="w-8 select-none pr-3 text-right text-slate-600 align-top">
                  {idx + 1}
                </td>
                <td className="text-slate-200 whitespace-pre font-mono">
                  {line}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Optional Annotation */}
      {data.notes && (
        <div className="px-4 py-2 bg-slate-800/50 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>{data.notes}</span>
          <span className="font-mono text-slate-500">Vectorized Numpy</span>
        </div>
      )}

    </div>
  );
};
