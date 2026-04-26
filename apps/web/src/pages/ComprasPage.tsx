import { useMemo, useState } from 'react';
import {
  getListaCompraDueInfo,
  todayISODate,
  type CompraItem,
  type CompraItemId,
  type CompraItemInput,
  type ISODate,
  type ListaCompra,
  type ListaCompraId,
} from '@planner/core';
import { useCompras } from '../hooks/useCompras.js';

type ReminderMode = 'none' | 'manual_next_date' | 'after_completion_interval';

export function ComprasPage() {
  const {
    state,
    createListaCompra,
    archiveListaCompra,
    addCompraItem,
    updateCompraItem,
    removeCompraItem,
    completeListaCompra,
  } = useCompras();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [plannedFor, setPlannedFor] = useState('');
  const [reminderMode, setReminderMode] = useState<ReminderMode>('none');
  const [nextDate, setNextDate] = useState('');
  const [intervalValue, setIntervalValue] = useState(7);
  const [intervalUnit, setIntervalUnit] = useState<'days' | 'weeks' | 'months'>('days');
  const [anchorDate, setAnchorDate] = useState('');

  const listas = useMemo(() => {
    if (state.status !== 'ok') return [];
    const today = todayISODate();
    return [...state.listas].sort((a, b) => {
      const dueA = getListaCompraDueInfo(a, today);
      const dueB = getListaCompraDueInfo(b, today);
      if (!!dueA !== !!dueB) return dueA ? -1 : 1;
      if (dueA && dueB && dueA.isOverdue !== dueB.isOverdue) return dueA.isOverdue ? -1 : 1;
      return a.title.localeCompare(b.title, 'pt-BR');
    });
  }, [state]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const reminder = reminderMode === 'none'
      ? { mode: 'none' as const }
      : reminderMode === 'manual_next_date'
        ? { mode: 'manual_next_date' as const, ...(nextDate && { nextDate: nextDate as ISODate }) }
        : {
            mode: 'after_completion_interval' as const,
            value: intervalValue,
            unit: intervalUnit,
            ...(anchorDate && { anchorDate: anchorDate as ISODate }),
          };

    await createListaCompra({
      title: title.trim(),
      ...(notes.trim() && { notes: notes.trim() }),
      ...(plannedFor && { plannedFor: plannedFor as ISODate }),
      reminder,
    });

    setTitle('');
    setNotes('');
    setPlannedFor('');
    setNextDate('');
    setAnchorDate('');
  }

  return (
    <div>
      <h1 style={pageTitleStyle}>Compras</h1>

      <form onSubmit={handleCreate} style={formStyle}>
        <div style={rowStyle}>
          <input
            type="text"
            placeholder="Nome da lista"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ ...inputStyle, flex: 2, minWidth: 220 }}
          />
          <input type="date" value={plannedFor} onChange={(e) => setPlannedFor(e.target.value)} style={inputStyle} />
          <select value={reminderMode} onChange={(e) => setReminderMode(e.target.value as ReminderMode)} style={selectStyle}>
            <option value="none">Sem lembrete</option>
            <option value="manual_next_date">Próxima data manual</option>
            <option value="after_completion_interval">Intervalo após concluir</option>
          </select>
        </div>

        {reminderMode === 'manual_next_date' && (
          <div style={rowStyle}>
            <label style={labelStyle}>Próxima data:</label>
            <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} style={inputStyle} />
          </div>
        )}

        {reminderMode === 'after_completion_interval' && (
          <div style={rowStyle}>
            <input type="number" min={1} value={intervalValue} onChange={(e) => setIntervalValue(Number(e.target.value))} style={{ ...inputStyle, maxWidth: 100 }} />
            <select value={intervalUnit} onChange={(e) => setIntervalUnit(e.target.value as 'days' | 'weeks' | 'months')} style={selectStyle}>
              <option value="days">dias</option>
              <option value="weeks">semanas</option>
              <option value="months">meses</option>
            </select>
            <label style={labelStyle}>Data inicial opcional:</label>
            <input type="date" value={anchorDate} onChange={(e) => setAnchorDate(e.target.value)} style={inputStyle} />
          </div>
        )}

        <textarea
          placeholder="Observações"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />

        <button type="submit" style={btnStyle}>Criar lista</button>
      </form>

      {state.status === 'loading' && <p style={messageStyle}>Carregando...</p>}
      {state.status === 'error' && <p style={errorStyle}>Erro: {state.message}</p>}
      {state.status === 'ok' && listas.length === 0 && <p style={messageStyle}>Nenhuma lista ativa.</p>}
      {state.status === 'ok' && listas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {listas.map((lista) => (
            <ListaCompraCard
              key={lista.id}
              lista={lista}
              onArchive={archiveListaCompra}
              onAddItem={addCompraItem}
              onToggleItem={(listaId, item) => updateCompraItem(listaId, item.id, { checked: !item.checked })}
              onRemoveItem={removeCompraItem}
              onComplete={completeListaCompra}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ListaCompraCard({
  lista,
  onArchive,
  onAddItem,
  onToggleItem,
  onRemoveItem,
  onComplete,
}: {
  lista: ListaCompra;
  onArchive: (id: ListaCompraId) => Promise<void> | void;
  onAddItem: (listaId: ListaCompraId, input: CompraItemInput) => Promise<void> | void;
  onToggleItem: (listaId: ListaCompraId, item: CompraItem) => Promise<void> | void;
  onRemoveItem: (listaId: ListaCompraId, itemId: CompraItemId) => Promise<void> | void;
  onComplete: (listaId: ListaCompraId, date: ISODate) => Promise<void> | void;
}) {
  const today = todayISODate();
  const dueInfo = getListaCompraDueInfo(lista, today);
  const [itemTitle, setItemTitle] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [preferredStore, setPreferredStore] = useState('');
  const [url, setUrl] = useState('');
  const [lastPrice, setLastPrice] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [notes, setNotes] = useState('');

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemTitle.trim()) return;

    await onAddItem(lista.id, {
      title: itemTitle.trim(),
      ...(quantity && { quantity: Number(quantity) }),
      ...(unit.trim() && { unit: unit.trim() }),
      ...(preferredStore.trim() && { preferredStore: preferredStore.trim() }),
      ...(url.trim() && { url: url.trim() }),
      ...(lastPrice && { lastPrice: Number(lastPrice) }),
      ...(targetPrice && { targetPrice: Number(targetPrice) }),
      ...(notes.trim() && { notes: notes.trim() }),
    });

    setItemTitle('');
    setQuantity('');
    setUnit('');
    setPreferredStore('');
    setUrl('');
    setLastPrice('');
    setTargetPrice('');
    setNotes('');
  }

  return (
    <section style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <strong style={{ fontSize: 15, color: 'var(--text)' }}>{lista.title}</strong>
            {dueInfo && <Badge tone={dueInfo.isOverdue ? 'danger' : 'accent'}>{dueInfo.isOverdue ? `Atrasada desde ${dueInfo.dueDate}` : `Planejada para ${dueInfo.dueDate}`}</Badge>}
            {lista.items.length > 0 && <Badge>{`${lista.items.filter((item) => !item.checked).length}/${lista.items.length} pendentes`}</Badge>}
          </div>
          <p style={metaStyle}>{formatCompraMeta(lista)}</p>
          {lista.notes && <p style={metaStyle}>{lista.notes}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <button onClick={() => onComplete(lista.id, today)} style={btnStyle}>Concluir compra</button>
          <button onClick={() => onArchive(lista.id)} style={ghostBtnStyle}>Arquivar</button>
        </div>
      </div>

      {lista.items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {lista.items.map((item) => (
            <div key={item.id} style={itemRowStyle}>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => onToggleItem(lista.id, item)}
                  style={{ marginTop: 2, cursor: 'pointer' }}
                />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ color: 'var(--text)', textDecoration: item.checked ? 'line-through' : 'none' }}>
                    {item.title}
                    {item.quantity !== undefined && ` • ${item.quantity}${item.unit ? ` ${item.unit}` : ''}`}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {[item.preferredStore, item.lastPrice !== undefined ? `R$ ${item.lastPrice.toFixed(2)}` : null, item.targetPrice !== undefined ? `Alvo R$ ${item.targetPrice.toFixed(2)}` : null].filter(Boolean).join(' • ')}
                  </span>
                  {item.url && <a href={item.url} target="_blank" rel="noreferrer" style={linkStyle}>{item.url}</a>}
                </span>
              </label>
              <button onClick={() => onRemoveItem(lista.id, item.id)} style={smallGhostBtnStyle}>Remover</button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAddItem} style={formStyle}>
        <div style={rowStyle}>
          <input type="text" placeholder="Novo item" value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} style={{ ...inputStyle, flex: 2, minWidth: 180 }} />
          <input type="number" min={0} step="0.01" placeholder="Qtd." value={quantity} onChange={(e) => setQuantity(e.target.value)} style={{ ...inputStyle, maxWidth: 100 }} />
          <input type="text" placeholder="Unidade" value={unit} onChange={(e) => setUnit(e.target.value)} style={{ ...inputStyle, maxWidth: 110 }} />
          <input type="text" placeholder="Loja" value={preferredStore} onChange={(e) => setPreferredStore(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        </div>
        <div style={rowStyle}>
          <input type="url" placeholder="Link" value={url} onChange={(e) => setUrl(e.target.value)} style={{ ...inputStyle, flex: 2, minWidth: 180 }} />
          <input type="number" min={0} step="0.01" placeholder="Ultimo preco" value={lastPrice} onChange={(e) => setLastPrice(e.target.value)} style={{ ...inputStyle, maxWidth: 130 }} />
          <input type="number" min={0} step="0.01" placeholder="Preco alvo" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} style={{ ...inputStyle, maxWidth: 130 }} />
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Observacoes do item" style={{ ...inputStyle, resize: 'vertical' }} />
        <button type="submit" style={btnStyle}>Adicionar item</button>
      </form>
    </section>
  );
}

function formatCompraMeta(lista: ListaCompra): string {
  const bits = [
    lista.plannedFor ? `Planejada para ${lista.plannedFor}` : null,
    formatReminder(lista),
    lista.lastCompletedAt ? `Última conclusão: ${lista.lastCompletedAt.slice(0, 10)}` : null,
  ].filter(Boolean);
  return bits.join(' • ') || 'Sem planejamento definido';
}

function formatReminder(lista: ListaCompra): string | null {
  switch (lista.reminder.mode) {
    case 'none':
      return null;
    case 'manual_next_date':
      return lista.reminder.nextDate ? `Próxima data manual: ${lista.reminder.nextDate}` : 'Próxima data manual pendente';
    case 'after_completion_interval':
      return `Repor a cada ${lista.reminder.value} ${lista.reminder.unit}`;
  }
}

function Badge({ children, tone = 'muted' }: { children: React.ReactNode; tone?: 'muted' | 'accent' | 'danger' }) {
  const palette = {
    muted: { background: 'var(--bg-badge)', color: 'var(--text-badge)' },
    accent: { background: 'var(--accent-soft)', color: 'var(--accent)' },
    danger: { background: 'var(--overdue-bg)', color: 'var(--overdue-text)' },
  };
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: 'var(--radius-xs)',
      ...palette[tone],
    }}>
      {children}
    </span>
  );
}

const pageTitleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 24,
  letterSpacing: '-0.3px',
  color: 'var(--text)',
};

const formStyle: React.CSSProperties = {
  marginBottom: 28,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  alignItems: 'center',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  padding: '9px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-input)',
  fontSize: 13.5,
  outline: 'none',
  background: 'var(--bg-input)',
  color: 'var(--text)',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

const btnStyle: React.CSSProperties = {
  padding: '9px 18px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--btn-bg)',
  color: 'var(--btn-text)',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

const ghostBtnStyle: React.CSSProperties = {
  ...btnStyle,
  background: 'transparent',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border)',
};

const smallGhostBtnStyle: React.CSSProperties = {
  ...ghostBtnStyle,
  padding: '6px 10px',
  fontSize: 12,
};

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border)',
  padding: '18px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const metaStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 13,
  margin: '6px 0 0',
  lineHeight: 1.5,
};

const itemRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  paddingBottom: 8,
  borderBottom: '1px solid var(--border)',
};

const messageStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 14,
};

const errorStyle: React.CSSProperties = {
  color: 'var(--priority-high-text)',
  fontSize: 14,
};

const linkStyle: React.CSSProperties = {
  color: 'var(--accent)',
  fontSize: 12,
  textDecoration: 'none',
  wordBreak: 'break-all',
};
