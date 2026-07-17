-- בני משפחה — כל בן משפחה הוא תיק אישי נפרד
CREATE TABLE family_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  name        TEXT NOT NULL,
  relation    TEXT,           -- קרבה: בן / בת / הורה / בן זוג וכו'
  birth_date  DATE,
  color       TEXT            -- צבע לזיהוי הכרטיס
);

CREATE TABLE documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  member_id   UUID REFERENCES family_members(id) ON DELETE CASCADE,
  blob_url    TEXT NOT NULL,
  filename    TEXT NOT NULL,
  doc_date    DATE,
  doctor      TEXT,
  hospital    TEXT,
  specialty   TEXT,
  summary     TEXT,
  keywords    TEXT[],
  thumbnail_url TEXT,
  status      TEXT DEFAULT 'processing'
);

CREATE INDEX idx_documents_member    ON documents(member_id);
CREATE INDEX idx_documents_specialty ON documents(specialty);
CREATE INDEX idx_documents_doc_date  ON documents(doc_date DESC);
CREATE INDEX idx_documents_doctor    ON documents(doctor);
