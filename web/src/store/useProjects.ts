import { useEffect, useState } from 'react';
import type { Project, ProjectType } from '../types';
import { buildInitialScope } from '../data/scopeTemplates';
import { buildFinanceiro } from '../data/financeiro';

const KEY = 'archi.projects.v4';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const SEED_DATES: Record<ProjectType, Record<string, [string, string]>> = {
  construcao_nova: { levantamento_terreno: ['2026-09-16', '09:00'], reuniao_expectativas: ['2026-09-18', '14:00'] },
  reforma: { visita_tecnica_previa: ['2026-09-15', '09:00'], levantamento_imovel: ['2026-09-17', '10:30'] },
  interiores: { levantamento_ambiente: ['2026-09-15', '15:00'] },
};

function seedScope(type: ProjectType) {
  return buildInitialScope(type).map((s) => {
    const d = SEED_DATES[type][s.templateId];
    return d ? { ...s, scheduledAt: d[0], horaAgendada: d[1], status: 'agendado' as const } : s;
  });
}

function seeds(): Project[] {
  const now = new Date().toISOString();
  const fin = (
    valor: number,
    contrato: { condicoesPagamento: string; prazoDias: number; dataAssinatura: string },
    overrides: string[] = [],
  ) => {
    const f = buildFinanceiro({ valorTotal: valor, ...contrato });
    overrides.forEach((v, i) => {
      if (f.parcelas[i]) f.parcelas[i].vencimento = v;
    });
    return f;
  };
  return [
    {
      id: uid(),
      nome: 'Casa Horizonte — Silva',
      tipo: 'construcao_nova',
      statusKanban: 'em_levantamento',
      clienteNome: 'Marina Silva',
      clienteEmail: 'marina.silva@email.com',
      clienteTelefone: '(11) 99911-2233',
      enderecoPessoal: 'Rua das Flores, 123 — São Paulo/SP',
      enderecoObra: 'Lote 14, Cond. Horizonte — Cotia/SP',
      contrato: {
        dataAssinatura: '2026-09-01',
        prazoDias: 120,
        condicoesPagamento: '3 parcelas',
        clausulas: 'Sinal 15% na assinatura. Saldo em 3 parcelas vinculadas às apresentações e entrega.',
      },
      financeiro: fin(
        150000,
        {
          condicoesPagamento: '3 parcelas',
          prazoDias: 120,
          dataAssinatura: '2026-09-01',
        },
        ['2026-09-13'],
      ),
      escopo: seedScope('construcao_nova'),
      createdAt: now,
    },
    {
      id: uid(),
      nome: 'Reforma Apê — Souza',
      tipo: 'reforma',
      statusKanban: 'novo',
      clienteNome: 'Paulo Souza',
      clienteEmail: 'paulo.souza@email.com',
      clienteTelefone: '(11) 98822-3344',
      enderecoPessoal: 'Av. Paulista, 900 — São Paulo/SP',
      enderecoObra: 'Rua Vergueiro, 2100 ap. 42 — São Paulo/SP',
      contrato: {
        dataAssinatura: '2026-09-05',
        prazoDias: 90,
        condicoesPagamento: '4 parcelas',
        clausulas: 'Visita técnica prévia realizada. Sinal 15%. Saldo em 4 parcelas (3 + 1 mês após entrega).',
      },
      financeiro: fin(
        65000,
        {
          condicoesPagamento: '4 parcelas',
          prazoDias: 90,
          dataAssinatura: '2026-09-05',
        },
        ['2026-09-12'],
      ),
      escopo: seedScope('reforma'),
      createdAt: now,
    },
    {
      id: uid(),
      nome: 'Quarto Theo — Interiores',
      tipo: 'interiores',
      statusKanban: 'em_projeto',
      clienteNome: 'Camila Rocha',
      clienteEmail: 'camila.rocha@email.com',
      clienteTelefone: '(11) 97733-4455',
      enderecoPessoal: 'Rua Clélia, 500 — São Paulo/SP',
      enderecoObra: 'Rua Clélia, 500 casa 2 — São Paulo/SP (quarto Theo)',
      ambiente: 'Quarto do Theo',
      contrato: {
        dataAssinatura: '2026-08-20',
        prazoDias: 60,
        condicoesPagamento: '3 parcelas',
        clausulas: 'Escopo restrito ao cômodo indicado. Sinal 15% via Pix.',
      },
      financeiro: fin(28000, {
        condicoesPagamento: '3 parcelas',
        prazoDias: 60,
        dataAssinatura: '2026-08-20',
      }),
      escopo: seedScope('interiores'),
      createdAt: now,
    },
  ];
}

function withFinanceiro(p: Project): Project {
  if (p.financeiro) return p;
  return {
    ...p,
    financeiro: buildFinanceiro({
      valorTotal: 0,
      condicoesPagamento: p.contrato.condicoesPagamento,
      prazoDias: p.contrato.prazoDias,
      dataAssinatura: p.contrato.dataAssinatura,
    }),
  };
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return (JSON.parse(raw) as Project[]).map(withFinanceiro);
    } catch {
      /* ignore */
    }
    return seeds();
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(projects));
  }, [projects]);

  const add = (p: Omit<Project, 'id' | 'createdAt' | 'escopo'>) => {
    const full: Project = {
      ...p,
      id: uid(),
      createdAt: new Date().toISOString(),
      escopo: buildInitialScope(p.tipo),
    };
    setProjects((prev) => [full, ...prev]);
    return full;
  };

  const update = (id: string, patch: Partial<Project>) =>
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const remove = (id: string) => setProjects((prev) => prev.filter((p) => p.id !== id));

  const reset = () => setProjects(seeds());

  return { projects, add, update, remove, reset };
}
