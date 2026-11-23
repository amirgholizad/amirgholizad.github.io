# amirg.dev

Personal site of Amir Gholizad, software developer and co-founder of [Sharplines Studio](https://sharplines.ca).

It's a small static site built with plain HTML and CSS, plus one small script for the blog's audio player. There's no framework, no build step and no dependencies. Every page fits the screen without scrolling; long blog posts scroll inside their own reading window.

| File | Purpose |
|---|---|
| `index.html` | Home: headline over the portrait |
| `about.html` | About: short bio and facts |
| `work.html` | Work: career journey drawn as a winding road |
| `open-source.html` | Open source: a card per project with a screenshot, a live demo link and a source link |
| `img/` | Project screenshots for the Open source page |
| `blog.html` | Blog: a grid of square post cards, newest first |
| `posts/` | One HTML file per post; the article scrolls inside a glass reading window. Audio versions live in `posts/audio/` |
| `player.js` | Audio player for posts that have an audio version |
| `contact.html` | Contact: email and links |
| `style.css` | All styles. The page entrance timing (start times `--t-*` and durations `--d-*`) is at the bottom |
| `photo.jpg` | Black-and-white portrait on a pure black backdrop, landscape (2000×1333) |
| `og-image.jpg` | Link preview card (1200×630) used by Google, LinkedIn, X, Slack, etc. |
| `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` | Site icons (Google shows the favicon next to search results) |
| `sitemap.xml`, `robots.txt` | Tell search engines which pages to crawl |
| `.nojekyll` | Tells GitHub Pages to serve the files as-is, without Jekyll |
| `CNAME` | Custom domain (`amirg.dev`) |

## Run locally

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deploy

GitHub Pages serves the root of the `main` branch ("Deploy from a branch") at <https://amirg.dev>. Pushing to `main` publishes the site. Links between pages are relative, so it also works under a project URL like `username.github.io/repo-name/`. Canonical URLs, Open Graph tags and structured data use absolute `https://amirg.dev/...` URLs on purpose.

## Adding an open-source project

1. Save a screenshot in `img/` as a JPG about 960px wide. A 16:10 image crops best; the card trims the edges to fit.
2. In `open-source.html`, copy one `<li class="project">` card and change the screenshot, the meta line (license and stack), the name, a one-sentence description (keep it to about two lines so the page still fits short screens), and the demo and source links. If a project has no live demo, delete that link.
3. In the same file's `<head>`, add a matching `ListItem` to the JSON-LD list.

Up to three projects fit on one row on desktop (two on smaller laptops and tablets). On phones the cards become compact rows. Beyond what fits, the content scrolls inside the page like on the other pages, so once there are more than three or four projects the cards will need a more compact layout.

## Adding a blog post

1. Copy `posts/how-i-became-a-software-developer.html` to a new file in `posts/` and replace the title, date, reading time and article text. In its `<head>`, also update the description, the canonical and `og:` URLs, `article:published_time`, and the headline, description and dates in the JSON-LD block.
2. In `blog.html`, copy the `<li>` card at the top of the `.posts` list and point it at the new file.
3. To use a photo as a cover, put it in the repo and replace the `<svg>` inside `.cover` with `<img src="..." alt="...">`. Inside an article, use `<figure><img src="..." alt="..."><figcaption>...</figcaption></figure>`.
4. Add the new post's URL to `sitemap.xml`.
5. Optional audio version: put the MP3 in `posts/audio/`, copy the `.listen` block and the `<script src="../player.js">` tag from the first post, and set `data-duration` (seconds) and `data-chapters` (the start second of the intro and of each `<h2>` section, in order). Mark the card in `blog.html` with "· Audio".

## SEO

- Every page has a unique `<title>`, meta description, canonical URL and Open Graph tags.
- `index.html` holds the main structured data (JSON-LD): `Person` (Amir Gholizad, with `alternateName` "Amirgholizad"), `WebSite`, `ProfilePage`, and `Organization` for Sharplines Studio with Amir as founder. Keep the `sameAs` list in sync with the social links; add the Twitter/X profile there once the handle is set.
- Don't add a location (address, city or country) to any text or structured data.
