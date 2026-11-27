import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export type JourneyPhoto = {
  id: string;
  src: string;
  title: string;
};

const repositoryUrl = 'https://github.com/shanlinglu/shanlinglu.github.io';
const folderPath = 'public/journey-photos';
const optimizedFolderPath = `${folderPath}/optimized`;
const imageExtension = /\.(?:avif|gif|jpe?g|png|webp)$/i;
const filenameOrder = new Intl.Collator('zh-CN', { numeric: true });

export const journeyUploadUrl = `${repositoryUrl}/upload/main/${folderPath}`;

export async function getJourneyPhotos(): Promise<JourneyPhoto[]> {
  const entries = await readdir(join(process.cwd(), optimizedFolderPath), { withFileTypes: true });
  const filenames = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.webp'))
    .map((entry) => ({ optimized: entry.name, original: entry.name.replace(/\.webp$/i, '') }))
    .sort((first, second) => {
      const order = filenameOrder.compare(second.original, first.original);
      if (order !== 0 || first.original === second.original) return order;
      return first.original < second.original ? -1 : 1;
    });

  return filenames.map(({ optimized, original }) => {
    const title = original.replace(imageExtension, '').replace(/_+/g, ' ').trim();
    return {
      id: original,
      src: `/journey-photos/optimized/${encodeURIComponent(optimized)}`,
      title: title || original,
    };
  });
}
