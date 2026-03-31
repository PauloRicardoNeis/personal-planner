import { useState } from 'react';
import { type Projeto, type ProjetoId, type EtapaId, type EtapaStatus } from '@planner/core';
import { EtapaCard } from './EtapaCard.js';

interface Props {
  projeto: Projeto;
  onAddEtapa: (projetoId: ProjetoId, title: string) => void;
  onUpdateStatus: (projetoId: ProjetoId, etapaId: EtapaId, status: EtapaStatus) => void;
  onRemoveEtapa: (projetoId: ProjetoId, etapaId: EtapaId) => void;
}

export function EtapaList({ projeto, onAddEtapa, onUpdateStatus, onRemoveEtapa }: Props) {
  const [newTitle, setNewTitle] = useState('');

  const sorted = [...projeto.etapas].sort((a, b) => a.order - b.order);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddEtapa(projeto.id, newTitle.trim());
    setNewTitle('');
  }

  return (
    <div>
      {sorted.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '8px 0' }}>
          Nenhuma etapa ainda.
        </p>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {sorted.map((etapa) => (
          <EtapaCard
            key={etapa.id}
            etapa={etapa}
            projeto={projeto}
            onUpdateStatus={onUpdateStatus}
            onRemove={onRemoveEtapa}
          />
        ))}
      </ul>

      {/* Inline add */}
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <input
          type="text"
          placeholder="Nova etapa..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{
            flex: 1, padding: '7px 10px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-input)', fontSize: 13,
            background: 'var(--bg-input)', color: 'var(--text)', outline: 'none',
            transition: 'border-color var(--transition), box-shadow var(--transition)',
          }}
        />
        <button type="submit" style={{
          padding: '7px 14px', borderRadius: 'var(--radius-md)', border: 'none',
          background: 'var(--btn-bg)', color: 'var(--btn-text)', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, transition: 'background var(--transition)',
        }}>
          +
        </button>
      </form>
    </div>
  );
}
