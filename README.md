# Escondido PTA Ice Cream Challenge 2026

Public progress board for the Escondido Elementary PTA ice cream fundraiser, plus a password-protected admin page for goals and CSV updates.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The gear icon in the header opens admin login.

Set `ADMIN_PASSWORD` and `SESSION_SECRET` in `.env.local`.

Demo classrooms and totals are written to `data/store.json` by `npm run seed`. That file is gitignored. Locally, if it is missing, the app seeds demo data. On Railway, a missing file starts empty (no fake classrooms).

## What is stored

The site keeps only tallies:

- public page title
- overall dollar goal and amount raised
- classroom number, teacher name, student count, and scoop count
- donation site URL
- last-updated timestamp

Student names, family names, and individual donation amounts are never written to disk after a CSV is processed. The Square item summary is summed and discarded; only the school-wide total is kept.

## Admin CSV formats

Classroom roster (`examples/classrooms.csv`):

```csv
classroom,teacher,students
12,Ms. Smith,24
```

Donations (`examples/donations.csv` or last year’s PTA form export) update classroom scoops only:

```csv
classroom,student
12,Jane Doe
```

The same family in the same classroom is one scoop. Dollar amounts in this file are ignored — use the item summary CSV below for the school-wide total.

## Live CheddarUp updates (Zapier)

In addition to the donations CSV, Zapier can POST one purchase at a time to:

`https://YOUR-SERVICE.up.railway.app/update`

Send JSON with the same fields as the donations CSV (simple `classroom` + `student`, or CheddarUp form columns such as `Respondent` and `Student #1: Classroom`). Each new family in a classroom adds one scoop. Repeat gifts by the same family in the same classroom are skipped. A later donations CSV upload still replaces classroom scoops from the full export.

Protect the URL with a dedicated `UPDATE_SECRET` (not the admin login password). Zapier should send one of:

- Header `X-Update-Secret: your-secret`
- Header `Authorization: Bearer your-secret`
- JSON body field `secret`

Do not put the secret in the URL query string (`?secret=`). Those values leak in logs, proxies, and browser history.

To add a payment amount to the school fundraising total, POST to `/update_payment` with the same secret and a JSON `total`:

```json
{ "id": 10001, "total": 40 }
```

or `{ "total": "$40.00" }`. That **adds** this payment to the current total. Different items on the same CheddarUp payment are each counted. Only a repeat of the same line-item `id` is skipped. A later item summary CSV upload still **replaces** the school total from the Square export.

Item summary (`examples/item-summary.csv`, Square export) sets the school-wide dollar total from **Net Amount Sold**:

```csv
Item Name,Variation,Price,Quantity Sold,Quantity Refunded,Amount Sold,Refunded Amount,Net Amount Sold
Single Scoop (PER CHILD Suggested Donation),,$350.00,10,,"$3,500.00",$0.00,"$3,500.00"
```

## Report

The **Report** button on `/admin` opens `/admin/report`: the school total against the goal, total scoops and students, how many classrooms met the scoop goal, and a per-classroom table (students, scoops, percent, goal met) with a total row. **Download CSV** saves the same report for a spreadsheet. Dollars are only stored as a school-wide total, so there are no per-classroom amounts.

## Railway

The app is a single Node web service. Tally data is a JSON file, so it needs a **volume** or every deploy will reset progress.

1. **Commit and push** this repo to GitHub (Railway deploys from git).
2. In [Railway](https://railway.app), **New Project → Deploy from GitHub repo**.
3. Open the service **Variables** and set:
   - `ADMIN_PASSWORD` — the admin login password
   - `SESSION_SECRET` — a long random string, for example:
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `UPDATE_SECRET` — required shared secret for Zapier `POST /update` and `POST /update_payment`. Do not reuse `ADMIN_PASSWORD`.
4. Add a **Volume** to the service. Mount path `/data` is fine. Railway sets `RAILWAY_VOLUME_MOUNT_PATH`; the app writes `store.json` there. Do not skip this or CSV/goal updates disappear on the next deploy.
5. Under **Settings → Networking**, generate a public domain (or attach a custom one). HTTPS is provided on `*.up.railway.app`.
6. After the first deploy, open `/admin`, log in, set the page title, donation URL, and goals, then upload the classroom roster, donations, and item summary CSVs.

Build is `npm run build`. Start is `npm run start` (`next start --hostname 0.0.0.0`). Railway injects `PORT`.

Do not commit `.env` files or `data/store.json`.
