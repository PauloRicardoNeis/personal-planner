import { useState } from 'react';
import {
  computeProjetoProgress,
  type Projeto,
  type ProjetoId,
  type ProjetoStatus,
  type EtapaId,
  type EtapaStatus,
} from '@planner/core';
import { ProjetoProgressBar } from './ProjetoProgressBar.js';
import { EtapaList } from './EtapaList.js';

interface Props {
  projeto: Projeto;
  onUpdateStatus: (id: ProjetoId, status: ProjetoStatus) => void;
  onArchive: (id: ProjetoId) => void;
  onAddEtapa: (projetoId: ProjetoId, title: string) => void;
  onUpdateEtapaStatus: (projetoId: ProjetoId, etapaId: EtapaId, status: EtapaStatus) => void;
  onRemoveEtapa: (projetoId: ProjetoId, etapaId: EtapaId) => void;
}

const STATUS_LABELS: Record<ProjetoStatus, string> = {
  planning: 'Planejamento',
  active: 'Ativo',
  paused: 'Pausado',
  done: 'Concluído',
  archived: 'Arquivado',
};

const STATUS_COLORS: Record<ProjetoStatus, { color: string; bg: string }> = {
  planning: { color: '#9333ea', bg: '#f3e8ff' },
  active: { color: '#2563eb', bg: '#dbeafe' },
  paused: { color: '#d97706', bg: '#fef3c7' },
  done: { color: '#16a34a', bg: '#dcfce7' },
  archived: { color: 'var(--text-muted)', bg: 'var(--bg-badge)' },
};

const PRIORITY_CONFIG = {
  high: { label: 'alta', bg: 'var(--priority-high-bg)', text: 'var(--priority-high-text)' },
  medium: { label: 'média', bg: 'var(--priority-med-bg)', text: 'var(--priority-med-text)' },
  low: { label: 'baixa', bg: 'var(--priority-low-bg)', text: 'var(--priority-low-text)' },
};

export function ProjetoCard({
  projeto, onUpdateStatus, onArchive, onAddEtapa, onUpdateEtapaStatus, onRemoveEtapa,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const progress = computeProjetoProgress(projeto);
  const statusColor = STATUS_COLORS[projeto.status];
  const prioConfig = PRIORITY_CONFIG[projeto.priority];

  return (
    <li style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--bg-card)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
    }}>
      {/* Header — click to expand */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '14px 16px', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
            ▸
          </span>
          <span style={{ fontWeight: 600, fontSize: 15, flex: 1, color: 'var(--text)' }}>
            {projeto.title}
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
              color: statusColor.color, background: statusColor.bg,
            }}>
              {STATUS_LABELS[projeto.status]}
            </span>
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
              color: prioConfig.text, background: prioConfig.bg,
            }}>
              {prioConfig.label}
            </span>
            {projeto.area && (
              <span style={{ fontSize: 10, color: 'var(--text-badge)', background: 'var(--bg-badge)', padding: '2px 8px', borderRadius: 4 }}>
                {projeto.area}
              </span>
            )}
          </div>
        </div>

        {projeto.etapas.length > 0 && (
          <div style={{ paddingLeft: 22 }}>
            <ProjetoProgressBar {...progress} />
          </div>
        )}

        {projeto.description && !expanded && (
          <div style={{ paddingLeft: 22, fontSize: 12, color: 'var(--text-muted)' }}>
            {projeto.description.length > 100 ? projeto.description.slice(0, 100) + '...' : projeto.description}
          </div>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
          {projeto.description && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '12px 0 8px' }}>
              {projeto.description}
            </p>
          )}

          {/* Date info */}
          {(projeto.inicio || projeto.fim) && (
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)', margin: '8px 0' }}>
              {projeto.inicio && <span>Início: {projeto.inicio}</span>}
              {projeto.fim && <span>Entrega: {projeto.fim}</span>}
            </div>
          )}

          {/* Status actions */}
          <div style={{ display: 'flex', gap: 6, margin: '12px 0', flexWrap: 'wrap' }}>
            {projeto.status === 'planning' && (
              <StatusButton label="Ativar" onClick={() => onUpdateStatus(projeto.id, 'active')} />
            )}
            {projeto.status === 'active' && (
              <>
                <StatusButton label="Pausar" onClick={() => onUpdateStatus(projeto.id, 'paused')} />
                {progress.total > 0 && progress.completed === progress.total && (
                  <StatusButton label="Concluir" onClick={() => onUpdateStatus(projeto.id, 'done')} />
                )}
              </>
            )}
            {projeto.status === 'paused' && (
              <StatusButton label="Retomar" onClick={() => onUpdateStatus(projeto.id, 'active')} />
            )}
            {projeto.status === 'done' && (
              <StatusButton label="Reabrir" onClick={() => onUpdateStatus(projeto.id, 'active')} />
            )}
            <button
              onClick={(e) => { e.stopPropagation(); if (confirm(`Arquivar "${projeto.title}"?`)) onArchive(projeto.id); }}
              style={{
                padding: '5px 12px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-input)', background: 'none',
                color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12,
              }}
            >
              Arquivar
            </button>
          </div>

          {/* Etapas */}
          <div style={{ marginTop: 8 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 8px' }}>
              Etapas ({progress.completed}/{progress.total})
            </h4>
            <EtapaList
              projeto={projeto}
              onAddEtapa={onAddEtapa}
              onUpdateStatus={onUpdateEtapaStatus}
              onRemoveEtapa={onRemoveEtapa}
            />
          </div>
        </div>
      )}
    </li>
  );
}

function StatusButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        padding: '5px 12px', borderRadius: 'var(--radius-md)', border: 'none',
        background: 'var(--btn-bg)', color: 'var(--btn-text)', cursor: 'pointer',
        fontSize: 12, fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
}
