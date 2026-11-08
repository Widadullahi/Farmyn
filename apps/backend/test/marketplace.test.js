const { test } = require('node:test');
const assert = require('node:assert/strict');
const { product, registration } = require('../validation');
const { error, hash } = require('../utils');

test('listing validation accepts marketplace fields and rejects remote images', () => {
  const listing = { name: 'Fresh Tomatoes', category: 'Vegetables', price: 2500, stockCount: 8, unit: 'basket', minimumOrder: '1 basket', images: ['products/seller-a/550e8400-e29b-41d4-a716-446655440000.jpg'], location: 'Lagos', description: 'Freshly harvested tomatoes.' };
  assert.equal(product.safeParse(listing).success, true);
  assert.equal(product.safeParse({ ...listing, images: ['https://example.com/photo.jpg'] }).success, false);
  assert.equal(product.safeParse({ ...listing, images: [] }).success, false);
  assert.equal(product.safeParse({ ...listing, images: Array(9).fill(listing.images[0]) }).success, false);
  assert.equal(product.safeParse({ ...listing, price: -1 }).success, false);
});

test('registration creates one account type without a buyer or seller choice', () => {
  const account = { email: 'member@example.com', password: 'ValidPassword123!', name: 'Test Member', phone: '+2348000000000', location: 'Lagos' };
  assert.equal(registration.safeParse(account).success, true);
  assert.equal(registration.safeParse({ ...account, referralCode: 'GARRI123' }).success, true);
  assert.equal(registration.safeParse({ ...account, referralCode: 'short' }).success, false);
  assert.equal(registration.safeParse({ ...account, role: 'buyer' }).success, false);
});

test('shared API helpers create status errors and stable hashes', () => {
  assert.equal(error(404, 'Missing').status, 404);
  assert.equal(hash('farmyn'), hash('farmyn'));
  assert.notEqual(hash('farmyn'), hash('other'));
});
