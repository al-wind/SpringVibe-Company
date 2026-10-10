import postgres from 'postgres'

export const sql = postgres(process.env.DATABASE_URL, {
  onnotice: () => {},
  ssl: process.env.DATABASE_SSL === 'true' ? 'require' : false,
})

export const STATUSES = {
  live: 'Live',
  beta: 'Beta',
  soon: 'Coming soon',
}

export async function migrate() {
  await sql`create schema if not exists apps`
  await sql`
    create table if not exists apps.apps (
      id          serial primary key,
      slug        text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
      name        text not null,
      tagline     text not null default '',
      description text not null default '',
      audience    text not null default '',
      features    text[] not null default '{}',
      icon        text not null default '🌱',
      status      text not null default 'soon' check (status in ('live', 'beta', 'soon')),
      app_url     text not null default '',
      sort        integer not null default 100,
      published   boolean not null default false,
      created_at  timestamptz not null default now(),
      updated_at  timestamptz not null default now()
    )`

  const [{ count }] = await sql`select count(*)::int as count from apps.apps`
  if (count === 0) await seed()
}

// Placeholder content so the inventory isn't empty on first deploy.
// Everything here is meant to be rewritten in /admin.
async function seed() {
  await sql`
    insert into apps.apps ${sql([
      {
        slug: '5d-for-two',
        name: '5D for Two',
        tagline: 'A private space for two people to talk, share and build together.',
        description: 'Draft description — edit in the app admin.',
        audience: 'Pairs: partners, co-founders, mentor and mentee.',
        features: ['Real-time chat', 'Screen sharing', 'Co-editing'],
        icon: '🤝',
        status: 'soon',
        sort: 10,
        published: true,
      },
      {
        slug: '5d-for-teams',
        name: '5D for Teams',
        tagline: 'Deep collaboration for small teams, built for trust and presence.',
        description: 'Draft description — edit in the app admin.',
        audience: 'Small teams working closely together.',
        features: ['Shared spaces', 'Real-time chat', 'Screen sharing', 'Co-editing'],
        icon: '👥',
        status: 'soon',
        sort: 20,
        published: true,
      },
    ])}`
}

export const listApps = ({ all = false } = {}) =>
  all
    ? sql`select * from apps.apps order by sort, name`
    : sql`select * from apps.apps where published order by sort, name`

export async function getApp(where) {
  const [row] = where.id
    ? await sql`select * from apps.apps where id = ${where.id}`
    : await sql`select * from apps.apps where slug = ${where.slug}`
  return row
}

const FIELDS = ['slug', 'name', 'tagline', 'description', 'audience', 'features', 'icon', 'status', 'app_url', 'sort', 'published']

export async function saveApp(id, data) {
  const row = Object.fromEntries(FIELDS.map((f) => [f, data[f]]))
  if (id) {
    const [saved] = await sql`
      update apps.apps set ${sql(row, FIELDS)}, updated_at = now()
      where id = ${id} returning *`
    return saved
  }
  const [saved] = await sql`insert into apps.apps ${sql(row, FIELDS)} returning *`
  return saved
}

export const deleteApp = (id) => sql`delete from apps.apps where id = ${id}`
