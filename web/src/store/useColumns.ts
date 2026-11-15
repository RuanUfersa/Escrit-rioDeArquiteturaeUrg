import { useEffect, useState } from 'react';
import type { KanbanColumn } from '../types';
import { KANBAN_COLUMNS } from '../types';

const KEY = 'archi.columns.v1';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/** Colunas do quadro: começam com as 6 padrão e podem ser criadas e reordenadas. */
export function useColumns() {
  const [columns, setColumns] = useState<KanbanColumn[]>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as KanbanColumn[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignora dados corrompidos */
    }
    return KANBAN_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(columns));
  }, [columns]);

  const addColumn = (label: string) => {
    const nome = label.trim();
    if (!nome) return;
    setColumns((prev) => [...prev, { id: `col_${uid()}`, label: nome }]);
  };

  /** Move a coluna uma posição para a esquerda (-1) ou direita (+1). */
  const moveColumn = (id: string, dir: -1 | 1) =>
    setColumns((prev) => {
      const i = prev.findIndex((c) => c.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const resetColumns = () => setColumns(KANBAN_COLUMNS);

  return { columns, addColumn, moveColumn, resetColumns };
}
