# Backend setup

Do these in order. Step 6 tells you whether it worked.

Nothing here should be pasted into a chat window, a commit, or a screenshot:
the service-role key is equivalent to full access to your database.

---

## 1. Create the Supabase project

Any region — `eu-central-1` (Frankfurt) is the sane default for a Polish
client, because it keeps personal data inside the EU and saves you a paragraph
of transfer language in the privacy policy.

## 2. Run the schema

Supabase dashboard → **SQL Editor** → New query → paste the whole of
`supabase/schema.sql` → **Run**.

It's idempotent, so re-running it after an edit is safe.

## 3. Fill `.env.local`

Copy `.env.example` to `.env.local`, then get the values from
**Project Settings → API**.

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service_role / secret key>
IP_HASH_SECRET=<see below>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Newer Supabase projects label these **publishable** and **secret** rather than
**anon** and **service_role**. They're the same two things: one is safe in the
browser, one is never.

Generate the hash secret on your own machine — don't let anyone generate it
for you, including me:

```bash
openssl rand -hex 32
```

Three things that will bite you:

- `SUPABASE_SERVICE_ROLE_KEY` must **never** gain a `NEXT_PUBLIC_` prefix. That
  prefix is what tells Next.js to inline a value into the JavaScript bundle.
- `NEXT_PUBLIC_SITE_URL` must match your origin **exactly**, no trailing slash.
  It's the CSRF check in `/api/contact`; a mismatch makes every submission 403.
- `.env.local` is already in `.gitignore`. Keep it that way.

## 4. Turn off public signups

Login uses an emailed one-time code. Supabase sends these for free — no SMS
provider, no Twilio, no cost. Two settings make sure the login page can't be
turned into a public signup form:

- **Turn OFF global signups.** Authentication → Sign In / Providers → the
  "Allow new users to sign up" toggle. Nobody but you ever authenticates
  against this project, so this is safe. The client code already passes
  `shouldCreateUser:false`; this is the second lock on the same door.
- **Enable CAPTCHA** on Auth (Authentication → Settings → Bot and Abuse
  Protection). Without it, your login page is a button that anyone can hammer
  to send emails in your project's name.

> **Free built-in email is rate-limited** (a handful of messages per hour).
> For one admin logging in occasionally that's fine. If you ever add more
> admins or want branded email, plug your own SMTP into
> Authentication → Settings → SMTP — but you don't need that to launch.
>
> Codes expire after an hour. If one "doesn't arrive," check spam, then wait a
> moment before requesting another.

## 5. Create your admin user

Dashboard → **Authentication → Users → Add user**. Enter your email, set a
password (you'll never use it — login is by code), and tick **Auto Confirm
User**. Save.

Then put that user on the allowlist. SQL Editor:

```sql
insert into public.admin_users (user_id, email, label)
select id, email, 'owner' from auth.users where email = 'you@example.com'
on conflict (user_id) do nothing;
```

Being in `auth.users` is *not* being an admin. This insert is what grants
access, and it's why a stranger who somehow signs in still gets nothing.

## 6. Verify

**In SQL:** run `supabase/verify.sql`. Every row must read `PASS`. Check 4 is
the one that matters — it proves the public key in your JavaScript bundle can't
read a single inquiry.

**In the app:**

```bash
npm install && npm run dev
```

| Do this | Expect |
|---|---|
| Open `/admin` while signed out | redirect to `/admin/login` |
| Sign in with your email | the code arrives; you land on `/admin` |
| Sign in with an email *not* on the allowlist | bounced back to `/admin/login` |
| Submit the contact form | the row appears in `/admin/inquiries` |
| Submit the form 6× in an hour | the 6th returns 429 |
| Refuse analytics, then browse | `/admin` shows 0 visitors — correct, not a bug |
| Accept analytics, then browse | sections and scroll depth appear |

That sixth row is the one people misread. A dashboard showing fewer visitors
than you expected usually means consent is working.

## 7. Schedule the purge

Database → Extensions → enable **pg_cron**. Then:

```sql
select cron.schedule('wc-purge', '17 3 * * *', 'select public.purge_old_data()');
```

Your privacy policy promises analytics events are deleted after 14 months.
Until this job exists, that sentence is not true — and an unkept retention
promise is a worse finding than never having made one.

## 8. Before going live

- Set `NEXT_PUBLIC_SITE_URL` to the real domain in your host's env vars.
- Fill the `[TODO]` identity fields in `app/(site)/privacy/page.tsx`
  (controller name, address, NIP). Legally required, Art. 13(1)(a).
- Have a Polish lawyer read that page. It's accurate about the code. It is
  not legal advice, and I'm not qualified to give you any.
