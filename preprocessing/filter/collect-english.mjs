import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const baseDir = './dataset';
const outputDir = './dataset-en';
const files = await readdir(baseDir);
const dataFiles = files.filter((f) => f.endsWith('.json'));

for (const file of dataFiles) {
  const fullPath = join(baseDir, file);
  const str = await readFile(fullPath, 'utf-8');
  const data = JSON.parse(str);
  const filteredReviews = data
    .filter((review) => review.opencritic.language === 'en-us')
    .map((data) => ({
      game: data.opencritic.game.name,
      url: data.url,
      title: data.title,
      text: data.textContent,
    }));
  await writeFile(
    join(outputDir, file),
    JSON.stringify(filteredReviews),
    'utf-8'
  );
}
