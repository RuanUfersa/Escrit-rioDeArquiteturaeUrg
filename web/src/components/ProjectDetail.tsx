import { useState } from 'react';
import type { Project, ProjectScopeItem, ScopeItemStatus, Financeiro, Parcela, DocumentoFiscal } from '../types';
import { MAX_COMENTARIO, PROJECT_TYPE_LABELS } from '../types';
import { SCOPE_TEMPLATES } from '../data/scopeTemplates';
import { formatBRL, MAX_UPLOAD_BYTES } from '../data/financeiro';
import { diasAte, etapasAtivas, fmtDate, HORARIOS, prazoTexto } from '../lib/format';

interface Props {
  project: Project;
  code: string;
  estagio: string;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Project>) => void;
}

type Tab = 'checklist' | 'financeiro' | 'contrato';

const STATUS_LABEL: Record<ScopeItemStatus, string> = {
  pendente: 'Pendente',
  agendado: 'Agendado',
  em_andamento: 'Em andamento',
  em_revisao: 'Em revisão',
  concluido: 'Concluído',
  desconsiderado: 'Desconsiderar etapa',
};

// Bolinha de status, como na proposta visual.
function Dot({ status }: { status: ScopeItemStatus }) {
  if (status === 'concluido') return <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-oliva-600" aria-hidden="true" />;
  if (status === 'desconsiderado') return <span className="h-2.5 w-2.5 shrink-0 rounded-full border-[1.5px] border-dashed border-sand-400" aria-hidden="true" />;
  if (status === 'pendente') return <span className="h-2.5 w-2.5 shrink-0 rounded-full border-[1.5px] border-sand-400" aria-hidden="true" />;
  return <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-terra-500" aria-hidden="true" />;
}

const STATUS_STYLE: Record<ScopeItemStatus, string> = {
  pendente: 'bg-sand-100 text-sand-800',
  agendado: 'bg-terra-50 text-terra-800',
  em_andamento: 'bg-terra-100 text-terra-800',
  em_revisao: 'bg-terra-100 text-terra-800',
  concluido: 'bg-oliva-100 text-oliva-800',
  desconsiderado: 'bg-sand-50 text-sand-600 line-through',
};

