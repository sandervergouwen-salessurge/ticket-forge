// Fixture dataset served by the mock API. Mirrors the shape of a real
// Pipedrive company account with a handful of organizations and people.

export const SUPPORT_TIER_FIELD = '9f2c1d4e7a8b3c5d6e0f1a2b3c4d5e6f70819a2b';
export const CONTRACT_HOURS_FIELD = '3b7e5a19c04d2f8e6b1a9c7d5e3f0a2b4c6d8e01';

export const organizations = [
  {
    id: 101,
    name: 'Northwind Logistics BV',
    owner_id: 11,
    add_time: '2024-03-04T09:12:00Z',
    update_time: '2026-08-11T14:02:00Z',
    is_deleted: false,
    custom_fields: {
      [SUPPORT_TIER_FIELD]: { value: 'gold' },
      [CONTRACT_HOURS_FIELD]: { value: 40 }
    }
  },
  {
    id: 102,
    name: 'Baxter Health Group',
    owner_id: 12,
    add_time: '2024-06-19T11:30:00Z',
    update_time: '2026-07-30T08:45:00Z',
    is_deleted: false,
    custom_fields: {
      [SUPPORT_TIER_FIELD]: { value: 'silver' },
      [CONTRACT_HOURS_FIELD]: { value: 20 }
    }
  },
  {
    id: 103,
    name: 'Corvus Media',
    owner_id: 11,
    add_time: '2025-01-08T16:20:00Z',
    update_time: '2026-05-22T10:11:00Z',
    is_deleted: false,
    custom_fields: {
      [SUPPORT_TIER_FIELD]: { value: 'bronze' },
      [CONTRACT_HOURS_FIELD]: { value: 8 }
    }
  },
  {
    id: 104,
    name: 'Delta Freight Partners',
    owner_id: 13,
    add_time: '2025-09-02T07:55:00Z',
    update_time: '2026-08-29T13:40:00Z',
    is_deleted: false,
    custom_fields: {
      [CONTRACT_HOURS_FIELD]: { value: 0 }
    }
  }
];

export const persons = [
  { id: 201, name: 'Maartje de Vries',  org_id: 101,  owner_id: 11, primary_email: 'maartje@northwind-log.nl',  is_deleted: false },
  { id: 202, name: 'Tomas Berger',      org_id: 101,  owner_id: 11, primary_email: 't.berger@northwind-log.nl', is_deleted: false },
  { id: 203, name: 'Priya Raghunathan', org_id: 102,  owner_id: 12, primary_email: 'p.raghunathan@baxterhg.com', is_deleted: false },
  { id: 204, name: 'Joris Kleinman',    org_id: 102,  owner_id: 12, primary_email: 'joris@baxterhg.com',         is_deleted: false },
  { id: 205, name: 'Sofia Almeida',     org_id: 103,  owner_id: 11, primary_email: 'sofia@corvusmedia.pt',       is_deleted: false },
  { id: 206, name: 'Henk Doornbos',     org_id: 104,  owner_id: 13, primary_email: 'h.doornbos@deltafreight.nl', is_deleted: false },
  { id: 207, name: 'Aylin Kaya',        org_id: null, owner_id: 13, primary_email: 'aylin.kaya@gmail.com',       is_deleted: false },
  { id: 208, name: 'Rob Vermeulen',     org_id: 103,  owner_id: 11, primary_email: 'rob@corvusmedia.pt',         is_deleted: false }
];

export const users = [
  { id: 11, name: 'Sander V.',  email: 'sander@example.test',  is_active: true },
  { id: 12, name: 'Bart-Jan H.', email: 'bartjan@example.test', is_active: true },
  { id: 13, name: 'Nora T.',    email: 'nora@example.test',    is_active: true }
];
