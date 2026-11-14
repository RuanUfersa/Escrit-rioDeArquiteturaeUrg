import { useState } from 'react';
import type { Project, ScopeItemStatus, Financeiro, Parcela, DocumentoFiscal } from '../types';
import { PROJECT_TYPE_LABELS } from '../types';
import { SCOPE_TEMPLATES } from '../data/scopeTemplates';
import { formatBRL, MAX_UPLOAD_BYTES } from '../data/financeiro';

interface Props {
  project: Project;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Project>) => void;
}

const NEXT: Record<ScopeItemStatus, ScopeItemStatus> = {
  pendente: 'agendado',
  agendado: 'em_andamento',
  em_andamento: 'em_revisao',
  em_revisao: 'concluido',
  concluido: 'pendente',
};

export default function ProjectDetail({ project, onClose, onUpdate }: Props) {
  const template = SCOPE_TEMPLATES[project.tipo];
  const [docMsg, setDocMsg] = useState<string | null>(null);

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

  function cycleStatus(templateId: string) {
    const escopo = project.escopo.map((s) =>
      s.templateId === templateId ? { ...s, status: NEXT[s.status] } : s,
    );
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

  function schedule(templateId: string, date: string) {
    const escopo = project.escopo.map((s) =>
      s.templateId === templateId ? { ...s, scheduledAt: date, status: 'agendado' as const } : s,
    );
    onUpdate(project.id, { escopo });
  }

  const concluidos = project.escopo.filter((s) => s.status === 'concluido').length;

  const totalPago =
    (project.financeiro.sinal.status === 'pago' ? project.financeiro.sinal.valor : 0) +
    project.financeiro.parcelas
      .filter((p) => p.status === 'pago')
      .reduce((acc, p) => acc + p.valor, 0);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-sand-950/50" onClick={onClose}>
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-medium text-terra-700">{PROJECT_TYPE_LABELS[project.tipo]} • {concluidos}/{project.escopo.length} concluídos</div>
            <h2 className="text-xl font-semibold text-sand-900">{project.nome}</h2>
            <div className="text-sm text-sand-500">{project.clienteNome} • {project.clienteEmail} • {project.clienteTelefone}</div>
          </div>
          <button onClick={onClose} className="rounded-lg px-3 py-1 text-sm text-sand-500 hover:bg-sand-100">✕</button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 rounded-xl bg-sand-50 p-3 text-sm">
          <div><b>Pessoal:</b> {project.enderecoPessoal}</div>
          <div><b>Obra:</b> {project.enderecoObra}</div>
          {project.ambiente && <div><b>Ambiente:</b> {project.ambiente}</div>}
          <div><b>Contrato:</b> {project.contrato.dataAssinatura} • {project.contrato.prazoDias} dias • {project.contrato.condicoesPagamento}</div>
          <div className="text-sand-600">{project.contrato.clausulas}</div>
        </div>

        <h3 className="mb-2 mt-5 text-sm font-semibold text-sand-900">Checklist de escopo — {template.label}</h3>
        <div className="flex flex-col gap-2">
          {project.escopo.map((s) => {
            const meta = template.items.find((t) => t.id === s.templateId);
            return (
              <div key={s.templateId} className="rounded-xl border border-sand-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-sand-400">{s.fase}</div>
                    <div className="text-sm font-medium text-sand-900">{s.titulo}</div>
                    {meta?.descricao && <div className="text-xs text-sand-500">{meta.descricao}</div>}
                  </div>
                  <button onClick={() => cycleStatus(s.templateId)} className="shrink-0 rounded-lg border border-sand-300 px-2 py-1 text-xs hover:bg-sand-50">
                    {s.status}
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  {meta?.requerAgendamento && (
                    <label className="flex items-center gap-1 text-sand-600">
                      🗓 <input type="date" value={s.scheduledAt ?? ''} onChange={(e) => schedule(s.templateId, e.target.value)} className="rounded-md border border-sand-300 px-1 py-0.5" />
                      <span className="text-[11px] text-sand-400">(interno — não vai ao cliente)</span>
                    </label>
                  )}
                  {meta?.permiteRevisao && (
                    <span className="flex items-center gap-1">
                      Revisões: <b>{s.revisoesUsadas}/2</b>
                      <button onClick={() => addRevisao(s.templateId)} className="rounded-md bg-terra-600 px-2 py-0.5 text-white">+ revisão</button>
                    </span>
                  )}
                  {s.exigeDefinicaoCliente && (
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 font-medium text-amber-800">3ª alteração exige definição do cliente</span>
                  )}
                  {s.status === 'concluido' && <span className="text-oliva-600">✓ concluído</span>}
                </div>
              </div>
            );
          })}
        </div>

        <h3 className="mb-2 mt-5 text-sm font-semibold text-sand-900">Financeiro</h3>
        <div className="rounded-xl border border-sand-200 bg-white p-3">
          <div className="mb-2 grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-xs text-sand-500">Total</div>
              <div className="font-semibold">{formatBRL(project.financeiro.valorTotal)}</div>
            </div>
            <div>
              <div className="text-xs text-sand-500">Pago</div>
              <div className="font-semibold text-oliva-600">{formatBRL(totalPago)}</div>
            </div>
            <div>
              <div className="text-xs text-sand-500">Pendente</div>
              <div className="font-semibold text-red-700">{formatBRL(project.financeiro.valorTotal - totalPago)}</div>
            </div>
          </div>

          <div className="rounded-lg border border-sand-200 p-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-sand-400">Sinal 15% — assinatura</div>
                <div className="text-sm font-medium text-sand-900">
                  {formatBRL(project.financeiro.sinal.valor)}{' '}
                  <span className="text-xs font-normal text-sand-500">venc. {project.contrato.dataAssinatura}</span>
                </div>
                {project.financeiro.sinal.pagoEm && (
                  <div className="text-[11px] text-oliva-600">pago em {project.financeiro.sinal.pagoEm}</div>
                )}
              </div>
              <button
                onClick={() => togglePago('sinal')}
                className={`rounded-lg border px-2 py-1 text-xs ${project.financeiro.sinal.status === 'pago' ? 'border-oliva-300 bg-oliva-50 text-oliva-700' : 'border-sand-300 hover:bg-sand-50'}`}
              >
                {project.financeiro.sinal.status === 'pago' ? '✓ pago' : 'marcar pago'}
              </button>
            </div>
            <DocUpload
              label="Comprovante"
              doc={project.financeiro.sinal.comprovante}
              onUpload={(f) => uploadDoc('sinal', null, f)}
              onRemove={() => removeDoc('sinal', null)}
            />
          </div>

          {project.financeiro.parcelas.map((p, i) => (
            <div key={p.id} className="mt-2 rounded-lg border border-sand-200 p-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-sand-400">Parcela {i + 1}</div>
                  <div className="text-sm font-medium text-sand-900">{p.descricao}</div>
                  <div className="text-xs text-sand-500">
                    {formatBRL(p.valor)} • venc.{' '}
                    <input
                      type="date"
                      className="rounded-md border border-sand-300 px-1 py-0.5 text-xs"
                      value={p.vencimento}
                      onChange={(e) => updateParcela(p.id, { vencimento: e.target.value })}
                    />
                  </div>
                  {p.pagoEm && <div className="text-[11px] text-oliva-600">pago em {p.pagoEm}</div>}
                </div>
                <button
                  onClick={() => togglePago('parcela', p.id)}
                  className={`rounded-lg border px-2 py-1 text-xs ${p.status === 'pago' ? 'border-oliva-300 bg-oliva-50 text-oliva-700' : 'border-sand-300 hover:bg-sand-50'}`}
                >
                  {p.status === 'pago' ? '✓ pago' : 'marcar pago'}
                </button>
              </div>
              <DocUpload
                label="Comprovante"
                doc={p.comprovante}
                onUpload={(f) => uploadDoc('parcela', p.id, f)}
                onRemove={() => removeDoc('parcela', p.id)}
              />
            </div>
          ))}

          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-sand-50 p-2">
            <div className="text-sm">
              <span className="font-medium text-sand-900">Nota fiscal</span>
              <span className="ml-1 text-xs text-sand-500">(emitida fora do sistema — prefeitura)</span>
            </div>
            <DocUpload
              label="Upload NF"
              doc={project.financeiro.notaFiscal}
              onUpload={(f) => uploadDoc('nota', null, f)}
              onRemove={() => removeDoc('nota', null)}
            />
          </div>

          {docMsg && <div className="mt-2 rounded-lg bg-amber-50 px-3 py-1 text-xs text-amber-800">{docMsg}</div>}
        </div>
      </div>
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
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-sand-300 px-2 py-1 text-xs hover:bg-sand-50">
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
          {!doc.arquivo && <span className="text-sand-400">(só metadata)</span>}
          {doc.arquivo && (
            <a className="text-terra-600 underline" href={doc.arquivo} target="_blank" rel="noreferrer" download={doc.nome}>
              abrir
            </a>
          )}
          <button type="button" onClick={onRemove} className="text-red-500 hover:underline">✕</button>
        </span>
      )}
    </div>
  );
}