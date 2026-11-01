import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useContent, wa } from '../lib/useContent.js'
import { supabase, configured, isVideo } from '../lib/supabase.js'

const Media = ({ u, alt, className }) => isVideo(u)
  ? <video className={className} src={u} controls playsInline preload="metadata" />
  : <img className={className} alt={alt} src={u} loading="lazy" />
import { CATS } from '../lib/defaults.js'

function Globe() {
  const ref = useRef(null)
  useEffect(() => {
    const cv = ref.current, g = cv.getContext('2d'), N = 240, P = []
    for (let i = 0; i < N; i++) { const y = 1 - 2 * i / (N - 1), r = Math.sqrt(1 - y * y), a = i * 2.39996; P.push([Math.cos(a) * r, y, Math.sin(a) * r]) }
    let ax = 0, mx = 0, my = 0, raf
    const mm = (e) => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5 }
    addEventListener('mousemove', mm)
    const rm = matchMedia('(prefers-reduced-motion:reduce)').matches
    const f = () => {
      g.clearRect(0, 0, 700, 700); ax += rm ? 0 : .004
      const cA = Math.cos(ax + mx), sA = Math.sin(ax + mx), cB = Math.cos(.4 + my * .5), sB = Math.sin(.4 + my * .5)
      const Q = P.map((p) => { const x = p[0] * cA + p[2] * sA; let z = -p[0] * sA + p[2] * cA; const y = p[1] * cB - z * sB; z = p[1] * sB + z * cB; const s = 1 / (1.9 - z * .6); return [350 + x * 250 * s * 1.3, 350 + y * 250 * s * 1.3, z] })
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const dx = Q[i][0] - Q[j][0], dy = Q[i][1] - Q[j][1], d = dx * dx + dy * dy
        if (d < 1500) { g.strokeStyle = `rgba(39,150,255,${(1 - d / 1500) * .35 * (Q[i][2] + 1.4) / 2.4})`; g.beginPath(); g.moveTo(Q[i][0], Q[i][1]); g.lineTo(Q[j][0], Q[j][1]); g.stroke() }
      }
      Q.forEach((q) => { g.fillStyle = `rgba(${q[2] > 0 ? '120,230,255' : '40,110,255'},${.35 + q[2] * .4})`; g.beginPath(); g.arc(q[0], q[1], 1.6 + q[2] * 1.2, 0, 6.3); g.fill() })
      if (!rm) raf = requestAnimationFrame(f)
    }
    f()
    return () => { cancelAnimationFrame(raf); removeEventListener('mousemove', mm) }
  }, [])
  return <canvas id="cv" ref={ref} width="700" height="700" />
}

function Typed({ phrases }) {
  const [t, setT] = useState('')
  useEffect(() => {
    const list = phrases.split('\n').filter(Boolean)
    if (!list.length) return
    let i = 0, j = 0, del = false, timer
    const tick = () => {
      const w = list[i % list.length]; setT(w.slice(0, j))
      if (!del && j === w.length) { del = true; timer = setTimeout(tick, 1500); return }
      if (del && j === 0) { del = false; i++ }
      j += del ? -1 : 1
      timer = setTimeout(tick, del ? 35 : 75)
    }
    tick()
    return () => clearTimeout(timer)
  }, [phrases])
  return <span className="type">{t}</span>
}


const d = (k) => ({ '--d': `${Math.min(k, 8) * 70}ms` })

function Count({ to, suffix }) {
  const ref = useRef(null)
  const [n, setN] = useState(0)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const step = (t) => { const p = Math.min(1, (t - t0) / 1600); setN(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step) }
      requestAnimationFrame(step)
    }, { threshold: .4 })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [to])
  return <b ref={ref}>{n.toLocaleString()}{suffix}</b>
}

function Progress() {
  const r = useRef(null)
  useEffect(() => {
    const f = () => { const h = document.documentElement; r.current.style.width = (h.scrollTop / ((h.scrollHeight - h.clientHeight) || 1) * 100) + '%' }
    addEventListener('scroll', f, { passive: true })
    return () => removeEventListener('scroll', f)
  }, [])
  return <div className="prog" ref={r} />
}

const Sec = ({ id, title, sub, children }) => (
  <section id={id}><div className="wrap">
    <h2 className="grad rv">{title}</h2>{sub && <p className="sub rv">{sub}</p>}{children}
  </div></section>
)

