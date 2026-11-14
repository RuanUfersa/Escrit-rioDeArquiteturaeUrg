// ScopeTemplates como CONFIG — novos tipos entram aqui sem mudar código.
// Regras vindas do CLAUDE.md:
// - construcao_nova: fluxo completo
// - reforma: mesmo + visita técnica prévia (antes do contrato) + 2 pranchas extras
//   (demolição e construção) antes da planta definitiva
// - interiores: mesmo fluxo, mas levantamento de ambiente no lugar de terreno,
//   escopo aplicado a um cômodo.
import type { ProjectType, ScopeTemplate } from '../types';

export const SCOPE_TEMPLATES: Record<ProjectType, ScopeTemplate> = {
  construcao_nova: {
    type: 'construcao_nova',
    label: 'Construção nova',
    descricao: 'Escopo completo da casa toda.',
    items: [
      { id: 'levantamento_terreno', titulo: 'Levantamento do terreno', fase: 'Levantamento', permiteRevisao: false, requerAgendamento: true, descricao: 'Medições, fotos, condicionantes do lote.' },
      { id: 'reuniao_expectativas', titulo: 'Reunião de expectativas', fase: 'Levantamento', permiteRevisao: false, requerAgendamento: true },
      { id: 'estudo_climatico', titulo: 'Estudo climático', fase: 'Estudo', permiteRevisao: false, requerAgendamento: false },
      { id: 'estudo_legislacao', titulo: 'Estudo de legislação', fase: 'Estudo', permiteRevisao: false, requerAgendamento: false },
      { id: 'planta_baixa', titulo: 'Planta baixa', fase: 'Projeto', permiteRevisao: false, requerAgendamento: false },
      { id: 'apres_planta', titulo: 'Apresentação — planta baixa', fase: 'Apresentação', permiteRevisao: true, requerAgendamento: false, descricao: 'Até 2 rodadas de alteração.' },
      { id: 'layout', titulo: 'Layout', fase: 'Projeto', permiteRevisao: false, requerAgendamento: false },
      { id: 'apres_layout', titulo: 'Apresentação — layout', fase: 'Apresentação', permiteRevisao: true, requerAgendamento: false },
      { id: 'modelo_3d', titulo: 'Modelo 3D', fase: 'Projeto', permiteRevisao: false, requerAgendamento: false },
      { id: 'apres_3d', titulo: 'Apresentação — 3D', fase: 'Apresentação', permiteRevisao: true, requerAgendamento: false },
      { id: 'acabamentos', titulo: 'Definição de acabamentos', fase: 'Projeto', permiteRevisao: false, requerAgendamento: false },
      { id: 'volumetria', titulo: 'Volumetria', fase: 'Projeto', permiteRevisao: false, requerAgendamento: false },
      { id: 'caderno_detalhamento', titulo: 'Caderno de detalhamento', fase: 'Detalhamento', permiteRevisao: false, requerAgendamento: false },
      { id: 'entrega', titulo: 'Entrega final', fase: 'Entrega', permiteRevisao: false, requerAgendamento: false },
    ],
  },
  reforma: {
    type: 'reforma',
    label: 'Reforma',
    descricao: 'Escopo completo + visita prévia e pranchas de demolição/construção.',
    items: [
      { id: 'visita_tecnica_previa', titulo: 'Visita técnica prévia (antes do contrato)', fase: 'Pré-contrato', permiteRevisao: false, requerAgendamento: true, condicao: 'reforma.pre_contrato', descricao: 'Ocorre antes da assinatura.' },
      { id: 'levantamento_imovel', titulo: 'Levantamento do imóvel', fase: 'Levantamento', permiteRevisao: false, requerAgendamento: true },
      { id: 'reuniao_expectativas', titulo: 'Reunião de expectativas', fase: 'Levantamento', permiteRevisao: false, requerAgendamento: true },
      { id: 'estudo_climatico', titulo: 'Estudo climático', fase: 'Estudo', permiteRevisao: false, requerAgendamento: false },
      { id: 'estudo_legislacao', titulo: 'Estudo de legislação', fase: 'Estudo', permiteRevisao: false, requerAgendamento: false },
      { id: 'prancha_demolicao', titulo: 'Prancha — demolição', fase: 'Detalhamento', permiteRevisao: false, requerAgendamento: false, condicao: 'reforma.extra', descricao: 'Antes da planta definitiva.' },
      { id: 'prancha_construcao', titulo: 'Prancha — construção', fase: 'Detalhamento', permiteRevisao: false, requerAgendamento: false, condicao: 'reforma.extra' },
      { id: 'planta_baixa', titulo: 'Planta baixa definitiva', fase: 'Projeto', permiteRevisao: false, requerAgendamento: false },
      { id: 'apres_planta', titulo: 'Apresentação — planta baixa', fase: 'Apresentação', permiteRevisao: true, requerAgendamento: false },
      { id: 'layout', titulo: 'Layout', fase: 'Projeto', permiteRevisao: false, requerAgendamento: false },
      { id: 'apres_layout', titulo: 'Apresentação — layout', fase: 'Apresentação', permiteRevisao: true, requerAgendamento: false },
      { id: 'modelo_3d', titulo: 'Modelo 3D', fase: 'Projeto', permiteRevisao: false, requerAgendamento: false },
      { id: 'apres_3d', titulo: 'Apresentação — 3D', fase: 'Apresentação', permiteRevisao: true, requerAgendamento: false },
      { id: 'acabamentos', titulo: 'Definição de acabamentos', fase: 'Projeto', permiteRevisao: false, requerAgendamento: false },
      { id: 'volumetria', titulo: 'Volumetria', fase: 'Projeto', permiteRevisao: false, requerAgendamento: false },
      { id: 'caderno_detalhamento', titulo: 'Caderno de detalhamento', fase: 'Detalhamento', permiteRevisao: false, requerAgendamento: false },
      { id: 'entrega', titulo: 'Entrega final', fase: 'Entrega', permiteRevisao: false, requerAgendamento: false },
    ],
  },
  interiores: {
    type: 'interiores',
    label: 'Interiores',
    descricao: 'Mesmo fluxo aplicado a um cômodo (levantamento de ambiente).',
    items: [
      { id: 'levantamento_ambiente', titulo: 'Levantamento do ambiente (cômodo)', fase: 'Levantamento', permiteRevisao: false, requerAgendamento: true, condicao: 'interiores.comodo', descricao: 'No lugar do levantamento de terreno.' },
      { id: 'reuniao_expectativas', titulo: 'Reunião de expectativas', fase: 'Levantamento', permiteRevisao: false, requerAgendamento: true },
      { id: 'estudo_climatico', titulo: 'Estudo climático do ambiente', fase: 'Estudo', permiteRevisao: false, requerAgendamento: false },
      { id: 'estudo_legislacao', titulo: 'Estudo de legislação / condomínio', fase: 'Estudo', permiteRevisao: false, requerAgendamento: false },
      { id: 'planta_ambiente', titulo: 'Planta do ambiente', fase: 'Projeto', permiteRevisao: false, requerAgendamento: false },
      { id: 'apres_planta', titulo: 'Apresentação — planta', fase: 'Apresentação', permiteRevisao: true, requerAgendamento: false },
      { id: 'layout', titulo: 'Layout do cômodo', fase: 'Projeto', permiteRevisao: false, requerAgendamento: false },
      { id: 'apres_layout', titulo: 'Apresentação — layout', fase: 'Apresentação', permiteRevisao: true, requerAgendamento: false },
      { id: 'modelo_3d', titulo: 'Modelo 3D', fase: 'Projeto', permiteRevisao: false, requerAgendamento: false },
      { id: 'apres_3d', titulo: 'Apresentação — 3D', fase: 'Apresentação', permiteRevisao: true, requerAgendamento: false },
      { id: 'acabamentos', titulo: 'Definição de acabamentos', fase: 'Projeto', permiteRevisao: false, requerAgendamento: false },
      { id: 'volumetria', titulo: 'Volumetria', fase: 'Projeto', permiteRevisao: false, requerAgendamento: false },
      { id: 'caderno_detalhamento', titulo: 'Caderno de detalhamento', fase: 'Detalhamento', permiteRevisao: false, requerAgendamento: false },
      { id: 'entrega', titulo: 'Entrega final', fase: 'Entrega', permiteRevisao: false, requerAgendamento: false },
    ],
  },
};

export function buildInitialScope(type: ProjectType) {
  return SCOPE_TEMPLATES[type].items.map((t) => ({
    templateId: t.id,
    titulo: t.titulo,
    fase: t.fase,
    status: 'pendente' as const,
    revisoesUsadas: 0,
    exigeDefinicaoCliente: false,
  }));
}
