import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import * as db from './db.js'
import { authConfigured, requireAdmin, startLogin, finishLogin, logout } from './auth.js'
import { umamiConfigured, summary, report, RANGES } from './umami.js'
import { resendConfigured, verifyWebhook, fetchReceived, attachmentUrl, send, MAILBOX } from './resend.js'
import * as v from './views.js'

const app = new Hono()

app.get('/healthz', (c) => c.text('ok'))
app.use('/favicon.ico', serveStatic({ root: './public' }))
app.use('/*.png', serveStatic({ root: './public' }))

/* ── sign-in ────────────────────────────────────── */

app.get('/login', (c) => c.html(v.loginPage({ configured: authConfigured(), error: c.req.query('error') })))
app.get('/auth/start', (c) => (authConfigured() ? startLogin(c) : c.redirect('/login')))
app.get('/auth/callback', async (c) => {
  const res = await finishLogin(c)
  return res.ok ? c.redirect('/') : c.html(v.loginPage({ configured: true, error: res.error }), 403)
})
app.post('/logout', (c) => {
  logout(c)
  return c.redirect('/login')
})

/* ── Resend inbound webhook (signed, no session) ── */

app.post('/hooks/resend', async (c) => {
  if (!resendConfigured()) return c.text('Email is not configured', 503)
  const raw = await c.req.text()
  let event
  try {
    await verifyWebhook(raw, Object.fromEntries(c.req.raw.headers))
    event = JSON.parse(raw)
  } catch {
    return c.text('Invalid signature', 400)
  }
  if (event.type !== 'email.received') return c.json({ ignored: event.type })
  const message = await fetchReceived(event.data.email_id)
  const res = await db.storeIncoming(message)
  console.log(`inbound ${event.data.email_id} from ${message.fromAddr}: ${res.duplicate ? 'duplicate' : `thread ${res.threadId}`}`)
  return c.json({ ok: true })
})

/* ── everything below needs a signed-in team member ── */

app.use('/*', requireAdmin)

const ctx = async (c) => ({ user: c.get('user'), unread: await db.unreadCount(), mailReady: resendConfigured() })

app.get('/', async (c) => {
  const base = await ctx(c)
  let s = null
  let statsError = null
  if (umamiConfigured()) {
    try {
      s = await summary('7d')
    } catch (e) {
      statsError = `Couldn't load statistics: ${e.message}`
    }
  }
  const threads = (await db.listThreads()).slice(0, 8)
  return c.html(v.homePage(base.user, { ...base, summary: s, statsError, threads }))
})

app.get('/stats', async (c) => {
  const base = await ctx(c)
  const key = RANGES[c.req.query('range')] ? c.req.query('range') : '7d'
  if (!umamiConfigured()) return c.html(v.statsPage(base.user, { ...base, key, report: null }))
  try {
    return c.html(v.statsPage(base.user, { ...base, key, report: await report(key) }))
  } catch (e) {
    return c.html(v.statsPage(base.user, { ...base, key, report: undefined, error: `Couldn't load statistics: ${e.message}` }), 502)
  }
})

/* ── inbox ──────────────────────────────────────── */

const FOLDERS = ['inbox', 'sent', 'archived']

app.get('/inbox', async (c) => {
  const base = await ctx(c)
  const folder = FOLDERS.includes(c.req.query('folder')) ? c.req.query('folder') : 'inbox'
  const q = (c.req.query('q') || '').trim().slice(0, 100)
  const threads = await db.listThreads({ folder, q })
  return c.html(v.inboxPage(base.user, { ...base, threads, folder, q, notice: c.req.query('notice') }))
})

app.get('/inbox/new', async (c) => c.html(v.composePage(c.get('user'), await ctx(c))))

const EMAIL = /^[^\s@<>,]+@[^\s@<>,]+\.[^\s@<>,]+$/

app.post('/inbox/new', async (c) => {
  const base = await ctx(c)
  const body = await c.req.parseBody()
  const draft = { to: String(body.to || '').trim(), subject: String(body.subject || '').trim(), text: String(body.text || '') }
  const to = draft.to.split(',').map((s) => s.trim()).filter(Boolean)
  const error = !to.length || !to.every((a) => EMAIL.test(a)) ? 'Enter valid email addresses, separated by commas.'
    : !draft.subject ? 'Add a subject.' : !draft.text.trim() ? 'Write a message.' : null
  if (error || !base.mailReady) return c.html(v.composePage(base.user, { ...base, draft, error }), 400)
  try {
    const { id: resendId, messageId } = await send({ to, subject: draft.subject, text: draft.text })
    const id = await db.newOutgoingThread({
      resendId, messageId, to, subject: draft.subject, text: draft.text, fromAddr: MAILBOX, fromName: '', sentBy: base.user.login,
    })
    return c.redirect(`/inbox/${id}?notice=${encodeURIComponent('Message sent.')}`)
  } catch (e) {
    return c.html(v.composePage(base.user, { ...base, draft, error: `Couldn't send: ${e.message}` }), 502)
  }
})

