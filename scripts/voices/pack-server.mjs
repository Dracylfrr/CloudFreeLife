// A tiny local server for the voice pack renderer: it hands the speech model and voices (read only, from the
// app's data folder or a folder you name) to the renderer page, and receives the finished files.
//   node scripts/voices/pack-server.mjs [output-folder] [voices-folder] [content-folder]
import { createServer } from 'node:http';
import { createReadStream, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT = resolve(process.argv[2] ?? 'voicepacks-out');
const VOICES = resolve(process.argv[3] ?? process.env.APPDATA + '/Project D.R.E.A.M/voices');
mkdirSync(OUT, { recursive: true });
const CONTENT = resolve(process.argv[4] ?? 'content');
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, HEAD, PUT, OPTIONS', 'Access-Control-Allow-Headers': '*' };
const SAFE = /^[A-Za-z0-9_.-]+$/;

createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (req.method === 'OPTIONS') return void res.writeHead(204, cors).end();
  if (req.method === 'PUT' && url.startsWith('/save/')) {
    const name = url.slice(6);
    if (!SAFE.test(name)) return void res.writeHead(400, cors).end();
    const parts = [];
    req.on('data', (d) => parts.push(d));
    req.on('end', () => {
      writeFileSync(resolve(OUT, name), Buffer.concat(parts));
      res.writeHead(200, cors).end('ok');
    });
    return;
  }
  // every free story and adventure, for rendering them all
  if (url === '/list') {
    const paths = [];
    for (const sub of ['relaxing', 'adventures']) {
      try {
        for (const d of readdirSync(resolve(CONTENT, 'stories', sub), { withFileTypes: true })) if (d.isDirectory()) paths.push(`stories/${sub}/${d.name}`);
      } catch {
        /* none of that kind */
      }
    }
    return void res.writeHead(200, { ...cors, 'Content-Type': 'application/json' }).end(JSON.stringify(paths));
  }
  // what has been saved so far can be read back (to check it plays)
  const mine = url.startsWith('/out/');
  const name = url.slice(mine ? 5 : 1);
  if ((req.method !== 'GET' && req.method !== 'HEAD') || !SAFE.test(name)) return void res.writeHead(404, cors).end();
  try {
    const file = resolve(mine ? OUT : VOICES, name);
    const st = statSync(file);
    res.writeHead(200, { ...cors, 'Content-Length': st.size, 'Content-Type': 'application/octet-stream' });
    if (req.method === 'HEAD') res.end();
    else createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404, cors).end();
  }
}).listen(8765, '127.0.0.1', () => console.log(`voice files from ${VOICES}\nfinished files go to ${OUT}`));
