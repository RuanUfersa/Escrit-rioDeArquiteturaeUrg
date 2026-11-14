# PROGRESSO — Ateliê: Plataforma de Gestão (MVP)

> Última atualização: 13/09/2026
> Objetivo deste arquivo: registro do que já foi feito para retomar o trabalho de onde paramos.

## Resumo do produto

Plataforma web para gestão de um escritório de arquitetura: kanban de projetos, cadastro de cliente/projeto, checklist de escopo por tipo, financeiro (sinal 15% + saldo em 3/4 parcelas), agenda interna (protótipo do Google Calendar), notificações ao cliente (protótipo email/WhatsApp) e dashboard estratégico. Tudo atualmente é **mock local (localStorage)**.

## Stack

- React 19 + TypeScript ~6 + Vite 8
- Tailwind CSS v4 (tema customizado via `@theme` no `index.css`)
- Linting: Oxlint (`npm run lint`); build: `tsc -b && vite build`
- Sem bibliotecas externas além das citadas (drag and drop é HTML5 nativo)

## Status do MVP

| Item MVP | Status |
|---|---|
| 1. Kanban + cadastro (tipo de projeto + checklist automático) | ✅ |
| 2. Checklist de escopo com regras por tipo | ✅ |
| 3. Financeiro (15% + 3/4 parcelas) + upload comprovante/NF | ✅ |
| 4. Google Calendar — eventos internos | 🟡 Protótipo de navegação (simulado, sem API real) |
| 5. Notificações email/WhatsApp | 🟡 Protótipo (simulado, sem envio real) |
| 6. Dashboard estratégico | ✅ |

Extras já implementados: **drag and drop** no kanban e **tema terroso minimalista** (crema/areia/terracota/oliva).

## Estrutura de arquivos (`web/src`)

- `types.ts` — tipos do domínio: `ProjectType`, `KanbanStatus`, `ScopeTemplate`, `ScopeItemStatus`, `Contrato`, **`Financeiro`/`Parcela`/`DocumentoFiscal`**, `Project`, colunas do kanban e labels.
- `data/scopeTemplates.ts` — templates de escopo por tipo (config pura; novos tipos entram aqui) + `buildInitialScope()`.
- `data/financeiro.ts` — `buildFinanceiro()` (sinal 15%, parcelas), `formatBRL()`, `round2()`, `MAX_UPLOAD_BYTES` (500 KB).
- `data/agenda.ts` — `buildAgenda()` (eventos internos + conflito) e `pendingAgenda()`.
- `data/notificacoes.ts` — `buildLembretes()` (parcelas vencendo em até 3 dias ou atrasadas).
- `data/dashboard.ts` — `buildDashboard()` (KPIs, por estágio/tipo, próximos vencimentos).
- `store/useProjects.ts` — hook com projetos persistidos em `localStorage` (chave `archi.projects.v4`), `add/update/remove/reset`, seeds com datas agendadas e migração `withFinanceiro`.
- `store/useNotifications.ts` — log de notificações enviadas (chave `archi.notifications.v1`), `send/sentKeys/reset`.
- `components/` — `KanbanBoard`, `ProjectForm`, `ProjectDetail`, `AgendaView`, `NotificationsView`, `DashboardView`.
- `App.tsx` — navegação entre as views (Quadro / Agenda / Notificações / Dashboard), busca e filtro por tipo.

## Regras de negócio aplicadas no código

- **Cadastro**: endereço pessoal e endereço da obra separados e obrigatórios; opção **"obra no mesmo endereço do cliente"** (desbloqueia a igualdade de endereços). Contrato (data, prazo, condições, cláusulas) obrigatório. Interiores exigem cômodo/ambiente.
- **Financeiro**: sinal 15% na assinatura; saldo em **3 parcelas** (apresentações + entrega) ou **4 parcelas** (3 + 1 mês após entrega), split igual com arredondamento na última. Pagamento via Pix; **comprovante** (por pagamento) e **nota fiscal** (global, emitida fora do sistema pela prefeitura) via upload base64 ≤ 500 KB (acima disso salva só metadata).
- **Agenda**: itens do escopo com `requerAgendamento` geram eventos internos; conflito (2+ projetos no mesmo dia) é destacado em vermelho; cliente não vê.
- **Revisões**: máximo 2 por apresentação; na 3ª, marca "exige definição do cliente".

## Como rodar

```bash
cd web
npm install      # se necessário
npm run dev      # sobe Vite (porta 5173; altera para 5174 se ocupada)
npm run lint
npm run build
```

Acessar o endereço indicado no terminal (ex.: `http://localhost:5173`).

## Notas técnicas / decisões

- Dados do app ficam em `localStorage["archi.projects.v4"]`; o botão **"Resetar demo"** restaura os seeds. Ao mudar o modelo de dados, **bump a versão da chave** (v5, v6…) para regenerar os seeds.
- Seeds incluem cenários de demonstração: parcela vencendo hoje, parcela atrasada, datas agendadas com 1 conflito (15/09) e lista "por agendar".
- `ProjectDetail` é um painel lateral; `ProjectForm` é um modal. Uploads de arquivo usam `FileReader.readAsDataURL`.
- O `App.css` ainda contém CSS boilerplate do template Vite (sem uso).

## Próximos passos sugeridos (retomar daqui)

1. **Google Calendar real**: integrar API (OAuth) gerando/atualizando/removendo eventos a partir de `scheduledAt` (hoje simulado).
2. **Envio real de email/WhatsApp** (ex.: Resend / Twilio WhatsApp) a partir dos lembretes; hoje é simulado e registrado em `archi.notifications.v1`.
3. **Backend + banco** (hoje tudo é mock local) e upload real de arquivos (hoje base64 no localStorage).
4. Ajustes de UI conforme feedback.