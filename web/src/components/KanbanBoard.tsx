import { useState } from 'react';
import type { KanbanColumn, KanbanStatus, Project, ProjectType } from '../types';
import { PROJECT_TYPE_LABELS } from '../types';
import { fmtDate, proximoItem, scopePct } from '../lib/format';

interface Props {
  projects: Project[];
  codes: Map<string, string>;
  columns: KanbanColumn[];
  onAddColumn: (label: string) => void;
  onMoveColumn: (id: string, dir: -1 | 1) => void;
  onRenameColumn: (id: string, label: string) => void;
  onRemoveColumn: (id: string) => void;
  /** Todos os projetos, sem filtro: usados para impedir remover coluna com projetos. */
  allProjects: Project[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, to: KanbanStatus) => void;
  onDelete: (id: string) => void;
}

// Cor do filete de cada coluna, do mais neutro ao concluído.
const COL_BAR: Record<string, string> = {
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

/** Nome curto só para a coluna padrão de nome longo; nomes editados aparecem como estão. */
function nomeCurto(c: KanbanColumn) {
  return c.id === 'detalhamento_entrega' && c.label === 'Detalhamento / Entrega' ? 'Detalhamento' : c.label;
}

function Card({
  p,
  columns,
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
  columns: KanbanColumn[];
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
  const idx = columns.findIndex((c) => c.id === p.statusKanban);
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
            Próximo: <b className="font-semibold text-sand-950">{prox.titulo}{prox.scheduledAt ? ` · ${fmtDate(prox.scheduledAt).slice(0, 5)}${prox.horaAgendada ? ` ${prox.horaAgendada}` : ''}` : ''}</b>
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
          disabled={idx <= 0}
          onClick={() => idx > 0 && onMove(p.id, columns[idx - 1].id)}
          aria-label="Voltar estágio"
          className={`${btn} ${touch ? '' : 'ml-auto'} border border-sand-300 text-sand-800 hover:bg-sand-100 disabled:opacity-30`}
        >
          {touch ? '← Voltar' : '←'}
        </button>
        <button
          disabled={idx < 0 || idx === columns.length - 1}
          onClick={() => idx >= 0 && idx < columns.length - 1 && onMove(p.id, columns[idx + 1].id)}
          aria-label="Avançar estágio"
          className={`${btn} ${touch ? 'bg-sand-950 text-cream hover:bg-sand-900' : 'border border-sand-300 text-sand-800 hover:bg-sand-100'} disabled:opacity-30`}
        >
          {touch ? 'Avançar →' : '→'}
        </button>
      </div>
    </article>
  );
}

export default function KanbanBoard({ projects, codes, columns, onAddColumn, onMoveColumn, onRenameColumn, onRemoveColumn, allProjects, selectedId, onSelect, onMove, onDelete }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<KanbanStatus | null>(null);
  const [stageEscolhido, setStage] = useState<KanbanStatus>(() => {
    const first = columns.find((c) => projects.some((p) => p.statusKanban === c.id));
    return first?.id ?? columns[0]?.id ?? 'novo';
  });

  // Se a coluna escolhida for removida, volta para a primeira.
  const stage = columns.some((c) => c.id === stageEscolhido) ? stageEscolhido : (columns[0]?.id ?? '');
  const stageItems = projects.filter((p) => p.statusKanban === stage);
  const [editando, setEditando] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setEditando((v) => !v)}
          aria-expanded={editando}
          className="h-9 rounded-lg border border-sand-300 px-3 text-xs font-medium text-sand-800 hover:bg-sand-100"
        >
          {editando ? 'Fechar edição de colunas' : 'Editar colunas'}
        </button>
      </div>
      {editando && (
        <ColumnEditor
          columns={columns}
          projects={allProjects}
          onAdd={onAddColumn}
          onMove={onMoveColumn}
          onRename={onRenameColumn}
          onRemove={onRemoveColumn}
        />
      )}

      {/* Celular e tablet: um estágio por vez, troca pelos botões */}
      <div className="flex flex-col gap-3 lg:hidden">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6" role="tablist" aria-label="Estágios">
          {columns.map((c) => {
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
                {nomeCurto(c)} <span className="font-mono opacity-80">{n}</span>
              </button>
            );
          })}
        </div>
        {stageItems.map((p) => (
          <Card
            key={p.id}
            p={p}
            columns={columns}
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
        <div className="grid gap-3.5" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(200px, 1fr))`, minWidth: `${columns.length * 214}px` }}>
          {columns.map((col) => {
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
                    {nomeCurto(col).toUpperCase()}
                  </h2>
                  <span className="font-mono text-[11px] text-sand-700">{items.length}</span>
                </div>
                <div className={`h-0.5 rounded ${COL_BAR[col.id] ?? 'bg-sand-500'}`} />
                {items.map((p) => (
                  <Card
                    key={p.id}
                    p={p}
                    columns={columns}
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

function ColumnEditor({
  columns,
  projects,
  onAdd,
  onMove,
  onRename,
  onRemove,
}: {
  columns: KanbanColumn[];
  projects: Project[];
  onAdd: (label: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onRename: (id: string, label: string) => void;
  onRemove: (id: string) => void;
}) {
  const [nome, setNome] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [aviso, setAviso] = useState('');
  const iconBtn = 'h-9 w-9 shrink-0 rounded-lg border border-sand-300 text-sand-800 hover:bg-sand-100 disabled:opacity-30';
  const txtBtn = 'h-9 shrink-0 rounded-lg border px-2.5 text-xs font-medium';

  function remover(c: KanbanColumn) {
    const n = projects.filter((p) => p.statusKanban === c.id).length;
    if (columns.length <= 1) {
      setAviso('O quadro precisa ter pelo menos uma coluna.');
      return;
    }
    if (n > 0) {
      setAviso(`"${c.label}" tem ${n} ${n === 1 ? 'projeto' : 'projetos'}. Mova ${n === 1 ? 'o projeto' : 'os projetos'} para outra coluna antes de remover.`);
      return;
    }
    if (confirm(`Remover a coluna "${c.label}"? (Na versão final, a exclusão vai pedir aprovação do Gerente.)`)) {
      onRemove(c.id);
      setAviso('');
    }
  }

  function salvar(id: string) {
    if (!editNome.trim()) return;
    onRename(id, editNome);
    setEditId(null);
  }

  return (
    <section aria-label="Editar colunas" className="flex flex-col gap-3 rounded-2xl border border-sand-200 bg-paper p-4">
      <div className="label-mono">Colunas do quadro · ordem da esquerda para a direita</div>
      <ol className="flex flex-col gap-1.5">
        {columns.map((c, i) => (
          <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-sand-200 px-3 py-1.5">
            <span className="w-6 font-mono text-[10px] text-sand-600">{String(i + 1).padStart(2, '0')}</span>
            {editId === c.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  salvar(c.id);
                }}
                className="flex min-w-[12rem] flex-1 flex-wrap gap-2"
              >
                <label className="sr-only" htmlFor={`col-${c.id}`}>Novo nome da coluna {c.label}</label>
                <input
                  id={`col-${c.id}`}
                  autoFocus
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setEditId(null)}
                  maxLength={40}
                  className="h-9 min-w-0 flex-1 rounded-lg border border-terra-500 bg-paper px-2.5 text-sm outline-none"
                />
                <button type="submit" disabled={!editNome.trim()} className={`${txtBtn} border-terra-600 bg-terra-600 text-paper disabled:opacity-40`}>
                  Salvar
                </button>
                <button type="button" onClick={() => setEditId(null)} className={`${txtBtn} border-sand-300 text-sand-800 hover:bg-sand-100`}>
                  Cancelar
                </button>
              </form>
            ) : (
              <>
                <span className="min-w-[8rem] flex-1 break-words text-sm">{c.label}</span>
                <div className="ml-auto flex gap-2">
                <button
                  onClick={() => {
                    setEditId(c.id);
                    setEditNome(c.label);
                    setAviso('');
                  }}
                  aria-label={`Editar nome de ${c.label}`}
                  className={`${txtBtn} border-sand-300 text-sand-800 hover:bg-sand-100`}
                >
                  Editar
                </button>
                <button onClick={() => onMove(c.id, -1)} disabled={i === 0} aria-label={`Mover ${c.label} para a esquerda`} className={iconBtn}>
                  ←
                </button>
                <button onClick={() => onMove(c.id, 1)} disabled={i === columns.length - 1} aria-label={`Mover ${c.label} para a direita`} className={iconBtn}>
                  →
                </button>
                <button
                  onClick={() => remover(c)}
                  aria-label={`Remover coluna ${c.label}`}
                  className={`${txtBtn} border-sand-300 text-terra-700 hover:bg-terra-50`}
                >
                  Remover
                </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ol>
      {aviso && (
        <p role="alert" className="rounded-lg bg-linen px-3 py-2 text-xs text-terra-800">
          {aviso}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAdd(nome);
          setNome('');
        }}
        className="flex flex-wrap gap-2"
      >
        <label className="sr-only" htmlFor="nova-coluna">Nome da nova coluna</label>
        <input
          id="nova-coluna"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={40}
          placeholder="Nome da nova coluna"
          className="h-10 min-w-0 flex-1 rounded-lg border border-sand-300 bg-paper px-3 text-sm outline-none focus:border-terra-500"
        />
        <button
          type="submit"
          disabled={!nome.trim()}
          className="h-10 rounded-lg bg-terra-600 px-4 text-sm font-semibold text-paper hover:bg-terra-700 disabled:opacity-40"
        >
          + Criar coluna
        </button>
      </form>
    </section>
  );
}
