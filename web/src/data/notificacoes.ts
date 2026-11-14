import type { Project } from '../types';

export interface Lembrete {
  key: string;
  projectId: string;
  projectNome: string;
  clienteNome: string;
  clienteEmail: string;
  clienteWhats: string;
  parcelaId: string;
  descricao: string;
  vencimento: string;
  valor: number;
  diasAte: number;
}

export function buildLembretes(projects: Project[], diasAntes = 3): Lembrete[] {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const out: Lembrete[] = [];
  for (const p of projects) {
    for (const par of p.financeiro.parcelas) {
      if (par.status === 'pago') continue;
      const v = new Date(par.vencimento + 'T00:00:00');
      const diasAte = Math.round((v.getTime() - hoje.getTime()) / 86400000);
      if (diasAte > diasAntes) continue;
      out.push({
        key: `${p.id}:${par.id}`,
        projectId: p.id,
        projectNome: p.nome,
        clienteNome: p.clienteNome,
        clienteEmail: p.clienteEmail,
        clienteWhats: p.clienteTelefone,
        parcelaId: par.id,
        descricao: par.descricao,
        vencimento: par.vencimento,
        valor: par.valor,
        diasAte,
      });
    }
  }
  out.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  return out;
}