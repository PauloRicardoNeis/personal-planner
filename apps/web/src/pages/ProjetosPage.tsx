import { useState } from 'react';
import { type ISODate, type ProjetoId, type ProjetoStatus, type EtapaId, type EtapaStatus } from '@planner/core';
import { useProjetos } from '../hooks/useProjetos.js';
import { ProjetoList } from '../components/projetos/ProjetoList.js';

export function ProjetosPage() {
  const {
    state, createProjeto, updateProjeto, archiveProjeto,
    addEtapa, updateEtapa, removeEtapa,
  } = useProjetos();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    await createProjeto({
      title: title.trim(),
      ...(description.trim() && { description: description.trim() }),
      ...(area.trim() && { area: area.trim() }),
      priority,
      ...(inicio && { inicio: inicio as ISODate }),
      ...(fim && { fim: fim as ISODate }),
    });

    setTitle('');
    setDescription('');
    setArea('');
    setInicio('');
    setFim('');
  }

  function handleUpdateStatus(id: ProjetoId, status: ProjetoStatus) {
    void updateProjeto(id, { status });
  }

  function handleArchive(id: ProjetoId) {
    void archiveProjeto(id);
  }

  function handleAddEtapa(projetoId: ProjetoId, etapaTitle: string) {
    void addEtapa(projetoId, { title: etapaTitle });
  }

  function handleUpdateEtapaStatus(projetoId: ProjetoId, etapaId: EtapaId, status: EtapaStatus) {
    void updateEtapa(projetoId, etapaId, { status });
  }

  function handleRemoveEtapa(projetoId: ProjetoId, etapaId: EtapaId) {
    void removeEtapa(projetoId, etapaId);
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Projetos</h1>

      <form onSubmit={handleCreate} style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Title + area */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input type="text" placeholder="Nome do projeto" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ ...inputStyle, flex: 2, minWidth: 180 }} />
          <input type="text" placeholder="Área (opcional)" value={area} onChange={(e) => setArea(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 120 }} />
        </div>

        {/* Description */}
        <textarea
          placeholder="Descrição (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
        />

        {/* Priority */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={priority} onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')} style={selectStyle}>
            <option value="high">Prioridade: Alta</option>
            <option value="medium">Prioridade: Média</option>
            <option value="low">Prioridade: Baixa</option>
          </select>
        </div>

        {/* Dates */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: 13, color: 'var(--label)', marginRight: 8 }}>Início:</label>
            <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: 'var(--label)', marginRight: 8 }}>Entrega:</label>
            <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <button type="submit" style={btnStyle}>Criar projeto</button>
      </form>

      {state.status === 'loading' && <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>}
      {state.status === 'error' && <p style={{ color: 'var(--priority-high-text)' }}>Erro: {state.message}</p>}
      {state.status === 'ok' && (
        <ProjetoList
          projetos={state.projetos}
          onUpdateStatus={handleUpdateStatus}
          onArchive={handleArchive}
          onAddEtapa={handleAddEtapa}
          onUpdateEtapaStatus={handleUpdateEtapaStatus}
          onRemoveEtapa={handleRemoveEtapa}
        />
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-input)',
  fontSize: 14, outline: 'none', background: 'var(--bg-input)', color: 'var(--text)',
  transition: 'border-color var(--transition), box-shadow var(--transition)',
};

const selectStyle: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-input)',
  fontSize: 14, outline: 'none', background: 'var(--bg-input)', color: 'var(--text)', cursor: 'pointer',
  transition: 'border-color var(--transition), box-shadow var(--transition)',
};

const btnStyle: React.CSSProperties = {
  padding: '11px 24px', borderRadius: 'var(--radius-md)', border: 'none',
  background: 'var(--btn-bg)', color: 'var(--btn-text)', cursor: 'pointer',
  fontSize: 14, fontWeight: 600, alignSelf: 'flex-start',
  transition: 'background var(--transition), transform var(--transition)',
};
