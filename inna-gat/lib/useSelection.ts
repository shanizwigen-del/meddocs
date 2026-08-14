'use client'
import { useState, useEffect, useCallback } from 'react'

// בחירת מסמכים משותפת שנשמרת בין הקטגוריות (התיקיות) לאורך הניווט.
// שומרים גם מטא-דאטה (שם + קישור) כדי שאפשר לשלוח/לשתף/למחוק מסמכים
// שנבחרו בכמה קטגוריות שונות — לא רק בקטגוריה הנוכחית.

export interface SelItem {
  id: string
  filename: string
  blob_url: string
}

const KEY = 'doc-selection'
const EVENT = 'doc-selection-change'

function read(): SelItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

function write(items: SelItem[]) {
  sessionStorage.setItem(KEY, JSON.stringify(items))
  window.dispatchEvent(new Event(EVENT))
}

export function useSelection() {
  const [items, setItems] = useState<SelItem[]>([])

  // טעינה ראשונית + סנכרון בין רכיבים באותו עמוד
  useEffect(() => {
    const sync = () => setItems(read())
    sync()
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const has = useCallback((id: string) => items.some(i => i.id === id), [items])

  const toggle = useCallback((item: SelItem) => {
    const current = read()
    const exists = current.some(i => i.id === item.id)
    write(exists ? current.filter(i => i.id !== item.id) : [...current, item])
  }, [])

  const remove = useCallback((ids: string[]) => {
    write(read().filter(i => !ids.includes(i.id)))
  }, [])

  const clear = useCallback(() => write([]), [])

  return { items, has, toggle, remove, clear }
}
