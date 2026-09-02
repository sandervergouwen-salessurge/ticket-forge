// Turns an inbound webhook delivery into a ticket.

export const SUPPORT_PREFIX = '[SUPPORT]';

/** Raised when a delivery is in a shape this service does not accept. */
export class UnsupportedPayload extends Error {}

export function isSupportActivity(activity) {
  throw new Error('isSupportActivity is not implemented');
}

export function normaliseSubject(subject) {
  throw new Error('normaliseSubject is not implemented');
}

/**
 * Pull the parts this service cares about out of a delivery.
 * Deliveries this service does not accept must raise UnsupportedPayload.
 */
export function readEnvelope(payload) {
  throw new Error('readEnvelope is not implemented');
}

/** Assemble a full ticket record for an activity. */
export async function buildTicket(activity, occurredAt) {
  throw new Error('buildTicket is not implemented');
}

/**
 * Apply one delivery to the store.
 * @returns {Promise<{result: 'created'|'updated'|'ignored'|'duplicate'}>}
 */
export async function handleDelivery(payload, store) {
  throw new Error('handleDelivery is not implemented');
}
