# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for security vulnerabilities.

Report them privately through GitHub's
[Report a vulnerability](https://github.com/Likith2005-coder/SkillStreak-AI/security/advisories/new)
form. Include the affected component, reproduction steps, and impact if you know it.

You can expect an initial response within a few days.

## Scope

SkillStreak AI is an academic project and is not operated as a hosted production service.
The areas most worth scrutiny are:

- JWT issuance, refresh and revocation (`backend/src/services/auth.service.ts`)
- Authorization checks on domain, progress and admin routes
- Prompt injection through user-supplied text reaching Gemini
- Rate limiting on expensive LLM endpoints

## Secrets

No secrets belong in the repository. `backend/.env` and `frontend/.env.local` are
git-ignored; use the `.env.example` files as templates. If you believe a credential has
been committed, report it privately rather than opening an issue, and rotate it
immediately.

## The Ethical Hacking Arsenal

The Arsenal is a teaching surface. It documents real penetration-testing tools and their
usage for learners studying defensive and authorized offensive security. It does not
execute attacks, and it must never be extended to target systems the user does not own or
have written permission to test.
