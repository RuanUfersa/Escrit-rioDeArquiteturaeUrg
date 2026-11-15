import type { Project } from '../types';

/** Converte data ISO (aaaa-mm-dd ou data-hora) para dd/mm/aaaa. */
export function fmtDate(iso: string | undefined): string {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** Dias entre hoje e a data ISO (negativo = já passou). */
export function diasAte(iso: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const v = new Date(iso.slice(0, 10) + 'T00:00:00');
  return Math.round((v.getTime() - hoje.getTime()) / 86400000);
}

/** Texto do prazo: "hoje", "em 3 dias", "atrasado há 5 dias". */
export function prazoTexto(dias: number): string {
  if (dias === 0) return 'hoje';
  const n = Math.abs(dias);
  const d = n === 1 ? 'dia' : 'dias';
  return dias > 0 ? `em ${n} ${d}` : `atrasado há ${n} ${d}`;
}

/**
 * Código de exibição (PRJ-0001…) pela ordem de criação.
 * Provisório: o código definitivo será gravado no banco (bloco Firebase).
 */
export function projectCodes(projects: Project[]): Map<string, string> {
  const sorted = [...projects].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt),
  );
  return new Map(sorted.map((p, i) => [p.id, `PRJ-${String(i + 1).padStart(4, '0')}`]));
}

/** Etapas que contam no progresso (as desconsideradas ficam de fora). */
export function etapasAtivas(p: Project) {
  return p.escopo.filter((s) => s.status !== 'desconsiderado');
}

export function scopePct(p: Project): number {
  const ativas = etapasAtivas(p);
  if (ativas.length === 0) return 0;
  return Math.round((ativas.filter((s) => s.status === 'concluido').length / ativas.length) * 100);
}

/** Próxima etapa ainda não concluída (ignora as desconsideradas). */
export function proximoItem(p: Project) {
  return p.escopo.find((s) => s.status !== 'concluido' && s.status !== 'desconsiderado');
}

/** Horários de 30 em 30 minutos: 00:00, 00:30 … 23:30. */
export const HORARIOS: string[] = Array.from({ length: 48 }, (_, i) =>
  `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`,
);
