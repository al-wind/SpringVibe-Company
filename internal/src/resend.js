import { Webhook } from 'svix'
import { randomUUID } from 'node:crypto'

const API = process.env.RESEND_API_URL || 'https://api.resend.com'
const key = () => process.env.RESEND_API_KEY

export const MAILBOX = process.env.MAILBOX_ADDRESS || 'hello@springvibe.cafe'
export const MAILBOX_NAME = process.env.MAILBOX_NAME || 'SpringVibe'
export const resendConfigured = () => Boolean(key() && process.env.RESEND_WEBHOOK_SECRET)

async function api(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${key()}`, 'content-type': 'application/json', ...init.headers },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Resend ${res.status}: ${body.message || body.name || 'request failed'}`)
  return body
}

// Throws if the request wasn't signed by Resend (Svix signature over the raw body).
export function verifyWebhook(rawBody, headers) {
  return new Webhook(process.env.RESEND_WEBHOOK_SECRET).verify(rawBody, {
    'svix-id': headers['svix-id'],
    'svix-timestamp': headers['svix-timestamp'],
    'svix-signature': headers['svix-signature'],
  })
}

// "Ada Lovelace <ada@example.com>" → { name, addr }
export function parseAddress(s = '') {
  const m = s.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/)
  return m ? { name: m[1].trim(), addr: m[2].trim().toLowerCase() } : { name: '', addr: s.trim().toLowerCase() }
}

const header = (headers, name) => {
  const v = headers?.[name] ?? headers?.[name.toLowerCase()]
  return Array.isArray(v) ? v.join(' ') : v
}

// Webhooks carry only metadata, so fetch the full message from the Receiving API.
export async function fetchReceived(emailId) {
  const e = await api(`/emails/receiving/${encodeURIComponent(emailId)}`)
  const from = parseAddress(header(e.headers, 'from') || e.from)
  return {
    resendId: e.id,
    messageId: e.message_id || header(e.headers, 'message-id') || null,
    inReplyTo: header(e.headers, 'in-reply-to') || null,
    references: (header(e.headers, 'references') || '').split(/\s+/).filter(Boolean),
    replyTo: e.reply_to?.length ? parseAddress(e.reply_to[0]).addr : null,
    fromAddr: from.addr,
    fromName: from.name,
    to: e.to || [],
    cc: e.cc || [],
    subject: e.subject || '(no subject)',
    text: e.text ?? null,
    html: e.html ?? null,
    attachments: (e.attachments || []).map(({ id, filename, content_type, size }) => ({ id, filename, content_type, size })),
    auth: e.authentication || null,
    at: e.created_at ? new Date(e.created_at) : new Date(),
  }
}

export async function attachmentUrl(emailId, attachmentId) {
  const a = await api(`/emails/receiving/${encodeURIComponent(emailId)}/attachments/${encodeURIComponent(attachmentId)}`)
  return a.download_url
}

// Returns { id, messageId }. We set our own Message-ID so replies to it thread back here.
export async function send({ to, subject, text, inReplyTo, references }) {
  const messageId = `<${randomUUID()}@${MAILBOX.split('@')[1]}>`
  const headers = { 'Message-ID': messageId }
  if (inReplyTo) {
    headers['In-Reply-To'] = inReplyTo
    headers.References = [...(references || []), inReplyTo].join(' ')
  }
  const res = await api('/emails', {
    method: 'POST',
    body: JSON.stringify({
      from: `${MAILBOX_NAME} <${MAILBOX}>`,
      to,
      subject,
      text,
      headers,
    }),
  })
  return { id: res.id, messageId }
}
