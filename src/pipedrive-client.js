// Carried over from an earlier internal prototype. It was working against a
// live company account at the time it was written. Adapt as needed.

const BASE_URL = process.env.PIPEDRIVE_BASE_URL || 'http://127.0.0.1:4010';
const API_TOKEN = process.env.PIPEDRIVE_TOKEN || 'tf_local_dev_token';

async function get(resource, params = {}) {
  const query = new URLSearchParams({ ...params, api_token: API_TOKEN });
  const response = await fetch(`${BASE_URL}/v1/${resource}?${query}`);
  const body = await response.json();
  return body.data;
}

export function getPerson(personId) {
  return get(`persons/${personId}`);
}

export function getOrganization(organizationId) {
  return get(`organizations/${organizationId}`);
}

export function listPersons({ start = 0, limit = 100 } = {}) {
  return get('persons', { start, limit });
}

// Organization custom field holding the support tier for the account.
export const SUPPORT_TIER_FIELD = '9f2c1d4e7a8b3c5d6e0f1a2b3c4d5e6f70819a2b';

export function supportTierOf(organization) {
  return organization?.[SUPPORT_TIER_FIELD] ?? null;
}
