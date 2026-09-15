import { mkdir, readdir, rm, rename, access } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileAsync = promisify(execFile);
const rootFiles = await readdir('.');
const zipName = rootFiles.find((name) => name.trim().toLowerCase() === 'hub79.zip');

if (!zipName) {
  throw new Error('hub79.zip não encontrado no repositório');
}

const outDir = path.join('dist', 'hub79');
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

await execFileAsync('unzip', ['-oq', zipName, '-d', outDir]);

// Se o ZIP vier com uma única pasta externa, move o conteúdo dela para /hub79.
try {
  await access(path.join(outDir, 'index.html'));
} catch {
  const entries = await readdir(outDir, { withFileTypes: true });
  const dirs = entries.filter((entry) => entry.isDirectory());
  const files = entries.filter((entry) => entry.isFile());

  if (dirs.length === 1 && files.length === 0) {
    const nested = path.join(outDir, dirs[0].name);
    const nestedEntries = await readdir(nested);
    for (const entry of nestedEntries) {
      await rename(path.join(nested, entry), path.join(outDir, entry));
    }
    await rm(nested, { recursive: true, force: true });
  }
}

await access(path.join(outDir, 'index.html'));
console.log(`HUB79 extraído de "${zipName}" para ${outDir}`);