export default function ProjectDetail({ project, code, estagio, onClose, onUpdate }: Props) {
  const template = SCOPE_TEMPLATES[project.tipo];
  const [docMsg, setDocMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('checklist');

  function updateFinanceiro(patch: Partial<Financeiro>) {
    onUpdate(project.id, { financeiro: { ...project.financeiro, ...patch } });
  }

  function updateParcela(id: string, patch: Partial<Parcela>) {
    updateFinanceiro({
      parcelas: project.financeiro.parcelas.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    });
  }

  function togglePago(kind: 'sinal' | 'parcela', id?: string) {
    const hoje = new Date().toISOString().slice(0, 10);
    if (kind === 'sinal') {
      const s = project.financeiro.sinal;
      const status = s.status === 'pago' ? 'pendente' : 'pago';
      updateFinanceiro({
        sinal: { ...s, status, pagoEm: status === 'pago' ? hoje : undefined },
      });
    } else if (id) {
      const x = project.financeiro.parcelas.find((p) => p.id === id);
      if (!x) return;
      const status = x.status === 'pago' ? 'pendente' : 'pago';
      updateParcela(id, { status, pagoEm: status === 'pago' ? hoje : undefined });
    }
  }

  function readAsDataURL(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = () => rej(r.error);
      r.readAsDataURL(file);
    });
  }

  async function uploadDoc(kind: 'sinal' | 'parcela' | 'nota', parId: string | null, file: File) {
    const doc: DocumentoFiscal = {
      nome: file.name,
      tipo: kind === 'nota' ? 'nota' : 'comprovante',
      arquivo: '',
      tamanho: file.size,
      data: new Date().toISOString().slice(0, 10),
    };
    if (file.size > MAX_UPLOAD_BYTES) {
      setDocMsg(`“${file.name}” excede ${Math.round(MAX_UPLOAD_BYTES / 1024)} KB do mock local — apenas o nome foi salvo.`);
    } else {
      doc.arquivo = await readAsDataURL(file);
    }
    if (kind === 'nota') updateFinanceiro({ notaFiscal: doc });
    else if (kind === 'sinal') updateFinanceiro({ sinal: { ...project.financeiro.sinal, comprovante: doc } });
    else if (parId) updateParcela(parId, { comprovante: doc });
  }

  function removeDoc(kind: 'sinal' | 'parcela' | 'nota', parId: string | null) {
    if (kind === 'nota') updateFinanceiro({ notaFiscal: undefined });
    else if (kind === 'sinal') updateFinanceiro({ sinal: { ...project.financeiro.sinal, comprovante: undefined } });
    else if (parId) updateParcela(parId, { comprovante: undefined });
  }

  function patchItem(templateId: string, patch: Partial<ProjectScopeItem>) {
    const escopo = project.escopo.map((s) => (s.templateId === templateId ? { ...s, ...patch } : s));
    onUpdate(project.id, { escopo });
  }

  function addComentario(item: ProjectScopeItem, texto: string) {
    const limpo = texto.trim().slice(0, MAX_COMENTARIO);
    if (!limpo) return;
    const novo = { id: Math.random().toString(36).slice(2, 10), texto: limpo, data: new Date().toISOString() };
    patchItem(item.templateId, { comentarios: [...(item.comentarios ?? []), novo] });
  }

  function setStatus(templateId: string, status: ScopeItemStatus) {
    const item = project.escopo.find((s) => s.templateId === templateId);
    // "Agendado" exige data e hora definidas.
    if (status === 'agendado' && !(item?.scheduledAt && item?.horaAgendada)) return;
    const escopo = project.escopo.map((s) => (s.templateId === templateId ? { ...s, status } : s));
    onUpdate(project.id, { escopo });
  }

  function addRevisao(templateId: string) {
    const escopo = project.escopo.map((s) => {
      if (s.templateId !== templateId) return s;
      const meta = template.items.find((t) => t.id === templateId);
      if (!meta?.permiteRevisao) return s;
      if (s.revisoesUsadas >= 2) return { ...s, exigeDefinicaoCliente: true };
      const usadas = s.revisoesUsadas + 1;
      return { ...s, revisoesUsadas: usadas, status: 'em_revisao' as const, exigeDefinicaoCliente: usadas >= 2 };
    });
    onUpdate(project.id, { escopo });
  }

  /** Agenda data e hora. "Agendado" só vale com as duas definidas. */
  function schedule(item: ProjectScopeItem, patch: { scheduledAt?: string; horaAgendada?: string }) {
    const next = { ...item, ...patch };
    const completo = !!next.scheduledAt && !!next.horaAgendada;
    let status = next.status;
    if (completo && status === 'pendente') status = 'agendado';
    if (!completo && status === 'agendado') status = 'pendente';
    patchItem(item.templateId, { ...patch, status });
  }

  function addEtapa(titulo: string, fase: string) {
    const nova: ProjectScopeItem = {
      templateId: `custom_${Math.random().toString(36).slice(2, 10)}`,
      titulo: titulo.trim(),
      fase: fase.trim() || 'Etapa',
      status: 'pendente',
      revisoesUsadas: 0,
      exigeDefinicaoCliente: false,
    };
    onUpdate(project.id, { escopo: [...project.escopo, nova] });
  }

  function moveEtapa(templateId: string, dir: -1 | 1) {
    const i = project.escopo.findIndex((s) => s.templateId === templateId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= project.escopo.length) return;
    const escopo = [...project.escopo];
    [escopo[i], escopo[j]] = [escopo[j], escopo[i]];
    onUpdate(project.id, { escopo });
  }

  function removeEtapa(item: ProjectScopeItem) {
    // Na versão com login, a remoção vai pedir aprovação do Gerente.
    if (!confirm(`Remover a etapa "${item.titulo}"?`)) return;
    onUpdate(project.id, { escopo: project.escopo.filter((s) => s.templateId !== item.templateId) });
  }

  const ativas = etapasAtivas(project);
  const concluidos = ativas.filter((s) => s.status === 'concluido').length;
  const fin = project.financeiro;
  const totalPago =
    (fin.sinal.status === 'pago' ? fin.sinal.valor : 0) +
    fin.parcelas.filter((p) => p.status === 'pago').reduce((acc, p) => acc + p.valor, 0);
  const atrasado =
    (fin.sinal.status !== 'pago' && diasAte(project.contrato.dataAssinatura) < 0 ? fin.sinal.valor : 0) +
    fin.parcelas
      .filter((p) => p.status !== 'pago' && diasAte(p.vencimento) < 0)
      .reduce((acc, p) => acc + p.valor, 0);
  const aVencer = fin.valorTotal - totalPago - atrasado;
  const pctPago = fin.valorTotal ? (totalPago / fin.valorTotal) * 100 : 0;
  const pctAtrasado = fin.valorTotal ? (atrasado / fin.valorTotal) * 100 : 0;

  const prazoFinal = (() => {
    const d = new Date(project.contrato.dataAssinatura + 'T00:00:00');
    d.setDate(d.getDate() + project.contrato.prazoDias);
    return d.toISOString().slice(0, 10);
  })();

  const TABS: { id: Tab; label: string }[] = [
    { id: 'checklist', label: 'Checklist' },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'contrato', label: 'Contrato' },
  ];

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-sand-950/50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={project.nome}
        className="flex h-full w-full max-w-5xl flex-col overflow-y-auto bg-cream shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-5 px-5 py-5 sm:px-8 sm:py-7">
          <button onClick={onClose} className="self-start font-mono text-[11px] tracking-[0.14em] text-terra-700 hover:text-terra-900">
            ← VOLTAR
          </button>

          <header className="flex flex-wrap items-end gap-5 border-b border-sand-200 pb-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] text-sand-600">
                <span>{code}</span>
                <span>·</span>
                <span className="text-terra-600">{PROJECT_TYPE_LABELS[project.tipo].toUpperCase()}</span>
              </div>
              <h2 className="mt-1.5 mb-1 font-display text-[26px] font-semibold tracking-tight sm:text-[32px]">{project.nome}</h2>
              <div className="text-[13px] text-sand-700">
                {project.clienteNome} · {project.clienteEmail}
                {project.clienteTelefone ? ` · ${project.clienteTelefone}` : ''}
              </div>
            </div>
            <dl className="flex gap-7 sm:ml-auto">
              <div>
                <dt className="label-mono">Estágio</dt>
                <dd className="font-display text-lg font-semibold">{estagio}</dd>
              </div>
              <div>
                <dt className="label-mono">Escopo</dt>
                <dd className="font-display text-lg font-semibold">{concluidos} / {ativas.length}</dd>
              </div>
              <div>
                <dt className="label-mono">Prazo</dt>
                <dd className="font-display text-lg font-semibold">{fmtDate(prazoFinal)}</dd>
              </div>
            </dl>
          </header>

          <div role="tablist" aria-label="Seções do projeto" className="flex flex-wrap gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`h-10 rounded-[10px] border px-4 text-[13px] font-medium sm:h-9 ${tab === t.id ? 'border-sand-950 bg-sand-950 text-cream' : 'border-sand-200 text-sand-800 hover:bg-sand-100'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'checklist' && (
            <section aria-label="Checklist de escopo" className="overflow-hidden rounded-2xl border border-sand-200 bg-paper">
              <div className="flex flex-wrap items-center gap-2 border-b border-sand-100 px-[18px] py-3">
                <span className="label-mono">Checklist — {template.label}</span>
                {project.escopo.length !== ativas.length && (
                  <span className="ml-auto font-mono text-[10px] tracking-[0.1em] text-sand-600">
                    {project.escopo.length - ativas.length} DESCONSIDERADA(S), FORA DA CONTAGEM
                  </span>
                )}
              </div>
              {project.escopo.map((s, i) => {
                const meta = template.items.find((t) => t.id === s.templateId);
                const ignorada = s.status === 'desconsiderado';
                const podeAgendar = !!s.scheduledAt && !!s.horaAgendada;
                return (
                  <div key={s.templateId} className={`flex flex-col gap-2 border-b border-sand-100 px-[18px] py-3.5 last:border-0 ${ignorada ? 'bg-sand-50/60' : ''}`}>
                    <div className="flex items-center gap-3.5">
                      <Dot status={s.status} />
                      <div className={`min-w-0 flex-1 ${ignorada ? 'opacity-60' : ''}`}>
                        <div className="label-mono">{s.fase}</div>
                        <div className={`text-sm font-medium ${ignorada ? 'line-through' : ''}`}>{s.titulo}</div>
                        {(s.descricao || meta?.descricao) && (
                          <div className="line-clamp-2 text-xs text-sand-700">{s.descricao || meta?.descricao}</div>
                        )}
                      </div>
                      <label className="shrink-0">
                        <span className="sr-only">Status de {s.titulo}</span>
                        <select
                          value={s.status}
                          onChange={(e) => setStatus(s.templateId, e.target.value as ScopeItemStatus)}
                          className={`h-9 max-w-[150px] rounded-md border-0 px-2 font-mono text-[10px] tracking-[0.1em] uppercase ${STATUS_STYLE[s.status]}`}
                        >
                          {(Object.keys(STATUS_LABEL) as ScopeItemStatus[]).map((k) => (
                            <option key={k} value={k} disabled={k === 'agendado' && !podeAgendar && s.status !== 'agendado'}>
                              {STATUS_LABEL[k]}
                              {k === 'agendado' && !podeAgendar ? ' (defina data e hora)' : ''}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="ml-6 flex flex-wrap items-center gap-2 text-xs text-sand-700">
                      <span className="label-mono">Agendamento</span>
                      <label className="flex items-center gap-1.5">
                        <span className="sr-only">Data de {s.titulo}</span>
                        <input
                          type="date"
                          value={s.scheduledAt ?? ''}
                          onChange={(e) => schedule(s, { scheduledAt: e.target.value || undefined })}
                          className="h-9 rounded-md border border-sand-300 bg-paper px-1.5"
                        />
                      </label>
                      <label className="flex items-center gap-1.5">
                        <span className="sr-only">Hora de {s.titulo}</span>
                        <select
                          value={s.horaAgendada ?? ''}
                          onChange={(e) => schedule(s, { horaAgendada: e.target.value || undefined })}
                          className="h-9 rounded-md border border-sand-300 bg-paper px-1.5"
                        >
                          <option value="">Hora</option>
                          {HORARIOS.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </label>
                      {(s.scheduledAt || s.horaAgendada) && (
                        <button
                          onClick={() => schedule(s, { scheduledAt: undefined, horaAgendada: undefined })}
                          className="h-9 px-1 text-terra-700 underline-offset-2 hover:underline"
                        >
                          limpar
                        </button>
                      )}
                      {s.scheduledAt && !s.horaAgendada && <span className="text-terra-700">falta a hora</span>}
                      {!s.scheduledAt && s.horaAgendada && <span className="text-terra-700">falta a data</span>}
                    </div>

                    {(meta?.permiteRevisao || s.exigeDefinicaoCliente) && (
                      <div className="ml-6 flex flex-wrap items-center gap-2 text-xs text-sand-700">
                        {meta?.permiteRevisao && (
                          <span className="flex items-center gap-1.5">
                            Revisões <b className="font-mono">{s.revisoesUsadas} de 2</b>
                            <button onClick={() => addRevisao(s.templateId)} className="h-8 rounded-md border border-terra-600 px-2 font-medium text-terra-700 hover:bg-terra-50">
                              + revisão
                            </button>
                          </span>
                        )}
                        {s.exigeDefinicaoCliente && (
                          <span className="rounded-md bg-terra-100 px-2 py-1 font-medium text-terra-900">3ª alteração exige definição do cliente</span>
                        )}
                      </div>
                    )}

                    <div className="ml-6 flex flex-wrap items-center gap-1.5">
                      <EtapaNotas
                        item={s}
                        descricaoPadrao={meta?.descricao}
                        onDescricao={(v) => patchItem(s.templateId, { descricao: v })}
                        onComentar={(t) => addComentario(s, t)}
                      />
                      <div className="ml-auto flex items-center gap-1.5">
                        <button
                          onClick={() => moveEtapa(s.templateId, -1)}
                          disabled={i === 0}
                          aria-label={`Subir etapa ${s.titulo}`}
                          className="h-9 w-9 rounded-lg border border-sand-300 text-sand-800 hover:bg-sand-100 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveEtapa(s.templateId, 1)}
                          disabled={i === project.escopo.length - 1}
                          aria-label={`Descer etapa ${s.titulo}`}
                          className="h-9 w-9 rounded-lg border border-sand-300 text-sand-800 hover:bg-sand-100 disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeEtapa(s)}
                          aria-label={`Remover etapa ${s.titulo}`}
                          className="h-9 rounded-lg px-2 text-xs text-terra-700 hover:bg-terra-50"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <NovaEtapa fases={[...new Set(project.escopo.map((s) => s.fase))]} onAdd={addEtapa} />
            </section>
          )}

          {tab === 'financeiro' && (
            <section aria-label="Financeiro" className="flex flex-col gap-4">
              <div className="rounded-2xl border border-sand-200 bg-paper p-[18px]">
                <div className="label-mono">Valor do contrato</div>
                <div className="mt-2 font-display text-[26px] font-semibold">{formatBRL(fin.valorTotal)}</div>
                <div className="mt-2.5 flex h-1.5 overflow-hidden rounded-full bg-sand-100">
                  <div className="bg-oliva-600" style={{ width: `${pctPago}%` }} />
                  <div className="bg-terra-500" style={{ width: `${pctAtrasado}%` }} />
                </div>
                <div className="mt-2.5 grid gap-1.5 text-xs sm:grid-cols-3">
                  <div className="flex justify-between gap-2 sm:flex-col"><span className="text-oliva-600">● Pago</span><span>{formatBRL(totalPago)}</span></div>
                  <div className="flex justify-between gap-2 sm:flex-col"><span className="text-terra-600">● Atrasado</span><span>{formatBRL(atrasado)}</span></div>
                  <div className="flex justify-between gap-2 sm:flex-col"><span className="text-sand-700">● A vencer</span><span>{formatBRL(aVencer)}</span></div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-sand-200 bg-paper">
                <PagamentoLinha
                  titulo="Sinal 15% — assinatura"
                  valor={fin.sinal.valor}
                  vencimento={project.contrato.dataAssinatura}
                  pago={fin.sinal.status === 'pago'}
                  pagoEm={fin.sinal.pagoEm}
                  onToggle={() => togglePago('sinal')}
                >
                  <DocUpload label="Comprovante" doc={fin.sinal.comprovante} onUpload={(f) => uploadDoc('sinal', null, f)} onRemove={() => removeDoc('sinal', null)} />
                </PagamentoLinha>
                {fin.parcelas.map((p) => (
                  <PagamentoLinha
                    key={p.id}
                    titulo={p.descricao}
                    valor={p.valor}
                    vencimento={p.vencimento}
                    pago={p.status === 'pago'}
                    pagoEm={p.pagoEm}
                    onToggle={() => togglePago('parcela', p.id)}
                    onVencimento={(v) => updateParcela(p.id, { vencimento: v })}
                  >
                    <DocUpload label="Comprovante" doc={p.comprovante} onUpload={(f) => uploadDoc('parcela', p.id, f)} onRemove={() => removeDoc('parcela', p.id)} />
                  </PagamentoLinha>
                ))}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-sand-50 px-[18px] py-3.5">
                  <div className="text-sm">
                    <span className="font-medium">Nota fiscal</span>
                    <span className="ml-1 text-xs text-sand-600">(emitida fora do sistema)</span>
                  </div>
                  <DocUpload label="Enviar NF" doc={fin.notaFiscal} onUpload={(f) => uploadDoc('nota', null, f)} onRemove={() => removeDoc('nota', null)} />
                </div>
              </div>
              {docMsg && <div className="rounded-lg bg-terra-50 px-3 py-2 text-xs text-terra-900">{docMsg}</div>}
            </section>
          )}

          {tab === 'contrato' && (
            <section aria-label="Contrato" className="grid gap-4 rounded-2xl border border-sand-200 bg-paper p-[18px] text-sm sm:grid-cols-2">
              <div><div className="label-mono">Assinatura</div><div className="mt-1">{fmtDate(project.contrato.dataAssinatura)}</div></div>
              <div><div className="label-mono">Prazo</div><div className="mt-1">{project.contrato.prazoDias} dias · até {fmtDate(prazoFinal)}</div></div>
              <div><div className="label-mono">Pagamento</div><div className="mt-1">Sinal 15% + {project.contrato.condicoesPagamento}</div></div>
              {project.ambiente && <div><div className="label-mono">Ambiente</div><div className="mt-1">{project.ambiente}</div></div>}
              <div className="sm:col-span-2"><div className="label-mono">Endereço do cliente</div><div className="mt-1">{project.enderecoPessoal}</div></div>
              <div className="sm:col-span-2"><div className="label-mono">Endereço da obra</div><div className="mt-1">{project.enderecoObra}</div></div>
              <div className="sm:col-span-2"><div className="label-mono">Cláusulas</div><div className="mt-1 text-sand-800">{project.contrato.clausulas}</div></div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function EtapaNotas({
  item,
  descricaoPadrao,
  onDescricao,
  onComentar,
}: {
  item: ProjectScopeItem;
  descricaoPadrao?: string;
  onDescricao: (v: string) => void;
  onComentar: (texto: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [novo, setNovo] = useState('');
  const comentarios = item.comentarios ?? [];
  const id = `etapa-${item.templateId}`;
  const restante = MAX_COMENTARIO - novo.length;

  return (
    <div className={aberto ? 'w-full' : ''}>
      <button
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls={id}
        className="min-h-9 text-xs font-medium text-terra-700 hover:text-terra-900"
      >
        {aberto ? '▾' : '▸'} Descrição e comentários
        {comentarios.length > 0 && <span className="ml-1 font-mono text-sand-700">({comentarios.length})</span>}
      </button>
      {aberto && (
        <div id={id} className="mt-1 flex flex-col gap-3 rounded-xl border border-sand-200 bg-cream p-3">
          <label className="flex flex-col gap-1">
            <span className="label-mono">Descrição</span>
            <textarea
              value={item.descricao ?? ''}
              onChange={(e) => onDescricao(e.target.value)}
              placeholder={descricaoPadrao ?? 'Descreva o que deve ser feito nesta etapa'}
              rows={2}
              className="resize-y rounded-lg border border-sand-300 bg-paper px-3 py-2 text-sm text-sand-950 outline-none focus:border-terra-500"
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="label-mono">Comentários</span>
            {comentarios.length === 0 && <div className="text-xs text-sand-600">Nenhum comentário ainda.</div>}
            {comentarios.map((c) => (
              <div key={c.id} className="rounded-lg border border-sand-200 bg-paper px-3 py-2">
                <p className="whitespace-pre-wrap break-words text-sm">{c.texto}</p>
                <div className="mt-1 font-mono text-[10px] tracking-[0.1em] text-sand-600">
                  {fmtDate(c.data)} · {new Date(c.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onComentar(novo);
                setNovo('');
              }}
              className="flex flex-col gap-1.5"
            >
              <label className="sr-only" htmlFor={`${id}-novo`}>Novo comentário</label>
              <textarea
                id={`${id}-novo`}
                value={novo}
                maxLength={MAX_COMENTARIO}
                onChange={(e) => setNovo(e.target.value.slice(0, MAX_COMENTARIO))}
                placeholder="Escreva um comentário para a equipe"
                rows={2}
                className="resize-y rounded-lg border border-sand-300 bg-paper px-3 py-2 text-sm text-sand-950 outline-none focus:border-terra-500"
              />
              <div className="flex items-center gap-2">
                <span className={`font-mono text-[10px] tracking-[0.1em] ${restante <= 50 ? 'text-terra-700' : 'text-sand-600'}`} aria-live="polite">
                  {novo.length} / {MAX_COMENTARIO}
                </span>
                <button
                  type="submit"
                  disabled={!novo.trim()}
                  className="ml-auto h-9 rounded-lg bg-terra-600 px-3 text-xs font-semibold text-paper hover:bg-terra-700 disabled:opacity-40"
                >
                  Comentar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NovaEtapa({ fases, onAdd }: { fases: string[]; onAdd: (titulo: string, fase: string) => void }) {
  const [titulo, setTitulo] = useState('');
  const [fase, setFase] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!titulo.trim()) return;
        onAdd(titulo, fase);
        setTitulo('');
      }}
      className="flex flex-wrap items-end gap-2 border-t border-sand-200 bg-cream px-[18px] py-3.5"
    >
      <label className="flex min-w-[180px] flex-[2] flex-col gap-1">
        <span className="label-mono">Nova etapa</span>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={80}
          placeholder="Ex.: Visita à obra"
          className="h-10 rounded-lg border border-sand-300 bg-paper px-3 text-sm outline-none focus:border-terra-500"
        />
      </label>
      <label className="flex min-w-[140px] flex-1 flex-col gap-1">
        <span className="label-mono">Fase</span>
        <input
          value={fase}
          onChange={(e) => setFase(e.target.value)}
          list="fases-etapa"
          maxLength={40}
          placeholder="Ex.: Projeto"
          className="h-10 rounded-lg border border-sand-300 bg-paper px-3 text-sm outline-none focus:border-terra-500"
        />
        <datalist id="fases-etapa">
          {fases.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>
      </label>
      <button
        type="submit"
        disabled={!titulo.trim()}
        className="h-10 rounded-lg bg-terra-600 px-4 text-sm font-semibold text-paper hover:bg-terra-700 disabled:opacity-40"
      >
        + Criar etapa
      </button>
    </form>
  );
}

function PagamentoLinha({
  titulo,
  valor,
  vencimento,
  pago,
  pagoEm,
  onToggle,
  onVencimento,
  children,
}: {
  titulo: string;
  valor: number;
  vencimento: string;
  pago: boolean;
  pagoEm?: string;
  onToggle: () => void;
  onVencimento?: (v: string) => void;
  children: React.ReactNode;
}) {
  const dias = diasAte(vencimento);
  const atraso = !pago && dias < 0;
  return (
    <div className="flex flex-col gap-2 border-b border-sand-100 px-[18px] py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium">{titulo}</div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-sand-700">
            <span className="font-mono">{formatBRL(valor)}</span>
            <span>·</span>
            {onVencimento ? (
              <label className="flex items-center gap-1">
                venc.
                <input type="date" value={vencimento} onChange={(e) => onVencimento(e.target.value)} className="h-7 rounded-md border border-sand-300 bg-paper px-1" />
              </label>
            ) : (
              <span>venc. {fmtDate(vencimento)}</span>
            )}
            {pago ? (
              <span className="text-oliva-600">pago em {fmtDate(pagoEm)}</span>
            ) : (
              <span className={atraso ? 'font-medium text-terra-700' : ''}>{prazoTexto(dias)}</span>
            )}
          </div>
        </div>
        <button
          onClick={onToggle}
          className={`h-9 rounded-lg border px-3 text-xs font-medium ${pago ? 'border-oliva-300 bg-oliva-50 text-oliva-700' : 'border-sand-300 hover:bg-sand-100'}`}
        >
          {pago ? '✓ Pago' : 'Marcar como pago'}
        </button>
      </div>
      {children}
    </div>
  );
}

function DocUpload({
  label,
  doc,
  onUpload,
  onRemove,
}: {
  label: string;
  doc?: DocumentoFiscal;
  onUpload: (f: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-sand-300 px-2.5 text-xs hover:bg-sand-100">
        {label}
        <input
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = '';
          }}
        />
      </label>
      {doc && (
        <span className="inline-flex items-center gap-1 rounded-md bg-sand-100 px-2 py-1 text-xs">
          {doc.nome}
          {!doc.arquivo && <span className="text-sand-500">(só o nome)</span>}
          {doc.arquivo && (
            <a className="text-terra-700 underline" href={doc.arquivo} target="_blank" rel="noreferrer" download={doc.nome}>
              abrir
            </a>
          )}
          <button type="button" onClick={onRemove} aria-label="Remover arquivo" className="text-terra-700 hover:underline">✕</button>
        </span>
      )}
    </div>
  );
}