CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE weapons (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  caliber TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE modalities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  distance TEXT NOT NULL,
  weapon_type TEXT NOT NULL,
  caliber TEXT NOT NULL,
  shots_per_round INTEGER NOT NULL DEFAULT 5,
  max_score_per_shot INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  modality_id TEXT NOT NULL REFERENCES modalities(id),
  weapon_id TEXT REFERENCES weapons(id),
  type TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  total_score INTEGER NOT NULL DEFAULT 0,
  total_shots INTEGER NOT NULL DEFAULT 0,
  average_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rounds (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  shot_1 INTEGER NOT NULL,
  shot_2 INTEGER NOT NULL,
  shot_3 INTEGER NOT NULL,
  shot_4 INTEGER NOT NULL,
  shot_5 INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  average_score DOUBLE PRECISION NOT NULL,
  best_shot INTEGER NOT NULL,
  worst_shot INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO modalities (id, name, distance, weapon_type, caliber, shots_per_round, max_score_per_shot)
VALUES
  ('pistol-25', 'Pistola 25 m .22 LR', '25 m', 'pistol', '.22 LR', 5, 10),
  ('rapid-pistol-25', 'Pistola velocidad 25 m .22 LR', '25 m', 'pistol', '.22 LR', 5, 10),
  ('rifle-50', 'Carabina 50 m .22 LR', '50 m', 'rifle', '.22 LR', 5, 10),
  ('rifle-3p-50', 'Carabina 3 posiciones 50 m .22 LR', '50 m', 'rifle', '.22 LR', 5, 10)
ON CONFLICT (id) DO NOTHING;
