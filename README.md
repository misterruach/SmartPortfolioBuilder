# Smart Portfolio Builder — V1

A full-stack Next.js SaaS foundation for creating AI-assisted portfolios and CV/resumes. The project uses the Liquid Intelligence design system: glassmorphism for environments and neumorphism for interactions, with no purple.

## Stack
- Next.js + TypeScript
- Tailwind CSS
- Supabase Auth + PostgreSQL + Storage-ready architecture
- OpenAI API for AI generation
- Paystack for one-time payments
- Resend for transactional email
- Vercel for deployment

## Plans
Free $0 / Starter $19 / Plus $49 / Pro $99 / Business $249.
A project is one portfolio OR one resume/CV. Free gets one project; paid plans get the project/template/AI/hosting allowances defined in the pricing page.

## What is implemented
- Landing page
- Authentication (Supabase email/password)
- Dashboard with real project queries
- AI builder that creates a project then generates structured profile data
- Project editor and persistence
- Portfolio publishing with expiration based on entitlement
- Public portfolio route `/p/[slug]`
- Template gallery
- 100 portfolio + 100 resume template records in SQL seed
- Plan/entitlement system
- Paystack checkout + webhook entitlement activation
- Resend email helper and contact endpoint
- Admin dashboard with role guard and system counts
- RLS policies for user-owned data
- Environment variable separation for secrets

## First-time setup
1. Install Node.js 20+.
2. Copy `.env.example` to `.env.local`.
3. In Supabase, create a project and open SQL Editor.
4. Paste and run **all** of `db/schema.sql`.
5. In Supabase Auth settings, set your site URL to your Vercel URL and add `/api/auth/callback` if you use OAuth later. Email/password works without OAuth.
6. Put the Supabase URL and anon key in Vercel environment variables.
7. Create an OpenAI API key. Put it in `OPENAI_API_KEY`. Never expose it with `NEXT_PUBLIC_`.
8. In Resend, create an API key. Put it in `RESEND_API_KEY`. For production, verify your sending domain and change `EMAIL_FROM` to that domain. The default `onboarding@resend.dev` is only for basic testing.
9. In Paystack, use your existing account. Add public/secret/webhook credentials. Configure the webhook endpoint to `https://YOUR-VERCEL-DOMAIN/api/webhooks/paystack`.
10. Set `NEXT_PUBLIC_APP_URL=https://YOUR-VERCEL-DOMAIN`.
11. Deploy to Vercel.

## Vercel environment variables
Required for live functionality:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (reserved for future server/admin jobs; never expose it)
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default `gpt-4o-mini`)
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_PUBLIC_KEY`
- `` if needed by your chosen Paystack flow
- ``
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `SUPPORT_EMAIL`
- `NEXT_PUBLIC_APP_URL`

## Security notes
- Never commit `.env.local`.
- Never put OpenAI, Supabase service-role, Paystack secret, or Resend API keys in client-side code.
- Payment activation must come from a verified Paystack webhook/transaction, not from a client-side success message.
- For production, add webhook signature/transaction verification according to your Paystack account's current dashboard/API configuration before enabling paid entitlements.
- Add rate limiting/WAF and abuse monitoring before public launch.

## Important V1 limitation
This is a working full-stack foundation, not a finished enterprise product. Advanced ATS scoring, job matching, custom-domain DNS automation, analytics collection, PDF rendering, AI billing/cost accounting, admin CRUD screens, and production-grade payment reconciliation should be completed and tested before a public launch. The architecture is prepared for them.

## Deploying a ZIP
Vercel works best when you connect a Git repository, but you can also import a project. After deployment, add the environment variables in Vercel Project Settings → Environment Variables and redeploy.
