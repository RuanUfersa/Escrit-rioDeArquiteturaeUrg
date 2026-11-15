import { useEffect, useState } from 'react';
import type { Lembrete } from '../data/notificacoes';
import { formatBRL } from '../data/financeiro';
import { fmtDate } from '../lib/format';
import { MAX_CORPO, preencher, type CanalModelo, type ModeloMensagem } from '../lib/modelos';

interface Props {
  lembrete: Lembrete;
  modelos: ModeloMensagem[];
  onClose: () => void;
  onSend: (l: Lembrete, canal: 'email' | 'whatsapp', conteudo: { assunto?: string; mensagem: string }) => void;
}

const MAX_EMAIL = MAX_CORPO.email;
const MAX_WHATS = MAX_CORPO.whatsapp;

function quando(l: Lembrete) {
  const data = fmtDate(l.vencimento);
  if (l.diasAte > 0) return `vence em ${data} (daqui a ${l.diasAte} ${l.diasAte === 1 ? 'dia' : 'dias'})`;
  if (l.diasAte === 0) return `vence hoje, ${data}`;
  return `venceu em ${data}`;
}

/**
 * Número no formato do link wa.me: só dígitos, com DDI.
 * Suposição: telefones com 10 ou 11 dígitos são brasileiros (DDD + número) e recebem o 55.
 */
function numeroWhats(tel: string) {
  const d = tel.replace(/\D/g, '');
  if (d.length === 10 || d.length === 11) return `55${d}`;
  return d;
}

function padraoDe(modelos: ModeloMensagem[], canal: CanalModelo) {
  return modelos.find((m) => m.canal === canal && m.padrao) ?? modelos.find((m) => m.canal === canal);
}

