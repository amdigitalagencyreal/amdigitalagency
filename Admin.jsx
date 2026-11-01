import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, configured, uploadImage, isVideo } from '../lib/supabase.js'
import { DEFAULTS, CATS } from '../lib/defaults.js'

const err = (e) => (e && e.message) || String(e)

function Field({ f, value, onChange }) {
  const [busy, setBusy] = useState(false)
  const [m, setM] = useState('')
  const up = async (file) => {
    if (!file) return
    setBusy(true); setM('')
    try { onChange(await uploadImage(file)) } catch (e) { setM(err(e)) }
    setBusy(false)
  }
  return (
    <div className="fld">
      <label>{f.label}</label>
      {f.type === 'textarea' ? <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
        : f.type === 'select' ? <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>{f.options.map((o) => { const v = typeof o === 'object' ? o.v : o, l = typeof o === 'object' ? o.l : o; return <option key={v} value={v}>{l}</option> })}</select>
        : <input type={f.type === 'number' ? 'number' : 'text'} value={value ?? ''} onChange={(e) => onChange(f.type === 'number' ? Number(e.target.value) : e.target.value)} />}
      {f.type === 'text' && f.image && <>
        <input type="file" accept="image/*,video/*" onChange={(e) => up(e.target.files[0])} />
        {busy && <span className="msg">Uploading…</span>}{m && <span className="err">{m}</span>}
        {value && (isVideo(value) ? <video src={value} controls style={{ width: 160, borderRadius: 8 }} /> : <img alt="" src={value} style={{ width: 120, borderRadius: 8 }} />)}
      </>}
    </div>
  )
}

function Manager({ table, title, fields, blank, label }) {
  const [rows, setRows] = useState([])
  const [ed, setEd] = useState(null)
  const [msg, setMsg] = useState('')
  const load = async () => {
    const { data, error } = await supabase.from(table).select('*').order('sort_order', { ascending: true })
    error ? setMsg(err(error)) : setRows(data)
  }
  useEffect(() => { load() }, [table])
  const save = async (e) => {
    e.preventDefault()
    const { id, created_at, ...v } = ed
    const { error } = id ? await supabase.from(table).update(v).eq('id', id) : await supabase.from(table).insert(v)
    if (error) return setMsg(err(error))
    setEd(null); setMsg('Saved. The public website now shows this change.'); load()
  }
  const del = async (id) => {
    if (!confirm('Delete this item?')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    error ? setMsg(err(error)) : (setMsg('Deleted.'), load())
  }
  return (
    <div>
      <h2>{title}</h2>
      {msg && <div className={'msg' + (/error|violates|permission|row-level/i.test(msg) ? ' err' : '')}>{msg}</div>}
      {ed ? (
        <form className="card" onSubmit={save} style={{ marginTop: 14 }}>
          {fields.map((f) => <Field key={f.k} f={f} value={ed[f.k]} onChange={(v) => setEd({ ...ed, [f.k]: v })} />)}
          <div style={{ display: 'flex', gap: 10 }}><button className="btn" type="submit">Save</button><button className="btn ghost" type="button" onClick={() => setEd(null)}>Cancel</button></div>
        </form>
      ) : <button className="btn sm" style={{ marginTop: 12 }} onClick={() => setEd({ ...blank, sort_order: rows.length + 1 })}>+ Add new</button>}
      <div className="list">
        {rows.map((r) => (
          <div className="item" key={r.id}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>{r.image_url && (isVideo(r.image_url) ? <span>🎬</span> : <img alt="" src={r.image_url} />)}<div><b>{label(r)}</b></div></div>
            <div style={{ display: 'flex', gap: 8 }}><button className="btn ghost sm" onClick={() => setEd(r)}>Edit</button><button className="btn danger sm" onClick={() => del(r.id)}>Delete</button></div>
          </div>
        ))}
        {!rows.length && <p className="sub">Nothing here yet.</p>}
      </div>
    </div>
  )
}

function Settings({ title, fields }) {
  const [v, setV] = useState({ ...DEFAULTS.settings })
  const [msg, setMsg] = useState('')
  useEffect(() => {
    supabase.from('site_settings').select('*').then(({ data }) => data && setV((p) => ({ ...p, ...Object.fromEntries(data.map((r) => [r.key, r.value])) })))
  }, [])
  const save = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('site_settings').upsert(fields.map((f) => ({ key: f.k, value: v[f.k] ?? '' })), { onConflict: 'key' })
    setMsg(error ? err(error) : 'Saved. The public website now shows this change.')
  }
  return (
    <form onSubmit={save}>
      <h2>{title}</h2>
      <div className="card" style={{ marginTop: 14 }}>
        {fields.map((f) => <Field key={f.k} f={f} value={v[f.k]} onChange={(x) => setV({ ...v, [f.k]: x })} />)}
        <button className="btn" type="submit">Save changes</button>
        {msg && <div className={'msg' + (msg.startsWith('Saved') ? '' : ' err')}>{msg}</div>}
      </div>
    </form>
  )
}

