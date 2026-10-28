import { demoPages, demoPosts } from './demo-data';
import { stripHtml } from './format';
import type { PageContent, Post, ProductImage } from './types';

const wpUrl = (import.meta.env.WP_URL || '').replace(/\/$/, '');
export const hasWordPress = Boolean(wpUrl);

interface WpRendered {
  rendered?: string;
}

interface WpMedia {
  source_url?: string;
  alt_text?: string;
}

interface WpTerm {
  taxonomy?: string;
  name?: string;
}

interface WpPost {
  id?: number;
  slug?: string;
  date?: string;
  title?: WpRendered;
  excerpt?: WpRendered;
  content?: WpRendered;
  _embedded?: {
    'wp:featuredmedia'?: WpMedia[];
    'wp:term'?: WpTerm[][];
  };
}

function featuredImage(raw: WpPost, title: string): ProductImage | undefined {
  const media = raw._embedded?.['wp:featuredmedia']?.[0];
  if (!media?.source_url) return undefined;
  return {
    src: media.source_url,
    alt: media.alt_text || title,
  };
}

function normalizePost(raw: WpPost): Post {
  const title = stripHtml(raw.title?.rendered ?? 'Untitled');
  const terms = (raw._embedded?.['wp:term'] ?? []).flat();
  return {
    id: Number(raw.id ?? 0),
    slug: raw.slug ?? String(raw.id ?? ''),
    title,
    excerpt: stripHtml(raw.excerpt?.rendered ?? ''),
    content: raw.content?.rendered ?? '',
    date: raw.date ?? new Date().toISOString(),
    image: featuredImage(raw, title),
    categories: terms
      .filter((term) => term.taxonomy === 'category')
      .map((term) => term.name ?? '')
      .filter(Boolean),
  };
}

async function wpGet<T>(path: string): Promise<T> {
  const response = await fetch(
    `${wpUrl}/wp-json/wp/v2${path}${path.includes('?') ? '&' : '?'}_embed`,
    {
      headers: { Accept: 'application/json' },
    },
  );

  if (!response.ok) {
    throw new Error(`WordPress request failed (${response.status}).`);
  }

  return (await response.json()) as T;
}

export async function getPosts(limit = 12): Promise<Post[]> {
  if (!hasWordPress) return demoPosts.slice(0, limit);

  try {
    const raw = await wpGet<WpPost[]>(
      `/posts?per_page=${limit}&orderby=date&order=desc`,
    );
    return raw.map(normalizePost);
  } catch (error) {
    console.warn(
      `Could not load WordPress posts from ${wpUrl}; using demo content.`,
      error,
    );
    return demoPosts.slice(0, limit);
  }
}

export async function getPost(slug: string): Promise<Post | undefined> {
  if (!hasWordPress) return demoPosts.find((post) => post.slug === slug);

  try {
    const raw = await wpGet<WpPost[]>(`/posts?slug=${encodeURIComponent(slug)}`);
    return raw[0] ? normalizePost(raw[0]) : undefined;
  } catch (error) {
    console.warn(`Could not load WordPress post "${slug}".`, error);
    return demoPosts.find((post) => post.slug === slug);
  }
}

export async function getPage(slug: string): Promise<PageContent | undefined> {
  if (!hasWordPress) return demoPages[slug];

  try {
    const raw = await wpGet<WpPost[]>(`/pages?slug=${encodeURIComponent(slug)}`);
    const page = raw[0];
    if (!page) return demoPages[slug];
    return {
      slug,
      title: stripHtml(page.title?.rendered ?? demoPages[slug]?.title ?? slug),
      content: page.content?.rendered ?? '',
    };
  } catch (error) {
    console.warn(`Could not load WordPress page "${slug}".`, error);
    return demoPages[slug];
  }
}
