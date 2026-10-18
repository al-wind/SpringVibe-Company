import { html, raw } from 'hono/html'
import { RANGES } from './umami.js'
import { MAILBOX } from './resend.js'

const CSS = raw(`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--green:#2A9D5C;--green-dk:#1F7A47;--green-lt:#E8F5EE;--green-md:#A7D9BC;--orange:#F4A261;--bg:#FFFDF7;--surface:#FFFFFF;--border:#E8E4DC;--text:#1C1C1E;--muted:#6B7280;--danger:#C2410C;--radius:14px}
body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.55}
a{color:var(--green)}
nav{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 2rem;max-width:1200px;margin:0 auto;flex-wrap:wrap}
.logo{display:flex;align-items:center;gap:.6rem;text-decoration:none;color:var(--text)}
.logo img{height:40px;width:auto;display:block}
.logo-name{font-size:1.05rem;font-weight:700;letter-spacing:-.02em}
.logo-tld{color:var(--muted);font-weight:400}
.tabs{display:flex;gap:.25rem;align-items:center;flex-wrap:wrap}
.tabs a{font-size:.9rem;color:var(--muted);text-decoration:none;font-weight:600;padding:.45rem .85rem;border-radius:999px}
.tabs a:hover{color:var(--text)}
.tabs a.on{background:var(--green-lt);color:var(--green-dk)}
.badge{display:inline-block;min-width:1.3rem;padding:0 .4rem;border-radius:999px;background:var(--green);color:#fff;font-size:.72rem;text-align:center;margin-left:.3rem}
main{max-width:1200px;margin:0 auto;padding:0 2rem 4rem}
h1{font-size:1.6rem;font-weight:800;letter-spacing:-.03em;margin:1.25rem 0 1rem}
h2{font-size:1.05rem;font-weight:700;letter-spacing:-.02em;margin-bottom:.75rem}
.muted{color:var(--muted)}
.small{font-size:.85rem}
.btn{display:inline-block;padding:.6rem 1.25rem;border-radius:999px;font-size:.9rem;font-weight:600;text-decoration:none;border:none;cursor:pointer;font-family:inherit}
.btn:hover{opacity:.88}
.btn-primary{background:var(--green);color:#fff}
.btn-secondary{background:var(--surface);color:var(--text);border:1.5px solid var(--border)}
.btn-sm{padding:.35rem .85rem;font-size:.82rem}
.card{background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);padding:1.25rem 1.5rem}
.grid{display:grid;gap:1rem}
.kpis{grid-template-columns:repeat(auto-fit,minmax(170px,1fr))}
.kpi .label{font-size:.78rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-weight:600}
.kpi .value{font-size:1.9rem;font-weight:800;letter-spacing:-.03em;margin:.15rem 0}
.delta{font-size:.8rem;font-weight:600}
.delta.up{color:var(--green)}.delta.down{color:var(--danger)}.delta.flat{color:var(--muted)}
.two{grid-template-columns:repeat(auto-fit,minmax(320px,1fr))}
.toolbar{display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap}
.seg{display:inline-flex;border:1.5px solid var(--border);border-radius:999px;overflow:hidden;background:var(--surface)}
.seg a{padding:.4rem .9rem;font-size:.85rem;font-weight:600;color:var(--muted);text-decoration:none}
.seg a.on{background:var(--green);color:#fff}
table.rank{width:100%;border-collapse:collapse;font-size:.9rem}
table.rank td{padding:.4rem 0;border-bottom:1px solid var(--border);vertical-align:middle}
table.rank tr:last-child td{border-bottom:none}
table.rank td.n{text-align:right;font-variant-numeric:tabular-nums;font-weight:600;width:4.5rem}
.bar{height:6px;border-radius:3px;background:var(--green-md);margin-top:.25rem}
.chart svg{display:block;width:100%;height:auto}
.legend{display:flex;gap:1rem;font-size:.8rem;color:var(--muted);margin-top:.5rem}
.legend i{display:inline-block;width:.75rem;height:.75rem;border-radius:2px;margin-right:.35rem;vertical-align:-1px}
.list{background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);overflow:hidden}
.list a.row{display:grid;grid-template-columns:minmax(140px,220px) 1fr auto;gap:1rem;padding:.85rem 1.25rem;border-bottom:1px solid var(--border);text-decoration:none;color:inherit;align-items:baseline}
.list a.row:last-child{border-bottom:none}
.list a.row:hover{background:#FAF8F3}
.list .who{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.list .what{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted)}
.list .what b{color:var(--text);font-weight:500}
.list .unread .who,.list .unread .what b{font-weight:700}
.list .when{font-size:.8rem;color:var(--muted);white-space:nowrap}
.empty{padding:2.5rem;text-align:center;color:var(--muted)}
.msg{background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);margin-bottom:1rem}
.msg.out{border-color:var(--green-md);background:#FBFEFC}
.msg header{display:flex;justify-content:space-between;gap:1rem;padding:.9rem 1.25rem;border-bottom:1px solid var(--border);flex-wrap:wrap}
.msg .body{padding:1.1rem 1.25rem;white-space:pre-wrap;word-wrap:break-word;font-size:.95rem}
.msg iframe{width:100%;min-height:420px;border:0;border-top:1px solid var(--border);background:#fff}
.msg footer{padding:.6rem 1.25rem;border-top:1px solid var(--border);font-size:.82rem;display:flex;gap:1rem;flex-wrap:wrap}
.chip{display:inline-block;font-size:.72rem;font-weight:600;padding:.15rem .5rem;border-radius:999px;background:#F3F4F6;color:var(--muted);margin-left:.4rem}
.chip.warn{background:#FEF2F2;color:var(--danger)}
form.mail{display:grid;gap:.75rem}
form.mail label{display:grid;gap:.3rem;font-size:.82rem;font-weight:600}
input[type=text],input[type=email],input[type=search],textarea{font:inherit;font-size:.95rem;padding:.6rem .8rem;border:1.5px solid var(--border);border-radius:10px;background:var(--surface);color:var(--text);width:100%}
textarea{min-height:10rem;resize:vertical}
input:focus,textarea:focus{outline:2px solid var(--green);outline-offset:1px;border-color:transparent}
.actions{display:flex;gap:.6rem;flex-wrap:wrap;align-items:center}
.notice{background:var(--green-lt);color:var(--green-dk);padding:.7rem 1rem;border-radius:10px;font-size:.9rem;margin-bottom:1rem}
.error{background:#FEF2F2;color:var(--danger);padding:.7rem 1rem;border-radius:10px;font-size:.9rem;margin-bottom:1rem}
.setup{border-style:dashed;color:var(--muted);font-size:.9rem}
.setup code{background:#F3F4F6;padding:.05rem .35rem;border-radius:4px;font-size:.85em;color:var(--text)}
.login{max-width:420px;margin:5rem auto;text-align:center;display:grid;gap:1.25rem}
@media (max-width:640px){nav{padding:.75rem 1rem}main{padding:0 1rem 3rem}.list a.row{grid-template-columns:1fr auto}.list .what{grid-column:1/-1;grid-row:2}}
`)

