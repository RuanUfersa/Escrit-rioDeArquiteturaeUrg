import { useState } from 'react';
import type { Project } from '../types';
import EnviarLembrete from './EnviarLembrete';
import { buildLembretes, type Lembrete } from '../data/notificacoes';
import { formatBRL } from '../data/financeiro';
import { fmtDate, prazoTexto } from '../lib/format';
import type { NotificacaoLog } from '../store/useNotifications';

interface Props {
  projects: Project[];
  logs: NotificacaoLog[];
  sentKeys: Set<string>;
  onSend: (l: Lembrete, canal: 'email' | 'whatsapp', conteudo: { assunto?: string; mensagem: string }) => void;
  onResetLog: () => void;
}

function fmtData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR');
}

export default function NotificationsView({ projects, logs, sentKeys, onSend, onResetLog }: Props) {
  const lembretes = buildLembretes(projects);
  const pendentes = lembretes.filter((l) => !sentKeys.has(l.key));
  const [aberto, setAberto] = useState<Lembrete | null>(null);

  return (
    <div>
      <div className="mb-4 rounded-xl border border-dashed border-sand-300 p-3 text-xs text-sand-700">
        <b>Lembretes de parcela</b> — mostra o sinal e as parcelas que vencem em até 3 dias ou estão atrasados.
        Em “Enviar lembrete” você revisa e edita o e-mail (envio simulado nesta demonstração) e a mensagem do WhatsApp, que abre pronta para você enviar.
      </div>

      <h3 className="mb-2 label-mono">Pendentes de envio ({pendentes.length})</h3>
      {pendentes.length === 0 && (
        <div className="rounded-xl border border-dashed border-sand-300 p-4 text-center text-sm text-sand-600">
          Nenhum lembrete no momento.
        </div>
      )}
      <div className="flex flex-col gap-2">
        {pendentes.map((l) => {
          const temEmail = !!l.clienteEmail;
          const temWhats = !!l.clienteWhats;
          const atrasada = l.diasAte < 0;
          return (
            <div key={l.key} className="rounded-2xl border border-sand-200 bg-paper p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-sand-900">{l.projectNome}</div>
                  <div className="text-xs text-sand-700">
                    {l.clienteNome} • {l.descricao} • {formatBRL(l.valor)}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`rounded-md px-2 py-0.5 font-medium ${atrasada ? 'bg-terra-100 text-terra-800' : 'bg-sand-100 text-sand-800'}`}>
                    venc. {fmtDate(l.vencimento)} · {prazoTexto(l.diasAte)}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px]">
                <span className={`rounded-md px-2 py-0.5 ${temEmail ? 'bg-sand-100 text-sand-700' : 'bg-terra-50 text-terra-700 line-through'}`}>
                  ✉ email{temEmail ? `: ${l.clienteEmail}` : ' — sem e-mail'}
                </span>
                <span className={`rounded-md px-2 py-0.5 ${temWhats ? 'bg-sand-100 text-sand-700' : 'bg-terra-50 text-terra-700 line-through'}`}>
                  WhatsApp{temWhats ? `: ${l.clienteWhats}` : ' — sem telefone'}
                </span>
                <button
                  disabled={!temEmail && !temWhats}
                  onClick={() => setAberto(l)}
                  className={`ml-auto h-9 rounded-lg px-3 font-medium ${!temEmail && !temWhats ? 'cursor-not-allowed bg-sand-100 text-sand-600' : 'bg-terra-600 text-white hover:bg-terra-700'}`}
                >
                  Enviar lembrete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <h3 className="label-mono">Enviadas — histórico ({logs.length})</h3>
        {logs.length > 0 && (
          <button onClick={onResetLog} className="text-xs text-sand-700 underline">limpar histórico</button>
        )}
      </div>
      {logs.length === 0 && (
        <div className="rounded-xl border border-dashed border-sand-300 p-4 text-center text-sm text-sand-600">Nenhum envio registrado.</div>
      )}
      <div className="mt-1 flex flex-col gap-1">
        {logs.map((n) => (
          <div key={n.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sand-50 px-3 py-2 text-sm text-sand-900">
            <div>
              <span className={`mr-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${n.canal === 'email' ? 'bg-terra-100 text-terra-800' : 'bg-oliva-100 text-oliva-700'}`}>
                {n.canal === 'email' ? '✉ email' : 'WhatsApp (aberto)'}
              </span>
              <b>{n.projectNome}</b> — {n.descricao} ({formatBRL(n.valor)})
              <div className="text-xs text-sand-700">{n.clienteNome} → {n.destino} • {fmtData(n.dataEnvio)}</div>
              {n.mensagem && (
                <details className="mt-1 text-xs text-sand-700">
                  <summary className="cursor-pointer">ver mensagem</summary>
                  {n.assunto && <div className="mt-1 font-medium">Assunto: {n.assunto}</div>}
                  <div className="mt-1 whitespace-pre-wrap">{n.mensagem}</div>
                </details>
              )}
            </div>
          </div>
        ))}
      </div>
      {aberto && <EnviarLembrete lembrete={aberto} onClose={() => setAberto(null)} onSend={onSend} />}
    </div>
  );
}