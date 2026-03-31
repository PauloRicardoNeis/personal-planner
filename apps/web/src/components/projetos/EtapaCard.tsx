import { canTransitionEtapa, type Etapa, type EtapaId, type EtapaStatus, type Projeto, type ProjetoId } from '@planner/core';

interface Props {
  etapa: Etapa;
  projeto: Projeto;
  onUpdateStatus: (projetoId: ProjetoId, etapaId: EtapaId, status: EtapaStatus) => void;
  onRemove: (projetoId: ProjetoId, etapaId: EtapaId) => void;
}

const STATUS_CONFIG: Record<EtapaStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'pendente', color: 'var(--text-muted)', bg: 'var(--bg-badge)' },
  in_progress: { label: 'em andamento', color: '#2563eb', bg: '#dbeafe' },
  done: { label: 'concluída', color: '#16a34a', bg: '#dcfce7' },
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
      padding: '10px 0', borderBottom: '1px solid var(--border)',
      opacity: isDone ? 0.6 : 1,
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
          width: 20, height: 20, minWidth: 20, borderRadius: 5,
          border: isDone ? '2px solid #22c55e' : '2px solid var(--border-input)',
          background: isDone ? '#22c55e' : 'var(--bg-check)',
          color: '#fff', fontSize: 12, fontWeight: 700, cursor: isDone || canFinish ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
        }}
        title={isDone ? 'Reabrir' : canFinish ? 'Concluir' : 'Dependências não satisfeitas'}
      >
        {isDone ? '✓' : ''}
      </button>

      <div style={{ flex: 1 }}>
        <div style={{
          fontWeight: 500, fontSize: 14,
          textDecoration: isDone ? 'line-through' : 'none',
          color: isDone ? 'var(--text-done)' : 'var(--text)',
        }}>
          {etapa.title}
        </div>
        {etapa.description && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {etapa.description}
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 4,
            color: config.color, background: config.bg, fontWeight: 500,
          }}>
            {config.label}
          </span>
          {etapa.deadline && (
            <span style={{ fontSize: 10, color: 'var(--text-badge)', background: 'var(--bg-badge)', padding: '1px 6px', borderRadius: 4 }}>
              prazo: {etapa.deadline}
            </span>
          )}
          {etapa.effortHours !== undefined && (
            <span style={{ fontSize: 10, color: 'var(--text-badge)', background: 'var(--bg-badge)', padding: '1px 6px', borderRadius: 4 }}>
              {etapa.effortHours}h
            </span>
          )}
          {etapa.dependsOn && etapa.dependsOn.length > 0 && (
            <span style={{ fontSize: 10, color: 'var(--text-badge)', background: 'var(--bg-badge)', padding: '1px 6px', borderRadius: 4 }}>
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
        style={{ background: 'none', border: 'none', color: 'var(--border-input)', cursor: 'pointer', fontSize: 14, padding: '0 2px' }}
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
