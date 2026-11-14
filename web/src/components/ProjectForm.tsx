import { useState } from 'react';
import type { Project, ProjectType } from '../types';
import { SCOPE_TEMPLATES } from '../data/scopeTemplates';
import { buildFinanceiro } from '../data/financeiro';

interface Props {
  onSubmit: (p: Omit<Project, 'id' | 'createdAt' | 'escopo'>) => void;
  onClose: () => void;
}

const initial = {
  nome: '',
  tipo: 'construcao_nova' as ProjectType,
  clienteNome: '',
  clienteEmail: '',
  clienteTelefone: '',
  enderecoPessoal: '',
  enderecoObra: '',
  mesmoEndereco: false,
  ambiente: '',
  valor: '',
  dataAssinatura: new Date().toISOString().slice(0, 10),
  prazoDias: 90,
  condicoesPagamento: '3 parcelas',
  clausulas: '',
};

export default function ProjectForm({ onSubmit, onClose }: Props) {
  const [f, setF] = useState(initial);
  const [err, setErr] = useState<string | null>(null);

  const set = (k: keyof typeof initial, v: string | number) =>
    setF((p) => ({ ...p, [k]: v }));

  const previewCount = SCOPE_TEMPLATES[f.tipo].items.length;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.nome.trim() || !f.clienteNome.trim() || !f.clienteEmail.trim())
      return setErr('Nome do projeto, cliente e e-mail são obrigatórios.');
    if (!f.enderecoPessoal.trim())
      return setErr('Endereço pessoal do cliente é obrigatório.');
    if (!f.enderecoObra.trim())
      return setErr('Endereço da obra é obrigatório.');
    if (!f.mesmoEndereco && f.enderecoPessoal.trim() === f.enderecoObra.trim())
      return setErr('Os dois endereços estão idênticos — a regra do escritório exige endereços separados ou marcar a opção “obra no mesmo endereço”.');
    if (!f.dataAssinatura || !f.prazoDias || !f.condicoesPagamento.trim() || !f.clausulas.trim())
      return setErr('Dados contratuais obrigatórios: data de assinatura, prazo, condições de pagamento e cláusulas.');
    if (f.tipo === 'interiores' && !f.ambiente.trim())
      return setErr('Para Interiores, informe o cômodo/ambiente (escopo é por cômodo).');
    if (!f.valor || Number(f.valor) <= 0)
      return setErr('Informe o valor total do projeto (R$) para gerar sinal e parcelas.');

    onSubmit({
      nome: f.nome.trim(),
      tipo: f.tipo,
      statusKanban: 'novo',
      clienteNome: f.clienteNome.trim(),
      clienteEmail: f.clienteEmail.trim(),
      clienteTelefone: f.clienteTelefone.trim(),
      enderecoPessoal: f.enderecoPessoal.trim(),
      enderecoObra: f.enderecoObra.trim(),
      ambiente: f.ambiente.trim() || undefined,
      contrato: {
        dataAssinatura: f.dataAssinatura,
        prazoDias: Number(f.prazoDias),
        condicoesPagamento: f.condicoesPagamento.trim(),
        clausulas: f.clausulas.trim(),
      },
      financeiro: buildFinanceiro({
        valorTotal: Number(f.valor),
        condicoesPagamento: f.condicoesPagamento.trim(),
        prazoDias: Number(f.prazoDias),
        dataAssinatura: f.dataAssinatura,
      }),
    });
    onClose();
  }

  const input = 'w-full rounded-lg border border-sand-300 px-3 py-2 text-sm text-sand-900 outline-none focus:border-terra-500';
  const label = 'text-xs font-medium text-sand-600';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-sand-950/50 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-sand-900">Novo projeto</h2>
            <p className="text-sm text-sand-500">
              Tipo <b>{SCOPE_TEMPLATES[f.tipo].label}</b> gera <b>{previewCount} itens</b> de checklist automaticamente.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1 text-sm text-sand-500 hover:bg-sand-100">✕</button>
        </div>

        {err && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className={label}>Nome do projeto *</div>
            <input className={input} value={f.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Ex: Casa Horizonte — Silva" />
          </div>
          <div>
            <div className={label}>Tipo de projeto *</div>
            <select className={input} value={f.tipo} onChange={(e) => set('tipo', e.target.value as ProjectType)}>
              <option value="construcao_nova">Construção nova</option>
              <option value="reforma">Reforma (+ visita prévia + 2 pranchas)</option>
              <option value="interiores">Interiores (por cômodo)</option>
            </select>
          </div>
          {f.tipo === 'interiores' && (
            <div>
              <div className={label}>Cômodo / ambiente *</div>
              <input className={input} value={f.ambiente} onChange={(e) => set('ambiente', e.target.value)} placeholder="Ex: Quarto do Theo" />
            </div>
          )}
          <div>
            <div className={label}>Cliente *</div>
            <input className={input} value={f.clienteNome} onChange={(e) => set('clienteNome', e.target.value)} />
          </div>
          <div>
            <div className={label}>E-mail *</div>
            <input className={input} value={f.clienteEmail} onChange={(e) => set('clienteEmail', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <div className={label}>Telefone / WhatsApp</div>
            <input className={input} value={f.clienteTelefone} onChange={(e) => set('clienteTelefone', e.target.value)} />
          </div>
          <div>
            <div className={label}>Endereço pessoal do cliente *</div>
            <input className={input} value={f.enderecoPessoal} onChange={(e) => set('enderecoPessoal', e.target.value)} placeholder="Rua..., nº — Cidade/UF" />
          </div>
          <div>
            <div className={label}>Endereço da obra * {f.mesmoEndereco ? '(mesmo do cliente)' : '(separado)'}</div>
            <input
              className={input}
              value={f.enderecoObra}
              disabled={f.mesmoEndereco}
              onChange={(e) => set('enderecoObra', e.target.value)}
              placeholder={f.mesmoEndereco ? f.enderecoPessoal || 'Obra no mesmo endereço do cliente' : 'Lote/Rua..., nº — Cidade/UF'}
            />
          </div>
          <div className="md:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-sand-700">
              <input
                type="checkbox"
                className="accent-terra-600"
                checked={f.mesmoEndereco}
                onChange={(e) => {
                  const on = e.target.checked;
                  setF((p) => ({ ...p, mesmoEndereco: on, enderecoObra: on ? p.enderecoPessoal : p.enderecoObra }));
                }}
              />
              Obra no mesmo endereço do cliente
            </label>
          </div>
          <div>
            <div className={label}>Data assinatura *</div>
            <input type="date" className={input} value={f.dataAssinatura} onChange={(e) => set('dataAssinatura', e.target.value)} />
          </div>
          <div>
            <div className={label}>Prazo (dias) *</div>
            <input type="number" min={1} className={input} value={f.prazoDias} onChange={(e) => set('prazoDias', Number(e.target.value))} />
          </div>
          <div>
            <div className={label}>Condições de pagamento *</div>
            <select className={input} value={f.condicoesPagamento} onChange={(e) => set('condicoesPagamento', e.target.value)}>
              <option>3 parcelas</option>
              <option>4 parcelas</option>
            </select>
          </div>
          <div>
            <div className={label}>Valor total do projeto (R$) *</div>
            <input type="number" min={0} step="0.01" className={input} value={f.valor} onChange={(e) => set('valor', e.target.value)} placeholder="Ex: 45000" />
          </div>
          <div>
            <div className={label}>Cláusulas *</div>
            <input className={input} value={f.clausulas} onChange={(e) => set('clausulas', e.target.value)} placeholder="Sinal 15% + saldo..." />
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-sand-50 p-3 text-xs text-sand-600">
          Checklist que será criado ({previewCount}):{' '}
          {SCOPE_TEMPLATES[f.tipo].items.map((i) => i.titulo).join(' • ')}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-sand-600 hover:bg-sand-100">Cancelar</button>
          <button type="submit" className="rounded-lg bg-terra-600 px-4 py-2 text-sm font-medium text-white hover:bg-terra-700">Criar projeto</button>
        </div>
      </form>
    </div>
  );
}