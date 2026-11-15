import type { KanbanColumn, Project } from '../types';
import { buildDashboard, type ProximoVencimento } from '../data/dashboard';
import { formatBRL } from '../data/financeiro';
import { fmtDate, prazoTexto } from '../lib/format';

interface Props {
  projects: Project[];
  columns: KanbanColumn[];
  onSelect: (id: string) => void;
}

export default function DashboardView({ projects, columns, onSelect }: Props) {
  const d = buildDashboard(projects, columns);

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-sand-200 bg-paper p-[18px]">
          <div className="label-mono">Projetos</div>
          <div className="mt-1.5 font-display text-[26px] font-semibold text-sand-900">{d.totalProjetos}</div>
          <div className="text-xs text-sand-700">progresso médio {d.progressoMedio}%</div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-paper p-[18px]">
          <div className="label-mono">Total contratado</div>
          <div className="mt-1.5 font-display text-[26px] font-semibold text-sand-900">{formatBRL(d.valores.total)}</div>
          <div className="text-xs text-sand-700">portfólio ativo</div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-paper p-[18px]">
          <div className="label-mono">Recebido</div>
          <div className="mt-1.5 font-display text-[26px] font-semibold text-oliva-600">{formatBRL(d.valores.recebido)}</div>
          <div className="text-xs text-sand-700">
            {d.valores.total ? `${Math.round((d.valores.recebido / d.valores.total) * 100)}% do contratado` : '—'}
          </div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-paper p-[18px]">
          <div className="label-mono">A receber</div>
          <div className="mt-1.5 font-display text-[26px] font-semibold text-terra-700">{formatBRL(d.valores.aReceber)}</div>
          <div className="text-xs text-sand-700">{d.proximasAtividades} atividades agendadas</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 items-start gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-sand-200 bg-paper p-[18px]">
          <div className="mb-3 label-mono">Projetos por estágio</div>
          <div className="flex flex-col gap-2">
            {d.porStatus.map((s) => (
              <div key={s.status}>
                <div className="flex justify-between text-xs text-sand-700">
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

        <div className="rounded-2xl border border-sand-200 bg-paper p-[18px]">
          <div className="mb-3 label-mono">Por tipo de projeto</div>
          <div className="flex flex-col gap-2">
            {d.porTipo.map((t) => (
              <div key={t.tipo}>
                <div className="flex justify-between text-xs text-sand-700">
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

        <div className="flex flex-col gap-3">
          <Vencimentos titulo="Atrasados" vazio="Nenhum pagamento atrasado" itens={d.vencidos} onSelect={onSelect} />
          <Vencimentos titulo="Próximos 7 dias" vazio="Nada vence nos próximos 7 dias" itens={d.proximosVencimentos} onSelect={onSelect} />
        </div>
      </div>
    </div>
  );
}
function Vencimentos({
  titulo,
  vazio,
  itens,
  onSelect,
}: {
  titulo: string;
  vazio: string;
  itens: ProximoVencimento[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-paper p-[18px]">
      <div className="mb-3 flex items-center justify-between">
        <span className="label-mono">{titulo}</span>
        <span className="font-mono text-[11px] text-sand-700">{itens.length}</span>
      </div>
      {itens.length === 0 && (
        <div className="rounded-lg border border-dashed border-sand-300 p-3 text-center text-xs text-sand-600">{vazio}</div>
      )}
      <div className="flex flex-col gap-2">
        {itens.map((v, i) => (
          <button
            key={i}
            onClick={() => onSelect(v.projectId)}
            className="rounded-lg border border-sand-200 p-2.5 text-left hover:bg-sand-50"
          >
            <div className="text-xs font-medium">{v.projectNome}</div>
            <div className="text-[11px] text-sand-700">{v.descricao} · {formatBRL(v.valor)}</div>
            <div className={`text-[11px] font-medium ${v.diasAte < 0 ? 'text-terra-700' : 'text-sand-800'}`}>
              venc. {fmtDate(v.vencimento)} · {prazoTexto(v.diasAte)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
