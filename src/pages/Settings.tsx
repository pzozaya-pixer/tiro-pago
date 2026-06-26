import { useState } from 'react';
import { useTrainingStore } from '../store/useTrainingStore';
import { translations } from '../data/translations';
import { AlertTriangle, Edit2, Globe, Plus, Save, Target, Trash2, X, Crosshair, Gauge } from 'lucide-react';
import type { Modality, WeaponType } from '../types';

export function Settings() {
  const language = useTrainingStore((state) => state.language);
  const setLanguage = useTrainingStore((state) => state.setLanguage);
  const modalities = useTrainingStore((state) => state.modalities);
  const tiradas = useTrainingStore((state) => state.tiradas);
  const addModality = useTrainingStore((state) => state.addModality);
  const updateModality = useTrainingStore((state) => state.updateModality);
  const deleteModality = useTrainingStore((state) => state.deleteModality);
  const t = translations[language];

  // Modality Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModality, setEditingModality] = useState<Modality | null>(null);
  const [formName, setFormName] = useState('');
  const [formWeaponType, setFormWeaponType] = useState<WeaponType>('pistol');
  const [formCaliber, setFormCaliber] = useState('');
  const [formDistance, setFormDistance] = useState('');
  const [formShots, setFormShots] = useState(5);
  const [formMaxScore, setFormMaxScore] = useState(10);

  // Deletion States
  const [deletingModalityId, setDeletingModalityId] = useState<string | null>(null);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [referencingCount, setReferencingCount] = useState(0);

  // Open Form for Adding
  const handleOpenAdd = () => {
    setEditingModality(null);
    setFormName('');
    setFormWeaponType('pistol');
    setFormCaliber('.22 LR');
    setFormDistance('25 m');
    setFormShots(5);
    setFormMaxScore(10);
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (modality: Modality) => {
    setEditingModality(modality);
    setFormName(modality.name);
    setFormWeaponType(modality.weaponType);
    setFormCaliber(modality.caliber);
    setFormDistance(modality.distance);
    setFormShots(modality.shotsPerRound);
    setFormMaxScore(modality.maxScorePerShot);
    setIsFormOpen(true);
  };

  // Submit Form (Add or Edit)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    const cleanCaliber = formCaliber.trim() || '.22 LR';
    const cleanDistance = formDistance.trim() || '25 m';

    if (!cleanName) return;

    const payload = {
      name: cleanName,
      weaponType: formWeaponType,
      caliber: cleanCaliber,
      distance: cleanDistance,
      shotsPerRound: Number(formShots) || 5,
      maxScorePerShot: Number(formMaxScore) || 10
    };

    if (editingModality) {
      updateModality(editingModality.id, payload);
    } else {
      addModality(payload);
    }

    setIsFormOpen(false);
    setEditingModality(null);
  };

  // Delete Request Handler (Checks if in use)
  const handleDeleteRequest = (modalityId: string) => {
    const count = tiradas.filter((t) => t.modalityId === modalityId).length;
    setDeletingModalityId(modalityId);

    if (count > 0) {
      setReferencingCount(count);
      setIsBlockedModalOpen(true);
    } else {
      setIsConfirmDeleteOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingModalityId) {
      deleteModality(deletingModalityId);
    }
    setIsConfirmDeleteOpen(false);
    setDeletingModalityId(null);
  };

  return (
    <div className="page list-page">
      <header className="compact-header compact-header--row">
        <div>
          <h1>{t.settings_title}</h1>
          <p>{t.settings_subtitle}</p>
        </div>
        <div className="header-logo-container">
          <img
            src={`${import.meta.env.BASE_URL}logo-pixer.png`}
            alt="Agencia Pixer"
            className="header-logo"
          />
        </div>
      </header>

      {/* Language Selector Card */}
      <section className="settings-section">
        <div className="settings-card">
          <div className="settings-card__header">
            <Globe size={20} className="text-green" />
            <h3>{t.settings_lang_label}</h3>
          </div>
          <div className="language-selector">
            {(['es', 'en', 'fr'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                className={`lang-btn ${language === lang ? 'is-active' : ''}`}
                onClick={() => setLanguage(lang)}
              >
                {lang === 'es' ? 'Español' : lang === 'en' ? 'English' : 'Français'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Offline Info Card */}
      <section className="settings-section">
        <div className="status-card">
          <strong>{t.settings_offline_title}</strong>
          <span>{t.settings_offline_desc}</span>
        </div>
      </section>

      {/* Modalities CRUD Section */}
      <section className="settings-section">
        <div className="section-title">
          <div>
            <h2>{t.settings_modalities_title}</h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--muted)', marginTop: '4px' }}>
              {t.settings_modalities_subtitle}
            </p>
          </div>
          <button
            type="button"
            className="primary-button add-modality-btn"
            onClick={handleOpenAdd}
            style={{ width: 'auto', minHeight: '44px', padding: '0 14px', borderRadius: '12px', fontSize: '0.9rem' }}
          >
            <Plus size={18} />
            <span>{t.settings_btn_add_modality}</span>
          </button>
        </div>

        <div className="simple-list modalities-crud-list" style={{ marginTop: '14px' }}>
          {modalities.map((modality) => {
            const Icon = modality.id.includes('rapid')
              ? Gauge
              : modality.weaponType === 'rifle'
              ? Target
              : Crosshair;

            return (
              <article key={modality.id} className="crud-card">
                <div className="crud-card__icon-wrap">
                  <Icon size={22} className="text-green" />
                </div>
                <div className="crud-card__body">
                  <strong>{modality.name}</strong>
                  <span>
                    {modality.caliber} · {modality.distance} · {modality.weaponType === 'pistol' ? t.settings_modality_weapon_pistol : t.settings_modality_weapon_rifle}
                  </span>
                </div>
                <div className="crud-card__actions">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(modality)}
                    className="crud-btn edit-btn"
                    aria-label="Editar modalidad"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRequest(modality.id)}
                    className="crud-btn delete-btn"
                    aria-label="Borrar modalidad"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Form Modal (Add / Edit) */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleFormSubmit}>
            <div className="modal-card__header-row">
              <h3>{editingModality ? t.settings_modal_edit_title : t.settings_modal_add_title}</h3>
              <button type="button" className="close-btn" onClick={() => setIsFormOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-card__body-scroll">
              <label className="field">
                <span>{t.settings_modality_name}</span>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Carabina 10 m"
                  required
                  autoFocus
                />
              </label>

              <div className="field">
                <span>{t.settings_modality_weapon_type}</span>
                <div className="segmented">
                  {(['pistol', 'rifle'] as const).map((wt) => (
                    <button
                      key={wt}
                      type="button"
                      className={formWeaponType === wt ? 'is-active' : ''}
                      onClick={() => setFormWeaponType(wt)}
                    >
                      {wt === 'pistol' ? t.settings_modality_weapon_pistol : t.settings_modality_weapon_rifle}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label className="field">
                  <span>{t.settings_modality_caliber}</span>
                  <input
                    type="text"
                    value={formCaliber}
                    onChange={(e) => setFormCaliber(e.target.value)}
                    placeholder="Ej. .22 LR"
                    required
                  />
                </label>
                <label className="field">
                  <span>{t.settings_modality_distance}</span>
                  <input
                    type="text"
                    value={formDistance}
                    onChange={(e) => setFormDistance(e.target.value)}
                    placeholder="Ej. 10 m"
                    required
                  />
                </label>
              </div>

              <div className="field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label className="field">
                  <span>{t.settings_modality_shots}</span>
                  <input
                    type="number"
                    value={formShots}
                    onChange={(e) => setFormShots(Number(e.target.value))}
                    min={1}
                    required
                  />
                </label>
                <label className="field">
                  <span>{t.settings_modality_max_score}</span>
                  <input
                    type="number"
                    value={formMaxScore}
                    onChange={(e) => setFormMaxScore(Number(e.target.value))}
                    min={1}
                    required
                  />
                </label>
              </div>
            </div>

            <div className="modal-card__actions" style={{ marginTop: '20px' }}>
              <button type="button" className="modal-btn modal-btn--secondary" onClick={() => setIsFormOpen(false)}>
                {t.settings_modal_btn_cancel}
              </button>
              <button type="submit" className="modal-btn modal-btn--danger" style={{ background: 'linear-gradient(135deg, var(--green), var(--green-dark))', boxShadow: '0 10px 24px rgba(72, 177, 56, 0.2)' }}>
                <Save size={18} />
                <span>{t.settings_modal_btn_save}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Blocked Warning Modal */}
      {isBlockedModalOpen && (
        <div className="modal-overlay" onClick={() => setIsBlockedModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card__icon" style={{ background: 'rgba(255, 152, 0, 0.12)', borderColor: 'rgba(255, 152, 0, 0.25)' }}>
              <AlertTriangle size={36} color="#ffa726" />
            </div>
            <h3>{language === 'en' ? 'Deletion Blocked' : language === 'fr' ? 'Suppression Bloquée' : 'Borrado Bloqueado'}</h3>
            <p>
              {t.settings_delete_modal_blocked.replace('{count}', String(referencingCount))}
            </p>
            <button
              type="button"
              className="modal-btn modal-btn--secondary"
              onClick={() => setIsBlockedModalOpen(false)}
              style={{ width: '100%' }}
            >
              {language === 'en' ? 'Understood' : language === 'fr' ? 'Compris' : 'Entendido'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isConfirmDeleteOpen && (
        <div className="modal-overlay" onClick={() => setIsConfirmDeleteOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card__icon">
              <AlertTriangle size={36} color="var(--red)" />
            </div>
            <h3>{t.settings_delete_modal_title}</h3>
            <p>{t.settings_delete_modal_desc}</p>
            <div className="modal-card__actions">
              <button type="button" className="modal-btn modal-btn--secondary" onClick={() => setIsConfirmDeleteOpen(false)}>
                {t.settings_modal_btn_cancel}
              </button>
              <button type="button" className="modal-btn modal-btn--danger" onClick={handleConfirmDelete}>
                {t.history_delete_modal_btn_delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
