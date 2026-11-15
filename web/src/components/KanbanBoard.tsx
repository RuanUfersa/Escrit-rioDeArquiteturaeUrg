import { useState } from 'react';
import type { KanbanStatus, Project, ProjectType } from '../types';
import { KANBAN_COLUMNS, PROJECT_TYPE_LABELS } from '../types';
import { fmtDate, proximoItem, scopePct } from '../lib/format';

interface Props {
  projects: Project[];
  codes: Map<string, string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, to: KanbanStatus) => void;
  onDelete: (id: string) => void;
}

// Cor do filete de cada coluna, do mais neutro ao concluído.
const COL_BAR: Record<KanbanStatus, string> = {
  novo: 'bg-sand-300',
  em_levantamento: 'bg-sand-400',
  em_projeto: 'bg-terra-400',
  em_apresentacao: 'bg-terra-500',
  detalhamento_entrega: 'bg-terra-700',
  concluido: 'bg-oliva-600',
};

const TYPE_COLOR: Record<ProjectType, string> = {
  construcao_nova: 'text-oliva-600',
  reforma: 'text-terra-700',
  interiores: 'text-sand-700',
};

const COL_LABEL_CURTO: Partial<Record<KanbanStatus, string>> = {
  detalhamento_entrega: 'Detalhamento',
};

