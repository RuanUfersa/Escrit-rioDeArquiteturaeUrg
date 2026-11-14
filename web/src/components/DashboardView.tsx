import type { Project } from '../types';
import { buildDashboard } from '../data/dashboard';
import { formatBRL } from '../data/financeiro';

interface Props {
  projects: Project[];
  onSelect: (id: string) => void;
}

export default function DashboardView({ projects, onSelect }: Props) {
  const d = buildDashboard(projects);

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-sand-200 bg-white p-4">
          <div className="text-xs text-sand-500">Projetos</div>
          <div className="text-2xl font-bold text-sand-900">{d.totalProjetos}</div>
          <div className="text-xs text-sand-500">progresso médio {d.progressoMedio}%</div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-4">
          <div className="text-xs text-sand-500">Total contratado</div>
          <div className="text-2xl font-bold text-sand-900">{formatBRL(d.valores.total)}</div>
          <div className="text-xs text-sand-500">portfólio ativo</div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-4">
          <div className="text-xs text-sand-500">Recebido</div>
          <div className="text-2xl font-bold text-oliva-600">{formatBRL(d.valores.recebido)}</div>
          <div className="text-xs text-sand-500">
            {d.valores.total ? `${Math.round((d.valores.recebido / d.valores.total) * 100)}% do contratado` : '—'}
          </div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-4">
          <div className="text-xs text-sand-500">A receber</div>
          <div className="text-2xl font-bold text-red-700">{formatBRL(d.valores.aReceber)}</div>
          <div className="text-xs text-sand-500">{d.proximasAtividades} atividades agendadas</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-sand-200 bg-white p-4">
          <div className="mb-3 text-sm font-semibold text-sand-900">Projetos por estágio</div>
          <div className="flex flex-col gap-2">
            {d.porStatus.map((s) => (
              <div key={s.status}>
                <div className="flex justify-between text-xs text-sand-600">
                  <span>{s.label}</span>
                  <span>{s.count} • {s.pct}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand-100">
                  <div className="h-full bg-terra-600" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-sand-200 bg-white p-4">
          <div className="mb-3 text-sm font-semibold text-sand-900">Por tipo de projeto</div>
          <div className="flex flex-col gap-2">
            {d.porTipo.map((t) => (
              <div key={t.tipo}>
                <div className="flex justify-between text-xs text-sand-600">
                  <span>{t.label}</span>
                  <span>{t.count} • {t.pct}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand-100">
                  <div className="h-full bg-oliva-600" style={{ width: `${t.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-sand-200 bg-white p-4">
          <div className="mb-3 text-sm font-semibold text-sand-900">Próximos vencimentos (7 dias)</div>
          {d.proximosVencimentos.length === 0 && (
            <div className="rounded-lg border border-dashed border-sand-300 p-3 text-center text-xs text-sand-400">sem parcelas próximas</div>
          )}
          <div className="flex flex-col gap-2">
            {d.proximosVencimentos.map((v, i) => (
              <button
                key={i}
                onClick={() => onSelect(v.projectId)}
                className="rounded-lg border border-sand-200 p-2 text-left hover:bg-sand-50"
              >
                <div className="text-xs font-medium text-sand-900">{v.projectNome}</div>
                <div className="text-[11px] text-sand-500">{v.descricao} • {formatBRL(v.valor)}</div>
                <div className={`text-[11px] font-medium ${v.diasAte < 0 ? 'text-red-700' : 'text-amber-700'}`}>
                  venc. {v.vencimento}
                  {v.diasAte < 0 ? ` (+${Math.abs(v.diasAte)}d)` : v.diasAte === 0 ? ' (hoje)' : ` (${v.diasAte}d)`}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}