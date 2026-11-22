# amirg.dev

Personal site of Amir Gholizad, software developer and co-founder of [Sharplines Studio](https://sharplines.ca).

It's a single static page built with plain HTML, CSS and JavaScript. There's no framework, no build step and no dependencies.

| File | Purpose |
|---|---|
| `index.html` | The home page |
| `style.css` | All styles |
| `script.js` | Shows a placeholder frame until `photo.jpg` exists |
| `photo.jpg` | Black-and-white portrait on a pure black backdrop, landscape (2000×1333) |
| `.nojekyll` | Tells GitHub Pages to serve the files as-is, without Jekyll |
| `CNAME` | Custom domain (`amirg.dev`) |

## Run locally

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deploy

GitHub Pages serves the root of the `main` branch ("Deploy from a branch") at <https://amirg.dev>. Pushing to `main` publishes the site. All paths are relative, so it also works under a project URL like `username.github.io/repo-name/`.
