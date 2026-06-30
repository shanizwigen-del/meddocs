'use client'
import {
  Brain, Heart, Bone, Stethoscope, Eye, Ear, Microscope,
  FlaskConical, Flower2, Ribbon, ScanLine, Pill, Baby,
  Zap, Wind, FolderOpen
} from 'lucide-react'

const StomachIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 7 C9 7 7 10 7 13 C7 17 8 19 8 22 C8 27 11 29 15 29 C19 29 22 27 24 24 C26 21 27 18 27 15 C27 11 25 9 22 8 C20 7.5 18 8 17 9 C16 10 15 10 14 9.5 C13.5 9 13 8 13 7 Z" />
    <path d="M22 8 C23 6 24 5 25 5" />
  </svg>
)

interface FolderConfig {
  icon: React.ReactNode
  bg: string
  iconColor: string
  border: string
}

const FOLDER_CONFIG: Record<string, FolderConfig> = {
  'בריאות הנפש': {
    icon: <Brain size={36} strokeWidth={1.5} />,
    bg: 'bg-violet-50',
    iconColor: 'text-violet-500',
    border: 'border-violet-100',
  },
  'פסיכיאטריה': {
    icon: <Brain size={36} strokeWidth={1.5} />,
    bg: 'bg-violet-50',
    iconColor: 'text-violet-500',
    border: 'border-violet-100',
  },
  'נוירולוגיה': {
    icon: <Zap size={36} strokeWidth={1.5} />,
    bg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    border: 'border-blue-100',
  },
  'קרדיולוגיה': {
    icon: <Heart size={36} strokeWidth={1.5} />,
    bg: 'bg-red-50',
    iconColor: 'text-red-500',
    border: 'border-red-100',
  },
  'אורטופדיה': {
    icon: <Bone size={36} strokeWidth={1.5} />,
    bg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    border: 'border-orange-100',
  },
  'רפואה פנימית': {
    icon: <Stethoscope size={36} strokeWidth={1.5} />,
    bg: 'bg-teal-50',
    iconColor: 'text-teal-500',
    border: 'border-teal-100',
  },
  'גסטרו': {
    icon: <StomachIcon />,
    bg: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    border: 'border-yellow-100',
  },
  'אנדוקרינולוגיה': {
    icon: <FlaskConical size={36} strokeWidth={1.5} />,
    bg: 'bg-green-50',
    iconColor: 'text-green-600',
    border: 'border-green-100',
  },
  'ראומטולוגיה': {
    icon: <Wind size={36} strokeWidth={1.5} />,
    bg: 'bg-pink-50',
    iconColor: 'text-pink-500',
    border: 'border-pink-100',
  },
  'אלרגיה': {
    icon: <Flower2 size={36} strokeWidth={1.5} />,
    bg: 'bg-lime-50',
    iconColor: 'text-lime-600',
    border: 'border-lime-100',
  },
  'עיניים': {
    icon: <Eye size={36} strokeWidth={1.5} />,
    bg: 'bg-sky-50',
    iconColor: 'text-sky-500',
    border: 'border-sky-100',
  },
  'אא"ג': {
    icon: <Ear size={36} strokeWidth={1.5} />,
    bg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    border: 'border-cyan-100',
  },
  'עור': {
    icon: <Pill size={36} strokeWidth={1.5} />,
    bg: 'bg-rose-50',
    iconColor: 'text-rose-500',
    border: 'border-rose-100',
  },
  'גינקולוגיה': {
    icon: <Baby size={36} strokeWidth={1.5} />,
    bg: 'bg-fuchsia-50',
    iconColor: 'text-fuchsia-500',
    border: 'border-fuchsia-100',
  },
  'אונקולוגיה': {
    icon: <Ribbon size={36} strokeWidth={1.5} />,
    bg: 'bg-slate-50',
    iconColor: 'text-slate-500',
    border: 'border-slate-200',
  },
  'בדיקות מעבדה': {
    icon: <Microscope size={36} strokeWidth={1.5} />,
    bg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    border: 'border-amber-100',
  },
  'הדמיה': {
    icon: <ScanLine size={36} strokeWidth={1.5} />,
    bg: 'bg-indigo-50',
    iconColor: 'text-indigo-500',
    border: 'border-indigo-100',
  },
  'אחר': {
    icon: <FolderOpen size={36} strokeWidth={1.5} />,
    bg: 'bg-gray-50',
    iconColor: 'text-gray-400',
    border: 'border-gray-200',
  },
}

function getConfig(specialty: string): FolderConfig {
  return FOLDER_CONFIG[specialty] ?? FOLDER_CONFIG['אחר']
}

interface Props {
  specialty: string
  count: number
  isOpen: boolean
  onClick: () => void
}

export function FolderCard({ specialty, count, isOpen, onClick }: Props) {
  const cfg = getConfig(specialty)
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all
        ${cfg.bg} ${cfg.border}
        ${isOpen ? 'shadow-md scale-[1.02] border-opacity-100' : 'hover:shadow-sm hover:scale-[1.01] border-opacity-60'}
      `}
    >
      <div className={`${cfg.iconColor} transition-transform ${isOpen ? 'scale-110' : ''}`}>
        {cfg.icon}
      </div>
      <div className="text-center space-y-1">
        <p className="font-semibold text-gray-800 text-sm leading-tight">{specialty}</p>
        <p className="text-xs text-gray-400">{count} מסמכים</p>
      </div>
    </button>
  )
}
