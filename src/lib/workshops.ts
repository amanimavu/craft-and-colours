import { demoWorkshops } from './demo-data';
import type { Workshop } from './types';

export async function getWorkshops(): Promise<Workshop[]> {
  // Can be extended to fetch from WordPress/WooCommerce REST API if needed
  return demoWorkshops;
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
