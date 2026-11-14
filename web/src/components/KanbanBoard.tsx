import { useState } from 'react';
import type { KanbanStatus, Project } from '../types';
import { KANBAN_COLUMNS, PROJECT_TYPE_LABELS } from '../types';

interface Props {
  projects: Project[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, to: KanbanStatus) => void;
  onDelete: (id: string) => void;
}

export default function KanbanBoard({ projects, selectedId, onSelect, onMove, onDelete }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<KanbanStatus | null>(null);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {KANBAN_COLUMNS.map((col) => {
        const items = projects.filter((p) => p.statusKanban === col.id);
        const done = (id: string) => {
          const p = projects.find((x) => x.id === id);
          if (!p || p.escopo.length === 0) return 0;
          return Math.round((p.escopo.filter((s) => s.status === 'concluido').length / p.escopo.length) * 100);
        };
        const isDropTarget = dragId !== null && overCol === col.id;
        return (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(col.id);
            }}
            onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId) {
                onMove(dragId, col.id);
              }
              setDragId(null);
              setOverCol(null);
            }}
            className={`flex min-h-[200px] flex-col rounded-2xl bg-sand-100 p-2 transition-shadow ${isDropTarget ? 'ring-2 ring-terra-400' : ''}`}
          >
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-sand-600">{col.label}</span>
              <span className="rounded-full bg-cream px-2 text-xs text-sand-600">{items.length}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {items.map((p) => {
                const idx = KANBAN_COLUMNS.findIndex((c) => c.id === p.statusKanban);
                const pct = done(p.id);
                return (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={() => setDragId(p.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverCol(null);
                    }}
                    onClick={() => onSelect(p.id)}
                    className={`cursor-grab rounded-xl border bg-white p-3 shadow-sm transition hover:shadow active:cursor-grabbing ${selectedId === p.id ? 'border-terra-600' : 'border-sand-200'} ${dragId === p.id ? 'opacity-40' : ''}`}
                  >
                    <div className="text-[11px] font-medium text-terra-700">{PROJECT_TYPE_LABELS[p.tipo]}</div>
                    <div className="text-sm font-semibold leading-tight">{p.nome}</div>
                    <div className="mt-1 text-xs text-sand-500">{p.clienteNome}</div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand-100">
                      <div className="h-full bg-terra-600" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1 text-[11px] text-sand-500">{pct}% do escopo</div>
                    <div className="mt-2 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        disabled={idx === 0}
                        onClick={() => onMove(p.id, KANBAN_COLUMNS[idx - 1].id)}
                        className="rounded-md border px-2 py-0.5 text-xs disabled:opacity-30"
                        title="Voltar estágio"
                      >←</button>
                      <button
                        disabled={idx === KANBAN_COLUMNS.length - 1}
                        onClick={() => onMove(p.id, KANBAN_COLUMNS[idx + 1].id)}
                        className="rounded-md border px-2 py-0.5 text-xs disabled:opacity-30"
                        title="Avançar estágio"
                      >→</button>
                      <button onClick={() => onDelete(p.id)} className="ml-auto text-xs text-red-500 hover:underline">excluir</button>
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && (
                <div className="rounded-xl border border-dashed border-sand-300 p-3 text-center text-xs text-sand-400">vazio</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}