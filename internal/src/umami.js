// Reads statistics from the self-hosted Umami (v3) API.
const base = () => (process.env.UMAMI_API_URL || 'http://umami.railway.internal:3000').replace(/\/$/, '')
const websiteId = () => process.env.UMAMI_WEBSITE_ID

export const umamiConfigured = () =>
  Boolean(websiteId() && process.env.UMAMI_USERNAME && process.env.UMAMI_PASSWORD)

let token = null

async function login() {
  const res = await fetch(`${base()}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: process.env.UMAMI_USERNAME, password: process.env.UMAMI_PASSWORD }),
  })
  if (!res.ok) throw new Error(`Umami login failed (${res.status})`)
  token = (await res.json()).token
}

async function get(path, params) {
  if (!token) await login()
  const url = `${base()}/api/websites/${websiteId()}${path}?${new URLSearchParams(params)}`
  let res = await fetch(url, { headers: { authorization: `Bearer ${token}` } })
  if (res.status === 401) {
    await login()
    res = await fetch(url, { headers: { authorization: `Bearer ${token}` } })
  }
  if (!res.ok) throw new Error(`Umami ${path} failed (${res.status})`)
  return res.json()
}

export const RANGES = {
  '24h': { label: 'Last 24 hours', ms: 86400_000, unit: 'hour' },
  '7d': { label: 'Last 7 days', ms: 7 * 86400_000, unit: 'day' },
  '30d': { label: 'Last 30 days', ms: 30 * 86400_000, unit: 'day' },
  '90d': { label: 'Last 90 days', ms: 90 * 86400_000, unit: 'day' },
}

const TZ = process.env.STATS_TIMEZONE || 'Europe/Oslo'
const num = (v) => Number(v ?? 0)

export async function summary(rangeKey = '7d') {
  const r = RANGES[rangeKey] || RANGES['7d']
  const endAt = Date.now()
  const startAt = endAt - r.ms
  const p = { startAt, endAt }
  const s = await get('/stats', p)
  const pick = (o) => ({
    visitors: num(o?.visitors),
    visits: num(o?.visits),
    pageviews: num(o?.pageviews),
    bounceRate: num(o?.visits) ? num(o?.bounces) / num(o?.visits) : 0,
    avgVisitSec: num(o?.visits) ? num(o?.totaltime) / num(o?.visits) : 0,
  })
  return { range: r, now: pick(s), prev: pick(s.comparison) }
}

export async function report(rangeKey = '7d') {
  const r = RANGES[rangeKey] || RANGES['7d']
  const endAt = Date.now()
  const startAt = endAt - r.ms
  const p = { startAt, endAt }
  const metric = (type, limit = 10) => get('/metrics', { ...p, type, limit }).catch(() => [])
  const [totals, series, hostnames, paths, referrers, countries, devices, browsers, events] = await Promise.all([
    summary(rangeKey),
    get('/pageviews', { ...p, unit: r.unit, timezone: TZ }),
    metric('hostname'),
    metric('path'),
    metric('referrer'),
    metric('country'),
    metric('device'),
    metric('browser'),
    metric('event'),
  ])
  const norm = (rows) => (rows || []).map((row) => ({ x: row.x || '(none)', y: num(row.y) }))
  return {
    ...totals,
    series: {
      unit: r.unit,
      pageviews: norm(series.pageviews),
      visitors: norm(series.sessions),
    },
    hostnames: norm(hostnames),
    paths: norm(paths),
    referrers: norm(referrers),
    countries: norm(countries),
    devices: norm(devices),
    browsers: norm(browsers),
    events: norm(events),
  }
}
