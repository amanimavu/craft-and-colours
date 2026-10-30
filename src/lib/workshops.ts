import { demoWorkshops } from './demo-data';
import { craftGet, hasWordPress } from './wordpress';
import type { Workshop } from './types';

const PLACEHOLDER_IMAGE =
  'https://placehold.co/1200x900/F4DDD1/211D19?text=Workshop';

// Workshops come from the "Workshops" post type in the mu-plugin, already in
// this shape; only a missing featured image needs filling in.
function normalizeWorkshop(raw: Workshop): Workshop {
  return {
    ...raw,
    image: raw.image?.src
      ? raw.image
      : { src: PLACEHOLDER_IMAGE, alt: raw.image?.alt || raw.title },
    wooProductId: raw.wooProductId ?? undefined,
  };
}

export async function getWorkshops(): Promise<Workshop[]> {
  if (!hasWordPress) return demoWorkshops;

  try {
    const raw = await craftGet<Workshop[]>('/workshops');
    return raw.map(normalizeWorkshop);
  } catch (error) {
    console.warn('Could not load WordPress workshops; using demo workshops.', error);
    return demoWorkshops;
  }
}

export async function getWorkshop(slug: string): Promise<Workshop | undefined> {
  const workshops = await getWorkshops();
  return workshops.find((workshop) => workshop.slug === slug);
}

export async function getUpcomingWorkshops(): Promise<Workshop[]> {
  const workshops = await getWorkshops();
  const now = new Date();
  return workshops
    .filter((w) => new Date(w.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getPastWorkshops(): Promise<Workshop[]> {
  const workshops = await getWorkshops();
  const now = new Date();
  return workshops
    .filter((w) => new Date(w.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function isFullyBooked(workshop: Workshop): boolean {
  return workshop.seatsLeft <= 0;
}

export function seatsTaken(workshop: Workshop): number {
  return Math.max(0, workshop.capacity - workshop.seatsLeft);
}

/** Share of seats already taken, 0–100. */
export function seatsFilledPercent(workshop: Workshop): number {
  if (workshop.capacity <= 0) return isFullyBooked(workshop) ? 100 : 0;
  return Math.min(
    100,
    Math.max(0, Math.round((seatsTaken(workshop) / workshop.capacity) * 100)),
  );
}

/** Few seats left: at most 3, or at most a fifth of the room. */
export function isAlmostFull(workshop: Workshop): boolean {
  return (
    !isFullyBooked(workshop) &&
    (workshop.seatsLeft <= 3 || workshop.seatsLeft <= workshop.capacity * 0.2)
  );
}
