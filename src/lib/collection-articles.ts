import { statSync } from 'node:fs';
import { join } from 'node:path';
import type { MarkdownInstance } from 'astro';

const entries = import.meta.glob<MarkdownInstance<Record<string, unknown>>>(
  '../../works/*/articles/*/index.md',
  { eager: true },
);

function readArticle(collection: string, slug: string, page: MarkdownInstance<Record<string, unknown>>) {
  const directory = `works/${collection}/articles/${slug}`;
  const assetBase = `/assets/${directory}/`;
  const { frontmatter, Content } = page;

  function invalid(message: string): never {
    throw new Error(`${directory}/index.md — ${message}`);
  }

  function field(key: string, optional = false) {
    const value = frontmatter[key];
    if (optional && value === undefined) return '';
    if (typeof value !== 'string' || !value.trim()) invalid(`请填写有效的 ${key} 字段。`);
    return value.trim();
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) invalid('文章目录名应为小写字母、数字和短横线。');
  const date = field('date');
  const timestamp = new Date(date + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(timestamp.getTime()) || timestamp.toISOString().slice(0, 10) !== date) {
    invalid('date 应填写有效的 YYYY-MM-DD 日期，并用引号包起来。');
  }

  const cover = field('cover', true);
  const coverParts = cover.split('/');
  if (cover && (coverParts.some(part => !part || part.startsWith('.')) || /[\\?#:]/.test(cover))) {
    invalid('cover 应使用文章目录内的相对路径。');
  }
  if (cover && !statSync(join(process.cwd(), directory, ...coverParts), { throwIfNoEntry: false })?.isFile()) {
    invalid(`找不到封面文件 ${cover}。`);
  }

  const source = field('source', true);
  if (source && (!source.startsWith('https://') || !URL.canParse(source))) invalid('source 应填写完整的 HTTPS 网址。');

  return {
    slug,
    title: field('title'),
    author: field('author'),
    summary: field('summary'),
    date,
    spoiler: field('spoiler', true),
    source,
    coverUrl: cover ? assetBase + coverParts.map(encodeURIComponent).join('/') : '',
    href: `/works/${collection}/${slug}/`,
    assetBase,
    Content,
  };
}

export function getCollectionArticles(collection: string) {
  const prefix = `../../works/${collection}/articles/`;
  return Object.entries(entries)
    .filter(([path]) => path.startsWith(prefix))
    .map(([path, page]) => readArticle(collection, path.split('/').at(-2)!, page))
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'zh-CN'));
}
