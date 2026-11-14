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

  const send = (l: Lembrete, canais: { email: boolean; whatsapp: boolean }): void => {
    const agora = new Date().toISOString();
    const novos: NotificacaoLog[] = [];
    if (canais.email && l.clienteEmail) {
      novos.push({
        id: uid(),
        key: l.key,
        projectNome: l.projectNome,
        clienteNome: l.clienteNome,
        canal: 'email',
        descricao: l.descricao,
        valor: l.valor,
        vencimento: l.vencimento,
        destino: l.clienteEmail,
        dataEnvio: agora,
      });
    }
    if (canais.whatsapp && l.clienteWhats) {
      novos.push({
        id: uid(),
        key: l.key,
        projectNome: l.projectNome,
        clienteNome: l.clienteNome,
        canal: 'whatsapp',
        descricao: l.descricao,
        valor: l.valor,
        vencimento: l.vencimento,
        destino: l.clienteWhats,
        dataEnvio: agora,
      });
    }
    setLogs((prev) => [...novos, ...prev]);
  };

  const sentKeys = new Set(logs.map((l) => l.key));
  const reset = () => setLogs([]);

  return { logs, send, sentKeys, reset };
}