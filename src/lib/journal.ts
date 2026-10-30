import { getCollection, type CollectionEntry } from 'astro:content';
import { CATS } from '../content.config';
import { typo } from './markdown.mjs';

export { CATS, typo };
export type Post = CollectionEntry<'journal'>;

export async function getPosts(): Promise<Post[]> {
  return (await getCollection('journal')).sort((a, b) => a.data.order - b.data.order);
}

const DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const formatDate = (d: Date) => DATE.format(d).replace(/^1 /, '1er ');

// temps de lecture : 220 mots par minute, sources comprises, 2 minutes au moins
export function minutes(p: Post): number {
  const text = (p.body ?? '').replace(/<[^>]+>/g, ' ').replace(/\{[\d,]+\}/g, '') + ' ' + p.data.sources.map((s) => `${s.label ?? s.title} ${s.detail ?? ''}`).join(' ');
  return Math.max(2, Math.round(text.trim().split(/\s+/).length / 220));
}

// « ANIL, Ville de Paris et Service-Public » : l'éditeur de chaque source, sans doublon
export function sourceNames(p: Post): string {
  const names = [...new Set(p.data.sources.map((s) => (s.label ?? s.title).split(',')[0]))];
  return names.length > 1 ? names.slice(0, -1).join(', ') + ' et ' + names[names.length - 1] : names[0];
}
