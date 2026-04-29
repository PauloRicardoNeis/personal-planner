import { useState } from 'react';
import {
  computeProjetoProgress,
  type Projeto,
  type ProjetoId,
  type ProjetoPatch,
  type ProjetoStatus,
  type EtapaId,
  type EtapaStatus,
  type ISODate,
  type Result,
} from '@planner/core';
import { ProjetoProgressBar } from './ProjetoProgressBar.js';
import { EtapaList } from './EtapaList.js';

interface Props {
  projeto: Projeto;
  onEditProjeto: (id: ProjetoId, patch: ProjetoPatch) => Promise<Result<Projeto>>;
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
  planning: { color: '#7c3aed', bg: '#f5f3ff' },
  active: { color: '#2563eb', bg: '#eff6ff' },
  paused: { color: '#d97706', bg: '#fffbeb' },
  done: { color: '#059669', bg: '#ecfdf5' },
  archived: { color: 'var(--text-muted)', bg: 'var(--bg-badge)' },
};

const PRIORITY_CONFIG = {
  high: { label: 'alta', bg: 'var(--priority-high-bg)', text: 'var(--priority-high-text)' },
  medium: { label: 'média', bg: 'var(--priority-med-bg)', text: 'var(--priority-med-text)' },
  low: { label: 'baixa', bg: 'var(--priority-low-bg)', text: 'var(--priority-low-text)' },
};