function Inquiries() {
  const [rows, setRows] = useState([])
  const [msg, setMsg] = useState('')
  const load = async () => {
    const { data, error } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false })
    error ? setMsg(err(error)) : setRows(data)
  }
  useEffect(() => { load() }, [])
  const setStatus = async (id, status) => { const { error } = await supabase.from('inquiries').update({ status }).eq('id', id); error ? setMsg(err(error)) : load() }
  const del = async (id) => { if (confirm('Delete this inquiry?')) { await supabase.from('inquiries').delete().eq('id', id); load() } }
  return (
    <div>
      <h2>Customer Inquiries</h2>{msg && <div className="msg err">{msg}</div>}
      <div className="list">
        {rows.map((r) => (
          <div className="card" key={r.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <b>{r.name} · {r.contact}</b><span className="tag">{new Date(r.created_at).toLocaleString()}</span>
            </div>
            <p className="tag" style={{ margin: '6px 0' }}>{r.service}</p>
            <p style={{ color: 'var(--mut)', whiteSpace: 'pre-wrap' }}>{r.message}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} style={{ width: 160 }}>{['new', 'contacted', 'closed'].map((s) => <option key={s}>{s}</option>)}</select>
              <button className="btn danger sm" onClick={() => del(r.id)}>Delete</button>
            </div>
          </div>
        ))}
        {!rows.length && <p className="sub">No inquiries yet.</p>}
      </div>
    </div>
  )
}

function Images() {
  const [files, setFiles] = useState([])
  const [msg, setMsg] = useState('')
  const url = (n) => supabase.storage.from('images').getPublicUrl(n).data.publicUrl
  const load = async () => {
    const { data, error } = await supabase.storage.from('images').list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })
    error ? setMsg(err(error)) : setFiles((data || []).filter((f) => f.name !== '.emptyFolderPlaceholder'))
  }
  useEffect(() => { load() }, [])
  const up = async (file) => { if (!file) return; try { await uploadImage(file); setMsg('Uploaded.'); load() } catch (e) { setMsg(err(e)) } }
  const del = async (n) => { if (!confirm('Delete this image?')) return; const { error } = await supabase.storage.from('images').remove([n]); error ? setMsg(err(error)) : load() }
  return (
    <div>
      <h2>Images</h2>{msg && <div className="msg">{msg}</div>}
      <div className="fld" style={{ marginTop: 12 }}><label>Upload a photo or video (max 50 MB)</label><input type="file" accept="image/*,video/*" onChange={(e) => up(e.target.files[0])} /></div>
      <div className="imgs">
        {files.map((f) => (
          <div key={f.name}>{isVideo(f.name) ? <video src={url(f.name)} controls style={{ width: '100%', borderRadius: 10 }} /> : <img alt="" src={url(f.name)} />}
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button className="btn ghost sm" onClick={() => { navigator.clipboard.writeText(url(f.name)); setMsg('Link copied.') }}>Copy link</button>
              <button className="btn danger sm" onClick={() => del(f.name)}>Delete</button></div></div>
        ))}
      </div>
    </div>
  )
}

function Dashboard() {
  const [n, setN] = useState({})
  useEffect(() => {
    const c = async (t, f) => { let q = supabase.from(t).select('*', { count: 'exact', head: true }); if (f) q = f(q); const { count } = await q; return count ?? 0 }
    const items = [['Services', 'services'], ['Portfolio items', 'portfolio'], ['Artworks', 'artworks'], ['Experience', 'experience'], ['Skills', 'skills'], ['Reviews', 'testimonials'], ['FAQs', 'faqs'], ['Packages', 'packages'], ['Total inquiries', 'inquiries']]
    Promise.all([...items.map((i) => c(i[1])), c('inquiries', (q) => q.eq('status', 'new'))]).then((r) => {
      const o = {}; items.forEach((i, k) => { o[i[0]] = r[k] }); o['New inquiries'] = r[items.length]; setN(o)
    })
  }, [])
  return (
    <div><h2>Dashboard</h2>
      <div className="stats" style={{ marginTop: 14 }}>{Object.entries(n).map(([k, v]) => <div className="card stat" key={k}><b style={{ display: 'block', fontSize: 34, color: 'var(--cyan)' }}>{v}</b>{k}</div>)}</div>
      <p className="sub" style={{ marginTop: 20 }}>Every change you save here appears on the public website straight away. Sections with no items are hidden automatically.</p>
    </div>
  )
}