function Card({
  p,
  code,
  selected,
  dragging,
  touch,
  onSelect,
  onMove,
  onDelete,
  onDragStart,
  onDragEnd,
}: {
  p: Project;
  code: string;
  selected: boolean;
  dragging: boolean;
  touch: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, to: KanbanStatus) => void;
  onDelete: (id: string) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const idx = KANBAN_COLUMNS.findIndex((c) => c.id === p.statusKanban);
  const pct = scopePct(p);
  const prox = proximoItem(p);
  const btn = touch
    ? 'h-11 flex-1 rounded-xl text-[13px] font-medium'
    : 'h-[30px] w-[30px] rounded-lg text-sm';

  return (
    <article
      draggable={!touch}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`flex flex-col gap-2 border bg-paper transition-shadow ${touch ? 'rounded-2xl p-4' : 'cursor-grab rounded-xl p-3.5 hover:shadow-[0_2px_10px_rgba(43,34,26,0.08)] active:cursor-grabbing'} ${selected ? 'border-terra-600' : 'border-sand-200'} ${dragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="whitespace-nowrap font-mono text-[10px] tracking-[0.1em] text-sand-600">{code}</span>
        <span className={`text-right text-[11px] font-semibold ${TYPE_COLOR[p.tipo]}`}>{PROJECT_TYPE_LABELS[p.tipo]}</span>
      </div>
      <button
        onClick={() => onSelect(p.id)}
        className={`text-left font-display font-semibold leading-tight text-sand-950 hover:text-terra-700 ${touch ? 'text-lg' : 'text-[15px]'}`}
      >
        {p.nome}
      </button>
      <div className="text-xs text-sand-700">{p.clienteNome}</div>
      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded bg-sand-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Escopo concluído">
          <div className="h-full bg-terra-600" style={{ width: `${pct}%` }} />
        </div>
        <span className="font-mono text-[10px] text-sand-700">{pct}%</span>
      </div>
      <div className="border-t border-dashed border-sand-200 pt-2 text-[11px] text-sand-700">
        {prox ? (
          <>
            Próximo: <b className="font-semibold text-sand-950">{prox.titulo}{prox.scheduledAt ? ` · ${fmtDate(prox.scheduledAt).slice(0, 5)}` : ''}</b>
          </>
        ) : (
          <b className="font-semibold text-oliva-600">Escopo concluído</b>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {!touch && (
          <button onClick={() => onDelete(p.id)} className="text-[11px] text-sand-500 hover:text-terra-700 hover:underline">
            excluir
          </button>
        )}
        <button
          disabled={idx === 0}
          onClick={() => onMove(p.id, KANBAN_COLUMNS[idx - 1].id)}
          aria-label="Voltar estágio"
          className={`${btn} ${touch ? '' : 'ml-auto'} border border-sand-300 text-sand-800 hover:bg-sand-100 disabled:opacity-30`}
        >
          {touch ? '← Voltar' : '←'}
        </button>
        <button
          disabled={idx === KANBAN_COLUMNS.length - 1}
          onClick={() => onMove(p.id, KANBAN_COLUMNS[idx + 1].id)}
          aria-label="Avançar estágio"
          className={`${btn} ${touch ? 'bg-sand-950 text-cream hover:bg-sand-900' : 'border border-sand-300 text-sand-800 hover:bg-sand-100'} disabled:opacity-30`}
        >
          {touch ? 'Avançar →' : '→'}
        </button>
      </div>
    </article>
  );
}

export default function KanbanBoard({ projects, codes, selectedId, onSelect, onMove, onDelete }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<KanbanStatus | null>(null);
  const [stage, setStage] = useState<KanbanStatus>(() => {
    const first = KANBAN_COLUMNS.find((c) => projects.some((p) => p.statusKanban === c.id));
    return first?.id ?? 'novo';
  });

  const stageItems = projects.filter((p) => p.statusKanban === stage);

  return (
    <>
      {/* Celular e tablet: um estágio por vez, troca pelos botões */}
      <div className="flex flex-col gap-3 lg:hidden">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6" role="tablist" aria-label="Estágios">
          {KANBAN_COLUMNS.map((c) => {
            const on = c.id === stage;
            const n = projects.filter((p) => p.statusKanban === c.id).length;
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={on}
                onClick={() => setStage(c.id)}
                className={`h-10 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium ${on ? 'border-terra-600 bg-terra-600 text-paper' : 'border-sand-300 text-sand-800'}`}
              >
                {COL_LABEL_CURTO[c.id] ?? c.label} <span className="font-mono opacity-80">{n}</span>
              </button>
            );
          })}
        </div>
        {stageItems.map((p) => (
          <Card
            key={p.id}
            p={p}
            code={codes.get(p.id) ?? ''}
            selected={selectedId === p.id}
            dragging={false}
            touch
            onSelect={onSelect}
            onMove={(id, to) => {
              onMove(id, to);
              setStage(to); // acompanha o card no novo estágio
            }}
            onDelete={onDelete}
          />
        ))}
        {stageItems.length === 0 && (
          <div className="rounded-2xl border border-dashed border-sand-300 p-5 text-center font-mono text-[10px] tracking-[0.12em] text-sand-600">
            NENHUM PROJETO NESTE ESTÁGIO
          </div>
        )}
      </div>

      {/* Computador: seis colunas com arrastar e soltar */}
      <div className="hidden overflow-x-auto pb-1.5 lg:block">
        <div className="grid min-w-[1240px] grid-cols-6 gap-3.5">
          {KANBAN_COLUMNS.map((col) => {
            const items = projects.filter((p) => p.statusKanban === col.id);
            const isDropTarget = dragId !== null && overCol === col.id;
            return (
              <section
                key={col.id}
                aria-label={col.label}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverCol(col.id);
                }}
                onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragId) onMove(dragId, col.id);
                  setDragId(null);
                  setOverCol(null);
                }}
                className={`flex min-h-[520px] flex-col gap-2.5 rounded-2xl border bg-linen p-3 transition-shadow ${isDropTarget ? 'border-terra-400 ring-2 ring-terra-300' : 'border-sand-200'}`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-mono text-[11px] font-medium tracking-[0.14em] text-sand-700">
                    {(COL_LABEL_CURTO[col.id] ?? col.label).toUpperCase()}
                  </h2>
                  <span className="font-mono text-[11px] text-sand-700">{items.length}</span>
                </div>
                <div className={`h-0.5 rounded ${COL_BAR[col.id]}`} />
                {items.map((p) => (
                  <Card
                    key={p.id}
                    p={p}
                    code={codes.get(p.id) ?? ''}
                    selected={selectedId === p.id}
                    dragging={dragId === p.id}
                    touch={false}
                    onSelect={onSelect}
                    onMove={onMove}
                    onDelete={onDelete}
                    onDragStart={() => setDragId(p.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverCol(null);
                    }}
                  />
                ))}
                {items.length === 0 && (
                  <div className="rounded-xl border border-dashed border-sand-300 p-[18px] text-center font-mono text-[10px] tracking-[0.12em] text-sand-600">
                    SOLTE UM CARD AQUI
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
