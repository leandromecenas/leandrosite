import { mkdir, readFile, writeFile } from 'node:fs/promises';

const html = await readFile('hub79.html', 'utf8');
await mkdir('dist/hub79', { recursive: true });
await writeFile('dist/hub79/index.html', html, 'utf8');
