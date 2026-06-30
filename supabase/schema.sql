CREATE TABLE documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  blob_url    TEXT NOT NULL,
  filename    TEXT NOT NULL,
  doc_date    DATE,
  doctor      TEXT,
  hospital    TEXT,
  specialty   TEXT,
  summary     TEXT,
  keywords    TEXT[],
  status      TEXT DEFAULT 'processing'
);

CREATE INDEX idx_documents_specialty ON documents(specialty);
CREATE INDEX idx_documents_doc_date  ON documents(doc_date DESC);
CREATE INDEX idx_documents_doctor    ON documents(doctor);
