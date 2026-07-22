# SkillStreak — Admin Console

A **standalone** admin website, separate from the learner app. It talks to the
same backend API (`http://localhost:4000`), so every change here writes to the
live database and shows up on the learner site immediately.

- **Learner app:** http://localhost:3000
- **Admin console:** http://localhost:3001
- **Backend API:** http://localhost:4000

## Run it

From the repo root:

```bash
npm install                 # once — links the admin workspace
npm run dev:admin           # start just the admin console (port 3001)
# or `npm run dev` to start frontend + backend + admin together
```

Then open http://localhost:3001 and sign in with an **admin** account.

## What you can do

- **Overview** — live metrics (users, active users, completions, quizzes, popular topics).
- **Content** — create, edit, and delete topics. Edits go straight to the learner site.
- **Users** — search users; promote/demote admins; reset a user's progress; delete accounts.
- **Access** — manage who can sign in to the admin console (grant/revoke admin).
- **Email** — trigger streak reminders and weekly digests.

## Admin credentials / access

Admins are normal accounts with the `admin` role. Two ways to grant it:

1. **From the console** — the *Access* tab (recommended for day-to-day).
2. **From the allowlist file** — edit [`config/admins.json`](./config/admins.json)
   and run the bootstrap script (useful for the very first admin, or
   version-controlled access):

   ```bash
   npm --workspace @skillstreak/admin run grant-admin
   # or grant an ad-hoc email:
   npm --workspace @skillstreak/backend run grant-admin -- someone@example.com
   ```

   The account must already be registered on the learner site.

## Config

- `NEXT_PUBLIC_API_URL` — backend base URL (default `http://localhost:4000/api`)
- `NEXT_PUBLIC_LEARNER_URL` — learner site URL for the header link (default `http://localhost:3000`)