const threadId = (c) => Number.parseInt(c.req.param('id'), 10)

app.get('/inbox/:id{[0-9]+}', async (c) => {
  const t = await db.getThread(threadId(c))
  if (!t) return c.notFound()
  if (t.thread.unread) await db.markRead(t.thread.id)
  const base = await ctx(c)
  return c.html(v.threadPage(base.user, { ...base, ...t, notice: c.req.query('notice') }))
})

app.post('/inbox/:id{[0-9]+}/reply', async (c) => {
  const t = await db.getThread(threadId(c))
  if (!t) return c.notFound()
  const base = await ctx(c)
  const body = await c.req.parseBody()
  const text = String(body.text || '')
  const subject = String(body.subject || `Re: ${t.thread.subject}`).slice(0, 250)
  const lastIn = [...t.messages].reverse().find((m) => m.direction === 'in')
  const to = lastIn ? lastIn.reply_to || lastIn.from_addr : t.thread.contact
  const fail = (error, status = 400) => c.html(v.threadPage(base.user, { ...base, ...t, error, draft: text }), status)
  if (!text.trim()) return fail('Write a reply first.')
  if (!base.mailReady) return fail('Email is not connected yet.', 503)
  const last = t.messages.at(-1)
  const references = t.messages.map((m) => m.message_id).filter(Boolean)
  try {
    const { id: resendId, messageId } = await send({ to: [to], subject, text, inReplyTo: last?.message_id || undefined, references: references.slice(0, -1) })
    await db.storeOutgoing(t.thread.id, {
      resendId, messageId, to: [to], subject, text, inReplyTo: last?.message_id || null, fromAddr: MAILBOX, fromName: '', sentBy: base.user.login,
    })
    return c.redirect(`/inbox/${t.thread.id}?notice=${encodeURIComponent(`Reply sent to ${to}.`)}#reply`)
  } catch (e) {
    return fail(`Couldn't send: ${e.message}`, 502)
  }
})

const back = (c, id, notice) => c.redirect(`/inbox${id ? `/${id}` : ''}?notice=${encodeURIComponent(notice)}`)
app.post('/inbox/:id{[0-9]+}/archive', async (c) => (await db.setArchived(threadId(c), true), back(c, null, 'Conversation archived.')))
app.post('/inbox/:id{[0-9]+}/unarchive', async (c) => (await db.setArchived(threadId(c), false), back(c, threadId(c), 'Moved back to the inbox.')))
app.post('/inbox/:id{[0-9]+}/unread', async (c) => (await db.markUnread(threadId(c)), back(c, null, 'Marked as unread.')))

/* ── message content ────────────────────────────── */

// Email HTML is untrusted: serve it on its own with scripts, forms and remote
// loads blocked, and only ever show it inside a sandboxed iframe.
app.get('/messages/:id{[0-9]+}/html', async (c) => {
  const m = await db.getMessage(c.req.param('id'))
  if (!m?.html_body) return c.notFound()
  c.header('Content-Security-Policy', "default-src 'none'; img-src data: cid:; style-src 'unsafe-inline'; font-src data:; sandbox")
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('Referrer-Policy', 'no-referrer')
  return c.html(m.html_body)
})

app.get('/messages/:id{[0-9]+}/attachments/:aid', async (c) => {
  const m = await db.getMessage(c.req.param('id'))
  const a = m?.attachments.find((x) => x.id === c.req.param('aid'))
  if (!a || !m.resend_id) return c.notFound()
  try {
    return c.redirect(await attachmentUrl(m.resend_id, a.id))
  } catch (e) {
    return c.text(`Couldn't fetch attachment: ${e.message}`, 502)
  }
})

app.onError((err, c) => {
  console.error(err)
  return c.text('Something went wrong.', 500)
})

await db.migrate()
const port = Number(process.env.PORT) || 3000
serve({ fetch: app.fetch, port }, () => console.log(`internal listening on :${port}`))
