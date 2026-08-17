/* Собирает всю игру в один HTML-файл: three.js и скрипты встраиваются внутрь.
   Такой файл открывается двойным щелчком из любой папки и работает без сервера.
   Запуск: node build.js  →  build/pechki-dubai.html */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let html = read('index.html');

const scripts = [
  'vendor/three.min.js',
  'src/audio.js',
  'src/world.js',
  'src/game.js'
];

for (const src of scripts) {
  const tag = `<script src="${src}"></script>`;
  if (!html.includes(tag)) throw new Error('не найден тег для ' + src);
  html = html.replace(tag, '<script>\n' + read(src) + '\n</script>');
}

fs.mkdirSync(path.join(root, 'build'), { recursive: true });
const out = path.join(root, 'build', 'pechki-dubai.html');
fs.writeFileSync(out, html);
console.log('готово:', out, (fs.statSync(out).size / 1024).toFixed(0) + ' КБ');
