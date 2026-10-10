import { html, raw } from 'hono/html'
import { STATUSES } from './db.js'

export const appUrl = (slug) => (process.env.APP_PAGE_URL || 'https://{slug}.springvibe.cafe').replace('{slug}', slug)
const appsUrl = () => process.env.APPS_URL || 'https://apps.springvibe.cafe'
const UMAMI = () =>
  process.env.UMAMI_SCRIPT_URL && process.env.UMAMI_WEBSITE_ID
    ? html`<script defer src="${process.env.UMAMI_SCRIPT_URL}" data-website-id="${process.env.UMAMI_WEBSITE_ID}"></script>`
    : ''

const CSS = raw(`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--green:#2A9D5C;--green-lt:#E8F5EE;--orange:#F4A261;--bg:#FFFDF7;--surface:#FFFFFF;--border:#E8E4DC;--text:#1C1C1E;--muted:#6B7280;--danger:#C2410C;--radius:14px}
body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.6}
a{color:var(--green)}
nav{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1.25rem 2rem;max-width:1100px;margin:0 auto}
.logo{display:flex;align-items:center;gap:.6rem;text-decoration:none;color:var(--text)}
.logo img{height:44px;width:auto;display:block}
.logo-name{font-size:1.1rem;font-weight:700;letter-spacing:-.02em}
.logo-tld{color:var(--muted);font-weight:400}
.nav-links{display:flex;gap:1.25rem;align-items:center}
.nav-links a{font-size:.9rem;color:var(--muted);text-decoration:none;font-weight:500}
.nav-links a:hover{color:var(--text)}
main{max-width:1100px;margin:0 auto;padding:0 2rem 5rem}
.hero{text-align:center;padding:4.5rem 0 3rem;max-width:760px;margin:0 auto}
.hero .icon{font-size:3rem;margin-bottom:1rem}
.hero h1{font-size:clamp(2.2rem,5vw,3.4rem);font-weight:800;letter-spacing:-.04em;line-height:1.1;margin-bottom:1rem}
.hero p{font-size:1.15rem;color:var(--muted);max-width:560px;margin:0 auto 2rem}
.btn{display:inline-block;padding:.75rem 1.6rem;border-radius:999px;font-size:.95rem;font-weight:600;text-decoration:none;border:none;cursor:pointer;font-family:inherit;transition:opacity .15s,transform .15s}
.btn:hover{opacity:.88;transform:translateY(-1px)}
.btn-primary{background:var(--green);color:#fff}
.btn-secondary{background:var(--surface);color:var(--text);border:1.5px solid var(--border)}
.btn-danger{background:var(--surface);color:var(--danger);border:1.5px solid var(--border)}
.btn-sm{padding:.45rem 1rem;font-size:.85rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.25rem}
.card{background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);padding:1.75rem;display:flex;flex-direction:column;gap:1rem;text-decoration:none;color:inherit;transition:box-shadow .2s,transform .2s}
a.card:hover{box-shadow:0 8px 32px rgba(0,0,0,.08);transform:translateY(-2px)}
.card .app-icon{width:48px;height:48px;border-radius:12px;background:var(--green-lt);display:flex;align-items:center;justify-content:center;font-size:1.4rem}
.card h3{font-size:1.1rem;font-weight:700;letter-spacing:-.02em;margin-top:.4rem}
.card p{font-size:.92rem;color:var(--muted);flex:1}
.card .more{font-size:.88rem;font-weight:600;color:var(--green)}
.tag{display:inline-block;font-size:.72rem;font-weight:600;padding:.2rem .6rem;border-radius:999px;text-transform:uppercase;letter-spacing:.05em}
.tag-live{background:var(--green-lt);color:var(--green)}
.tag-beta{background:#FDF0E6;color:#B45309}
.tag-soon{background:#F3F4F6;color:var(--muted)}
.tag-draft{background:#FEF2F2;color:var(--danger)}
section.block{background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);padding:2rem;margin-top:1.25rem}
section.block h2{font-size:1.25rem;font-weight:700;letter-spacing:-.02em;margin-bottom:.75rem}
section.block p{color:var(--muted);margin-bottom:.75rem}
section.block ul{list-style:none;display:grid;gap:.5rem}
section.block li::before{content:'✓';color:var(--green);font-weight:700;margin-right:.6rem}
.section-header{text-align:center;margin:1rem 0 2.5rem}
.section-header h1{font-size:clamp(2rem,4vw,2.8rem);font-weight:800;letter-spacing:-.04em}
.section-header p{color:var(--muted)}
footer{border-top:1px solid var(--border);padding:2rem;text-align:center;color:var(--muted);font-size:.85rem}
footer a{color:var(--muted);text-decoration:none}
.banner{background:#FEF3C7;color:#92400E;text-align:center;padding:.5rem 1rem;font-size:.85rem;font-weight:500}
/* admin */
.admin h1{font-size:1.6rem;font-weight:800;letter-spacing:-.03em;margin:1.5rem 0 1.25rem}
.toolbar{display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap}
table{width:100%;border-collapse:collapse;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);overflow:hidden}
th,td{text-align:left;padding:.75rem 1rem;border-bottom:1px solid var(--border);font-size:.92rem;vertical-align:middle}
th{font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);background:#FAF8F3}
tr:last-child td{border-bottom:none}
.table-wrap{overflow-x:auto}
form.edit{display:grid;gap:1.1rem;max-width:720px}
form.edit label{display:grid;gap:.35rem;font-size:.85rem;font-weight:600}
form.edit .hint{font-weight:400;color:var(--muted);font-size:.8rem}
input[type=text],input[type=url],input[type=number],textarea,select{font:inherit;font-size:.95rem;padding:.6rem .8rem;border:1.5px solid var(--border);border-radius:10px;background:var(--surface);color:var(--text);width:100%}
textarea{min-height:7rem;resize:vertical}
input:focus,textarea:focus,select:focus{outline:2px solid var(--green);outline-offset:1px;border-color:transparent}
.row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.check{display:flex!important;align-items:center;gap:.5rem}
.actions{display:flex;gap:.75rem;flex-wrap:wrap;align-items:center}
.error{background:#FEF2F2;color:var(--danger);padding:.75rem 1rem;border-radius:10px;font-size:.9rem}
.notice{background:var(--green-lt);color:var(--green);padding:.75rem 1rem;border-radius:10px;font-size:.9rem}
.login{max-width:420px;margin:5rem auto;text-align:center;display:grid;gap:1.25rem}
@media (max-width:600px){nav{padding:1rem}main{padding:0 1rem 3rem}.row{grid-template-columns:1fr}.hero{padding:3rem 0 2rem}section.block{padding:1.25rem}}
`)

