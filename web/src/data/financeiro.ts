import type { Financeiro, Parcela } from '../types';

export const MAX_UPLOAD_BYTES = 500 * 1024;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatBRL(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

const PARCELAS_3 = [
  'Parcela 1 — Após apresentação da planta',
  'Parcela 2 — Após apresentação de layout/3D',
  'Parcela 3 — Entrega final',
];

const PARCELAS_4 = [
  'Parcela 1 — Após apresentação da planta',
  'Parcela 2 — Após apresentação de layout/3D',
  'Parcela 3 — Entrega final',
  'Parcela 4 — 1 mês após a entrega',
];

export function buildFinanceiro(opts: {
  valorTotal: number;
  condicoesPagamento: string;
  prazoDias: number;
  dataAssinatura: string;
}): Financeiro {
  const { valorTotal, condicoesPagamento, prazoDias, dataAssinatura } = opts;
  const n = condicoesPagamento === '4 parcelas' ? 4 : 3;
  const sinalValor = round2(valorTotal * 0.15);
  const saldo = round2(valorTotal - sinalValor);
  const base = round2(saldo / n);
  const descricoes = n === 4 ? PARCELAS_4 : PARCELAS_3;
  const parcelas: Parcela[] = descricoes.map((descricao, i) => ({
    id: uid(),
    descricao,
    vencimento: addDays(dataAssinatura, Math.round(((i + 1) * prazoDias) / n)),
    valor: i === n - 1 ? round2(saldo - base * (n - 1)) : base,
    status: 'pendente' as const,
  }));
  return {
    valorTotal,
    sinal: { valor: sinalValor, status: 'pendente' },
    parcelas,
  };
}