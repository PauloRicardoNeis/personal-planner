import { canTransitionEtapa, type Etapa, type EtapaId, type EtapaStatus, type Projeto, type ProjetoId } from '@planner/core';

interface Props {
  etapa: Etapa;
  projeto: Projeto;
  onUpdateStatus: (projetoId: ProjetoId, etapaId: EtapaId, status: EtapaStatus) => void;
  onRemove: (projetoId: ProjetoId, etapaId: EtapaId) => void;
}

const STATUS_CONFIG: Record<EtapaStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'pendente', color: 'var(--text-muted)', bg: 'var(--bg-badge)' },
  in_progress: { label: 'em andamento', color: '#2563eb', bg: '#eff6ff' },
  done: { label: 'concluída', color: '#059669', bg: '#ecfdf5' },
  blocked: { label: 'bloqueada', color: '#dc2626', bg: '#fef2f2' },
};

export function EtapaCard({ etapa, projeto, onUpdateStatus, onRemove }: Props) {
  const config = STATUS_CONFIG[etapa.status];
  const canStart = etapa.status === 'pending' && canTransitionEtapa(projeto, etapa.id, 'in_progress');
  const canFinish = (etapa.status === 'pending' || etapa.status === 'in_progress') && canTransitionEtapa(projeto, etapa.id, 'done');
  const isDone = etapa.status === 'done';

  return (
    <li style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '9px 0', borderBottom: '1px solid var(--border)',
      opacity: isDone ? 0.55 : 1,
      transition: 'opacity var(--transition)',
    }}>
      {/* Done checkbox */}
      <button
        onClick={() => {
          if (isDone) {
            onUpdateStatus(projeto.id, etapa.id, 'pending');
          } else if (canFinish) {
            onUpdateStatus(projeto.id, etapa.id, 'done');
          }
        }}
        disabled={!isDone && !canFinish}
        style={{
          width: 18, height: 18, minWidth: 18, borderRadius: 'var(--radius-xs)',
          border: isDone ? '2px solid var(--progress-green)' : '2px solid var(--border-input)',
          background: isDone ? 'var(--progress-green)' : 'var(--bg-check)',
          color: '#fff', fontSize: 11, fontWeight: 700, cursor: isDone || canFinish ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
          transition: 'all var(--transition)',
        }}
        title={isDone ? 'Reabrir' : canFinish ? 'Concluir' : 'Dependências não satisfeitas'}
      >
        {isDone ? '✓' : ''}
      </button>

      <div style={{ flex: 1 }}>
        <div style={{
          fontWeight: 500, fontSize: 13.5, lineHeight: 1.4,
          textDecoration: isDone ? 'line-through' : 'none',
          color: isDone ? 'var(--text-done)' : 'var(--text)',
          transition: 'color var(--transition)',
        }}>
          {etapa.title}
        </div>
        {etapa.description && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
            {etapa.description}
          </div>
        )}
        <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 'var(--radius-xs)',
            color: config.color, background: config.bg, fontWeight: 500,
          }}>
            {config.label}
          </span>
          {etapa.deadline && (
            <span style={{ fontSize: 10, color: 'var(--text-badge)', background: 'var(--bg-badge)', padding: '1px 6px', borderRadius: 'var(--radius-xs)' }}>
              prazo: {etapa.deadline}
            </span>
          )}
          {etapa.effortHours !== undefined && (
            <span style={{ fontSize: 10, color: 'var(--text-badge)', background: 'var(--bg-badge)', padding: '1px 6px', borderRadius: 'var(--radius-xs)' }}>
              {etapa.effortHours}h
            </span>
          )}
          {etapa.dependsOn && etapa.dependsOn.length > 0 && (
            <span style={{ fontSize: 10, color: 'var(--text-badge)', background: 'var(--bg-badge)', padding: '1px 6px', borderRadius: 'var(--radius-xs)' }}>
              {etapa.dependsOn.length} dep.
            </span>
          )}

          {/* Quick status actions */}
          {canStart && !isDone && etapa.status !== 'in_progress' && (
            <button
              onClick={() => onUpdateStatus(projeto.id, etapa.id, 'in_progress')}
              style={{ ...actionBtnStyle, color: '#2563eb' }}
            >
              Iniciar
            </button>
          )}
        </div>
      </div>

      <button
        onClick={() => { if (confirm(`Remover etapa "${etapa.title}"?`)) onRemove(projeto.id, etapa.id); }}
        style={{
          background: 'none', border: 'none', color: 'var(--border-input)', cursor: 'pointer',
          fontSize: 13, padding: '2px 4px', borderRadius: 'var(--radius-xs)',
          transition: 'color var(--transition)',
        }}
        title="Remover etapa"
      >
        ✕
      </button>
    </li>
  );
}

const actionBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 11, fontWeight: 600, padding: 0,
};
