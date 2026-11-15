import type { Project } from '../types';
import { buildAgenda, pendingAgenda } from '../data/agenda';

interface Props {
  projects: Project[];
  onSelect: (id: string) => void;
}

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function nextDays(n: number): string[] {
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function fmt(dia: string) {
  return `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
}

export default function AgendaView({ projects, onSelect }: Props) {
  const events = buildAgenda(projects);
  const pendentes = pendingAgenda(projects);
  const days = nextDays(7);
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="mb-4 rounded-xl border border-dashed border-sand-300 p-3 text-xs text-sand-700">
        <b>Agenda interna</b> — protótipo de navegação simulando eventos do Google Agenda ocupados.
        Clique em um evento para abrir o projeto. Conflito entre projetos aparece em <span className="font-medium text-terra-700">destaque</span>.
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
        {days.map((day) => {
          const dia = new Date(day + 'T12:00:00');
          const nomeDia = DIAS[dia.getDay()];
          const evs = events
            .filter((e) => e.data === day)
            .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
          const isHoje = day === hoje;
          return (
            <div key={day} className={`flex min-h-[180px] flex-col rounded-2xl border p-2 ${isHoje ? 'border-terra-600 bg-terra-50' : 'border-sand-200 bg-paper'}`}>
              <div className="mb-2 flex items-center justify-between">
                <span className="label-mono">{nomeDia}</span>
                <span className={`text-xs font-medium ${isHoje ? 'text-terra-700' : 'text-sand-700'}`}>{fmt(day)}</span>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                {evs.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => onSelect(e.projectId)}
                    className={`block rounded-lg p-2 text-left text-xs ${e.conflito ? 'bg-terra-100 text-terra-900 ring-1 ring-terra-400' : 'bg-sand-950 text-cream'}`}
                    title={e.conflito ? 'Conflito: mais de um projeto no período' : 'Abrir projeto'}
                  >
                    <div className="font-medium">{e.horaInicio}–{e.horaFim}</div>
                    <div>{e.titulo}</div>
                    <div className="opacity-70">{e.projectNome}{e.conflito ? ' ⚠' : ''}</div>
                  </button>
                ))}
                {evs.length === 0 && (
                  <div className="rounded-lg border border-dashed border-sand-300 p-2 text-center text-[11px] text-sand-600">livre</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {pendentes.length > 0 && (
        <div className="mt-3 rounded-2xl border border-sand-200 bg-paper p-3.5">
          <div className="mb-2 label-mono">Por agendar ({pendentes.length})</div>
          {pendentes.map((pnd, i) => (
            <div key={i} className="flex items-center justify-between border-b border-sand-100 py-1 text-sm last:border-0">
              <span className="text-xs text-sand-700">{pnd.fase}</span>
              <span className="ml-2 flex-1 text-sand-900">{pnd.titulo} — <b>{pnd.projectNome}</b></span>
              <button onClick={() => onSelect(pnd.projectId)} className="text-xs text-terra-700 underline">abrir projeto</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}