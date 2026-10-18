import { getSignedCookie, setSignedCookie, deleteCookie } from 'hono/cookie'
import { randomBytes } from 'node:crypto'

const SESSION = 'sv_internal'
const STATE = 'sv_oauth_state'
const SESSION_DAYS = 7

const env = () => ({
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  secret: process.env.SESSION_SECRET,
  allowed: (process.env.ADMIN_GITHUB_USERS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  // Local-only escape hatch so the admin can be tried without a GitHub app.
  devUser: process.env.NODE_ENV !== 'production' ? process.env.DEV_ADMIN_USER : undefined,
})

export const authConfigured = () => {
  const e = env()
  return Boolean((e.clientId && e.clientSecret) || e.devUser) && Boolean(e.secret)
}

const cookieOpts = (c, maxAge) => ({
  path: '/',
  httpOnly: true,
  sameSite: 'Lax',
  secure: new URL(c.req.url).protocol === 'https:' || c.req.header('x-forwarded-proto') === 'https',
  maxAge,
})

export async function currentUser(c) {
  const { secret, allowed } = env()
  if (!secret) return null
  const raw = await getSignedCookie(c, secret, SESSION)
  if (!raw) return null
  try {
    const s = JSON.parse(raw)
    if (s.exp < Date.now()) return null
    if (!allowed.includes(s.login.toLowerCase()) && s.login !== env().devUser) return null
    return s
  } catch {
    return null
  }
}

// Guards every /admin route except the login flow itself.
export const requireAdmin = async (c, next) => {
  const user = await currentUser(c)
  if (!user) return c.redirect('/login')
  // Forms post back to the same origin; reject cross-site posts.
  if (c.req.method !== 'GET') {
    const origin = c.req.header('origin')
    const host = c.req.header('x-forwarded-host') || c.req.header('host')
    if (origin && new URL(origin).host !== host) return c.text('Bad origin', 403)
  }
  c.set('user', user)
  await next()
}

const callbackUrl = (c) => {
  const u = new URL(c.req.url)
  const proto = c.req.header('x-forwarded-proto') || u.protocol.replace(':', '')
  const host = c.req.header('x-forwarded-host') || c.req.header('host')
  return `${proto}://${host}/auth/callback`
}

export async function startLogin(c) {
  const e = env()
  if (e.devUser) {
    await startSession(c, e.devUser)
    return c.redirect('/')
  }
  const state = randomBytes(16).toString('hex')
  await setSignedCookie(c, STATE, state, e.secret, cookieOpts(c, 600))
  const url = new URL('https://github.com/login/oauth/authorize')
  url.searchParams.set('client_id', e.clientId)
  url.searchParams.set('redirect_uri', callbackUrl(c))
  url.searchParams.set('scope', 'read:user')
  url.searchParams.set('state', state)
  return c.redirect(url.toString())
}

export async function finishLogin(c) {
  const e = env()
  const expected = await getSignedCookie(c, e.secret, STATE)
  deleteCookie(c, STATE, { path: '/' })
  const { code, state } = c.req.query()
  if (!code || !expected || state !== expected) return { error: 'Sign-in expired. Please try again.' }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: e.clientId,
      client_secret: e.clientSecret,
      code,
      redirect_uri: callbackUrl(c),
    }),
  })
  const { access_token } = await tokenRes.json()
  if (!access_token) return { error: 'GitHub did not accept the sign-in.' }

  const userRes = await fetch('https://api.github.com/user', {
    headers: { authorization: `Bearer ${access_token}`, 'user-agent': 'springvibe-internal' },
  })
  const { login } = await userRes.json()
  if (!login || !e.allowed.includes(login.toLowerCase())) {
    return { error: `GitHub account “${login ?? 'unknown'}” is not allowed into SpringVibe internal.` }
  }
  await startSession(c, login)
  return { ok: true }
}

async function startSession(c, login) {
  const exp = Date.now() + SESSION_DAYS * 86400_000
  await setSignedCookie(c, SESSION, JSON.stringify({ login, exp }), env().secret, cookieOpts(c, SESSION_DAYS * 86400))
}

export const logout = (c) => deleteCookie(c, SESSION, { path: '/' })
