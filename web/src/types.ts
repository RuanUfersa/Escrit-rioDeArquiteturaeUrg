export type ProjectType = 'construcao_nova' | 'reforma' | 'interiores';

export type KanbanStatus =
  | 'novo'
  | 'em_levantamento'
  | 'em_projeto'
  | 'em_apresentacao'
  | 'detalhamento_entrega'
  | 'concluido';

export type ScopeItemStatus =
  | 'pendente'
  | 'agendado'
  | 'em_andamento'
  | 'em_revisao'
  | 'concluido';

export interface ScopeItemTemplate {
  id: string;
  titulo: string;
  fase: string;
  descricao?: string;
  permiteRevisao: boolean;
  requerAgendamento: boolean;
  // só para reforma/interiores: marcador condicional
  condicao?: string;
}

export interface ScopeTemplate {
  type: ProjectType;
  label: string;
  descricao: string;
  items: ScopeItemTemplate[];
}

export interface ProjectScopeItem {
  templateId: string;
  titulo: string;
  fase: string;
  status: ScopeItemStatus;
  revisoesUsadas: number; // 0..2
  exigeDefinicaoCliente: boolean;
  scheduledAt?: string;
  descricao?: string; // texto livre da equipe sobre a etapa
  comentarios?: ComentarioEtapa[];
}

export const MAX_COMENTARIO = 500;

export interface ComentarioEtapa {
  id: string;
  texto: string; // até MAX_COMENTARIO caracteres
  data: string; // ISO data-hora
  // autor: entra quando houver login (bloco de autenticação)
}

export interface Contrato {
  dataAssinatura: string; // ISO date
  prazoDias: number;
  condicoesPagamento: string; // ex: "3 parcelas" | "4 parcelas"
  clausulas: string;
}

export type PagamentoStatus = 'pendente' | 'pago';

export interface DocumentoFiscal {
  nome: string;
  tipo: 'comprovante' | 'nota';
  arquivo: string; // data URL (base64) vazio quando excede o limite do mock local
  tamanho: number; // bytes
  data: string; // ISO date do upload
}

export interface Parcela {
  id: string;
  descricao: string;
  vencimento: string; // ISO date
  valor: number;
  status: PagamentoStatus;
  pagoEm?: string; // ISO date
  comprovante?: DocumentoFiscal;
}

export interface Financeiro {
  valorTotal: number;
  sinal: {
    valor: number; // 15% na assinatura
    status: PagamentoStatus;
    pagoEm?: string;
    comprovante?: DocumentoFiscal;
  };
  parcelas: Parcela[];
  notaFiscal?: DocumentoFiscal; // emitida fora do sistema (prefeitura)
}

export interface Project {
  id: string;
  nome: string;
  tipo: ProjectType;
  statusKanban: KanbanStatus;
  clienteNome: string;
  clienteEmail: string;
  clienteTelefone: string;
  enderecoPessoal: string;
  enderecoObra: string;
  ambiente?: string; // obrigatório quando interiores (cômodo)
  contrato: Contrato;
  financeiro: Financeiro;
  escopo: ProjectScopeItem[];
  createdAt: string;
}

export const KANBAN_COLUMNS: { id: KanbanStatus; label: string }[] = [
  { id: 'novo', label: 'Novo' },
  { id: 'em_levantamento', label: 'Levantamento' },
  { id: 'em_projeto', label: 'Projeto' },
  { id: 'em_apresentacao', label: 'Apresentação' },
  { id: 'detalhamento_entrega', label: 'Detalhamento / Entrega' },
  { id: 'concluido', label: 'Concluído' },
];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  construcao_nova: 'Construção nova',
  reforma: 'Reforma',
  interiores: 'Interiores',
};
