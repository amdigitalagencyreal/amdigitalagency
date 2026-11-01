import { useEffect, useState } from 'react'
import { supabase, configured } from './supabase.js'
import { DEFAULTS } from './defaults.js'

export const wa = (num, text) => 'https://wa.me/' + String(num).replace(/\D/g, '') + (text ? '?text=' + encodeURIComponent(text) : '')
export const TABLES = ['services', 'portfolio', 'packages', 'artworks', 'experience', 'skills', 'testimonials', 'faqs', 'stats', 'custom_sections', 'custom_items']

export function useContent() {
  const [c, setC] = useState(DEFAULTS)
  useEffect(() => {
    if (!configured) return
    const q = (t) => supabase.from(t).select('*').order('sort_order', { ascending: true })
    Promise.all([...TABLES.map(q), supabase.from('site_settings').select('*')]).then((res) => {
      setC((prev) => {
        const next = { ...prev }
        TABLES.forEach((t, i) => { if (!res[i].error) next[t] = res[i].data })
        const s = res[TABLES.length]
        if (!s.error) next.settings = { ...DEFAULTS.settings, ...Object.fromEntries(s.data.map((r) => [r.key, r.value])) }
        return next
      })
    })
  }, [])
  return c
}
