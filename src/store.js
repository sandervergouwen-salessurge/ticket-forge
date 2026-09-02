// Ticket persistence.
//
// Tickets survive a restart of the service. The store is created by
// openStore() and must expose the methods the test suite exercises.

export function openStore(file = ':memory:') {
  throw new Error('openStore is not implemented');
}
