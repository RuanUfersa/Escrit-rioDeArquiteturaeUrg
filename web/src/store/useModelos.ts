import { useEffect, useState } from 'react';
import { MODELOS_PADRAO, type ModeloMensagem } from '../lib/modelos';

const KEY = 'archi.modelos.v1';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/** Garante no máximo um padrão por canal e, se houver modelos do canal, pelo menos um. */
function normalizar(lista: ModeloMensagem[]): ModeloMensagem[] {
  const out = lista.map((m) => ({ ...m }));
  for (const canal of ['email', 'whatsapp'] as const) {
    const doCanal = out.filter((m) => m.canal === canal);
    const padroes = doCanal.filter((m) => m.padrao);
    if (padroes.length > 1) padroes.slice(1).forEach((m) => (m.padrao = false));
    if (padroes.length === 0 && doCanal[0]) doCanal[0].padrao = true;
  }
  return out;
}

export type NovoModelo = Omit<ModeloMensagem, 'id' | 'atualizadoEm' | 'padrao'>;

export function useModelos() {
  const [modelos, setModelos] = useState<ModeloMensagem[]>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ModeloMensagem[];
        if (Array.isArray(parsed)) return normalizar(parsed);
      }
    } catch {
      /* ignora dados corrompidos */
    }
    return MODELOS_PADRAO;
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(modelos));
  }, [modelos]);

  const agora = () => new Date().toISOString();

  const criar = (m: NovoModelo) =>
    setModelos((prev) => normalizar([...prev, { ...m, id: `modelo_${uid()}`, padrao: false, atualizadoEm: agora() }]));

  const editar = (id: string, m: NovoModelo) =>
    setModelos((prev) => normalizar(prev.map((x) => (x.id === id ? { ...x, ...m, atualizadoEm: agora() } : x))));

  const excluir = (id: string) => setModelos((prev) => normalizar(prev.filter((x) => x.id !== id)));

  const definirPadrao = (id: string) =>
    setModelos((prev) => {
      const alvo = prev.find((x) => x.id === id);
      if (!alvo) return prev;
      return prev.map((x) => (x.canal === alvo.canal ? { ...x, padrao: x.id === id } : x));
    });

  const restaurar = () => setModelos(MODELOS_PADRAO);

  return { modelos, criar, editar, excluir, definirPadrao, restaurar };
}