export function ProjetoCard({
  projeto,
  onEditProjeto,
  onUpdateStatus,
  onArchive,
  onAddEtapa,
  onUpdateEtapaStatus,
  onRemoveEtapa,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(projeto.title);
  const [draftDescription, setDraftDescription] = useState(projeto.description ?? '');
  const [draftArea, setDraftArea] = useState(projeto.area ?? '');
  const [draftPriority, setDraftPriority] = useState<'low' | 'medium' | 'high'>(projeto.priority);
  const [draftInicio, setDraftInicio] = useState(projeto.inicio ?? '');
  const [draftFim, setDraftFim] = useState(projeto.fim ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const progress = computeProjetoProgress(projeto);
  const statusColor = STATUS_COLORS[projeto.status];
  const prioConfig = PRIORITY_CONFIG[projeto.priority];

  function startEditing() {
    setDraftTitle(projeto.title);
    setDraftDescription(projeto.description ?? '');
    setDraftArea(projeto.area ?? '');
    setDraftPriority(projeto.priority);
    setDraftInicio(projeto.inicio ?? '');
    setDraftFim(projeto.fim ?? '');
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraftTitle(projeto.title);
    setDraftDescription(projeto.description ?? '');
    setDraftArea(projeto.area ?? '');
    setDraftPriority(projeto.priority);
    setDraftInicio(projeto.inicio ?? '');
    setDraftFim(projeto.fim ?? '');
    setIsEditing(false);
  }

  async function handleEditSubmit(event: React.FormEvent) {
    event.preventDefault();
    const title = draftTitle.trim();

    if (!title) {
      return;
    }

    const patch: ProjetoPatch = {
      title,
      description: draftDescription.trim(),
      area: draftArea.trim(),
      priority: draftPriority,
      ...(draftInicio ? { inicio: draftInicio as ISODate } : {}),
      ...(draftFim ? { fim: draftFim as ISODate } : {}),
    };

    setIsSaving(true);
    const result = await onEditProjeto(projeto.id, patch);
    setIsSaving(false);

    if (result.ok) {
      setIsEditing(false);
    }
  }

  return (
    <li style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--bg-card)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
      transition: 'box-shadow var(--transition)',
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '14px 16px', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, transform: expanded ? 'rotate(90deg)' : 'none',
            transition: 'transform var(--transition)', color: 'var(--text-muted)',
          }}>
            ▸
          </span>
          <span style={{ fontWeight: 600, fontSize: 14, flex: 1, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            {projeto.title}
          </span>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <span style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 'var(--radius-xs)', fontWeight: 500,
              color: statusColor.color, background: statusColor.bg,
            }}>
              {STATUS_LABELS[projeto.status]}
            </span>
            <span style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 'var(--radius-xs)', fontWeight: 500,
              color: prioConfig.text, background: prioConfig.bg,
            }}>
              {prioConfig.label}
            </span>
            {projeto.area && (
              <span style={{ fontSize: 10, color: 'var(--text-badge)', background: 'var(--bg-badge)', padding: '2px 7px', borderRadius: 'var(--radius-xs)' }}>
                {projeto.area}
              </span>
            )}
          </div>
        </div>

        {projeto.etapas.length > 0 && (
          <div style={{ paddingLeft: 20 }}>
            <ProjetoProgressBar {...progress} />
          </div>
        )}

        {projeto.description && !expanded && (
          <div style={{ paddingLeft: 20, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {projeto.description.length > 100 ? projeto.description.slice(0, 100) + '...' : projeto.description}
          </div>
        )}
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
          {isEditing ? (
            <form onSubmit={handleEditSubmit} style={editPanelStyle}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Nome do projeto"
                  required
                  style={{ ...editInputStyle, flex: 2, minWidth: 180, fontWeight: 600 }}
                />
                <input
                  type="text"
                  value={draftArea}
                  onChange={(e) => setDraftArea(e.target.value)}
                  placeholder="Área (opcional)"
                  style={{ ...editInputStyle, flex: 1, minWidth: 140 }}
                />
              </div>

              <textarea
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                placeholder="Descrição (opcional)"
                rows={3}
                style={{ ...editInputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />

              <select
                value={draftPriority}
                onChange={(e) => setDraftPriority(e.target.value as 'low' | 'medium' | 'high')}
                style={{ ...editInputStyle, maxWidth: 200, cursor: 'pointer' }}
              >
                <option value="high">Prioridade: Alta</option>
                <option value="medium">Prioridade: Média</option>
                <option value="low">Prioridade: Baixa</option>
              </select>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={fieldLabelStyle}>Início</label>
                  <input
                    type="date"
                    value={draftInicio}
                    onChange={(e) => setDraftInicio(e.target.value)}
                    style={editInputStyle}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={fieldLabelStyle}>Entrega</label>
                  <input
                    type="date"
                    value={draftFim}
                    onChange={(e) => setDraftFim(e.target.value)}
                    style={editInputStyle}
                  />
                </div>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Datas vazias mantêm o valor já salvo.
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="submit" disabled={isSaving} style={primaryActionStyle}>
                  Salvar
                </button>
                <button type="button" onClick={cancelEditing} disabled={isSaving} style={secondaryActionStyle}>
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <>
              {projeto.description && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '12px 0 8px', lineHeight: 1.5 }}>
                  {projeto.description}
                </p>
              )}

              {(projeto.inicio || projeto.fim) && (
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)', margin: '8px 0' }}>
                  {projeto.inicio && <span>Início: {projeto.inicio}</span>}
                  {projeto.fim && <span>Entrega: {projeto.fim}</span>}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6, margin: '12px 0', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); startEditing(); }}
                  style={secondaryActionStyle}
                >
                  Editar
                </button>
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
                  style={archiveButtonStyle}
                >
                  Arquivar
                </button>
              </div>
            </>
          )}

          <div style={{ marginTop: 8 }}>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
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
        fontSize: 12, fontWeight: 600, transition: 'background var(--transition)',
      }}
    >
      {label}
    </button>
  );
}

const editPanelStyle: React.CSSProperties = {
  marginTop: 12,
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const editInputStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-input)',
  fontSize: 13,
  background: 'var(--bg-input)',
  color: 'var(--text)',
  outline: 'none',
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
  fontWeight: 500,
};

const primaryActionStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--btn-bg)',
  color: 'var(--btn-text)',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
};

const secondaryActionStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text)',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  transition: 'all var(--transition)',
};

const archiveButtonStyle: React.CSSProperties = {
  padding: '5px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)',
  background: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  fontSize: 12,
  transition: 'all var(--transition)',
};
