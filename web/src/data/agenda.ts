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

const SLOTS = [
  { inicio: '09:00', fim: '12:00' },
  { inicio: '14:00', fim: '16:00' },
  { inicio: '16:00', fim: '18:00' },
];

export function buildAgenda(projects: Project[]): AgendaEvent[] {
  const porDia = new Map<string, AgendaEvent[]>();
  for (const p of projects) {
    const template = SCOPE_TEMPLATES[p.tipo];
    for (const s of p.escopo) {
      const meta = template.items.find((t) => t.id === s.templateId);
      if (!meta?.requerAgendamento || !s.scheduledAt) continue;
      const base: AgendaEvent = {
        id: `${p.id}:${s.templateId}`,
        projectId: p.id,
        projectNome: p.nome,
        titulo: s.titulo,
        data: s.scheduledAt,
        horaInicio: '',
        horaFim: '',
        conflito: false,
      };
      const list = porDia.get(base.data) ?? [];
      list.push(base);
      porDia.set(base.data, list);
    }
  }
  const out: AgendaEvent[] = [];
  for (const list of porDia.values()) {
    list.sort((a, b) => a.titulo.localeCompare(b.titulo));
    list.forEach((e, i) => {
      const slot = SLOTS[i % SLOTS.length];
      out.push({
        ...e,
        horaInicio: slot.inicio,
        horaFim: slot.fim,
        conflito: list.length > 1,
      });
    });
  }
  return out;
}

export function pendingAgenda(projects: Project[]): AgendaPendente[] {
  const out: AgendaPendente[] = [];
  for (const p of projects) {
    const template = SCOPE_TEMPLATES[p.tipo];
    for (const s of p.escopo) {
      const meta = template.items.find((t) => t.id === s.templateId);
      if (meta?.requerAgendamento && !s.scheduledAt) {
        out.push({ projectId: p.id, projectNome: p.nome, titulo: s.titulo, fase: s.fase });
      }
    }
  }
  return out;
}