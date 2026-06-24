import { useNavigate } from 'react-router-dom';
import { Calendar, Save, Crosshair, Target, Gauge } from 'lucide-react';
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
          <img src={`${import.meta.env.BASE_URL}logo-pixer.png`} alt="Agencia Pixer" className="header-logo" />
        </div>
      </header>

      <div className="modality-selector-container">
        <span className="field-label">Modalidad</span>
        <div className="modality-list">
          {modalities.map((modality) => {
            const isSelected = modalityId === modality.id;
            const Icon = modality.id.includes('rapid')
              ? Gauge
              : modality.weaponType === 'rifle'
              ? Target
              : Crosshair;

            return (
              <button
                key={modality.id}
                type="button"
                className={`modality-select-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => setModalityId(modality.id)}
              >
                <div className="modality-select-card__main">
                  <Icon size={22} className="modality-select-card__icon" />
                  <span className="modality-select-card__name">{modality.name}</span>
                </div>
                <div className="modality-select-card__meta">
                  <span className="badge">{modality.distance}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

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