const head = (title, description, { image = true } = {}) => html`
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  ${description ? html`<meta name="description" content="${description}" />` : ''}
  <meta name="theme-color" content="#2A9D5C" />
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  ${image
    ? html`<meta property="og:title" content="${title}" />
        ${description ? html`<meta property="og:description" content="${description}" />` : ''}
        <meta property="og:image" content="${appsUrl()}/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />`
    : ''}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>${CSS}</style>`

const logo = (href) => html`
  <a class="logo" href="${href}">
    <img src="/mascot-240.png" alt="SpringVibe mascot" width="38" height="44" />
    <span class="logo-name">SpringVibe<span class="logo-tld">.cafe</span></span>
  </a>`

const footer = html`
  <footer>
    <p>© ${new Date().getFullYear()} SpringVibe · <a href="https://springvibe.cafe">springvibe.cafe</a> ·
      <a href="mailto:hello@springvibe.cafe">hello@springvibe.cafe</a></p>
  </footer>`

const statusTag = (s) => html`<span class="tag tag-${s}">${STATUSES[s]}</span>`
const paragraphs = (text) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => html`<p>${p}</p>`)

const publicPage = (title, description, body, { banner } = {}) => html`<!DOCTYPE html>
<html lang="en">
<head>${head(title, description)}${UMAMI()}</head>
<body>
  ${banner ? html`<div class="banner">${banner}</div>` : ''}
  <header>
    <nav>
      ${logo('https://springvibe.cafe')}
      <div class="nav-links">
        <a href="${appsUrl()}">All apps</a>
        <a href="mailto:hello@springvibe.cafe">Contact</a>
      </div>
    </nav>
  </header>
  <main>${body}</main>
  ${footer}
