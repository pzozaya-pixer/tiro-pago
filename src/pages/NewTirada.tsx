import { useNavigate } from 'react-router-dom';
import { Calendar, Save } from 'lucide-react';
import { modalities } from '../data/modalities';
import { useTrainingStore } from '../store/useTrainingStore';
import type { TiradaType } from '../types';
import { useState } from 'react';

export function NewTirada() {
  const navigate = useNavigate();
  const createTirada = useTrainingStore((state) => state.createTirada);
  const [modalityId, setModalityId] = useState(modalities[0].id);
  const [type, setType] = useState<TiradaType>('entrenamiento');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    createTirada({
      modalityId,
      type,
      date: new Date(date).toISOString()
    });
    navigate('/nueva-tanda');
  }

  return (
    <form className="page form-page" onSubmit={handleSubmit}>
      <header className="compact-header compact-header--row">
        <div>
          <h1>Nueva tirada</h1>
          <p>Selecciona modalidad y tipo de entrenamiento.</p>
        </div>
        <div className="header-logo-container">
          <img src={`${import.meta.env.BASE_URL}icon-512.png`} alt="Agencia Pixer" className="header-logo" />
        </div>
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
        {(['entrenamiento', 'competicion'] as TiradaType[]).map((item) => (
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
        Crear tirada
      </button>
    </form>
  );
}