const fmt = new Intl.NumberFormat('en')
const n = (v) => fmt.format(Math.round(v))
const pct = (v) => `${Math.round(v * 100)}%`
const dur = (s) => (s < 60 ? `${Math.round(s)}s` : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`)
const TZ = process.env.STATS_TIMEZONE || 'Europe/Oslo'

export const when = (d) => {
  const date = new Date(d)
  const diff = Date.now() - date
  if (diff < 86400_000 && date.getDate() === new Date().getDate())
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
  if (diff < 300 * 86400_000) return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: TZ })
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ })
}
const fullWhen = (d) =>
  new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: TZ })

const page = (title, user, active, body, { unread = 0 } = {}) => html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>${title} — SpringVibe internal</title>
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>${CSS}</style>
</head>
<body>
  <header>
    <nav>
      <a class="logo" href="/">
        <img src="/mascot-240.png" alt="SpringVibe mascot" width="35" height="40" />
        <span class="logo-name">SpringVibe<span class="logo-tld"> internal</span></span>
      </a>
      ${user
        ? html`<div class="tabs">
            <a href="/" class="${active === 'home' ? 'on' : ''}">Overview</a>
            <a href="/inbox" class="${active === 'inbox' ? 'on' : ''}">Inbox${unread ? html`<span class="badge">${unread}</span>` : ''}</a>
            <a href="/stats" class="${active === 'stats' ? 'on' : ''}">Statistics</a>
            <form method="post" action="/logout" style="display:inline;margin-left:.5rem">
              <button class="btn btn-secondary btn-sm">Sign out ${user.login}</button>
            </form>
          </div>`
        : ''}
    </nav>
  </header>
  <main>${body}</main>
</body>
</html>`

export const loginPage = ({ error, configured }) =>
  page(
    'Sign in',
    null,
    '',
    html`<div class="login">
      <h1>SpringVibe internal</h1>
      <p class="muted">Inbox and statistics for the SpringVibe team.</p>
      ${error ? html`<div class="error">${error}</div>` : ''}
      ${configured
        ? html`<a class="btn btn-primary" href="/auth/start">Sign in with GitHub</a>`
        : html`<div class="error">GitHub sign-in isn't set up yet. Set GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET,
            SESSION_SECRET and ADMIN_GITHUB_USERS on the internal service.</div>`}
    </div>`,
  )

/* ── statistics pieces ───────────────────────────── */

const delta = (now, prev, { invert = false } = {}) => {
  if (!prev) return html`<span class="delta flat">no earlier data</span>`
  const d = (now - prev) / prev
  const good = invert ? d < 0 : d > 0
  const cls = Math.abs(d) < 0.005 ? 'flat' : good ? 'up' : 'down'
  return html`<span class="delta ${cls}">${d > 0 ? '▲' : d < 0 ? '▼' : ''} ${pct(Math.abs(d))} vs previous period</span>`
}

const kpis = (s) => html`
  <div class="grid kpis">
    <div class="card kpi"><div class="label">Visitors</div><div class="value">${n(s.now.visitors)}</div>${delta(s.now.visitors, s.prev.visitors)}</div>
    <div class="card kpi"><div class="label">Page views</div><div class="value">${n(s.now.pageviews)}</div>${delta(s.now.pageviews, s.prev.pageviews)}</div>
    <div class="card kpi"><div class="label">Visits</div><div class="value">${n(s.now.visits)}</div>${delta(s.now.visits, s.prev.visits)}</div>
    <div class="card kpi"><div class="label">Bounce rate</div><div class="value">${pct(s.now.bounceRate)}</div>${delta(s.now.bounceRate, s.prev.bounceRate, { invert: true })}</div>
    <div class="card kpi"><div class="label">Avg. visit</div><div class="value">${dur(s.now.avgVisitSec)}</div>${delta(s.now.avgVisitSec, s.prev.avgVisitSec)}</div>
  </div>`

// Every bucket in the range, so quiet days show as zero instead of disappearing.
function buckets(ms, unit) {
  const parts = (d) =>
    Object.fromEntries(
      new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
        .formatToParts(d)
        .map((p) => [p.type, p.value]),
    )
  const step = unit === 'hour' ? 3600_000 : 86400_000
  const out = []
  const seen = new Set()
  for (let t = Date.now() - ms + step; t <= Date.now() + 1000; t += step) {
    const p = parts(new Date(t))
    const key = unit === 'hour' ? `${p.year}-${p.month}-${p.day} ${p.hour}` : `${p.year}-${p.month}-${p.day}`
    if (!seen.has(key)) seen.add(key), out.push({ key, p })
  }
  return out
}

const chart = (r) => {
  const keyLen = r.series.unit === 'hour' ? 13 : 10
  const sum = (rows) => rows.reduce((m, { x, y }) => m.set(x.slice(0, keyLen).replace('T', ' '), (m.get(x.slice(0, keyLen).replace('T', ' ')) || 0) + y), new Map())
  const pv = sum(r.series.pageviews)
  const vi = sum(r.series.visitors)
  const bs = buckets(r.range.ms, r.series.unit)
  const data = bs.map((b) => ({ ...b, pv: pv.get(b.key) || 0, vi: vi.get(b.key) || 0 }))
  const max = Math.max(1, ...data.map((d) => d.pv))
  const nice = (() => {
    const pow = 10 ** Math.floor(Math.log10(max))
    return [1, 2, 2.5, 5, 10].map((f) => f * pow).find((v) => v >= max)
  })()
  const W = 900, H = 240, L = 36, B = 26, T = 8
  const cw = (W - L) / data.length
  const bw = Math.max(2, cw * 0.7)
  const y = (v) => T + (H - T - B) * (1 - v / nice)
  const label = (d) =>
    r.series.unit === 'hour'
      ? `${d.p.hour}:00`
      : new Date(`${d.key}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const every = Math.ceil(data.length / 10)
  return html`<div class="card chart">
    <h2>Traffic</h2>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Page views and visitors per ${r.series.unit}">
      ${[0, 0.5, 1].map(
        (f) => html`<line x1="${L}" x2="${W}" y1="${y(nice * f)}" y2="${y(nice * f)}" stroke="#E8E4DC" stroke-width="1" />
          <text x="${L - 6}" y="${y(nice * f) + 4}" text-anchor="end" font-size="11" fill="#6B7280">${n(nice * f)}</text>`,
      )}
      ${data.map((d, i) => {
        const x = L + i * cw + (cw - bw) / 2
        return html`<g>
          <title>${label(d)}: ${n(d.vi)} visitors, ${n(d.pv)} page views</title>
          <rect x="${x}" y="${y(d.pv)}" width="${bw}" height="${H - B - y(d.pv)}" rx="2" fill="#A7D9BC" />
          <rect x="${x}" y="${y(d.vi)}" width="${bw}" height="${H - B - y(d.vi)}" rx="2" fill="#2A9D5C" />
          ${i % every === 0 ? html`<text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#6B7280">${label(d)}</text>` : ''}
        </g>`
      })}
    </svg>
    <div class="legend"><span><i style="background:#2A9D5C"></i>Visitors</span><span><i style="background:#A7D9BC"></i>Page views</span></div>
  </div>`
}

const COUNTRY = new Intl.DisplayNames(['en'], { type: 'region' })
const countryName = (c) => {
  try {
    return COUNTRY.of(c) || c
  } catch {
    return c
  }
}

const ranking = (title, rows, { fmtX = (x) => x, empty = 'Nothing yet' } = {}) => {
  const max = Math.max(1, ...rows.map((r) => r.y))
  return html`<div class="card">
    <h2>${title}</h2>
    ${rows.length
      ? html`<table class="rank">
          ${rows.map(
            (r) => html`<tr>
              <td>${fmtX(r.x)}<div class="bar" style="width:${Math.max(2, (r.y / max) * 100)}%"></div></td>
              <td class="n">${n(r.y)}</td>
            </tr>`,
          )}
        </table>`
      : html`<p class="muted small">${empty}</p>`}
  </div>`
}

const setupCard = (what, lines) => html`<div class="card setup"><h2>${what} isn't connected yet</h2>${lines}</div>`

export const statsSetup = setupCard(
  'Statistics',
  html`<p>Set <code>UMAMI_USERNAME</code>, <code>UMAMI_PASSWORD</code> and <code>UMAMI_WEBSITE_ID</code> on the
    internal service. The website ID is in Umami under Settings → Websites.</p>`,
)
export const mailSetup = setupCard(
  'Email',
  html`<p>Set <code>RESEND_API_KEY</code> and <code>RESEND_WEBHOOK_SECRET</code> on the internal service, and point a
    Resend <em>email.received</em> webhook at <code>https://internal.springvibe.cafe/hooks/resend</code>.</p>`,
)

const rangeSwitch = (key, path) => html`<div class="seg">
  ${Object.entries(RANGES).map(([k, v]) => html`<a href="${path}?range=${k}" class="${k === key ? 'on' : ''}" title="${v.label}">${k}</a>`)}
</div>`

export const statsPage = (user, { key, report, error, unread }) =>
  page(
    'Statistics',
    user,
    'stats',
    html`
      <div class="toolbar">
        <h1>Statistics <span class="muted small" style="font-weight:500">${RANGES[key].label}</span></h1>
        ${rangeSwitch(key, '/stats')}
      </div>
      ${error ? html`<div class="error">${error}</div>` : ''}
      ${report === null
        ? statsSetup
        : report
          ? html`<div class="grid" style="gap:1rem">
              ${kpis(report)} ${chart(report)}
              <div class="grid two">
                ${ranking('Sites', report.hostnames)}
                ${ranking('Pages', report.paths)}
                ${ranking('Referrers', report.referrers, { empty: 'No referrers yet — mostly direct visits' })}
                ${ranking('Button clicks', report.events, { empty: 'No tracked clicks yet' })}
                ${ranking('Countries', report.countries, { fmtX: countryName })}
                ${ranking('Devices', report.devices)}
                ${ranking('Browsers', report.browsers)}
              </div>
            </div>`
          : ''}
    `,
    { unread },
  )

/* ── overview ───────────────────────────────────── */

const threadRows = (threads) =>
  threads.length
    ? html`<div class="list">
        ${threads.map(
          (t) => html`<a class="row ${t.unread ? 'unread' : ''}" href="/inbox/${t.id}">
            <span class="who">${t.direction === 'out' ? 'To: ' : ''}${t.from_name || t.contact}${t.count > 1 ? html`<span class="chip">${t.count}</span>` : ''}</span>
            <span class="what"><b>${t.subject}</b> — ${t.snippet}</span>
            <span class="when">${when(t.last_at)}</span>
          </a>`,
        )}
      </div>`
    : html`<div class="list"><div class="empty">No mail here.</div></div>`

export const homePage = (user, { summary, statsError, threads, unread, mailReady }) =>
  page(
    'Overview',
    user,
    'home',
    html`
      <h1>Good to see you, ${user.login}</h1>
      <div class="grid" style="gap:1.5rem">
        <section>
          <div class="toolbar" style="margin-bottom:.75rem"><h2 style="margin:0">Last 7 days</h2><a class="small" href="/stats">All statistics →</a></div>
          ${statsError ? html`<div class="error">${statsError}</div>` : summary ? kpis(summary) : statsSetup}
        </section>
        <section>
          <div class="toolbar" style="margin-bottom:.75rem">
            <h2 style="margin:0">Inbox ${unread ? html`<span class="badge">${unread} unread</span>` : ''}</h2>
            <a class="small" href="/inbox">Open inbox →</a>
          </div>
          ${mailReady ? '' : html`<div style="margin-bottom:1rem">${mailSetup}</div>`}
          ${threadRows(threads)}
        </section>
      </div>`,
    { unread },
  )

/* ── inbox ──────────────────────────────────────── */

export const inboxPage = (user, { threads, folder, q, unread, notice, mailReady }) =>
  page(
    'Inbox',
    user,
    'inbox',
    html`
      <div class="toolbar">
        <h1>${MAILBOX}</h1>
        <a class="btn btn-primary btn-sm" href="/inbox/new">New message</a>
      </div>
      ${notice ? html`<div class="notice">${notice}</div>` : ''}
      ${mailReady ? '' : html`<div style="margin-bottom:1rem">${mailSetup}</div>`}
      <div class="toolbar" style="margin-bottom:1rem">
        <div class="seg">
          <a href="/inbox" class="${folder === 'inbox' ? 'on' : ''}">Inbox</a>
          <a href="/inbox?folder=sent" class="${folder === 'sent' ? 'on' : ''}">Sent</a>
          <a href="/inbox?folder=archived" class="${folder === 'archived' ? 'on' : ''}">Archived</a>
        </div>
        <form method="get" action="/inbox" style="flex:1;max-width:360px">
          <input type="hidden" name="folder" value="${folder}" />
          <input type="search" name="q" value="${q}" placeholder="Search mail" aria-label="Search mail" />
        </form>
      </div>
      ${threadRows(threads)}`,
    { unread },
  )

const authChip = (auth) => {
  if (!auth) return ''
  const failed = ['spf', 'dkim', 'dmarc'].filter((k) => auth[k] && auth[k] !== 'pass')
  return failed.length
    ? html`<span class="chip warn" title="Sender checks: SPF ${auth.spf}, DKIM ${auth.dkim}, DMARC ${auth.dmarc}">Unverified sender</span>`
    : ''
}

const messageCard = (m) => html`<article class="msg ${m.direction}" id="m${m.id}">
  <header>
    <div>
      <strong>${m.direction === 'out' ? `${m.sent_by ? `${m.sent_by} · ` : ''}${m.from_addr}` : m.from_name || m.from_addr}</strong>
      ${m.direction === 'in' && m.from_name ? html`<span class="muted small"> &lt;${m.from_addr}&gt;</span>` : ''}
      ${authChip(m.auth)}
      <div class="muted small">to ${m.to_addrs.join(', ')}${m.cc_addrs.length ? ` · cc ${m.cc_addrs.join(', ')}` : ''}</div>
    </div>
    <span class="muted small">${fullWhen(m.at)}</span>
  </header>
  ${m.text_body
    ? html`<div class="body">${m.text_body.trim()}</div>`
    : m.html_body
      ? html`<iframe sandbox src="/messages/${m.id}/html" title="Email content" loading="lazy"></iframe>`
      : html`<div class="body muted">(empty message)</div>`}
  ${m.text_body && m.html_body || m.attachments.length
    ? html`<footer>
        ${m.text_body && m.html_body ? html`<a href="/messages/${m.id}/html" target="_blank" rel="noopener">View original formatting</a>` : ''}
        ${m.attachments.map(
          (a) => html`<a href="/messages/${m.id}/attachments/${a.id}" target="_blank" rel="noopener">📎 ${a.filename} <span class="muted">(${Math.ceil((a.size || 0) / 1024)} KB)</span></a>`,
        )}
      </footer>`
    : ''}
</article>`

export const threadPage = (user, { thread, messages, unread, notice, error, draft, mailReady }) => {
  const lastIn = [...messages].reverse().find((m) => m.direction === 'in')
  const subject = /^re:/i.test(thread.subject) ? thread.subject : `Re: ${thread.subject}`
  return page(
    thread.subject,
    user,
    'inbox',
    html`
      <div class="toolbar">
        <h1>${thread.subject}</h1>
        <div class="actions">
          <a class="btn btn-secondary btn-sm" href="/inbox${thread.archived ? '?folder=archived' : ''}">← Back</a>
          <form method="post" action="/inbox/${thread.id}/${thread.archived ? 'unarchive' : 'archive'}">
            <button class="btn btn-secondary btn-sm">${thread.archived ? 'Move to inbox' : 'Archive'}</button>
          </form>
          <form method="post" action="/inbox/${thread.id}/unread"><button class="btn btn-secondary btn-sm">Mark unread</button></form>
        </div>
      </div>
      ${notice ? html`<div class="notice">${notice}</div>` : ''}
      ${messages.map(messageCard)}
      <div class="card" id="reply">
        <h2>Reply to ${lastIn ? lastIn.from_name || lastIn.from_addr : thread.contact}</h2>
        ${error ? html`<div class="error">${error}</div>` : ''}
        ${mailReady
          ? html`<form class="mail" method="post" action="/inbox/${thread.id}/reply">
              <input type="hidden" name="subject" value="${subject}" />
              <textarea name="text" required placeholder="Write your reply…">${draft || ''}</textarea>
              <div class="actions">
                <button class="btn btn-primary">Send from ${MAILBOX}</button>
                <span class="muted small">Sends as plain text and keeps the conversation threaded.</span>
              </div>
            </form>`
          : mailSetup}
      </div>`,
    { unread },
  )
}

export const composePage = (user, { unread, error, draft = {}, mailReady }) =>
  page(
    'New message',
    user,
    'inbox',
    html`
      <h1>New message</h1>
      ${error ? html`<div class="error">${error}</div>` : ''}
      ${mailReady
        ? html`<form class="card mail" method="post" action="/inbox/new" style="max-width:760px">
            <label>To <input type="email" name="to" required multiple value="${draft.to || ''}" placeholder="name@example.com" /></label>
            <label>Subject <input type="text" name="subject" required maxlength="200" value="${draft.subject || ''}" /></label>
            <label>Message <textarea name="text" required>${draft.text || ''}</textarea></label>
            <div class="actions">
              <button class="btn btn-primary">Send from ${MAILBOX}</button>
              <a class="btn btn-secondary" href="/inbox">Cancel</a>
            </div>
          </form>`
        : mailSetup}`,
    { unread },
  )
