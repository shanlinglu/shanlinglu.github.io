import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export type JourneyPhoto = {
  id: string;
  src: string;
  title: string;
};

const repositoryUrl = 'https://github.com/shanlinglu/shanlinglu.github.io';
const folderPath = 'public/journey-photos';
const imageExtension = /\.(?:avif|gif|jpe?g|png|webp)$/i;
const filenameOrder = new Intl.Collator('zh-CN', { numeric: true });

export const journeyUploadUrl = `${repositoryUrl}/upload/main/${folderPath}`;

export async function getJourneyPhotos(): Promise<JourneyPhoto[]> {
  const entries = await readdir(join(process.cwd(), folderPath), { withFileTypes: true });
  const filenames = entries
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.') && imageExtension.test(entry.name))
    .map((entry) => entry.name)
    .sort((first, second) => {
      const order = filenameOrder.compare(second, first);
      if (order !== 0 || first === second) return order;
      return first < second ? -1 : 1;
    });

  return filenames.map((filename) => {
    const title = filename.replace(imageExtension, '').replace(/_+/g, ' ').trim();
    return { id: filename, src: `/journey-photos/${encodeURIComponent(filename)}`, title: title || filename };
  });
}