</body>
</html>`

export const inventoryPage = (apps) =>
  publicPage(
    'SpringVibe Apps',
    'Every SpringVibe app in one place — each one a distinct idea, all under one roof.',
    html`
      <div class="section-header" style="margin-top:3rem">
        <h1>Our apps</h1>
        <p>Each one a distinct idea, all under one roof.</p>
      </div>
      ${apps.length
        ? html`<div class="grid">
            ${apps.map(
              (a) => html`
                <a class="card" href="${appUrl(a.slug)}">
                  <div class="app-icon">${a.icon}</div>
                  <div>${statusTag(a.status)}<h3>${a.name}</h3></div>
                  <p>${a.tagline}</p>
                  <span class="more">Learn more →</span>
                </a>`,
            )}
          </div>`
        : html`<p style="text-align:center;color:var(--muted)">New apps are on the way.</p>`}`,
  )

export const appPage = (a, { preview = false } = {}) =>
  publicPage(
    `${a.name} — SpringVibe`,
    a.tagline,
    html`
      <section class="hero">
        <div class="icon">${a.icon}</div>
        <div style="margin-bottom:1rem">${statusTag(a.status)}</div>
        <h1>${a.name}</h1>
        <p>${a.tagline}</p>
        ${a.app_url && a.status !== 'soon'
          ? html`<a class="btn btn-primary" href="${a.app_url}" data-umami-event="open-app" data-umami-event-app="${a.slug}">Open app</a>`
          : html`<a class="btn btn-secondary" href="mailto:hello@springvibe.cafe?subject=${encodeURIComponent(a.name)}">Tell me when it's ready</a>`}
      </section>
      ${a.description ? html`<section class="block"><h2>What it is</h2>${paragraphs(a.description)}</section>` : ''}
      ${a.features.length
        ? html`<section class="block"><h2>What you can do</h2><ul>${a.features.map((f) => html`<li>${f}</li>`)}</ul></section>`
        : ''}
      ${a.audience ? html`<section class="block"><h2>Who it's for</h2>${paragraphs(a.audience)}</section>` : ''}`,
    { banner: preview ? `Preview${a.published ? '' : ' — not published yet'} · this is how ${appUrl(a.slug)} will look` : null },
  )

export const notFoundPage = () =>
  publicPage(
    'Not found — SpringVibe',
    '',
    html`<div class="section-header" style="margin-top:4rem">
      <h1>Nothing here yet</h1>
      <p>This app doesn't exist (yet). <a href="${appsUrl()}">See all SpringVibe apps</a>.</p>
    </div>`,
  )

/* ── admin ───────────────────────────────────────── */

const adminPage = (title, user, body) => html`<!DOCTYPE html>
<html lang="en">
<head>${head(`${title} — Apps admin`, '', { image: false })}<meta name="robots" content="noindex" /></head>
<body>
  <header>
    <nav>
      ${logo('/admin')}
      <div class="nav-links">
        <a href="/admin">Apps</a>
        <a href="/" target="_blank">View site</a>
        ${user
          ? html`<form method="post" action="/admin/logout" style="display:inline">
              <button class="btn btn-secondary btn-sm" title="Signed in as ${user.login}">Sign out ${user.login}</button>
            </form>`
          : ''}
      </div>
    </nav>
  </header>
  <main class="admin">${body}</main>
