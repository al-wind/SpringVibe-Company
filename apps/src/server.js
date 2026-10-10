import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { migrate, listApps, getApp, saveApp, deleteApp, STATUSES } from './db.js'
import { authConfigured, requireAdmin, startLogin, finishLogin, logout } from './auth.js'
import { inventoryPage, appPage, notFoundPage, loginPage, adminList, adminForm } from './views.js'

// Hosts that show the inventory and admin. Any other host is treated as an app
// page, using its first label as the slug (5d-for-two.springvibe.cafe → 5d-for-two).
const APPS_HOSTS = (process.env.APPS_HOSTS || 'apps.springvibe.cafe,localhost')
  .split(',')
  .map((h) => h.trim())

const hostOf = (c) => (c.req.header('x-forwarded-host') || c.req.header('host') || '').split(':')[0].toLowerCase()
const isAppsHost = (host) => APPS_HOSTS.includes(host) || host.endsWith('.up.railway.app')
const slugOf = (host) => host.split('.')[0]

const app = new Hono()

app.get('/healthz', (c) => c.text('ok'))
app.use('/*', serveStatic({ root: './public' }))

/* ── admin (apps host only) ─────────────────────── */

const admin = new Hono()

admin.get('/login', (c) => c.html(loginPage({ configured: authConfigured(), error: c.req.query('error') })))
admin.get('/auth/start', (c) => (authConfigured() ? startLogin(c) : c.redirect('/admin/login')))
admin.get('/auth/callback', async (c) => {
  const res = await finishLogin(c)
  return res.ok ? c.redirect('/admin') : c.html(loginPage({ configured: true, error: res.error }), 403)
})
admin.post('/logout', (c) => {
  logout(c)
  return c.redirect('/admin/login')
})

admin.use('/*', async (c, next) => {
  const p = c.req.path
  if (p === '/admin/login' || p.startsWith('/admin/auth/')) return next()
  return requireAdmin(c, next)
})

admin.get('/', async (c) => c.html(adminList(c.get('user'), await listApps({ all: true }), c.req.query('notice'))))

const blank = { name: '', slug: '', tagline: '', description: '', audience: '', features: [], icon: '🌱', status: 'soon', app_url: '', sort: 100, published: false }
admin.get('/apps/new', (c) => c.html(adminForm(c.get('user'), blank)))

const parseForm = (body) => ({
  name: String(body.name || '').trim(),
  slug: String(body.slug || '').trim().toLowerCase(),
  tagline: String(body.tagline || '').trim(),
  description: String(body.description || '').trim(),
  audience: String(body.audience || '').trim(),
  features: String(body.features || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean),
  icon: String(body.icon || '').trim() || '🌱',
  status: STATUSES[body.status] ? body.status : 'soon',
  app_url: String(body.app_url || '').trim(),
  sort: Number.parseInt(body.sort, 10) || 100,
  published: body.published === 'on',
})

const validate = (a) => {
  if (!a.name) return 'Name is required.'
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(a.slug)) return 'Address may only use lowercase letters, numbers and dashes.'
  if (['apps', 'www', 'internal', 'stats', 'admin'].includes(a.slug)) return `“${a.slug}” is reserved.`
  if (a.app_url && !/^https?:\/\//.test(a.app_url)) return '“Open app” link must start with https://'
  return null
}

const save = async (c, id) => {
  const data = parseForm(await c.req.parseBody())
  const error = validate(data)
  if (error) return c.html(adminForm(c.get('user'), { ...data, id }, error), 400)
  try {
    const saved = await saveApp(id, data)
    return c.redirect(`/admin?notice=${encodeURIComponent(`Saved ${saved.name}.`)}`)
  } catch (e) {
    if (e.code === '23505') return c.html(adminForm(c.get('user'), { ...data, id }, 'Another app already uses that address.'), 400)
    throw e
  }
}

admin.post('/apps', (c) => save(c, null))

admin.get('/apps/:id{[0-9]+}', async (c) => {
  const a = await getApp({ id: c.req.param('id') })
  return a ? c.html(adminForm(c.get('user'), a)) : c.notFound()
})
admin.post('/apps/:id{[0-9]+}', (c) => save(c, c.req.param('id')))

admin.get('/apps/:id{[0-9]+}/preview', async (c) => {
  const a = await getApp({ id: c.req.param('id') })
  return a ? c.html(appPage(a, { preview: true })) : c.notFound()
})

admin.post('/apps/:id{[0-9]+}/delete', async (c) => {
  const a = await getApp({ id: c.req.param('id') })
  if (a) await deleteApp(a.id)
  return c.redirect(`/admin?notice=${encodeURIComponent(a ? `Deleted ${a.name}.` : 'Already deleted.')}`)
})

app.use('/admin/*', async (c, next) => (isAppsHost(hostOf(c)) ? next() : c.html(notFoundPage(), 404)))
app.route('/admin', admin)

/* ── public ─────────────────────────────────────── */

app.get('/', async (c) => {
  const host = hostOf(c)
  if (isAppsHost(host)) return c.html(inventoryPage(await listApps()))
  const a = await getApp({ slug: slugOf(host) })
  return a?.published ? c.html(appPage(a)) : c.html(notFoundPage(), 404)
})

app.notFound((c) => c.html(notFoundPage(), 404))
app.onError((err, c) => {
  console.error(err)
  return c.text('Something went wrong.', 500)
})

await migrate()
const port = Number(process.env.PORT) || 3000
serve({ fetch: app.fetch, port }, () => console.log(`apps listening on :${port}`))
