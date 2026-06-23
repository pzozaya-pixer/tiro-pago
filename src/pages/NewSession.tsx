import { useNavigate } from 'react-router-dom';
import { Calendar, Save } from 'lucide-react';
import { modalities } from '../data/modalities';
import { useTrainingStore } from '../store/useTrainingStore';
import type { SessionType } from '../types';
import { useState } from 'react';

export function NewSession() {
  const navigate = useNavigate();
  const createSession = useTrainingStore((state) => state.createSession);
  const [modalityId, setModalityId] = useState(modalities[0].id);
  const [type, setType] = useState<SessionType>('entrenamiento');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    createSession({
      modalityId,
      type,
      date: new Date(date).toISOString()
    });
    navigate('/nueva-tanda');
  }

  return (
    <form className="page form-page" onSubmit={handleSubmit}>
      <header className="compact-header">
        <h1>Nueva sesión</h1>
        <p>Selecciona modalidad y tipo de entrenamiento.</p>
      </header>

      <label className="field">
        <span>Modalidad</span>
        <select value={modalityId} onChange={(event) => setModalityId(event.target.value)}>
          {modalities.map((modality) => (
            <option key={modality.id} value={modality.id}>
              {modality.name}
            </option>
          ))}
        </select>
      </label>

      <div className="segmented">
        {(['entrenamiento', 'competicion'] as SessionType[]).map((item) => (
          <button key={item} type="button" className={type === item ? 'is-active' : ''} onClick={() => setType(item)}>
            {item}
          </button>
        ))}
      </div>

      <label className="field">
        <span>Fecha</span>
        <div className="input-with-icon">
          <Calendar size={20} />
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
      </label>

      <button className="primary-button" type="submit">
        <Save size={22} />
        Crear sesión
      </button>
    </form>
  );
}
