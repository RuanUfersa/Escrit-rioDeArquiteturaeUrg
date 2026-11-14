# CLAUDE.md — Plataforma de Gestão para Escritório de Arquitetura

## Contexto do produto

Plataforma web para centralizar a gestão de um escritório de arquitetura: kanban de projetos, cadastro de cliente/projeto, checklist de escopo dinâmico por tipo de projeto, controle financeiro de parcelas, upload de documentos, integração com Google Agenda e notificações automáticas ao cliente (email + WhatsApp), além de um dashboard estratégico.

## Tipos de projeto (project_type)

- **construcao_nova**: escopo completo (levantamento de terreno, reunião de expectativas, estudos climático/legislação, planta baixa, layout, 3D, apresentações com até 2 rodadas de revisão cada, acabamentos, volumetria, caderno de detalhamento, entrega).
- **reforma**: mesmo escopo + visita técnica prévia (antes do contrato) + 2 pranchas extras no detalhamento (demolição e construção) antes da planta definitiva.
- **interiores**: mesmo fluxo, mas levantamento de ambiente específico no lugar de levantamento de terreno; escopo aplicado a um cômodo, não à casa toda.

O tipo de projeto deve funcionar como parâmetro que carrega um `ScopeTemplate` — novos tipos devem poder ser adicionados por configuração, sem mudar código.

## Regras de negócio centrais

- **Cadastro**: endereço pessoal do cliente e endereço da obra são campos separados e obrigatórios (não copiar um do outro). Dados contratuais (data de assinatura, prazo, condições de pagamento, cláusulas) também são obrigatórios no cadastro.
- **Financeiro**: sinal de 15% na assinatura; saldo em 3 parcelas (vinculadas às apresentações e entrega) ou 4 parcelas (as 3 + uma 1 mês após a entrega). Pagamento via Pix; comprovante e nota fiscal são upload manual (nota fiscal é emitida fora do sistema, pela prefeitura, pois o cliente é pessoa física).
- **Agenda**: atividades agendadas do escopo (ex.: levantamento, reunião de expectativas) geram/atualizam/removem eventos no Google Calendar automaticamente, bloqueando o horário para evitar conflito entre projetos simultâneos. Esses eventos são **internos** — o cliente não vê.
- **Notificações ao cliente**: diferente da agenda interna, lembretes de parcela **devem** ir ao cliente por email e WhatsApp antes do vencimento.
- **Revisões**: cada apresentação ao cliente permite no máximo 2 rodadas de alteração; na 3ª, exige definição do cliente.

## Prioridade do MVP

1. Kanban + cadastro (com tipo de projeto e checklist automático de escopo)
2. Checklist de escopo com regras condicionais por tipo
3. Plano financeiro (3/4 parcelas) + upload de comprovante/nota fiscal
4. Integração Google Calendar
5. Notificações automáticas (email/WhatsApp)
6. Dashboard estratégico

## Documento completo

A especificação técnica detalhada (modelo de dados, módulos, integrações, requisitos não funcionais) está em `especificacao-tecnica-mvp-plataforma-arquitetura.md`, na raiz do projeto — consulte antes de implementar qualquer módulo nesta lista.
