import type { Workshop } from './types';

type Seats = Pick<Workshop, 'capacity' | 'seatsLeft'>;

/** Fired on window when a live seat count arrives. Detail: SeatsEventDetail. */
export const SEATS_EVENT = 'workshop:seats';

export interface SeatsEventDetail {
  id: number;
  seatsLeft: number;
}

export function isFullyBooked(workshop: Seats): boolean {
  return workshop.seatsLeft <= 0;
}

export function seatsTaken(workshop: Seats): number {
  return Math.max(0, workshop.capacity - workshop.seatsLeft);
}

/** Share of seats already taken, 0–100. */
export function seatsFilledPercent(workshop: Seats): number {
  if (workshop.capacity <= 0) return isFullyBooked(workshop) ? 100 : 0;
  return Math.min(
    100,
    Math.max(0, Math.round((seatsTaken(workshop) / workshop.capacity) * 100)),
  );
}

/** Few seats left: at most 3, or at most a fifth of the room. */
export function isAlmostFull(workshop: Seats): boolean {
  return (
    !isFullyBooked(workshop) &&
    (workshop.seatsLeft <= 3 || workshop.seatsLeft <= workshop.capacity * 0.2)
  );
}

/** What the seat meter shows, for the build and for live updates alike. */
export function seatsSummary(workshop: Seats) {
  const full = isFullyBooked(workshop);
  const almostFull = isAlmostFull(workshop);

  return {
    state: full ? 'full' : almostFull ? 'low' : 'open',
    status: full ? 'Fully booked' : almostFull ? 'Almost full' : 'Seats taken',
    detail: full
      ? `All ${workshop.capacity} seats taken`
      : `${seatsTaken(workshop)} of ${workshop.capacity} taken · ${workshop.seatsLeft} left`,
    taken: seatsTaken(workshop),
    percent: seatsFilledPercent(workshop),
  };
}
