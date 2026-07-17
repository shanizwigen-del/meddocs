import { sql } from '@/lib/db'

// מבטיח שהסכמה של ניהול המשפחה קיימת — נקרא מכל route שנוגע בבני משפחה.
// נשען על אותו דפוס "IF NOT EXISTS" בזמן ריצה שכבר קיים במערכת.
let ready: Promise<void> | null = null

export function ensureFamilySchema(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS family_members (
          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at  TIMESTAMPTZ DEFAULT now(),
          name        TEXT NOT NULL,
          relation    TEXT,
          birth_date  DATE,
          color       TEXT
        )
      `
      // יצירת טבלת המסמכים אם עדיין לא קיימת (אתחול אוטומטי מול DB חדש)
      await sql`
        CREATE TABLE IF NOT EXISTS documents (
          id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at    TIMESTAMPTZ DEFAULT now(),
          member_id     UUID REFERENCES family_members(id) ON DELETE CASCADE,
          blob_url      TEXT NOT NULL,
          filename      TEXT NOT NULL,
          doc_date      DATE,
          doctor        TEXT,
          hospital      TEXT,
          specialty     TEXT,
          summary       TEXT,
          keywords      TEXT[],
          thumbnail_url TEXT,
          status        TEXT DEFAULT 'processing'
        )
      `
      // מסד נתונים קיים (עותק של קרן) — הוספת העמודה החסרה
      await sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES family_members(id) ON DELETE CASCADE`
      await sql`CREATE INDEX IF NOT EXISTS idx_documents_member ON documents(member_id)`
    })().catch(err => {
      // אפס את ה-cache כדי לאפשר ניסיון חוזר בקריאה הבאה
      ready = null
      throw err
    })
  }
  return ready
}
