import { Resend } from 'resend'

// אתחול עצל — כדי שה-build לא ידרוש RESEND_API_KEY.
// שליחת המייל היא גיבוי בלבד (ברירת המחדל היא כפתור "שתף"), ולכן
// מפתח Resend הוא אופציונלי. הוא נדרש רק אם בפועל שולחים מייל.
export function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}
