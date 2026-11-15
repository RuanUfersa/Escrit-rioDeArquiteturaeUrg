import { useMemo, useState } from 'react';
import { useProjects } from './store/useProjects';
import { useNotifications } from './store/useNotifications';
import { useColumns } from './store/useColumns';
import KanbanBoard from './components/KanbanBoard';
import ProjectForm from './components/ProjectForm';
import ProjectDetail from './components/ProjectDetail';
import AgendaView from './components/AgendaView';
import NotificationsView from './components/NotificationsView';
import DashboardView from './components/DashboardView';
import type { ProjectType } from './types';
import { PROJECT_TYPE_LABELS } from './types';
import { projectCodes } from './lib/format';

type View = 'quadro' | 'agenda' | 'notificacoes' | 'dashboard';

const VIEWS: { id: View; label: string; curto: string; titulo: string }[] = [
  { id: 'quadro', label: 'Quadro', curto: 'Quadro', titulo: 'Projetos em andamento' },
  { id: 'agenda', label: 'Agenda', curto: 'Agenda', titulo: 'Agenda interna' },
  { id: 'notificacoes', label: 'Notificações', curto: 'Alertas', titulo: 'Lembretes de pagamento' },
  { id: 'dashboard', label: 'Dashboard', curto: 'Painel', titulo: 'Visão geral' },
];

const FILTROS: ('todas' | ProjectType)[] = ['todas', 'construcao_nova', 'reforma', 'interiores'];

