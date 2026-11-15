import type { Project } from '../types';
import type { KanbanColumn } from '../types';
import { KANBAN_COLUMNS, PROJECT_TYPE_LABELS } from '../types';
import { scopePct } from '../lib/format';

export interface StatusLinha {
  status: string;
  label: string;
  count: number;
  pct: number;
}

export interface TipoLinha {
  tipo: string;
  label: string;
  count: number;
  pct: number;
}

export interface ProximoVencimento {
  projectId: string;
  projectNome: string;
  clienteNome: string;
  descricao: string;
  vencimento: string;
  valor: number;
  diasAte: number;
}

export interface DashboardData {
  totalProjetos: number;
  porStatus: StatusLinha[];
  porTipo: TipoLinha[];
  valores: { total: number; recebido: number; aReceber: number };
  progressoMedio: number;
  proximosVencimentos: ProximoVencimento[];
  vencidos: ProximoVencimento[];
  proximasAtividades: number;
}

export function buildDashboard(projects: Project[], columns: KanbanColumn[] = KANBAN_COLUMNS): DashboardData {
  const totalProjetos = projects.length;

  const porStatus: StatusLinha[] = columns.map((c) => {
    const count = projects.filter((p) => p.statusKanban === c.id).length;
    return { status: c.id, label: c.label, count, pct: totalProjetos ? Math.round((count / totalProjetos) * 100) : 0 };
  });

  const porTipo = (['construcao_nova', 'reforma', 'interiores'] as const).map((t) => {
    const count = projects.filter((p) => p.tipo === t).length;
    return { tipo: t, label: PROJECT_TYPE_LABELS[t], count, pct: totalProjetos ? Math.round((count / totalProjetos) * 100) : 0 };
  });

  const valores = projects.reduce(
    (acc, p) => {
      const sinal = p.financeiro.sinal.status === 'pago' ? p.financeiro.sinal.valor : 0;
      const parcelasPagas = p.financeiro.parcelas
        .filter((par) => par.status === 'pago')
        .reduce((a, par) => a + par.valor, 0);
      return {
        total: acc.total + p.financeiro.valorTotal,
        recebido: acc.recebido + sinal + parcelasPagas,
        aReceber: acc.aReceber + p.financeiro.valorTotal - sinal - parcelasPagas,
      };
    },
    { total: 0, recebido: 0, aReceber: 0 },
  );

  const progressoMedio = totalProjetos
    ? Math.round(projects.reduce((acc, p) => acc + scopePct(p), 0) / totalProjetos)
    : 0;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const proximosVencimentos: ProximoVencimento[] = [];
  const vencidos: ProximoVencimento[] = [];
  for (const p of projects) {
    const cobrancas = [
      ...(p.financeiro.sinal.status === 'pago'
        ? []
        : [{ descricao: 'Sinal 15% — assinatura', vencimento: p.contrato.dataAssinatura, valor: p.financeiro.sinal.valor }]),
      ...p.financeiro.parcelas.filter((par) => par.status !== 'pago'),
    ];
    for (const par of cobrancas) {
      const v = new Date(par.vencimento + 'T00:00:00');
      const diasAte = Math.round((v.getTime() - hoje.getTime()) / 86400000);
      if (diasAte > 7) continue;
      const item: ProximoVencimento = {
        projectId: p.id,
        projectNome: p.nome,
        clienteNome: p.clienteNome,
        descricao: par.descricao,
        vencimento: par.vencimento,
        valor: par.valor,
        diasAte,
      };
      // Atrasados ficam numa lista própria, fora de "próximos 7 dias".
      (diasAte < 0 ? vencidos : proximosVencimentos).push(item);
    }
  }
  proximosVencimentos.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  vencidos.sort((a, b) => a.vencimento.localeCompare(b.vencimento));

  const proximasAtividades = projects.reduce(
    (acc, p) =>
      acc + p.escopo.filter((s) => s.scheduledAt && s.status !== 'concluido' && s.status !== 'desconsiderado').length,
    0,
  );

  return { totalProjetos, porStatus, porTipo, valores, progressoMedio, proximosVencimentos, vencidos, proximasAtividades };
}