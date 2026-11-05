# llaurazhang.github.io
laura's ux design portfolio — a little mac-os style desktop with animal crossing music, day/night mode and mochi the pixel pet.

## adding your work
everything in the **projects** and **hardware** folders comes from [`projects.js`](projects.js).
each entry becomes a "file" in the folder and opens as a case study.

- put images in `img/projects/` and set `cover: 'img/projects/my-cover.png'`
- paste a figma share/prototype link into `figma: '...'` and it embeds right in the window
- add case study sections with `sections: [{ heading, body, image }]`
- add buttons with `links: [{ label: 'behance', url: '...' }]`

## files
- `index.html` — layout, windows, widgets
- `style.css` / `globals.css` — styles + day/night colour tokens
- `script.js` — window manager (drag, focus, minimise, maximise, esc to close), folders, music, extras
- `pet.js` — mochi the pixel pet (feed / play / pet, sleeps in night mode)
- `projects.js` — your portfolio content