function CustomItems() {
  const [secs, setSecs] = useState(null)
  useEffect(() => { supabase.from('custom_sections').select('id,title').order('sort_order').then(({ data }) => setSecs(data || [])) }, [])
  if (secs === null) return <p className="sub">Loading…</p>
  if (!secs.length) return <p className="sub">Create a section first in "Custom Sections", then add its items here.</p>
  const fields = [{ k: 'section_id', label: 'Section', type: 'select', options: secs.map((x) => ({ v: x.id, l: x.title })) },
    { k: 'title', label: 'Title', type: 'text' }, { k: 'text', label: 'Text', type: 'textarea' }, { k: 'image_url', label: 'Image (optional)', type: 'text', image: true }, { k: 'sort_order', label: 'Order', type: 'number' }]
  return <Manager table="custom_items" title="Custom Section Items" fields={fields} blank={{ section_id: secs[0].id, title: '', text: '', image_url: '' }} label={(r) => `${r.title} · ${(secs.find((x) => x.id === r.section_id) || {}).title || '?'}`} />
}

const TEXT_FIELDS = [
  { k: 'tagline', label: 'Main tagline', type: 'text' }, { k: 'phrases', label: 'Typing phrases (one per line)', type: 'textarea' },
  { k: 'hero_text', label: 'Intro text under the tagline', type: 'textarea' }, { k: 'whatsapp', label: 'WhatsApp number (with country code, e.g. 923001234567)', type: 'text' },
  { k: 'email', label: 'Email', type: 'text' }, { k: 'facebook', label: 'Facebook link', type: 'text' }, { k: 'instagram', label: 'Instagram link', type: 'text' }
]
const ABOUT_FIELDS = [{ k: 'about_title', label: 'About title', type: 'text' }, { k: 'about_text', label: 'About text', type: 'textarea' }]
const SERVICE_FIELDS = [{ k: 'icon', label: 'Icon (an emoji)', type: 'text' }, { k: 'title', label: 'Title', type: 'text' }, { k: 'description', label: 'Description', type: 'textarea' }, { k: 'sort_order', label: 'Order', type: 'number' }]
const PORT_FIELDS = [{ k: 'title', label: 'Title', type: 'text' }, { k: 'category', label: 'Category', type: 'select', options: CATS }, { k: 'image_url', label: 'Image', type: 'text', image: true }, { k: 'sort_order', label: 'Order', type: 'number' }]
const PKG_FIELDS = [{ k: 'name', label: 'Package name', type: 'text' }, { k: 'price', label: 'Price (shown as typed, e.g. Rs 5,000)', type: 'text' }, { k: 'features', label: 'Features (one per line)', type: 'textarea' }, { k: 'sort_order', label: 'Order', type: 'number' }]

const T = (k, label, type = 'text', extra = {}) => ({ k, label, type, ...extra })
const ORD = T('sort_order', 'Order (1 = first)', 'number')
const ART_FIELDS = [T('title', 'Title'), T('description', 'Description', 'textarea'), T('image_url', 'Artwork image', 'text', { image: true }), ORD]
const EXP_FIELDS = [T('role', 'Role / title'), T('company', 'Company'), T('period', 'Period (e.g. 2022 – Present)'), T('description', 'Description', 'textarea'), ORD]
const SKILL_FIELDS = [T('name', 'Skill'), T('level', 'Level (0–100)', 'number'), ORD]
const REV_FIELDS = [T('name', 'Client name'), T('role', 'Role / company'), T('quote', 'Review', 'textarea'), T('rating', 'Stars (1–5)', 'number'), T('image_url', 'Photo (optional)', 'text', { image: true }), ORD]
const FAQ_FIELDS = [T('question', 'Question'), T('answer', 'Answer', 'textarea'), ORD]
const STAT_FIELDS = [T('label', 'Label (e.g. Happy clients)'), T('value', 'Number', 'number'), T('suffix', 'Suffix (e.g. +)'), ORD]
const CS_FIELDS = [T('title', 'Section title'), T('subtitle', 'Subtitle'), T('layout', 'Layout', 'select', { options: ['gallery', 'list', 'timeline'] }), T('visible', 'Show on website?', 'select', { options: ['yes', 'no'] }), ORD]

const TABS = ['Dashboard', 'Services', 'Portfolio', 'Artwork', 'Experience', 'Skills', 'Stats', 'Reviews', 'FAQ', 'Packages', 'Custom Sections', 'Custom Items', 'Website Text', 'About Us', 'Inquiries', 'Images']

