import { useEffect, useRef, useState } from 'react';
import {
  CANAL_LABEL,
  LEMBRETE_EXEMPLO,
  MAX_ASSUNTO,
  MAX_CORPO,
  MAX_NOME_MODELO,
  VARIAVEIS,
  preencher,
  type CanalModelo,
  type ModeloMensagem,
} from '../lib/modelos';
import type { NovoModelo } from '../store/useModelos';

interface Props {
  modelos: ModeloMensagem[];
  onCriar: (m: NovoModelo) => void;
  onEditar: (id: string, m: NovoModelo) => void;
  onExcluir: (id: string) => void;
  onDefinirPadrao: (id: string) => void;
  onClose: () => void;
}

type Filtro = 'todos' | CanalModelo;

const campo = 'w-full rounded-lg border border-sand-300 bg-paper px-3 py-2 text-sm text-sand-950 outline-none focus:border-terra-500';
const btnTxt = 'h-9 shrink-0 rounded-lg border border-sand-300 px-3 text-xs font-medium text-sand-800 hover:bg-sand-100';

export default function ModelosMensagem({ modelos, onCriar, onEditar, onExcluir, onDefinirPadrao, onClose }: Props) {
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [busca, setBusca] = useState('');
  /** null = lista; 'novo' = criando; id = editando */
  const [editando, setEditando] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const termo = busca.trim().toLowerCase();
  const lista = modelos.filter(
    (m) =>
      (filtro === 'todos' || m.canal === filtro) &&
      (termo === '' || `${m.nome} ${m.assunto ?? ''} ${m.corpo}`.toLowerCase().includes(termo)),
  );
  const atual = editando && editando !== 'novo' ? modelos.find((m) => m.id === editando) : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-sand-950/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modelos-titulo"
        onClick={(e) => e.stopPropagation()}
        className="my-6 flex w-full max-w-3xl flex-col gap-4 rounded-2xl bg-cream p-4 shadow-xl sm:p-6"
      >
        <header className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="label-mono">Notificações</div>
            <h2 id="modelos-titulo" className="mt-1 font-display text-xl font-semibold">
              Modelos de mensagem
            </h2>
            <div className="text-xs text-sand-700">Textos usados nos lembretes de pagamento por e-mail e WhatsApp.</div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="h-9 w-9 shrink-0 rounded-lg border border-sand-300 text-sand-800 hover:bg-sand-100">
            ✕
          </button>
        </header>

        {editando ? (
          <EditorModelo
            key={editando}
            inicial={atual}
            onCancel={() => setEditando(null)}
            onSave={(m) => {
              if (atual) onEditar(atual.id, m);
              else onCriar(m);
              setEditando(null);
            }}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex h-10 min-w-0 flex-1 basis-56 items-center rounded-lg border border-sand-300 bg-paper px-3 text-sm">
                <span className="sr-only">Buscar modelo</span>
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome ou texto"
                  className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-sand-500"
                />
              </label>
              <button
                onClick={() => setEditando('novo')}
                className="h-10 rounded-lg bg-terra-600 px-4 text-sm font-semibold text-paper hover:bg-terra-700"
              >
                + Novo modelo
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por canal">
              {(['todos', 'email', 'whatsapp'] as Filtro[]).map((f) => {
                const on = filtro === f;
                return (
                  <button
                    key={f}
                    onClick={() => setFiltro(f)}
                    aria-pressed={on}
                    className={`h-9 rounded-full border px-3.5 text-xs font-medium ${on ? 'border-sand-950 bg-sand-950 text-cream' : 'border-sand-300 text-sand-800 hover:bg-sand-100'}`}
                  >
                    {f === 'todos' ? 'Todos os canais' : CANAL_LABEL[f]}
                  </button>
                );
              })}
              <span className="ml-auto font-mono text-[11px] tracking-[0.1em] text-sand-600">
                {lista.length} {lista.length === 1 ? 'MODELO' : 'MODELOS'}
              </span>
            </div>

            {lista.length === 0 && (
              <div className="rounded-xl border border-dashed border-sand-300 p-4 text-center text-sm text-sand-600">
                Nenhum modelo encontrado.
              </div>
            )}
            <ul className="flex flex-col gap-2">
              {lista.map((m) => (
                <li key={m.id} className="flex flex-col gap-2 rounded-2xl border border-sand-200 bg-paper p-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${m.canal === 'email' ? 'bg-terra-100 text-terra-800' : 'bg-oliva-100 text-oliva-700'}`}
                    >
                      {CANAL_LABEL[m.canal]}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-medium text-sand-900">{m.nome}</span>
                    {m.padrao && (
                      <span className="rounded-md bg-sand-950 px-2 py-0.5 font-mono text-[10px] tracking-[0.1em] text-cream">PADRÃO</span>
                    )}
                  </div>
                  {m.assunto && <div className="text-xs text-sand-700">Assunto: {m.assunto}</div>}
                  <p className="line-clamp-2 text-xs text-sand-700">{m.corpo.replace(/\s+/g, " ")}</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setEditando(m.id)} aria-label={`Editar modelo ${m.nome} (${CANAL_LABEL[m.canal]})`} className={btnTxt}>
                      Editar
                    </button>
                    {!m.padrao && (
                      <button onClick={() => onDefinirPadrao(m.id)} className={btnTxt}>
                        Definir como padrão
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Excluir o modelo "${m.nome}"? (Na versão final, a exclusão vai pedir aprovação do Gerente.)`)) onExcluir(m.id);
                      }}
                      aria-label={`Excluir modelo ${m.nome} (${CANAL_LABEL[m.canal]})`}
                      className={`${btnTxt} text-terra-700 hover:bg-terra-50`}
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function EditorModelo({
  inicial,
  onSave,
  onCancel,
}: {
  inicial?: ModeloMensagem;
  onSave: (m: NovoModelo) => void;
  onCancel: () => void;
}) {
  const [nome, setNome] = useState(inicial?.nome ?? '');
  const [canal, setCanal] = useState<CanalModelo>(inicial?.canal ?? 'email');
  const [assunto, setAssunto] = useState(inicial?.assunto ?? '');
  const [corpo, setCorpo] = useState(inicial?.corpo ?? '');
  const corpoRef = useRef<HTMLTextAreaElement>(null);
  const max = MAX_CORPO[canal];
  const valido = nome.trim() !== '' && corpo.trim() !== '' && corpo.length <= max && (canal === 'whatsapp' || assunto.trim() !== '');

  function inserir(chave: string) {
    const el = corpoRef.current;
    const ini = el?.selectionStart ?? corpo.length;
    const fim = el?.selectionEnd ?? corpo.length;
    const novo = (corpo.slice(0, ini) + chave + corpo.slice(fim)).slice(0, max);
    setCorpo(novo);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(ini + chave.length, ini + chave.length);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valido) return;
        onSave({ nome: nome.trim(), canal, assunto: canal === 'email' ? assunto.trim() : undefined, corpo });
      }}
      className="flex flex-col gap-3"
    >
      <div className="label-mono">{inicial ? 'Editar modelo' : 'Novo modelo'}</div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="flex flex-col gap-1 text-xs text-sand-700">
          Nome do modelo
          <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={MAX_NOME_MODELO} required className={campo} />
        </label>
        <fieldset className="flex flex-col gap-1 text-xs text-sand-700">
          <legend className="mb-1">Canal</legend>
          <div className="flex gap-2">
            {(['email', 'whatsapp'] as CanalModelo[]).map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCanal(c)}
                aria-pressed={canal === c}
                className={`h-10 rounded-lg border px-3.5 text-sm ${canal === c ? 'border-sand-950 bg-sand-950 text-cream' : 'border-sand-300 text-sand-800 hover:bg-sand-100'}`}
              >
                {CANAL_LABEL[c]}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      {canal === 'email' && (
        <label className="flex flex-col gap-1 text-xs text-sand-700">
          Assunto
          <input value={assunto} onChange={(e) => setAssunto(e.target.value)} maxLength={MAX_ASSUNTO} required className={campo} />
        </label>
      )}
      <div className="flex flex-col gap-1.5">
        <div className="text-xs text-sand-700">Campos automáticos (toque para inserir no texto)</div>
        <div className="flex flex-wrap gap-1.5">
          {VARIAVEIS.map((v) => (
            <button
              type="button"
              key={v.chave}
              onClick={() => inserir(v.chave)}
              title={v.descricao}
              className="h-8 rounded-md border border-sand-300 bg-linen px-2 font-mono text-[11px] text-sand-800 hover:bg-sand-100"
            >
              {v.chave}
            </button>
          ))}
        </div>
      </div>
      <label className="flex flex-col gap-1 text-xs text-sand-700">
        Mensagem
        <textarea
          ref={corpoRef}
          value={corpo}
          onChange={(e) => setCorpo(e.target.value)}
          maxLength={max}
          rows={9}
          required
          className={`${campo} resize-y leading-relaxed`}
        />
      </label>
      <div className={`text-right font-mono text-[10px] ${corpo.length > max ? 'text-terra-700' : 'text-sand-600'}`}>
        {corpo.length} / {max}
      </div>
      {corpo.trim() && (
        <details className="rounded-lg border border-sand-200 bg-paper p-3 text-xs text-sand-800">
          <summary className="cursor-pointer text-sand-700">Pré-visualizar com dados de exemplo</summary>
          {canal === 'email' && assunto && <div className="mt-2 font-medium">Assunto: {preencher(assunto, LEMBRETE_EXEMPLO)}</div>}
          <div className="mt-2 whitespace-pre-wrap">{preencher(corpo, LEMBRETE_EXEMPLO)}</div>
        </details>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-10 rounded-lg border border-sand-300 px-4 text-sm text-sand-800 hover:bg-sand-100">
          Cancelar
        </button>
        <button type="submit" disabled={!valido} className="h-10 rounded-lg bg-terra-600 px-4 text-sm font-semibold text-paper hover:bg-terra-700 disabled:opacity-40">
          {inicial ? 'Salvar alterações' : 'Criar modelo'}
        </button>
      </div>
    </form>
  );
}
