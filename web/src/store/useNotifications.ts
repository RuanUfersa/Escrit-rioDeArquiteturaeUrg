import { useEffect, useState } from 'react';
import type { Lembrete } from '../data/notificacoes';

const KEY = 'archi.notifications.v1';

export interface NotificacaoLog {
  id: string;
  key: string;
  projectNome: string;
  clienteNome: string;
  canal: 'email' | 'whatsapp';
  descricao: string;
  valor: number;
  vencimento: string;
  destino: string;
  dataEnvio: string;
  /** Texto usado no envio (editável na janela de envio). */
  assunto?: string;
  mensagem?: string;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function useNotifications() {
  const [logs, setLogs] = useState<NotificacaoLog[]>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw) as NotificacaoLog[];
    } catch {
      /* ignore */
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(logs));
  }, [logs]);

  /**
   * Registra um envio. E-mail: envio simulado (sem servidor ainda).
   * WhatsApp: registra que a mensagem foi aberta no WhatsApp; quem envia de fato é o usuário.
   */
  const send = (l: Lembrete, canal: 'email' | 'whatsapp', conteudo: { assunto?: string; mensagem: string }): void => {
    const destino = canal === 'email' ? l.clienteEmail : l.clienteWhats;
    if (!destino) return;
    const novo: NotificacaoLog = {
      id: uid(),
      key: l.key,
      projectNome: l.projectNome,
      clienteNome: l.clienteNome,
      canal,
      descricao: l.descricao,
      valor: l.valor,
      vencimento: l.vencimento,
      destino,
      dataEnvio: new Date().toISOString(),
      assunto: conteudo.assunto,
      mensagem: conteudo.mensagem,
    };
    setLogs((prev) => [novo, ...prev]);
  };

  const sentKeys = new Set(logs.map((l) => l.key));
  const reset = () => setLogs([]);

  return { logs, send, sentKeys, reset };
}