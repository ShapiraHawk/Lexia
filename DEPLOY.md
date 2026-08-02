# LEXIA — deployment notes

> These are notes for whoever deploys the app. The app itself is `index.html`.
> This file is deliberately NOT named README.md: GitHub Pages renders a README
> as the site index when no index.html is found at that path, which makes a
> misplaced folder look like a working site.

A reading-practice app for pure alexia (letter-by-letter reading), Hebrew and English.
No accounts, no server, no analytics. All patient data stays in the browser on the
patient's own device and is never transmitted anywhere.

## Deploy (about 5 minutes)

Upload the **contents of this folder** to any static host. Keep the file names as they are.

- **Netlify Drop** — drag the folder onto https://app.netlify.com/drop
- **Cloudflare Pages** — create a project, upload the folder
- **GitHub Pages** — commit the folder, enable Pages on the branch

It must be served over **https**. That is not cosmetic: browsers only allow the
offline cache and reliable local storage on a secure origin.

Works fine in a subfolder (`example.com/lexia/`) — every path is relative.

## Do not hand out the raw file

Opening `index.html` from `file://` (email attachment, Downloads folder) will appear
to work but iOS Safari blocks local storage there, so **the patient's history is lost
on every refresh**, silently. Always use a hosted URL.

## Put it on the patient's home screen

1. Open the URL once in the patient's browser
2. **iPhone/iPad** — Share → Add to Home Screen
3. **Android** — menu → Install app / Add to Home screen

It then opens full-screen from an icon, with no browser chrome, and works with no
connection. For a patient with low digital literacy this matters more than it sounds:
an icon is one tap, "open the browser and find the bookmark" is three chances to fail.

## Get the data out

Settings → הנתונים / Data:

- **Export all practice items (CSV)** — one row per trial: item shown, response given,
  reaction time, exposure, error class, position in session, and the font/size settings
  in force. This is the file worth keeping.
- **Summary for a clinician (CSV)** — slope, WPM, comprehension, sessions, error classes
- **Full backup (JSON)** — everything, restorable

Export after every session. Nothing is backed up anywhere else, and clearing browser
data erases it.

## Updating

Edit `index.html`, bump `APP_VERSION` in it and `VERSION` in `sw.js`, re-upload.
Patients get the new build the next time they open the app after it has cached.
The version is shown in Settings, so you can always tell which build produced a CSV.

## Files

| File | Purpose |
|---|---|
| `index.html` | the entire app — self-contained, no external requests |
| `sw.js` | offline cache |
| `manifest.webmanifest` | home-screen install metadata |
| `icon*.png`, `icon.svg` | app icons |

## GitHub Pages

**Do not use Jekyll, and do not use a Docker image.** This is a static site with no
templates, no Markdown to render and no dependencies. Jekyll would add a build step
that can only break things.

The `.nojekyll` file in this folder tells GitHub to publish the files exactly as they
are. Keep it. Without it GitHub runs everything through Jekyll's Liquid templating,
which treats `{{ }}` and `{% %}` as template tags — so the day someone adds a line of
JavaScript containing `{{`, the build fails or silently mangles the file. `.nojekyll`
also skips the build entirely, so pushes go live in seconds.

### Publishing

```bash
git init
git add -A            # make sure .nojekyll is included
git commit -m "LEXIA"
git branch -M main
git remote add origin https://github.com/USER/REPO.git
git push -u origin main
```

Then: repo → Settings → Pages → Source: *Deploy from a branch* → `main` / `/ (root)`.

Your URL will be `https://USER.github.io/REPO/`. The app works in that subfolder —
every path in it is relative, and the service worker scopes itself to the subfolder.

### Notes

- **https is automatic** on `github.io`, so the offline cache and local storage work.
- **Free GitHub Pages requires a public repo.** No patient data is ever in the repo —
  it stays in the patient's browser — but the app itself will be publicly reachable by
  anyone with the link. If that is not acceptable, use Cloudflare Pages or Netlify,
  which offer password protection on free plans.
- **After pushing an update**, bump `APP_VERSION` in `index.html` and `VERSION` in
  `sw.js`. The patient gets it on their next launch; the version in Settings tells you
  which build they are actually running.
- **First deploy can take a couple of minutes** to go live. After that it is quick.
