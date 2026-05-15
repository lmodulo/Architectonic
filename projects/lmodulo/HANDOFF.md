# lmodulo — Handoff

## What's done

| Item | Status | Notes |
|------|--------|-------|
| Invite flow | ✅ Complete | Admin invites → email → `/accept-invite` → activate → login |
| Dashboard real data | ✅ Complete | All KPIs pull from live API — no seeded RNG |
| Proposals | ✅ Complete | Create from deal detail; `proposal` status on invoices; "Convert to Invoice" |
| Stripe webhook | ✅ Complete | `POST /finance/stripe/webhook` — auto-marks invoice paid, records payment |

---

## Remaining: Email Notifications

### What exists

`projects/lmodulo/api/src/lib/email.ts` has the full email infrastructure:
- `sendMail(opts)` — SMTP singleton (Ethereal fallback in dev)
- `layout(opts)` — HTML email template with heading, body, CTA button, footer note
- `sendInviteEmail()` and `sendPasswordResetEmail()` — pattern to follow

### What to build

**1. `sendInvoiceEmail(to, invoiceNumber, total, invoiceUrl)` in `email.ts`**
```ts
export async function sendInvoiceEmail(to: string, opts: {
  invoiceNumber: string; total: number; currency: string; invoiceUrl: string;
}): Promise<void> {
  await sendMail({
    to,
    subject: `Invoice ${opts.invoiceNumber} from ${process.env.APP_NAME ?? 'Us'}`,
    html: layout({
      heading: `Invoice ${opts.invoiceNumber}`,
      body:    `<p>Please find your invoice of ${new Intl.NumberFormat('en-US',{style:'currency',currency:opts.currency}).format(opts.total)} attached.</p>`,
      cta:     { label: 'View Invoice', url: opts.invoiceUrl },
      note:    'Reply to this email if you have any questions.',
    }),
    text: `Invoice ${opts.invoiceNumber}\n\nAmount: ${opts.total}\n\nView: ${opts.invoiceUrl}`,
  });
}
```

**2. `sendInvoiceOverdueEmail(to, invoiceNumber, total, dueDate, invoiceUrl)` in `email.ts`**
Same pattern, subject `Invoice ${invoiceNumber} is overdue`.

**3. Wire into the finance route — `projects/lmodulo/api/src/routes/finance/index.ts`**

In `PATCH /finance/invoices/:id`, after the `updateOne`, add:
```ts
// When status changes to 'sent', email the customer
if (status === 'sent') {
  const inv = await db.collection(INV_COL).findOne({ _id: oid });
  const customer = inv && await db.collection('users').findOne({ _id: inv.customerId });
  if (customer?.email) {
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    sendInvoiceEmail(customer.email, {
      invoiceNumber: inv.invoiceNumber as string,
      total:         inv.total as number,
      currency:      inv.currency as string,
      invoiceUrl:    `${appUrl}/payments`,
    }).catch(err => console.error('[email] invoice send failed:', err));
  }
}
```

Note: customers see invoices at `/payments`, not `/folio/invoices/:id` (customer role is restricted).

**4. Wire overdue reminder into scheduler — `projects/lmodulo/api/src/plugins/scheduler.ts`**

Add a `processOverdueInvoices(db, now)` function called from `tick()`:
```ts
async function processOverdueInvoices(db: Db, now: Date) {
  const overdue = await db.collection(INV_COL).find({
    status:  'sent',
    dueDate: { $lt: now },
  }).toArray();

  for (const inv of overdue) {
    await db.collection(INV_COL).updateOne({ _id: inv._id }, { $set: { status: 'overdue', updatedAt: now } });
    const customer = await db.collection('users').findOne({ _id: inv.customerId });
    if (customer?.email) {
      const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
      sendInvoiceOverdueEmail(customer.email, {
        invoiceNumber: inv.invoiceNumber as string,
        total:         inv.total as number,
        currency:      inv.currency as string,
        dueDate:       inv.dueDate as Date,
        invoiceUrl:    `${appUrl}/payments`,
      }).catch(err => console.error('[email] overdue reminder failed:', err));
    }
  }
}
```

**5. Ticket notification — `projects/lmodulo/api/src/routes/tickets.ts`**

No email is sent when a ticket is created. After inserting the ticket job, look up users with `owner`/`admin` role and call `sendTicketNotification()` (add to `email.ts`). Keep it fire-and-forget (`.catch(console.error)`).

### Testing email locally

Without `SMTP_HOST`, the app uses Ethereal (fake SMTP). Look for the preview URL in the API container logs:
```
[email] Preview: https://ethereal.email/message/...
```

---

## Remaining: CI/CD

### What exists

`projects/lmodulo/render.yaml` — fully configured Render Blueprint:
- Two services: `lmodulo-api` (Fastify, Docker) and `lmodulo-frontend` (SvelteKit, Docker)
- Both in Oregon on free tier
- All env vars stubbed with `sync: false` (set in Render dashboard)
- `render.yaml` supports Render's native auto-deploy from GitHub — no GitHub Actions required

### Option A — Render native (simplest, zero config)

1. Push the repo to GitHub (if not already)
2. In Render → New → Blueprint → point at the repo → Render reads `render.yaml` and creates both services
3. Every push to `main` auto-deploys — done

No `.github/workflows/` needed.

### Option B — GitHub Actions + Render deploy hook (if you want a build gate)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]
    paths:
      - 'projects/lmodulo/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Trigger Render deploy (API)
        run: curl -s "${{ secrets.RENDER_DEPLOY_HOOK_API }}" > /dev/null

      - name: Trigger Render deploy (Frontend)
        run: curl -s "${{ secrets.RENDER_DEPLOY_HOOK_FRONTEND }}" > /dev/null
```

Get deploy hook URLs from: Render dashboard → service → Settings → Deploy Hook.

Add as GitHub repo secrets: `RENDER_DEPLOY_HOOK_API`, `RENDER_DEPLOY_HOOK_FRONTEND`.

The `paths` filter means pushes to `candidate/` or other projects don't trigger a deploy.

### Env vars to set in Render after first deploy

| Var | Where to get it |
|-----|----------------|
| `MONGO_URI` | MongoDB Atlas → Connect → Drivers |
| `FRONTEND_ORIGIN` | `https://lmodulo-frontend.onrender.com` (your frontend URL) |
| `APP_URL` | Same as `FRONTEND_ORIGIN` |
| `ORIGIN` | Same as `FRONTEND_ORIGIN` (frontend service) |
| `API_URL` | `https://lmodulo-api.onrender.com` (frontend service) |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Resend, Postmark, or Mailgun SMTP credentials |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard → Webhooks → signing secret |

For `STRIPE_WEBHOOK_SECRET`: create a webhook in Stripe pointed at `https://lmodulo-api.onrender.com/finance/stripe/webhook`, listening for `payment_intent.succeeded`.

---

## Key file index

| File | Purpose |
|------|---------|
| `api/src/lib/email.ts` | All email functions — add new ones here |
| `api/src/routes/finance/index.ts:168` | `PATCH /finance/invoices/:id` — add sent email trigger here |
| `api/src/routes/finance/index.ts:282` | Stripe webhook — already complete |
| `api/src/plugins/scheduler.ts:96` | `tick()` — add `processOverdueInvoices` call here |
| `api/src/routes/tickets.ts` | Ticket creation — add staff notification email |
| `render.yaml` | Render Blueprint — already complete |
