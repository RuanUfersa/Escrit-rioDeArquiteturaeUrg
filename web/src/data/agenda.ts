import type { Project } from '../types';
import { SCOPE_TEMPLATES } from './scopeTemplates';

export interface AgendaEvent {
  id: string;
  projectId: string;
  projectNome: string;
  titulo: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  conflito: boolean;
}

export interface AgendaPendente {
  projectId: string;
  projectNome: string;
  titulo: string;
  fase: string;
}

export function buildAgenda(projects: Project[]): AgendaEvent[] {
  const out: AgendaEvent[] = [];
  for (const p of projects) {
    for (const s of p.escopo) {
      // Qualquer etapa pode ser agendada; desconsideradas não entram.
      if (!s.scheduledAt || s.status === 'desconsiderado') continue;
      out.push({
        id: `${p.id}:${s.templateId}`,
        projectId: p.id,
        projectNome: p.nome,
        titulo: s.titulo,
        data: s.scheduledAt,
        horaInicio: s.horaAgendada ?? '',
        horaFim: '',
        conflito: false,
      });
    }
  }
  // Conflito: duas etapas no mesmo dia e no mesmo horário.
  // (A duração de cada compromisso ainda não é registrada.)
  for (const e of out) {
    e.conflito = !!e.horaInicio && out.some((o) => o !== e && o.data === e.data && o.horaInicio === e.horaInicio);
  }
  return out;
}

export function pendingAgenda(projects: Project[]): AgendaPendente[] {
  const out: AgendaPendente[] = [];
  for (const p of projects) {
    const template = SCOPE_TEMPLATES[p.tipo];
    for (const s of p.escopo) {
      const meta = template.items.find((t) => t.id === s.templateId);
      if (meta?.requerAgendamento && !s.scheduledAt && s.status !== 'desconsiderado') {
        out.push({ projectId: p.id, projectNome: p.nome, titulo: s.titulo, fase: s.fase });
      }
    }
  }
  return out;
}