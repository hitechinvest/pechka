/* Собирает всю игру в один HTML-файл: three.js и скрипты встраиваются внутрь.
   Такой файл открывается двойным щелчком из любой папки и работает без сервера.
   Запуск: node build.js  →  build/pechki-dubai.html */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let html = read('index.html');

// список скриптов берём прямо из index.html, чтобы сборка не отставала от разметки
const tags = html.match(/<script src="[^"]+"><\/script>/g) || [];
if (!tags.length) throw new Error('в index.html не найдено ни одного внешнего скрипта');

for (const tag of tags) {
  const src = tag.match(/src="([^"]+)"/)[1];
  html = html.replace(tag, '<script>\n' + read(src) + '\n</script>');
  console.log('встроен', src);
}

fs.mkdirSync(path.join(root, 'build'), { recursive: true });
const out = path.join(root, 'build', 'pechki-dubai.html');
fs.writeFileSync(out, html);
console.log('готово:', out, (fs.statSync(out).size / 1024).toFixed(0) + ' КБ');
