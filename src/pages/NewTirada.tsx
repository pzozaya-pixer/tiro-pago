import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronDown, Crosshair, Gauge, Save, Target } from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState(false);

  const selectedModality = modalities.find((m) => m.id === modalityId) ?? modalities[0];
  const TriggerIcon = selectedModality.id.includes('rapid')
    ? Gauge
    : selectedModality.weaponType === 'rifle'
    ? Target
    : Crosshair;

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

      <div className="custom-dropdown-container">
        <span className="field-label">Modalidad</span>
        <div className="custom-dropdown">
          <button
            type="button"
            className={`custom-dropdown__trigger ${isOpen ? 'is-open' : ''}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="custom-dropdown__trigger-content">
              <TriggerIcon size={20} className="custom-dropdown__icon" />
              <span>{selectedModality?.name}</span>
            </div>
            <ChevronDown size={18} className={`custom-dropdown__arrow ${isOpen ? 'is-open' : ''}`} />
          </button>

          {isOpen && (
            <>
              <div className="custom-dropdown__overlay" onClick={() => setIsOpen(false)} />
              <ul className="custom-dropdown__menu">
                {modalities.map((modality) => {
                  const isSelected = modalityId === modality.id;
                  const Icon = modality.id.includes('rapid')
                    ? Gauge
                    : modality.weaponType === 'rifle'
                    ? Target
                    : Crosshair;

                  return (
                    <li key={modality.id}>
                      <button
                        type="button"
                        className={`custom-dropdown__item ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => {
                          setModalityId(modality.id);
                          setIsOpen(false);
                        }}
                      >
                        <div className="custom-dropdown__item-main">
                          <Icon size={18} className="custom-dropdown__item-icon" />
                          <span>{modality.name}</span>
                        </div>
                        <span className="custom-dropdown__item-badge">{modality.distance}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
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
