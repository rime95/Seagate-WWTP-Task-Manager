# Seagate WWTP Task Manager

A simple task manager for a WWTP senior engineer. Tasks are organised into **Daily, Weekly and Monthly** checklists. A separate **Invoices** tab tracks which invoices have been sent to Finance.

It is a Next.js web app that runs on phone and PC. It can be installed to the home screen and works offline. All data stays **on your device**, with no account and no server.

## Features
- **Daily / Weekly / Monthly tabs.** Each tab shows a count of open tasks, a progress bar and a category filter (Chemical, Roster, Report, Invoice, Operations, Other).
- **Go from date to date.** Use ‹ › to step one day, week (Mon–Sun) or month, and **Today** / **This week** / **This month** to jump back. Tap the date to open a calendar. In the calendar, a green dot means everything was done and a red dot means something was missed.
- **Ticks are saved per date.** Your task list repeats every period, but each day, week or month has its own ticks. A new period starts unticked, and past periods keep their history.
- **Daily tab shows the whole picture.** Under the day's tasks it also lists that week's weekly tasks and that month's monthly tasks. Ticking one there ticks it for the whole week or month, so it shows as done on every date in that period.
- **Notes per week and month.** A weekly or monthly task's note belongs to that week or month (e.g. "PR 4512 raised for 2 t polymer"). The next week or month shows it as *carried from Week 44* until you change it, and earlier periods keep their own note. Daily tasks keep one note.
- **Google sign-in and auto-save.** Sign in with Google and everything saves to your account a few seconds after each change. The same tasks show on your phone and PC. A fresh device loads your account's copy automatically. If two devices both changed something before syncing, the app asks which copy to keep.
- **Opens on today.** Every time you open the app it shows today, this week and this month.
- **One-off tasks.** Turn on 📌 *One-off task* to make a task appear only on the day, week or month you are viewing.
- **Starter tasks** for chemical orders, roster, invoices and the monthly report. You can edit or delete any of them.
- **Quick-add bar.** Type a task and press Enter. If a category filter is active, the new task gets that category.
- **Subtasks.** For example, the monthly report sections or each chemical to check.
- **High priority flag**, plus a **Focus** strip at the top that collects high-priority open tasks from every tab.
- **Invoices tab.** A plain "sent to Finance?" checklist per month, with ‹ › to change month. Ticking an invoice records the date it was sent. A banner warns you about unsent invoices from earlier months.
- **Swipe gestures** on phone: swipe right to mark done, swipe left to delete. On PC, use the buttons instead.
- **Undo toast** after you complete or delete something. Deleting a repeating task that has history removes it from today onward, and past days still show it.
- **Backup.** Use ⋮ → *Export backup* to save a `.json` file, and ⋮ → *Import backup* to restore it on any device.
- Light and dark mode follow your phone or PC setting.

## Run locally
```bash
npm install
npm run dev        # http://localhost:3000
```

## Build (static site)
```bash
npm run build      # outputs the static site to ./out
npx serve out      # preview the production build
```

## Deploy
- **Vercel:** import the repo. No settings needed.
- **GitHub Pages:** build with `NEXT_PUBLIC_BASE_PATH=/Seagate-WWTP-Task-Manager npm run build`, then publish the `out/` folder.

## Google sign-in setup (one time)
This app uses the same Supabase project as Grounds Up, so Google sign-in is already configured there.

1. **Create the table.** In Supabase, go to Dashboard → SQL Editor → New query. Paste in [`supabase/wwtp-data.sql`](supabase/wwtp-data.sql) and click **Run**.
2. **Allow this app's address.** Go to Supabase → Authentication → URL Configuration → Redirect URLs. Add your Vercel address, for example `https://your-app.vercel.app/**`. Add `http://localhost:3000/**` too if you run the app locally.
3. **Add the keys to Vercel.** Go to Vercel → Project → Settings → Environment Variables and add:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://nvhmvlpztfhogmnipdot.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the same anon (public) key Grounds Up uses, found in Supabase → Project Settings → API Keys
4. **Redeploy** on Vercel. A **Sign in** button appears at the top right.

Without these keys the app still works, but data stays on the device.

## Install on your phone
Open the site in Chrome (Android) or Safari (iPhone), then choose **Add to Home Screen**.

> Your data lives in that browser on that device. Export a backup now and then, and use Import to move your data to another device.

## Project structure
```
app/          layout + main page
components/   UI pieces (tabs, task list, sheets, toast, swipe rows…)
lib/          types, localStorage store, starter tasks, backup import/export
public/       PWA manifest, icon, service worker
```
