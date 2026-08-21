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

The same family in the same classroom is one scoop. Dollar amounts in this file are ignored.

Item summary (`examples/item-summary.csv`, Square export) sets the school-wide dollar total from **Net Amount Sold**:

```csv
Item Name,Variation,Price,Quantity Sold,Quantity Refunded,Amount Sold,Refunded Amount,Net Amount Sold
Single Scoop (PER CHILD Suggested Donation),,$350.00,10,,"$3,500.00",$0.00,"$3,500.00"
```

## Railway

The app is a single Node web service. Tally data is a JSON file, so it needs a **volume** or every deploy will reset progress.

1. **Commit and push** this repo to GitHub (Railway deploys from git).
2. In [Railway](https://railway.app), **New Project → Deploy from GitHub repo**.
3. Open the service **Variables** and set:
   - `ADMIN_PASSWORD` — the admin login password
   - `SESSION_SECRET` — a long random string, for example:
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
4. Add a **Volume** to the service. Mount path `/data` is fine. Railway sets `RAILWAY_VOLUME_MOUNT_PATH`; the app writes `store.json` there. Do not skip this or CSV/goal updates disappear on the next deploy.
5. Under **Settings → Networking**, generate a public domain (or attach a custom one). HTTPS is provided on `*.up.railway.app`.
6. After the first deploy, open `/admin`, log in, set the page title, donation URL, and goals, then upload the classroom roster, donations, and item summary CSVs.

Build is `npm run build`. Start is `npm run start` (`next start --hostname 0.0.0.0`). Railway injects `PORT`.

Do not commit `.env` files or `data/store.json`.