export default function EnviarLembrete({ lembrete: l, modelos, onClose, onSend }: Props) {
  const modelosEmail = modelos.filter((m) => m.canal === 'email');
  const modelosWhats = modelos.filter((m) => m.canal === 'whatsapp');
  const [modeloEmailId, setModeloEmailId] = useState(() => padraoDe(modelos, 'email')?.id ?? '');
  const [modeloWhatsId, setModeloWhatsId] = useState(() => padraoDe(modelos, 'whatsapp')?.id ?? '');
  const modeloEmail = modelosEmail.find((m) => m.id === modeloEmailId);
  const modeloWhats = modelosWhats.find((m) => m.id === modeloWhatsId);
  const [assunto, setAssunto] = useState(() => preencher(modeloEmail?.assunto ?? '', l));
  const [email, setEmail] = useState(() => preencher(modeloEmail?.corpo ?? '', l));
  const [whats, setWhats] = useState(() => preencher(modeloWhats?.corpo ?? '', l));

  function usarModeloEmail(id: string) {
    const m = modelosEmail.find((x) => x.id === id);
    setModeloEmailId(id);
    setAssunto(preencher(m?.assunto ?? '', l));
    setEmail(preencher(m?.corpo ?? '', l));
  }

  function usarModeloWhats(id: string) {
    const m = modelosWhats.find((x) => x.id === id);
    setModeloWhatsId(id);
    setWhats(preencher(m?.corpo ?? '', l));
  }
  const [emailFeito, setEmailFeito] = useState(false);
  const [whatsFeito, setWhatsFeito] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const numero = l.clienteWhats ? numeroWhats(l.clienteWhats) : '';
  const linkWhats = numero && whats.trim() ? `https://wa.me/${numero}?text=${encodeURIComponent(whats)}` : '';

  const campo = 'w-full rounded-lg border border-sand-300 bg-paper px-3 py-2 text-sm text-sand-950 outline-none focus:border-terra-500';
  const restaurar = 'text-xs text-sand-700 underline underline-offset-2';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-sand-950/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="enviar-lembrete-titulo"
        onClick={(e) => e.stopPropagation()}
        className="my-6 flex w-full max-w-3xl flex-col gap-4 rounded-2xl bg-cream p-4 shadow-xl sm:p-6"
      >
        <header className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="label-mono">Enviar lembrete</div>
            <h2 id="enviar-lembrete-titulo" className="mt-1 font-display text-xl font-semibold">
              {l.projectNome}
            </h2>
            <div className="text-xs text-sand-700">
              {l.clienteNome} · {l.descricao} · {formatBRL(l.valor)} · {quando(l)}
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="h-9 w-9 shrink-0 rounded-lg border border-sand-300 text-sand-800 hover:bg-sand-100">
            ✕
          </button>
        </header>

        <p className="text-xs text-sand-700">Escolha o modelo de cada canal e edite o texto se precisar. As alterações valem só para este envio; para mudar o modelo, use “Modelos de mensagem”.</p>

        <div className="grid gap-4 md:grid-cols-2">
          {/* E-mail */}
          <section aria-label="E-mail" className="flex flex-col gap-2.5 rounded-2xl border border-sand-200 bg-paper p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium">✉ E-mail</h3>
              <button onClick={() => usarModeloEmail(modeloEmailId)} disabled={!modeloEmail} className={restaurar}>
                restaurar texto do modelo
              </button>
            </div>
            <div className="text-xs text-sand-700">Para: {l.clienteEmail || <span className="text-terra-700">cliente sem e-mail cadastrado</span>}</div>
            <SeletorModelo modelos={modelosEmail} valor={modeloEmailId} onChange={usarModeloEmail} />
            <label className="flex flex-col gap-1 text-xs text-sand-700">
              Assunto
              <input value={assunto} onChange={(e) => setAssunto(e.target.value)} maxLength={150} className={campo} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-sand-700">
              Mensagem
              <textarea value={email} onChange={(e) => setEmail(e.target.value)} maxLength={MAX_EMAIL} rows={11} className={`${campo} resize-y leading-relaxed`} />
            </label>
            <div className="text-right font-mono text-[10px] text-sand-600">{email.length} / {MAX_EMAIL}</div>
            <button
              disabled={!l.clienteEmail || !email.trim() || !assunto.trim() || emailFeito}
              onClick={() => {
                onSend(l, 'email', { assunto, mensagem: email });
                setEmailFeito(true);
              }}
              className="h-10 rounded-lg bg-terra-600 px-4 text-sm font-semibold text-paper hover:bg-terra-700 disabled:opacity-40"
            >
              {emailFeito ? 'E-mail registrado ✓' : 'Enviar e-mail'}
            </button>
            <p className="text-[11px] text-sand-600">Demonstração: o envio é simulado e fica só no histórico.</p>
          </section>

          {/* WhatsApp */}
          <section aria-label="WhatsApp" className="flex flex-col gap-2.5 rounded-2xl border border-sand-200 bg-paper p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium">WhatsApp</h3>
              <button onClick={() => usarModeloWhats(modeloWhatsId)} disabled={!modeloWhats} className={restaurar}>
                restaurar texto do modelo
              </button>
            </div>
            <div className="text-xs text-sand-700">
              Para: {l.clienteWhats ? `${l.clienteWhats} (+${numero})` : <span className="text-terra-700">cliente sem telefone cadastrado</span>}
            </div>
            <SeletorModelo modelos={modelosWhats} valor={modeloWhatsId} onChange={usarModeloWhats} />
            <label className="flex flex-col gap-1 text-xs text-sand-700">
              Mensagem
              <textarea value={whats} onChange={(e) => setWhats(e.target.value)} maxLength={MAX_WHATS} rows={8} className={`${campo} resize-y leading-relaxed`} />
            </label>
            <div className="text-right font-mono text-[10px] text-sand-600">{whats.length} / {MAX_WHATS}</div>
            {linkWhats ? (
              <a
                href={linkWhats}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  onSend(l, 'whatsapp', { mensagem: whats });
                  setWhatsFeito(true);
                }}
                className="flex h-10 items-center justify-center rounded-lg bg-oliva-600 px-4 text-sm font-semibold text-paper hover:bg-oliva-700"
              >
                {whatsFeito ? 'Abrir no WhatsApp de novo' : 'Abrir no WhatsApp'}
              </a>
            ) : (
              <button disabled className="h-10 rounded-lg bg-oliva-600 px-4 text-sm font-semibold text-paper opacity-40">
                Abrir no WhatsApp
              </button>
            )}
            <p className="text-[11px] text-sand-600">
              Abre o WhatsApp com a mensagem pronta. <b>Você precisa tocar em enviar lá.</b> Na versão com login, só Gerente e Coordenador verão este botão.
            </p>
          </section>
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="h-10 rounded-lg border border-sand-300 px-4 text-sm text-sand-800 hover:bg-sand-100">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function SeletorModelo({ modelos, valor, onChange }: { modelos: ModeloMensagem[]; valor: string; onChange: (id: string) => void }) {
  if (modelos.length === 0) {
    return <div className="text-xs text-terra-700">Nenhum modelo para este canal. Crie um em “Modelos de mensagem” ou escreva abaixo.</div>;
  }
  return (
    <label className="flex flex-col gap-1 text-xs text-sand-700">
      Modelo
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-sand-300 bg-paper px-2.5 text-sm text-sand-950 outline-none focus:border-terra-500"
      >
        {modelos.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nome}
            {m.padrao ? ' (padrão)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
