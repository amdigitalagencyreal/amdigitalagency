import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const configured = Boolean(url && key)
export const supabase = configured ? createClient(url, key) : null

export const isVideo = (u) => /\.(mp4|webm|mov)(\?.*)?$/i.test(u || '')

export async function uploadImage(file) {
  if (!/^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm|quicktime))$/.test(file.type)) throw new Error('Use a JPG, PNG, WebP, GIF image or an MP4/WebM video.')
  if (file.size > 50 * 1024 * 1024) throw new Error('File must be under 50 MB.')
  const ext = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('images').upload(path, file, { cacheControl: '3600' })
  if (error) throw error
  return supabase.storage.from('images').getPublicUrl(path).data.publicUrl
}
