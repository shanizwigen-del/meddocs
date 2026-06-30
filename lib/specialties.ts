export const SPECIALTIES = [
  { name: 'פסיכיאטריה',     color: 'bg-purple-100 text-purple-800' },
  { name: 'נוירולוגיה',     color: 'bg-blue-100   text-blue-800'   },
  { name: 'קרדיולוגיה',     color: 'bg-red-100    text-red-800'    },
  { name: 'אורטופדיה',      color: 'bg-orange-100 text-orange-800' },
  { name: 'רפואה פנימית',   color: 'bg-teal-100   text-teal-800'   },
  { name: 'גסטרו',          color: 'bg-yellow-100 text-yellow-800' },
  { name: 'אנדוקרינולוגיה', color: 'bg-green-100  text-green-800'  },
  { name: 'ראומטולוגיה',    color: 'bg-pink-100   text-pink-800'   },
  { name: 'אלרגיה',         color: 'bg-lime-100   text-lime-800'   },
  { name: 'עיניים',         color: 'bg-sky-100    text-sky-800'    },
  { name: 'אא"ג',           color: 'bg-cyan-100   text-cyan-800'   },
  { name: 'עור',            color: 'bg-rose-100   text-rose-800'   },
  { name: 'גינקולוגיה',     color: 'bg-fuchsia-100 text-fuchsia-800' },
  { name: 'אונקולוגיה',     color: 'bg-slate-100  text-slate-800'  },
  { name: 'בדיקות מעבדה',   color: 'bg-amber-100  text-amber-800'  },
  { name: 'הדמיה',          color: 'bg-indigo-100 text-indigo-800' },
  { name: 'אחר',            color: 'bg-gray-100   text-gray-800'   },
] as const

export type Specialty = typeof SPECIALTIES[number]['name']

export function getSpecialtyColor(name: string) {
  return SPECIALTIES.find(s => s.name === name)?.color ?? 'bg-gray-100 text-gray-800'
}
