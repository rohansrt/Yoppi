# yoppi.in

YOPPI: experiences for schools and colleges.

A static site (no build step, no backend) served from GitHub Pages at
[yoppi.in](https://yoppi.in). It follows the InScene design language: Inter,
navy/blue/teal on white, hairline cards and navy-tinted shadows.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home: what's live today, schools and colleges, how we work |
| `offerings.html` | Offering cards for `#schools` and `#colleges`, each opening a detail dialog |
| `future-skills-lab.html` | Future Skills Lab catalogue: 12 courses × 3 class bands, each with a details dialog |
| `startup-sprint.html` | Startup Sprint: the Startup City business simulator (Class 6–12), opened from the Startup Sprint offering card |
| `contact.html` | Both founders (phone, WhatsApp, LinkedIn) and email |

Deep links: `offerings.html#colleges` opens the colleges tab, and
`offerings.html?offering=defend` opens that offering's dialog directly.

## Editing offerings

Every card and dialog is rendered from `assets/js/offerings-data.js`. Set
`status: 'live'` with an `href` for something people can use today, or
`status: 'soon'` for something in development (its button goes to Contact).

Live links: Career Simulator and Scenario Learning open InScene
(`inscene.anagat.net`), DEFEND opens `defend.anagat.net`, and Future Skills Lab
and Startup Sprint open `future-skills-lab.html` and `startup-sprint.html` on this site.

## Editing Future Skills Lab

Courses live in `assets/js/future-skills-data.js`: six skill areas, two courses
each, and per class band (`6-8`, `9-10`, `11-12`) five topics, an InScene mission
brief, four decision points, three skills checked and a thumbnail from
`assets/images/future-skills/`. Deep links: `future-skills-lab.html?class=9-10&area=ai&course=A01`.
Every course is in development, so its Start course button shows a Coming soon panel.

## Startup Sprint (Startup City)

A rule-based business simulation with no AI, no backend and no sign-up. Students
walk through six places in an illustrated town: Idea Park (find a problem), People
Street (three interviews), Market Centre (customer group + estimate), Build Studio
(feature builder with a working phone preview, plus its Test Corner), Launch Square
(price, promotion, two sales weeks and a surprise) and Founder HQ (the report, with
a real two-page PDF download). Three businesses (PlayShare, SnackStop, GiftBox),
three class bands (6–8, 9–10, 11–12).

| File | What it holds |
| --- | --- |
| `assets/js/startup-sprint/content.js` | All content: scenarios, people, answers, features, testers, prices, promotions, surprises, hints, reason texts (`CONTENT_VERSION`) |
| `assets/js/startup-sprint/engine.js` | Pure rules: stage order and locks, budget guards, the two-week market model, scoring and reason codes (`RULES_VERSION`, seeded) |
| `assets/js/startup-sprint/report.js` | Builds the report data that both the screen and the PDF use |
| `assets/js/startup-sprint/pdf.js` | A small, dependency-free PDF writer for the A4 report (₹ is drawn; Helvetica covers Latin text only) |
| `assets/js/startup-sprint/city.js` | The Startup City SVG drawings, all driven by the saved choices |
| `assets/js/startup-sprint/app.js` | Screens, routing (`#/idea-park` … `#/founder-hq`, `#/build-studio/test`), saving and the download |
| `assets/css/startup-sprint.css` | Styles, built on the site tokens and the Career Simulator's patterns |

Progress is saved in this browser only (`localStorage` key `yoppi.startupSprint.v1`):
the current game, the last finished report and the map/list preference. `?seed=123`
fixes the random seed for testing. Every number comes from the saved choices, the
seed and `RULES_VERSION`, so the same choices always give the same results.

Balancing: change numbers in `content.js`, then run `npm test` (accounting identities,
price sensitivity, feature effects, capacity, reproducibility) and look at
`node tests/calibrate.cjs playshare` for a sweep of outcomes.

## Checks and tests

Nothing here is needed to serve the site. With Node 18+ and Google Chrome installed:

```
npm install            # Playwright only (uses your installed Chrome)
npm run check          # scripts parse, local links resolve
npm test               # engine + PDF unit tests
npm run test:e2e       # plays Startup Sprint in Chrome: dry runs A–E, PDFs, mobile, regressions
```

Screenshots, downloaded PDFs and `dry-runs.json` go to `qa-artifacts/startup-sprint/` (git-ignored).

## Structure

```
assets/css/site.css            all styles (tokens at the top)
assets/js/offerings-data.js    offerings content
assets/js/site.js              header, reveal, cards, tabs, dialog, copy email
assets/js/future-skills-data.js  Future Skills Lab courses
assets/js/future-skills.js     Future Skills Lab catalogue and course dialog
assets/js/startup-sprint/      Startup Sprint game (content, engine, report, pdf, city, app)
assets/css/startup-sprint.css  Startup Sprint styles
tests/                         unit tests, e2e (tests/e2e) and the calibration sweep
assets/images/future-skills/   course thumbnails (InScene art), <slug>.webp + <slug>-800.webp
assets/images/offerings/       16:9 thumbnails, <slug>.webp (1600w) + <slug>-800.webp
assets/images/founders/        founder photos
assets/fonts/inter-var.woff2   Inter Variable (OFL)
```

## Contact

founder@yoppi.in · +91 86709 90985 · +91 89794 84758