export default function Admin() {
  const [session, setSession] = useState(undefined)
  const [isAdmin, setIsAdmin] = useState(null)
  const [tab, setTab] = useState('Dashboard')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!configured) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: l } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => l.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (!session) { setIsAdmin(null); return }
    supabase.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle().then(({ data }) => setIsAdmin(Boolean(data)))
  }, [session])

  const login = async (e) => {
    e.preventDefault(); setMsg('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
    if (error) setMsg(error.message)
  }
  const logout = () => supabase.auth.signOut()

  if (!configured) return <div className="adm"><div className="card login"><h2>Setup needed</h2><p className="sub">Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see README), then rebuild.</p><Link to="/">← Back to website</Link></div></div>
  if (session === undefined) return <div className="adm"><p className="sub">Loading…</p></div>
  if (!session) return (
    <div className="adm"><form className="card login" onSubmit={login}>
      <h2 className="grad">Admin Login</h2><p className="sub">AM Digital Agency</p>
      <div className="fld"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" /></div>
      <div className="fld"><label>Password</label><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required autoComplete="current-password" /></div>
      <button className="btn" type="submit">Sign in</button>{msg && <div className="msg err">{msg}</div>}
      <p style={{ marginTop: 14 }}><Link to="/">← Back to website</Link></p>
    </form></div>
  )
  if (isAdmin === null) return <div className="adm"><p className="sub">Checking permissions…</p></div>
  if (!isAdmin) return <div className="adm"><div className="card login"><h2>Not authorized</h2><p className="sub">This account is not on the administrators list. Ask the owner to add it (see README step 5).</p><button className="btn" onClick={logout}>Log out</button></div></div>

  return (
    <div className="adm">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2 className="grad">AM Admin Panel</h2>
        <div style={{ display: 'flex', gap: 8 }}><Link className="btn ghost sm" to="/">View website</Link><button className="btn danger sm" onClick={logout}>Logout</button></div>
      </div>
      <div className="bar">{TABS.map((t) => <button key={t} className={'tab' + (t === tab ? ' on' : '')} onClick={() => setTab(t)}>{t}</button>)}</div>
      {tab === 'Dashboard' && <Dashboard />}
      {tab === 'Services' && <Manager table="services" title="Services" fields={SERVICE_FIELDS} blank={{ icon: '⭐', title: '', description: '' }} label={(r) => `${r.icon} ${r.title}`} />}
      {tab === 'Portfolio' && <Manager table="portfolio" title="Portfolio" fields={PORT_FIELDS} blank={{ title: '', category: CATS[0], image_url: '' }} label={(r) => `${r.title} · ${r.category}`} />}
      {tab === 'Packages' && <Manager table="packages" title="Packages & Pricing" fields={PKG_FIELDS} blank={{ name: '', price: '', features: '' }} label={(r) => `${r.name} – ${r.price}`} />}
      {tab === 'Artwork' && <Manager table="artworks" title="My Artwork" fields={ART_FIELDS} blank={{ title: '', description: '', image_url: '' }} label={(r) => r.title} />}
      {tab === 'Experience' && <Manager table="experience" title="Experience" fields={EXP_FIELDS} blank={{ role: '', company: '', period: '', description: '' }} label={(r) => `${r.role} · ${r.period}`} />}
      {tab === 'Skills' && <Manager table="skills" title="Skills" fields={SKILL_FIELDS} blank={{ name: '', level: 80 }} label={(r) => `${r.name} – ${r.level}%`} />}
      {tab === 'Stats' && <Manager table="stats" title="Stats counters" fields={STAT_FIELDS} blank={{ label: '', value: 0, suffix: '+' }} label={(r) => `${r.value}${r.suffix} ${r.label}`} />}
      {tab === 'Reviews' && <Manager table="testimonials" title="Client Reviews" fields={REV_FIELDS} blank={{ name: '', role: '', quote: '', rating: 5, image_url: '' }} label={(r) => `${r.name} · ${'★'.repeat(r.rating)}`} />}
      {tab === 'FAQ' && <Manager table="faqs" title="FAQ" fields={FAQ_FIELDS} blank={{ question: '', answer: '' }} label={(r) => r.question} />}
      {tab === 'Custom Sections' && <Manager table="custom_sections" title="Custom Sections (make your own section)" fields={CS_FIELDS} blank={{ title: '', subtitle: '', layout: 'gallery', visible: 'yes' }} label={(r) => `${r.title} · ${r.layout}`} />}
      {tab === 'Custom Items' && <CustomItems />}
      {tab === 'Website Text' && <Settings title="Website Text & Contact Links" fields={TEXT_FIELDS} />}
      {tab === 'About Us' && <Settings title="About Us" fields={ABOUT_FIELDS} />}
      {tab === 'Inquiries' && <Inquiries />}
      {tab === 'Images' && <Images />}
    </div>
  )
}
