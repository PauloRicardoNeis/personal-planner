import { type Projeto, type ProjetoId, type ProjetoStatus, type EtapaId, type EtapaStatus } from '@planner/core';
import { ProjetoCard } from './ProjetoCard.js';

interface Props {
  projetos: Projeto[];
  onUpdateStatus: (id: ProjetoId, status: ProjetoStatus) => void;
  onArchive: (id: ProjetoId) => void;
  onAddEtapa: (projetoId: ProjetoId, title: string) => void;
  onUpdateEtapaStatus: (projetoId: ProjetoId, etapaId: EtapaId, status: EtapaStatus) => void;
  onRemoveEtapa: (projetoId: ProjetoId, etapaId: EtapaId) => void;
}

export function ProjetoList({
  projetos, onUpdateStatus, onArchive, onAddEtapa, onUpdateEtapaStatus, onRemoveEtapa,
}: Props) {
  if (projetos.length === 0) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 24 }}>Nenhum projeto ainda. Crie o primeiro acima.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {projetos.map((projeto) => (
        <ProjetoCard
          key={projeto.id}
          projeto={projeto}
          onUpdateStatus={onUpdateStatus}
          onArchive={onArchive}
          onAddEtapa={onAddEtapa}
          onUpdateEtapaStatus={onUpdateEtapaStatus}
          onRemoveEtapa={onRemoveEtapa}
        />
      ))}
    </ul>
  );
}
