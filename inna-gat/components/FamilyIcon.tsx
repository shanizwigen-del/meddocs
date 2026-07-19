// איור משפחה בסגנון הקו האחיד של שאר האייקונים במערכת
// (fill=none, stroke=currentColor, strokeWidth 1.5 — כמו אייקוני lucide שבתיקיות)
export function FamilyIcon({
  size = 36,
  strokeWidth = 1.5,
}: {
  size?: number
  strokeWidth?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* הורה שמאל */}
      <circle cx="11" cy="9" r="3.5" />
      <path d="M5 24 C5 19 8 17 11 17 C14 17 17 19 17 24" />
      {/* הורה ימין */}
      <circle cx="25" cy="9" r="3.5" />
      <path d="M19 24 C19 19 22 17 25 17 C28 17 31 19 31 24" />
      {/* ילד מרכז */}
      <circle cx="18" cy="21" r="2.8" />
      <path d="M13 32 C13 28.5 15 27 18 27 C21 27 23 28.5 23 32" />
    </svg>
  )
}
