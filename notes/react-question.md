# תזכורת – שאלה על ריאקט

## השאלה שלי
**האם המערכות שלי משתמשות בריאקט (React)?**

## התשובה (נכון ל‑06.08.2026)

כן. שתי המערכות בריפו בנויות על React.

| מערכת | React | React DOM | Next.js |
|-------|-------|-----------|---------|
| `meddocs` (הראשית) | 19.2.4 | 19.2.4 | 16.2.9 |
| `inna-gat` | 19.2.4 | 19.2.4 | 16.2.9 |

### איך זה נראה בפועל
- כל הקוד ב‑`app/` וב‑`components/` הוא קומפוננטות React בקבצי `.tsx`
  (16 קבצים ב‑meddocs, 21 ב‑inna-gat).
- Next.js הוא ה‑framework שרץ מעל React – הוא לא תחליף לריאקט.
- הקומפוננטות מתחלקות לשניים:
  - **Server Components** – ברירת המחדל, רצות בשרת (למשל `app/layout.tsx`).
  - **Client Components** – מסומנות ב‑`'use client'` בשורה הראשונה, רצות בדפדפן
    ומאפשרות `useState` / `useEffect` / אירועי לחיצה
    (למשל `components/PdfViewer.tsx`, `app/upload/page.tsx`).
- ספריות נוספות שתלויות בריאקט: `lucide-react` (אייקונים), `react-pdf` (הצגת PDF).

### איפה לבדוק בעצמי בפעם הבאה
```bash
cat package.json | grep react       # לראות את גרסאות הריאקט
grep -rl "use client" app components  # לראות אילו קומפוננטות רצות בדפדפן
```

## שאלות המשך לזכור לשאול
- מתי כדאי להשתמש ב‑Server Component ומתי ב‑Client Component?
- מה השתנה ב‑React 19 לעומת גרסאות קודמות (Actions, `use`, form hooks)?
- האם יש קומפוננטות שמסומנות `'use client'` בלי צורך אמיתי?
