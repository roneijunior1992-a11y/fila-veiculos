import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

/**
 * Main application component for managing a queue of vehicles.
 *
 * Users can add new vehicles to the queue by filling out the form. The
 * queue is fetched from Supabase on mount and kept locally in state. When
 * a new vehicle is added the record is inserted into Supabase and the
 * local queue is updated. A simple "Chamar próximo" button marks the
 * first vehicle as called and records the action in the historico table.
 */
export default function App() {
  // Define the initial form state
  const initialForm = {
    placa_cavalo: '',
    placa_carreta: '',
    motorista: '',
    origem: '',
    destino: '',
    tipo: '',
    prioridade: '',
    observacoes: '',
  };

  // Local state for form and queue
  const [form, setForm] = useState(initialForm);
  const [fila, setFila] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch the queue from Supabase when the component mounts
  useEffect(() => {
    const fetchQueue = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('fila')
        .select('*')
        .eq('status', 'Na fila')
        .order('chegada_at', { ascending: true });
      if (!error) {
        setFila(data || []);
      } else {
        console.error('Erro ao buscar fila:', error.message);
      }
      setLoading(false);
    };
    fetchQueue();
  }, []);

  // Handle form field changes
  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Add a new vehicle to the queue
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Insert new vehicle into Supabase
    const { data, error } = await supabase
      .from('fila')
      .insert([
        {
          ...form,
          status: 'Na fila',
        },
      ])
      .select('*');
    if (!error && data) {
      // Append the newly inserted record to local state
      setFila((prev) => [...prev, data[0]]);
      setForm(initialForm);
    } else {
      console.error('Erro ao inserir veículo:', error?.message);
    }
    setLoading(false);
  };

  // Call the next vehicle in line
  const handleCallNext = async () => {
    if (fila.length === 0) return;
    const next = fila[0];
    setLoading(true);
    const now = new Date().toISOString();
    // Update status to 'Chamado' and set chamado_at
    const { error: updateError } = await supabase
      .from('fila')
      .update({ status: 'Chamado', chamado_at: now })
      .eq('id', next.id);
    // Insert into historico table
    const { error: historicoError } = await supabase
      .from('historico')
      .insert([
        {
          veiculo_id: next.id,
          acao: 'Chamado',
          at: now,
          payload: next,
        },
      ]);
    if (updateError) {
      console.error('Erro ao chamar veículo:', updateError.message);
    }
    if (historicoError) {
      console.error('Erro ao registrar histórico:', historicoError.message);
    }
    // Remove the first vehicle from local queue
    setFila((prev) => prev.slice(1));
    setLoading(false);
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Fila de Veículos</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <input
            required
            placeholder="Placa Cavalo"
            value={form.placa_cavalo}
            onChange={handleChange('placa_cavalo')}
          />
          <input
            placeholder="Placa Carreta"
            value={form.placa_carreta}
            onChange={handleChange('placa_carreta')}
          />
          <input
            placeholder="Motorista"
            value={form.motorista}
            onChange={handleChange('motorista')}
          />
          <input
            placeholder="Origem"
            value={form.origem}
            onChange={handleChange('origem')}
          />
          <input
            placeholder="Destino"
            value={form.destino}
            onChange={handleChange('destino')}
          />
          <input
            placeholder="Tipo"
            value={form.tipo}
            onChange={handleChange('tipo')}
          />
          <input
            placeholder="Prioridade"
            value={form.prioridade}
            onChange={handleChange('prioridade')}
          />
          <input
            placeholder="Observações"
            value={form.observacoes}
            onChange={handleChange('observacoes')}
          />
        </div>
        <button type="submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? 'Salvando...' : 'Adicionar Veículo'}
        </button>
      </form>
      <button onClick={handleCallNext} disabled={loading || fila.length === 0} style={{ marginBottom: '1rem' }}>
        {fila.length === 0 ? 'Fila vazia' : 'Chamar próximo'}
      </button>
      {loading && <p>Carregando...</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {fila.map((item) => (
          <li
            key={item.id}
            style={{
              border: '1px solid #ccc',
              padding: '0.5rem',
              marginBottom: '0.5rem',
              borderRadius: '4px',
            }}
          >
            <strong>{item.placa_cavalo}</strong> / {item.placa_carreta} - {item.motorista}
            <br />
            {item.origem} → {item.destino}
            {item.prioridade && <>, prioridade: {item.prioridade}</>}
            {item.observacoes && <>, obs: {item.observacoes}</>}
          </li>
        ))}
      </ul>
    </div>
  );
}
