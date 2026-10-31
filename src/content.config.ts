import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const CATS = {
  reglementation: 'Réglementation',
  fiscalite: 'Fiscalité',
  strategie: 'Stratégie',
  marche: 'Marché',
  securite: 'Sécurité',
} as const;

const journal = defineCollection({
  loader: glob({ base: './src/content/journal', pattern: '*.md' }),
  schema: z.object({
    title: z.string(),
    dek: z.string(),
    cat: z.enum(Object.keys(CATS) as [keyof typeof CATS, ...(keyof typeof CATS)[]]),
    // nom d'une image de public/img, sans extension
    img: z.string(),
    pos: z.string().default('50% 50%'),
    alt: z.string(),
    date: z.coerce.date(),
    // ordre d'affichage : le plus petit est à la une
    order: z.number().int(),
    sources: z.array(z.object({
      title: z.string(),
      label: z.string().optional(),
      url: z.url(),
      // précision après le lien, HTML simple accepté (ex. 1<sup>er</sup>)
      detail: z.string().optional(),
    })).min(1),
    note: z.string(),
  }),
});

export const collections = { journal };
