const { test } = require('node:test');
const assert = require('node:assert/strict');
const { email, phone, product, registration, uploadRequest } = require('../validation');
const { error, hash } = require('../utils');

test('listing validation accepts marketplace fields and rejects remote images', () => {
  const listing = { name: 'Fresh Tomatoes', category: 'Vegetables', price: 2500, stockCount: 8, unit: 'basket', minimumOrder: '1 basket', images: ['products/seller-a/550e8400-e29b-41d4-a716-446655440000.jpg'], location: 'Lagos', description: 'Freshly harvested tomatoes.' };
  assert.equal(product.safeParse(listing).success, true);
  assert.equal(product.safeParse({ ...listing, images: ['https://example.com/photo.jpg'] }).success, false);
  assert.equal(product.safeParse({ ...listing, images: [] }).success, false);
  assert.equal(product.safeParse({ ...listing, images: Array(9).fill(listing.images[0]) }).success, false);
  assert.equal(product.safeParse({ ...listing, images: ['products/seller-a/550e8400-e29b-41d4-a716-446655440000.png'] }).success, true);
  assert.equal(product.safeParse({ ...listing, price: -1 }).success, false);
});

test('upload intents accept supported photos under 3 MB only', () => {
  assert.equal(uploadRequest.safeParse({ contentType: 'image/png', size: 1024 }).success, true);
  assert.equal(uploadRequest.safeParse({ contentType: 'text/html', size: 1024 }).success, false);
  assert.equal(uploadRequest.safeParse({ contentType: 'image/jpeg', size: 4 * 1024 * 1024 }).success, false);
});

test('registration creates one account type without a buyer or seller choice', () => {
  const account = { email: 'member@example.com', password: 'ValidPassword123!', name: 'Test Member', phone: '+2348000000000', location: 'Lagos' };
  assert.equal(registration.safeParse(account).success, true);
  assert.equal(registration.safeParse({ ...account, referralCode: 'GARRI123' }).success, true);
  assert.equal(registration.safeParse({ ...account, referralCode: 'short' }).success, false);
  assert.equal(registration.safeParse({ ...account, role: 'buyer' }).success, false);
});

test('email validation normalizes real addresses and rejects scripts or malformed domains', () => {
  assert.equal(email.parse('  Member@Example.COM  '), 'member@example.com');
  for (const value of ['<script>@example.com', 'member@example', 'member..name@example.com', 'member @example.com', 'member@example.com<script>']) {
    assert.equal(email.safeParse(value).success, false, value);
  }
});

test('phone validation accepts Nigerian mobile formats and rejects unsafe or incomplete values', () => {
  assert.equal(phone.parse('0801 234 5678'), '+2348012345678');
  assert.equal(phone.parse('2349012345678'), '+2349012345678');
  for (const value of ['0801234', '+2346012345678', '<script>08012345678', '0801234567a']) {
    assert.equal(phone.safeParse(value).success, false, value);
  }
});

test('shared API helpers create status errors and stable hashes', () => {
  assert.equal(error(404, 'Missing').status, 404);
  assert.equal(hash('farmyn'), hash('farmyn'));
  assert.notEqual(hash('farmyn'), hash('other'));
});
