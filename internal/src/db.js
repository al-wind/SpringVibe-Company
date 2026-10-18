import postgres from 'postgres'

export const sql = postgres(process.env.DATABASE_URL, {
  onnotice: () => {},
  ssl: process.env.DATABASE_SSL === 'true' ? 'require' : false,
})

export async function migrate() {
  await sql`create schema if not exists internal`
  await sql`
    create table if not exists internal.threads (
      id          serial primary key,
      subject     text not null default '',
      contact     text not null default '',
      last_at     timestamptz not null default now(),
      unread      boolean not null default true,
      archived    boolean not null default false
    )`
  await sql`
    create table if not exists internal.messages (
      id           serial primary key,
      thread_id    integer not null references internal.threads(id) on delete cascade,
      direction    text not null check (direction in ('in', 'out')),
      resend_id    text unique,
      message_id   text,
      in_reply_to  text,
      reply_to     text,
      from_addr    text not null,
      from_name    text not null default '',
      to_addrs     text[] not null default '{}',
      cc_addrs     text[] not null default '{}',
      subject      text not null default '',
      text_body    text,
      html_body    text,
      attachments  jsonb not null default '[]',
      auth         jsonb,
      sent_by      text,
      at           timestamptz not null default now()
    )`
  await sql`create index if not exists messages_message_id on internal.messages (message_id)`
  await sql`create index if not exists threads_last_at on internal.threads (archived, last_at desc)`
}

const normSubject = (s) => s.replace(/^((re|fwd?|aw|sv)\s*:\s*)+/i, '').trim().toLowerCase()

// Thread by In-Reply-To / References first, then by same contact + same subject.
async function findThread(tx, { inReplyTo, references, contact, subject }) {
  const ids = [inReplyTo, ...references].filter(Boolean)
  if (ids.length) {
    const [hit] = await tx`
      select thread_id from internal.messages where message_id = any(${ids}) order by at desc limit 1`
    if (hit) return hit.thread_id
  }
  const [hit] = await tx`
    select id from internal.threads
    where contact = ${contact} and lower(regexp_replace(subject, '^((re|fwd?|aw|sv)\\s*:\\s*)+', '', 'i')) = ${normSubject(subject)}
      and last_at > now() - interval '60 days'
    order by last_at desc limit 1`
  return hit?.id
}

export async function storeIncoming(m) {
  return sql.begin(async (tx) => {
    const [dupe] = await tx`select id from internal.messages where resend_id = ${m.resendId}`
    if (dupe) return { duplicate: true }
    let threadId = await findThread(tx, { ...m, contact: m.fromAddr })
    if (threadId) {
      await tx`update internal.threads set last_at = ${m.at}, unread = true, archived = false where id = ${threadId}`
    } else {
      ;[{ id: threadId }] = await tx`
        insert into internal.threads (subject, contact, last_at) values (${m.subject}, ${m.fromAddr}, ${m.at}) returning id`
    }
    await tx`
      insert into internal.messages ${tx({
        thread_id: threadId,
        direction: 'in',
        resend_id: m.resendId,
        message_id: m.messageId,
        in_reply_to: m.inReplyTo,
        reply_to: m.replyTo,
        from_addr: m.fromAddr,
        from_name: m.fromName,
        to_addrs: m.to,
        cc_addrs: m.cc,
        subject: m.subject,
        text_body: m.text,
        html_body: m.html,
        attachments: tx.json(m.attachments),
        auth: m.auth ? tx.json(m.auth) : null,
        at: m.at,
      })}`
    return { threadId }
  })
}

export async function storeOutgoing(threadId, m) {
  await sql.begin(async (tx) => {
    await tx`
      insert into internal.messages ${tx({
        thread_id: threadId,
        direction: 'out',
        resend_id: m.resendId,
        message_id: m.messageId ?? null,
        in_reply_to: m.inReplyTo ?? null,
        from_addr: m.fromAddr,
        from_name: m.fromName,
        to_addrs: m.to,
        subject: m.subject,
        text_body: m.text,
        sent_by: m.sentBy,
      })}`
    await tx`update internal.threads set last_at = now(), unread = false where id = ${threadId}`
  })
}

export async function newOutgoingThread(m) {
  const [{ id }] = await sql`
    insert into internal.threads (subject, contact, unread) values (${m.subject}, ${m.to[0]}, false) returning id`
  await storeOutgoing(id, m)
  return id
}

export function listThreads({ folder = 'inbox', q = '' } = {}) {
  const like = `%${q}%`
  return sql`
    select t.*, m.from_name, m.from_addr, m.direction, left(coalesce(m.text_body, ''), 160) as snippet,
           (select count(*)::int from internal.messages where thread_id = t.id) as count
    from internal.threads t
    join lateral (
      select * from internal.messages where thread_id = t.id order by at desc limit 1
    ) m on true
    where ${folder === 'archived' ? sql`t.archived` : folder === 'sent' ? sql`exists (select 1 from internal.messages where thread_id = t.id and direction = 'out')` : sql`not t.archived`}
      ${q ? sql`and (t.subject ilike ${like} or t.contact ilike ${like} or exists (
        select 1 from internal.messages x where x.thread_id = t.id and (x.text_body ilike ${like} or x.from_name ilike ${like})))` : sql``}
    order by t.last_at desc
    limit 200`
}

export async function getThread(id) {
  const [thread] = await sql`select * from internal.threads where id = ${id}`
  if (!thread) return null
  const messages = await sql`select * from internal.messages where thread_id = ${id} order by at`
  return { thread, messages }
}

export const getMessage = async (id) => (await sql`select * from internal.messages where id = ${id}`)[0]
export const markRead = (id) => sql`update internal.threads set unread = false where id = ${id}`
export const markUnread = (id) => sql`update internal.threads set unread = true where id = ${id}`
export const setArchived = (id, archived) => sql`update internal.threads set archived = ${archived} where id = ${id}`
export const unreadCount = async () =>
  (await sql`select count(*)::int as n from internal.threads where unread and not archived`)[0].n
