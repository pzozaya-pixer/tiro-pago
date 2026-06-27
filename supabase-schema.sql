CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS weapons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  caliber text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS modalities (
  id text PRIMARY KEY,
  name text NOT NULL,
  distance text NOT NULL,
  weapon_type text NOT NULL,
  caliber text NOT NULL,
  shots_per_round integer NOT NULL DEFAULT 5,
  max_score_per_shot integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  modality_id text NOT NULL REFERENCES modalities(id),
  weapon_id uuid REFERENCES weapons(id),
  type text NOT NULL CHECK (type IN ('entrenamiento', 'competicion')),
  date timestamptz NOT NULL,
  notes text,
  total_score integer NOT NULL DEFAULT 0,
  total_shots integer NOT NULL DEFAULT 0,
  average_score numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  shot_1 integer NOT NULL CHECK (shot_1 BETWEEN 0 AND 10),
  shot_2 integer NOT NULL CHECK (shot_2 BETWEEN 0 AND 10),
  shot_3 integer NOT NULL CHECK (shot_3 BETWEEN 0 AND 10),
  shot_4 integer NOT NULL CHECK (shot_4 BETWEEN 0 AND 10),
  shot_5 integer NOT NULL CHECK (shot_5 BETWEEN 0 AND 10),
  total_score integer NOT NULL,
  average_score numeric NOT NULL,
  best_shot integer NOT NULL,
  worst_shot integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL UNIQUE,
  stripe_subscription_id text NOT NULL UNIQUE,
  status text NOT NULL,
  trial_start timestamptz,
  trial_end timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  card_fingerprint text,
  card_brand text,
  card_last4 text,
  country text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email, token)
);

ALTER TABLE weapons ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own weapons" ON weapons
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions" ON sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own rounds" ON rounds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = rounds.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

INSERT INTO modalities (id, name, distance, weapon_type, caliber, shots_per_round, max_score_per_shot)
VALUES
  ('pistol-25', 'Pistola 25 m .22 LR', '25 m', 'pistol', '.22 LR', 5, 10),
  ('rapid-pistol-25', 'Pistola velocidad 25 m .22 LR', '25 m', 'pistol', '.22 LR', 5, 10),
  ('rifle-50', 'Carabina 50 m .22 LR', '50 m', 'rifle', '.22 LR', 5, 10),
  ('rifle-3p-50', 'Carabina 3 posiciones 50 m .22 LR', '50 m', 'rifle', '.22 LR', 5, 10)
ON CONFLICT (id) DO NOTHING;