</body>
</html>`

export const loginPage = ({ error, configured }) =>
  adminPage(
    'Sign in',
    null,
    html`<div class="login">
      <h1>Apps admin</h1>
      ${error ? html`<div class="error">${error}</div>` : ''}
      ${configured
        ? html`<a class="btn btn-primary" href="/admin/auth/start">Sign in with GitHub</a>`
        : html`<div class="error">GitHub sign-in isn't set up yet. Set GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET,
            SESSION_SECRET and ADMIN_GITHUB_USERS on the apps service.</div>`}
    </div>`,
  )

export const adminList = (user, apps, notice) =>
  adminPage(
    'Apps',
    user,
    html`
      <div class="toolbar">
        <h1>Apps</h1>
        <a class="btn btn-primary btn-sm" href="/admin/apps/new">Add app</a>
      </div>
      ${notice ? html`<p class="notice" style="margin-bottom:1rem">${notice}</p>` : ''}
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Order</th><th>App</th><th>Address</th><th>Status</th><th>Visible</th><th></th></tr>
          </thead>
          <tbody>
            ${apps.map(
              (a) => html`<tr>
                <td>${a.sort}</td>
                <td>${a.icon} <strong>${a.name}</strong></td>
                <td><a href="${appUrl(a.slug)}" target="_blank">${a.slug}</a></td>
                <td>${statusTag(a.status)}</td>
                <td>${a.published ? 'Yes' : html`<span class="tag tag-draft">Hidden</span>`}</td>
                <td class="actions">
                  <a class="btn btn-secondary btn-sm" href="/admin/apps/${a.id}">Edit</a>
                  <a class="btn btn-secondary btn-sm" href="/admin/apps/${a.id}/preview" target="_blank">Preview</a>
                </td>
              </tr>`,
            )}
          </tbody>
        </table>
      </div>
      <p style="color:var(--muted);font-size:.85rem;margin-top:1rem">
        Each app's page lives at its own address (slug.springvibe.cafe). A new address also needs a DNS record and a
        Railway custom domain on the apps service before it works.
      </p>`,
  )

export const adminForm = (user, a, error) => {
  const isNew = !a.id
  return adminPage(
    isNew ? 'Add app' : `Edit ${a.name}`,
    user,
    html`
      <h1>${isNew ? 'Add app' : `Edit ${a.name}`}</h1>
      ${error ? html`<p class="error" style="margin-bottom:1rem">${error}</p>` : ''}
      <form class="edit" method="post" action="${isNew ? '/admin/apps' : `/admin/apps/${a.id}`}">
        <div class="row">
          <label>Name <input type="text" name="name" required maxlength="80" value="${a.name}" /></label>
          <label>Address
            <input type="text" name="slug" required pattern="[a-z0-9]([a-z0-9-]*[a-z0-9])?" maxlength="60" value="${a.slug}" />
            <span class="hint">Lowercase letters, numbers and dashes → slug.springvibe.cafe</span>
          </label>
        </div>
        <label>One-line pitch <input type="text" name="tagline" maxlength="200" value="${a.tagline}" /></label>
        <label>What it is <textarea name="description">${a.description}</textarea>
          <span class="hint">Blank lines start a new paragraph.</span></label>
        <label>What you can do <textarea name="features">${a.features.join('\n')}</textarea>
          <span class="hint">One feature per line.</span></label>
        <label>Who it's for <textarea name="audience" style="min-height:4rem">${a.audience}</textarea></label>
        <div class="row">
          <label>Status
            <select name="status">
              ${Object.entries(STATUSES).map(
                ([k, v]) => html`<option value="${k}" ${k === a.status ? 'selected' : ''}>${v}</option>`,
              )}
            </select>
          </label>
          <label>Icon <input type="text" name="icon" maxlength="8" value="${a.icon}" />
            <span class="hint">An emoji.</span></label>
        </div>
        <div class="row">
          <label>“Open app” link <input type="url" name="app_url" placeholder="https://…" value="${a.app_url}" />
            <span class="hint">Shown when status is Live or Beta.</span></label>
          <label>Order <input type="number" name="sort" value="${a.sort}" />
            <span class="hint">Lower numbers come first.</span></label>
        </div>
        <label class="check"><input type="checkbox" name="published" ${a.published ? 'checked' : ''} /> Visible on the public site</label>
        <div class="actions">
          <button class="btn btn-primary">${isNew ? 'Add app' : 'Save'}</button>
          <a class="btn btn-secondary" href="/admin">Cancel</a>
        </div>
      </form>
      ${isNew
        ? ''
        : html`<form method="post" action="/admin/apps/${a.id}/delete" style="margin-top:2.5rem"
            onsubmit="return confirm('Delete this app? This cannot be undone.')">
            <button class="btn btn-danger btn-sm">Delete app</button>
          </form>`}`,
  )
}
