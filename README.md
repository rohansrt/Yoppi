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
| `contact.html` | Both founders (phone, WhatsApp, LinkedIn) and email |

Deep links: `offerings.html#colleges` opens the colleges tab, and
`offerings.html?offering=defend` opens that offering's dialog directly.

## Editing offerings

Every card and dialog is rendered from `assets/js/offerings-data.js`. Set
`status: 'live'` with an `href` for something people can use today, or
`status: 'soon'` for something in development (its button goes to Contact).

Live links: Career Simulator and Scenario Learning open InScene
(`inscene.anagat.net`), DEFEND opens `defend.anagat.net`, and Future Skills Lab
opens `future-skills-lab.html` on this site.

## Editing Future Skills Lab

Courses live in `assets/js/future-skills-data.js`: six skill areas, two courses
each, and per class band (`6-8`, `9-10`, `11-12`) five topics, an InScene mission
brief, four decision points, three skills checked and a thumbnail from
`assets/images/future-skills/`. Deep links: `future-skills-lab.html?class=9-10&area=ai&course=A01`.
Every course is in development, so its Start course button shows a Coming soon panel.

## Structure

```
assets/css/site.css            all styles (tokens at the top)
assets/js/offerings-data.js    offerings content
assets/js/site.js              header, reveal, cards, tabs, dialog, copy email
assets/js/future-skills-data.js  Future Skills Lab courses
assets/js/future-skills.js     Future Skills Lab catalogue and course dialog
assets/images/future-skills/   course thumbnails (InScene art), <slug>.webp + <slug>-800.webp
assets/images/offerings/       16:9 thumbnails, <slug>.webp (1600w) + <slug>-800.webp
assets/images/founders/        founder photos
assets/fonts/inter-var.woff2   Inter Variable (OFL)
```

## Contact

founder@yoppi.in · +91 86709 90985 · +91 89794 84758
