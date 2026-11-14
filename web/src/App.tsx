import { useMemo, useState } from 'react';
import { useProjects } from './store/useProjects';
import { useNotifications } from './store/useNotifications';
import KanbanBoard from './components/KanbanBoard';
import ProjectForm from './components/ProjectForm';
import ProjectDetail from './components/ProjectDetail';
import AgendaView from './components/AgendaView';
import NotificationsView from './components/NotificationsView';
import DashboardView from './components/DashboardView';
import type { ProjectType } from './types';

export default function App() {
  const { projects, add, update, remove, reset } = useProjects();
  const notif = useNotifications();
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todas' | ProjectType>('todas');
  const [q, setQ] = useState('');
  const [view, setView] = useState<'quadro' | 'agenda' | 'notificacoes' | 'dashboard'>('quadro');

  const selected = projects.find((p) => p.id === selectedId) ?? null;

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          (filter === 'todas' || p.tipo === filter) &&
          (q.trim() === '' ||
            (p.nome + p.clienteNome + p.enderecoObra).toLowerCase().includes(q.toLowerCase())),
      ),
    [projects, filter, q],
  );

  return (
    <div className="min-h-screen bg-cream text-sand-900">
      <header className="border-b border-sand-200">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">Ateliê — Gestão de Projetos</h1>
            <p className="text-sm text-sand-500">MVP 1: Kanban + cadastro + checklist por tipo (mock local)</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-sand-300 text-sm">
              <button onClick={() => setView('quadro')} className={`px-3 py-1.5 ${view === 'quadro' ? 'bg-terra-600 text-white' : 'hover:bg-sand-50'}`}>Quadro</button>
              <button onClick={() => setView('agenda')} className={`px-3 py-1.5 ${view === 'agenda' ? 'bg-terra-600 text-white' : 'hover:bg-sand-50'}`}>Agenda</button>
              <button onClick={() => setView('notificacoes')} className={`px-3 py-1.5 ${view === 'notificacoes' ? 'bg-terra-600 text-white' : 'hover:bg-sand-50'}`}>Notificações</button>
              <button onClick={() => setView('dashboard')} className={`px-3 py-1.5 ${view === 'dashboard' ? 'bg-terra-600 text-white' : 'hover:bg-sand-50'}`}>Dashboard</button>
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar projeto / cliente / obra..."
              className="rounded-lg border border-sand-300 px-3 py-1.5 text-sm"
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value as never)} className="rounded-lg border border-sand-300 px-2 py-1.5 text-sm">
              <option value="todas">Todos os tipos</option>
              <option value="construcao_nova">Construção nova</option>
              <option value="reforma">Reforma</option>
              <option value="interiores">Interiores</option>
            </select>
            <button onClick={() => reset()} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-sand-50">Resetar demo</button>
            <button onClick={() => setShowForm(true)} className="rounded-lg bg-terra-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-terra-700">+ Novo projeto</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4">
        <div className="mb-3 text-sm text-sand-500">
          {filtered.length} projeto(s) • Endereços pessoal/obra separados • Contrato obrigatório • Revisão máx. 2 por apresentação
        </div>
        {view === 'quadro' ? (
          <KanbanBoard
            projects={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={(id, to) => update(id, { statusKanban: to })}
            onDelete={(id) => {
              if (confirm('Excluir projeto?')) {
                remove(id);
                if (selectedId === id) setSelectedId(null);
              }
            }}
          />
        ) : view === 'agenda' ? (
          <AgendaView projects={filtered} onSelect={setSelectedId} />
        ) : view === 'notificacoes' ? (
          <NotificationsView
            projects={filtered}
            logs={notif.logs}
            sentKeys={notif.sentKeys}
            onSend={(l, canais) => notif.send(l, canais)}
            onResetLog={notif.reset}
          />
        ) : (
          <DashboardView projects={filtered} onSelect={setSelectedId} />
        )}
        <footer className="mt-6 text-xs text-sand-400">
          Mock local (localStorage “archi.projects.v4”). MVP completo em protótipo: Kanban, escopo por tipo, financeiro, agenda, notificações e dashboard.
        </footer>
      </main>

      {showForm && <ProjectForm onClose={() => setShowForm(false)} onSubmit={add} />}
      {selected && <ProjectDetail project={selected} onClose={() => setSelectedId(null)} onUpdate={update} />}
    </div>
  );
}
