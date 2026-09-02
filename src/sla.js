// Service level arithmetic.
//
// The support desk is staffed 09:00-17:00 Europe/Amsterdam, Monday to Friday.
// Time outside those hours does not count towards a target.

export const TIER_PRIORITY = { gold: 'urgent', silver: 'high', bronze: 'normal' };
export const PRIORITY_MINUTES = { urgent: 60, high: 240, normal: 480, low: 960 };

export function priorityForTier(tier) {
  throw new Error('priorityForTier is not implemented');
}

/**
 * @param {Date|string} start
 * @param {number} minutes  business minutes to add
 * @returns {Date}
 */
export function addBusinessMinutes(start, minutes) {
  throw new Error('addBusinessMinutes is not implemented');
}

/**
 * @param {string} createdAtIso
 * @param {string} priority
 * @returns {string} ISO-8601 instant, e.g. "2026-09-15T08:00:00Z"
 */
export function slaDueAt(createdAtIso, priority) {
  throw new Error('slaDueAt is not implemented');
}
