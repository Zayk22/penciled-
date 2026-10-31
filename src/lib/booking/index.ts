// src/lib/booking/index.ts

export type ComputeBlockedRangeInput = {
  start: Date;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
};

export type BlockedRange = {
  start: Date;
  end: Date;
  blockedStart: Date;
  blockedEnd: Date;
};

export function computeBlockedRange(input: ComputeBlockedRangeInput): BlockedRange {
  const { start, durationMinutes, bufferBeforeMinutes, bufferAfterMinutes } = input;

  if (!(start instanceof Date) || isNaN(start.getTime())) {
    throw new RangeError("computeBlockedRange: start must be a valid Date");
  }
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new RangeError("computeBlockedRange: durationMinutes must be a positive number");
  }
  if (!Number.isFinite(bufferBeforeMinutes) || bufferBeforeMinutes < 0) {
    throw new RangeError("computeBlockedRange: bufferBeforeMinutes must be a non-negative number");
  }
  if (!Number.isFinite(bufferAfterMinutes) || bufferAfterMinutes < 0) {
    throw new RangeError("computeBlockedRange: bufferAfterMinutes must be a non-negative number");
  }

  const startMs = start.getTime();
  const endMs = startMs + durationMinutes * 60_000;
  const blockedStartMs = startMs - bufferBeforeMinutes * 60_000;
  const blockedEndMs = endMs + bufferAfterMinutes * 60_000;

  return {
    start: new Date(startMs),
    end: new Date(endMs),
    blockedStart: new Date(blockedStartMs),
    blockedEnd: new Date(blockedEndMs),
  };
}

export function isSlotInGenerated(
  requestedStartIso: string,
  slots: { start: Date }[]
): boolean {
  const requestedMs = new Date(requestedStartIso).getTime();
  if (Number.isNaN(requestedMs)) return false;
  return slots.some((slot) => slot.start.getTime() === requestedMs);
}