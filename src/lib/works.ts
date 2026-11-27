import { statSync } from 'node:fs';
import { join } from 'node:path';
import type { MarkdownInstance } from 'astro';

type Fields = Record<string, unknown>;
const entries = import.meta.glob<MarkdownInstance<Fields>>('../../works/*/index.md', { eager: true });

function workFromFile(path: string, page: MarkdownInstance<Fields>) {
  const slug = path.split('/').at(-2)!;
  function invalid(message: string): never {
    throw new Error('works/' + slug + '/index.md — ' + message);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) invalid('目录名应为小写字母、数字和短横线。');
  const fields = page.frontmatter;
  function field(key: string, optional = false): string {
    const value = fields[key];
    if (optional && value === undefined) return '';
    if (typeof value !== 'string' || !value.trim()) invalid('请填写有效的 ' + key + ' 字段。');
    return (value as string).trim();
  }
  function https(value: string): boolean {
    try { return new URL(value).protocol === 'https:' && value.startsWith('https://'); }
    catch { return false; }
  }
  function asset(value: string) {
    const parts = value.split('/');
    if (parts.some(p => !p || p.startsWith('.')) || /[\\?#:]/.test(value)) invalid('请使用作品目录内的相对文件路径：' + value);
    if (!statSync(join(process.cwd(), 'works', slug, ...parts), { throwIfNoEntry: false })?.isFile()) invalid('找不到文件：' + value);
    return '/assets/works/' + slug + '/' + parts.map(encodeURIComponent).join('/');
  }
  const title = field('title'), author = field('author'), type = field('type'), summary = field('summary'), entry = field('entry');
  const cover = field('cover', true), source = field('source', true);
  if (source && !https(source)) invalid('source 需要完整的 HTTPS 网址。');
  const external = https(entry);
  const article = entry === 'article';
  const collection = entry === 'collection';
  if (!article && !collection && !external && !/\.html?$/i.test(entry)) invalid('entry 应填写 article、collection、HTML 相对路径或完整的 HTTPS 网址。');
  const href = '/works/' + slug + '/';
  const target = article || collection ? href : external ? entry : asset(entry);
  return {
    slug, title, author, type, summary, entry, article, collection, target, href: external ? entry : href,
    coverUrl: cover ? asset(cover) : undefined, source: source || undefined,
    action: field('action', true) || (collection ? '进入栏目' : article ? '阅读作品' : '打开作品'), Content: page.Content,
  };
}

export function getWorks() {
  return Object.entries(entries).map(([path, page]) => workFromFile(path, page));
}