function Logo({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg border-[1.5px] border-terra-400 font-display font-bold text-terra-300 ${small ? 'h-7 w-7 text-[13px]' : 'h-[30px] w-[30px]'}`}
      aria-hidden="true"
    >
      A
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export default function App() {
  const { projects, add, update, remove, reset } = useProjects();
  const notif = useNotifications();
  const { columns, addColumn, moveColumn, renameColumn, removeColumn, resetColumns } = useColumns();
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todas' | ProjectType>('todas');
  const [q, setQ] = useState('');
  const [view, setView] = useState<View>('quadro');

  const codes = useMemo(() => projectCodes(projects), [projects]);
  const selected = projects.find((p) => p.id === selectedId) ?? null;
  const viewIdx = VIEWS.findIndex((v) => v.id === view);
  const current = VIEWS[viewIdx];

  const filtered = useMemo(
    () =>
      projects.filter((p) => {
        const termo = q.trim().toLowerCase();
        const alvo = `${p.nome} ${p.clienteNome} ${p.enderecoObra} ${codes.get(p.id) ?? ''}`.toLowerCase();
        return (filter === 'todas' || p.tipo === filter) && (termo === '' || alvo.includes(termo));
      }),
    [projects, filter, q, codes],
  );

  function handleDelete(id: string) {
    if (confirm('Excluir projeto? (Na versão final, a exclusão vai pedir aprovação do Gerente.)')) {
      remove(id);
      if (selectedId === id) setSelectedId(null);
    }
  }

  return (
    <div className="min-h-screen bg-cream text-sand-950 lg:flex">
      {/* Menu lateral (computador) */}
      <nav
        aria-label="Menu principal"
        className="hidden w-[232px] shrink-0 flex-col gap-7 bg-sand-950 px-[18px] py-7 text-sand-100 lg:sticky lg:top-0 lg:flex lg:h-screen"
      >
        <div className="flex items-center gap-2.5">
          <Logo />
          <div>
            <div className="font-display text-[17px] font-semibold tracking-wide">Ateliê</div>
            <div className="font-mono text-[10px] tracking-[0.14em] text-sand-400">GESTÃO DE PROJETOS</div>
          </div>
        </div>
        <ul className="flex flex-col gap-0.5">
          {VIEWS.map((v, i) => {
            const active = v.id === view;
            return (
              <li key={v.id}>
                <button
                  onClick={() => setView(v.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-[13px] transition-colors ${active ? 'bg-sand-900 text-cream shadow-[inset_2px_0_0_var(--color-terra-400)]' : 'text-sand-200 hover:bg-sand-900/60'}`}
                >
                  <span className="w-[18px] font-mono text-[10px] text-sand-400">{String(i + 1).padStart(2, '0')}</span>
                  {v.label}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-auto flex flex-col gap-3 border-t border-sand-800 pt-4">
          <div className="font-mono text-[10px] leading-relaxed tracking-[0.12em] text-sand-400">
            MODO DEMONSTRAÇÃO
            <br />
            DADOS FICTÍCIOS · SEM LOGIN
          </div>
          <button
            onClick={() => {
              reset();
              resetColumns();
            }}
            className="self-start rounded-lg border border-sand-700 px-3 py-1.5 text-xs text-sand-200 hover:bg-sand-900"
          >
            Restaurar dados de exemplo
          </button>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-0">
        {/* Barra superior (celular) */}
        <div className="flex items-center gap-2.5 bg-sand-950 px-4 py-3 text-sand-100 lg:hidden">
          <Logo small />
          <span className="font-display text-[15px] font-semibold">Ateliê</span>
          <span className="ml-auto font-mono text-[10px] tracking-[0.12em] text-sand-400">DEMONSTRAÇÃO</span>
        </div>

        <main className="flex flex-col gap-5 px-4 py-5 sm:px-6 lg:px-9 lg:py-7">
          <header className="flex flex-wrap items-end gap-4">
            <div>
              <div className="font-mono text-[11px] tracking-[0.16em] text-sand-600">
                {String(viewIdx + 1).padStart(2, '0')} / {current.label.toUpperCase()}
              </div>
              <h1 className="mt-1 font-display text-[26px] font-semibold tracking-tight lg:text-[30px]">{current.titulo}</h1>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2.5 sm:ml-auto sm:w-auto">
              <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-sand-300 bg-paper px-3 text-[13px] text-sand-700 sm:h-10 sm:w-[280px] sm:flex-none">
                <SearchIcon />
                <span className="sr-only">Buscar</span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar projeto, cliente ou código"
                  className="min-w-0 flex-1 border-0 bg-transparent text-sand-950 outline-none placeholder:text-sand-500"
                />
              </label>
              <button
                onClick={() => setShowForm(true)}
                className="h-11 rounded-[10px] bg-terra-600 px-[18px] text-[13px] font-semibold text-paper hover:bg-terra-700 sm:h-10"
              >
                + Novo projeto
              </button>
            </div>
          </header>

          <div className="flex flex-wrap items-center gap-2">
            {FILTROS.map((f) => {
              const on = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  aria-pressed={on}
                  className={`h-9 rounded-full border px-3.5 text-xs font-medium transition-colors ${on ? 'border-sand-950 bg-sand-950 text-cream' : 'border-sand-300 text-sand-800 hover:bg-sand-100'}`}
                >
                  {f === 'todas' ? 'Todos os tipos' : PROJECT_TYPE_LABELS[f]}
                </button>
              );
            })}
            <span className="ml-auto font-mono text-[11px] tracking-[0.1em] text-sand-600">
              {filtered.length} {filtered.length === 1 ? 'PROJETO' : 'PROJETOS'}
            </span>
          </div>

          {view === 'quadro' ? (
            <KanbanBoard
              projects={filtered}
              codes={codes}
              columns={columns}
              onAddColumn={addColumn}
              onMoveColumn={moveColumn}
              onRenameColumn={renameColumn}
              onRemoveColumn={removeColumn}
              allProjects={projects}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onMove={(id, to) => update(id, { statusKanban: to })}
              onDelete={handleDelete}
            />
          ) : view === 'agenda' ? (
            <AgendaView projects={filtered} onSelect={setSelectedId} />
          ) : view === 'notificacoes' ? (
            <NotificationsView
              projects={filtered}
              logs={notif.logs}
              sentKeys={notif.sentKeys}
              onSend={notif.send}
              onResetLog={notif.reset}
            />
          ) : (
            <DashboardView projects={filtered} columns={columns} onSelect={setSelectedId} />
          )}

          <button
            onClick={() => {
              reset();
              resetColumns();
            }}
            className="self-start text-xs text-sand-600 underline underline-offset-2 lg:hidden"
          >
            Restaurar dados de exemplo
          </button>
        </main>
      </div>

      {/* Barra inferior (celular) */}
      <nav
        aria-label="Navegação"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-sand-200 bg-paper px-1.5 pt-1.5 pb-[max(14px,env(safe-area-inset-bottom))] lg:hidden"
      >
        {VIEWS.map((v) => {
          const on = v.id === view;
          return (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              aria-current={on ? 'page' : undefined}
              className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-1.5 text-[11px] font-medium ${on ? 'text-terra-600' : 'text-sand-700'}`}
            >
              <span className={`h-[3px] w-[18px] rounded-full ${on ? 'bg-terra-600' : 'bg-transparent'}`} />
              {v.curto}
            </button>
          );
        })}
      </nav>

      {showForm && <ProjectForm onClose={() => setShowForm(false)} onSubmit={add} />}
      {selected && (
        <ProjectDetail
          project={selected}
          code={codes.get(selected.id) ?? ''}
          estagio={columns.find((c) => c.id === selected.statusKanban)?.label ?? ''}
          onClose={() => setSelectedId(null)}
          onUpdate={update}
        />
      )}
    </div>
  );
}
