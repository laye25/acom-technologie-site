import React, { useState } from 'react';
import { EmbroideryDiagnosticAuditor } from '../services/embroideryServices';

export function TatamiDebugger() {
  const [selectedY, setSelectedY] = useState<number | null>(null);

  const exports = EmbroideryDiagnosticAuditor.tatamiExports;

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-medium text-gray-900">Tatami Debugger</h3>
        <span className="text-xs text-gray-500">{exports.length} scanlines</span>
      </div>
      
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {exports.map((diag, i) => (
          <div 
            key={i}
            className={`p-3 text-sm border rounded cursor-pointer transition-colors ${
              selectedY === diag.yVal ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
            onClick={() => setSelectedY(diag.yVal)}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono font-medium">Ligne #{i+1}</span>
              <span className="text-gray-500">Angle: {diag.angle}°</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Intersections ({diag.intersections.length})</p>
                <div className="font-mono text-xs max-h-24 overflow-auto">
                  {diag.intersections.map(x => x.toFixed(1)).join(', ')}
                </div>
              </div>
              
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Pairs</p>
                <div className="font-mono text-xs max-h-24 overflow-auto space-y-1">
                  {diag.pairs.map((p, j) => (
                    <div key={j} className={p.valid ? 'text-green-600 font-medium' : 'text-red-500'}>
                      {p.start.toFixed(1)} → {p.end.toFixed(1)} {p.valid ? '✓' : '❌'}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200/50">
                <p className="text-gray-500 text-xs uppercase mb-1">Segments Générés ({diag.validSegments.length})</p>
                <div className="font-mono text-xs">
                  {diag.validSegments.map((s, j) => (
                    <span key={j} className="inline-block bg-white border border-gray-200 rounded px-1.5 py-0.5 mr-1 mb-1">
                      {s.start.toFixed(1)} → {s.end.toFixed(1)}
                    </span>
                  ))}
                  {diag.validSegments.length === 0 && <span className="text-gray-400 italic">Aucun segment</span>}
                </div>
            </div>
          </div>
        ))}

        {exports.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>Aucune donnée diagnostique.</p>
            <p className="text-sm mt-2">Activez l'auditeur avant la génération.</p>
          </div>
        )}
      </div>
    </div>
  );
}