export default function Home() {
  const C = useContent()
  const { services, portfolio, packages, artworks, experience, skills, testimonials, faqs, stats, custom_sections, custom_items, settings: s } = C
  const [cat, setCat] = useState('All')
  const [status, setStatus] = useState('')
  const [lb, setLb] = useState(null)
  const io = useRef(null)

  useEffect(() => {
    let cur = null
    const tilt = (e) => {
      const el = document.elementFromPoint(e.clientX, e.clientY), c = el && el.closest('.tilt')
      if (cur && cur !== c) cur.style.transform = ''
      cur = c; if (!c) return
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5
      c.style.setProperty('--mx', (x + .5) * 100 + '%'); c.style.setProperty('--my', (y + .5) * 100 + '%')
      c.style.transform = `rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateZ(8px)`
    }
    addEventListener('mousemove', tilt)
    io.current = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')), { threshold: .08 })
    return () => { removeEventListener('mousemove', tilt); io.current.disconnect() }
  }, [])
  useEffect(() => { document.querySelectorAll('.rv:not(.in)').forEach((n) => io.current && io.current.observe(n)) })

  const nav = [['services', 'Services', services.length], ['work', 'Portfolio', 1], ['art', 'Artwork', artworks.length], ['exp', 'Experience', experience.length + skills.length],
    ['packages', 'Packages', packages.length], ['faq', 'FAQ', faqs.length], ['contact', 'Contact', 1]].filter((x) => x[2])
  const marq = [...services.map((x) => x.title), ...skills.map((x) => x.name)]
  const shown = portfolio.filter((w) => cat === 'All' || w.category === cat)

  const submit = async (e) => {
    e.preventDefault()
    const f = new FormData(e.target)
    const v = { name: f.get('name'), contact: f.get('contact'), service: f.get('service'), message: f.get('message') }
    setStatus('Sending…')
    if (configured) await supabase.from('inquiries').insert(v)
    setStatus('Thank you! Opening WhatsApp…')
    location.href = wa(s.whatsapp, `Hi AM Digital Agency, I’m ${v.name}. Service: ${v.service}. ${v.message}`)
  }

  return (
    <>
      <div className="aurora"><i /><i /><i /></div>
      <Progress />
      <header><div className="wrap"><nav>
        <a className="logo" href="#top">AM<b>.</b> Digital Agency</a>
        <div className="links">{nav.map((n) => <a key={n[0]} href={'#' + n[0]}>{n[1]}</a>)}
          <a className="btn sm" href={wa(s.whatsapp, 'Hi AM Digital Agency, I want to place an order.')}>Order Now</a></div>
      </nav></div></header>
      <main id="top">
        <section className="hero">
          <img id="banner" alt="" src="/banner.jpg" />
          <Globe />
          <div className="wrap">
            <span className="pill">Digital Marketing &amp; Creative Solutions Agency</span>
            <h1 className="grad">{s.tagline}</h1>
            <h1 style={{ fontSize: 'clamp(26px,5vw,44px)', marginTop: 6 }}>We create <Typed phrases={s.phrases} /></h1>
            <p>{s.hero_text}</p>
            <div className="cta"><a className="btn" href={wa(s.whatsapp, 'Hi AM Digital Agency, I want to get started.')}>Get Started Today</a><a className="btn ghost" href="#work">View Our Work</a></div>
          </div>
        </section>

        {marq.length > 0 && <div className="marq"><div>{[...marq, ...marq].map((m, i) => <span key={i}>{m}</span>)}</div></div>}

        {stats.length > 0 && <section style={{ paddingBottom: 0 }}><div className="wrap"><div className="stats">
          {stats.map((x, k) => <div className="card stat rv tilt" style={d(k)} key={x.id}><Count to={x.value} suffix={x.suffix} /><span>{x.label}</span></div>)}
        </div></div></section>}

        <Sec id="services" title="Our Services" sub="Everything your brand needs to grow online, under one roof.">
          <div className="grid">{services.map((x, k) => <div className="card tilt rv" style={d(k)} key={x.id}><div className="ico">{x.icon}</div><h3>{x.title}</h3><p>{x.description}</p></div>)}</div>
        </Sec>

        <Sec id="work" title="Portfolio" sub="A look at what we create. Fresh projects are added regularly.">
          <div className="chips">{['All', ...CATS].map((c) => <button key={c} className={'chip' + (c === cat ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>)}</div>
          <div className="grid">
            {shown.map((w, k) => <div className="card work tilt rv" style={d(k)} key={w.id}>
              <div className="thumb">{w.image_url ? <Media u={w.image_url} alt={w.title} /> : 'Your project here'}</div>
              <div className="b"><span className="tag">{w.category}</span><h3 style={{ margin: '4px 0 0', fontSize: 18 }}>{w.title}</h3></div>
            </div>)}
            {!shown.length && <p className="sub">New projects coming soon.</p>}
          </div>
        </Sec>

        {artworks.length > 0 && <Sec id="art" title="My Artwork" sub="Original designs, edits and creative work. Tap an image to view it full size.">
          <div className="grid">{artworks.map((a, k) => <div className="card work tilt rv" style={d(k)} key={a.id}>
            <div className="thumb zoom" onClick={() => a.image_url && !isVideo(a.image_url) && setLb(a)}>{a.image_url ? <Media u={a.image_url} alt={a.title} /> : 'Artwork'}</div>
            <div className="b"><h3 style={{ fontSize: 18 }}>{a.title}</h3>{a.description && <p style={{ color: 'var(--mut)', fontSize: 14 }}>{a.description}</p>}</div>
          </div>)}</div>
        </Sec>}

        {(experience.length > 0 || skills.length > 0) && <Sec id="exp" title="Experience & Skills" sub="The work and tools behind the results.">
          <div className="two">
            {experience.length > 0 && <div className="tl">{experience.map((x, k) => <div className="tli rv" style={d(k)} key={x.id}>
              <small>{x.period}</small><h3>{x.role}</h3>{x.company && <p><b>{x.company}</b></p>}<p>{x.description}</p></div>)}</div>}
            {skills.length > 0 && <div className="card rv"><h3 style={{ marginBottom: 16 }}>Skills</h3>{skills.map((x) => <div className="sk" key={x.id}>
              <div><span>{x.name}</span><span>{x.level}%</span></div><div className="bar2"><i style={{ '--w': x.level + '%' }} /></div></div>)}</div>}
          </div>
        </Sec>}

        <Sec id="packages" title="Packages & Pricing" sub="Pick a plan, or ask for a fully custom one.">
          <div className="grid">{packages.map((p, k) => <div className="card tilt rv" style={d(k)} key={p.id}>
            <h3>{p.name}</h3><div className="price">{p.price}</div>
            <ul>{String(p.features || '').split('\n').filter(Boolean).map((x, i) => <li key={i}>{x}</li>)}</ul>
            <a className="btn sm" style={{ marginTop: 16 }} href={wa(s.whatsapp, `Hi, I’m interested in the ${p.name} package.`)}>Order Now</a>
          </div>)}</div>
        </Sec>

        {testimonials.length > 0 && <Sec id="reviews" title="Client Reviews" sub="What clients say about working with us.">
          <div className="grid">{testimonials.map((t, k) => <div className="card tilt rv" style={d(k)} key={t.id}>
            <div className="stars">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</div>
            <p className="quote">“{t.quote}”</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>{t.image_url && <img className="av" alt="" src={t.image_url} />}<div><b>{t.name}</b><br /><span className="tag">{t.role}</span></div></div>
          </div>)}</div>
        </Sec>}

        {custom_sections.filter((x) => x.visible !== 'no').map((sec) => {
          const items = custom_items.filter((i) => i.section_id === sec.id)
          if (!items.length) return null
          return (
            <Sec key={sec.id} id={'c-' + sec.id} title={sec.title} sub={sec.subtitle}>
              {sec.layout === 'timeline'
                ? <div className="tl">{items.map((i, k) => <div className="tli rv" style={d(k)} key={i.id}><h3>{i.title}</h3><p>{i.text}</p></div>)}</div>
                : <div className="grid">{items.map((i, k) => <div className="card tilt rv" style={d(k)} key={i.id}>
                  {sec.layout === 'gallery' && i.image_url && <div onClick={() => !isVideo(i.image_url) && setLb(i)}><Media className="gimg zoom" u={i.image_url} alt={i.title} /></div>}
                  <h3>{i.title}</h3><p>{i.text}</p></div>)}</div>}
            </Sec>
          )
        })}

        {faqs.length > 0 && <Sec id="faq" title="Frequently Asked Questions">
          <div style={{ display: 'grid', gap: 12, maxWidth: 780 }}>{faqs.map((f, k) => <details className="card rv" style={d(k)} key={f.id}><summary>{f.question}</summary><p>{f.answer}</p></details>)}</div>
        </Sec>}

        <section id="about"><div className="wrap"><div className="card tilt rv" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h2 className="grad">{s.about_title}</h2><p className="sub" style={{ margin: '0 auto' }}>{s.about_text}</p>
        </div></div></section>

        <section id="contact"><div className="wrap" style={{ display: 'grid', gap: 28, gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
          <div className="rv"><h2 className="grad">Let’s Work Together</h2><p className="sub">Tell us what you need. We receive your request and open WhatsApp so we can talk right away.</p>
            <div className="soc">
              <a className="btn sm" href={wa(s.whatsapp, 'Hi AM Digital Agency')}>WhatsApp</a>
              <a className="btn ghost sm" href={`mailto:${s.email}`}>Email</a>
              <a className="btn ghost sm" href={s.facebook}>Facebook</a>
              <a className="btn ghost sm" href={s.instagram}>Instagram</a>
            </div></div>
          <div className="card rv"><form onSubmit={submit}>
            <input name="name" placeholder="Your name" required maxLength={120} />
            <input name="contact" placeholder="Phone or email" required maxLength={160} />
            <select name="service"><option>Custom request</option>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
            <textarea name="message" placeholder="Describe your project or custom request" required maxLength={2000} />
            <button className="btn" type="submit">Send Request</button>
            {status && <div className="msg">{status}</div>}
          </form></div>
        </div></section>
      </main>
      <footer><div className="wrap">© AM Digital Agency · {s.tagline}<br /><Link to="/admin" style={{ textDecoration: 'underline' }}>Admin login</Link></div></footer>
      {lb && <div className="lb" onClick={() => setLb(null)}><img alt={lb.title} src={lb.image_url} /><b>{lb.title}</b></div>}
    </>
  )
}
