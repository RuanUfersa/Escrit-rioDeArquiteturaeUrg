import type { Lembrete } from '../data/notificacoes';
import { formatBRL } from '../data/financeiro';
import { fmtDate } from './format';

export type CanalModelo = 'email' | 'whatsapp';

export interface ModeloMensagem {
  id: string;
  nome: string;
  canal: CanalModelo;
  /** Só para e-mail. */
  assunto?: string;
  corpo: string;
  /** Modelo que já vem selecionado na janela de envio (um por canal). */
  padrao: boolean;
  atualizadoEm: string;
}

export const MAX_NOME_MODELO = 60;
export const MAX_ASSUNTO = 150;
export const MAX_CORPO: Record<CanalModelo, number> = { email: 2000, whatsapp: 1000 };
export const CANAL_LABEL: Record<CanalModelo, string> = { email: 'E-mail', whatsapp: 'WhatsApp' };

/** Campos automáticos que podem ser usados no texto; são trocados pelos dados do lembrete. */
export const VARIAVEIS: { chave: string; descricao: string }[] = [
  { chave: '{cliente}', descricao: 'primeiro nome do cliente' },
  { chave: '{cliente_completo}', descricao: 'nome completo do cliente' },
  { chave: '{projeto}', descricao: 'nome do projeto' },
  { chave: '{parcela}', descricao: 'descrição da parcela' },
  { chave: '{valor}', descricao: 'valor em reais' },
  { chave: '{vencimento}', descricao: 'data de vencimento' },
  { chave: '{prazo}', descricao: '"vence em…", "vence hoje…" ou "venceu em…"' },
];

function quando(l: Lembrete) {
  const data = fmtDate(l.vencimento);
  if (l.diasAte > 0) return `vence em ${data} (daqui a ${l.diasAte} ${l.diasAte === 1 ? 'dia' : 'dias'})`;
  if (l.diasAte === 0) return `vence hoje, ${data}`;
  return `venceu em ${data}`;
}

export function preencher(texto: string, l: Lembrete) {
  const valores: Record<string, string> = {
    '{cliente}': l.clienteNome.trim().split(/\s+/)[0] ?? '',
    '{cliente_completo}': l.clienteNome,
    '{projeto}': l.projectNome,
    '{parcela}': l.descricao,
    '{valor}': formatBRL(l.valor),
    '{vencimento}': fmtDate(l.vencimento),
    '{prazo}': quando(l),
  };
  return texto.replace(/\{[a-z_]+\}/g, (m) => valores[m] ?? m);
}

/** Dados fictícios só para a pré-visualização no cadastro de modelos. */
export const LEMBRETE_EXEMPLO: Lembrete = {
  key: 'exemplo',
  projectId: 'exemplo',
  projectNome: 'Casa Exemplo',
  clienteNome: 'Maria Exemplo',
  clienteEmail: 'maria@exemplo.com',
  clienteWhats: '(11) 90000-0000',
  parcelaId: 'p1',
  descricao: 'Parcela 1',
  vencimento: '2026-12-01',
  valor: 1500,
  diasAte: 3,
};

const AVISO = 'Se você já efetuou o pagamento, por favor desconsidere esta mensagem.';

export const MODELOS_PADRAO: ModeloMensagem[] = [
  {
    id: 'modelo_email_padrao',
    nome: 'Lembrete de parcela',
    canal: 'email',
    assunto: 'Lembrete de pagamento · {parcela} · {projeto}',
    corpo: [
      'Olá, {cliente}!',
      '',
      'Este é um lembrete do Ateliê sobre o projeto "{projeto}": o pagamento referente a "{parcela}", no valor de {valor}, {prazo}.',
      '',
      'O pagamento pode ser feito por Pix. Depois de pagar, se puder, envie o comprovante respondendo a este e-mail.',
      '',
      AVISO,
      '',
      'Atenciosamente,',
      'Ateliê',
    ].join('\n'),
    padrao: true,
    atualizadoEm: '2026-11-15T00:00:00.000Z',
  },
  {
    id: 'modelo_whats_padrao',
    nome: 'Lembrete de parcela',
    canal: 'whatsapp',
    corpo: [
      'Olá, {cliente}! Aqui é do Ateliê.',
      'Passando para lembrar que o pagamento referente a "{parcela}" do projeto "{projeto}", no valor de {valor}, {prazo}.',
      AVISO,
    ].join('\n'),
    padrao: true,
    atualizadoEm: '2026-11-15T00:00:00.000Z',
  },
];
