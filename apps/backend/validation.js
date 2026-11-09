const { z } = require('zod');
const text = (min, max) => z.string().trim().min(min).max(max);
const email = z.string().trim().max(254).email().refine(value => {
  const [local, domain, extra] = value.split('@');
  return !extra && local.length <= 64 && !local.startsWith('.') && !local.endsWith('.') && !local.includes('..') && domain.includes('.') && !/[\s\u0000-\u001f\u007f<>]/.test(value);
}, 'Enter a valid email address.').transform(value => value.toLowerCase());
const normalizePhone = value => {
  const compact = value.replace(/[\s()-]/g, '');
  if (/^0\d{10}$/.test(compact)) return `+234${compact.slice(1)}`;
  if (/^234\d{10}$/.test(compact)) return `+${compact}`;
  return compact;
};
const phone = z.string().trim().max(24).refine(value => /^\+234(?:70|80|81|90|91)\d{8}$/.test(normalizePhone(value)), 'Enter a valid Nigerian mobile number.').transform(normalizePhone);
const categories = ['Vegetables', 'Fruits', 'Grains & Cereals', 'Spices & Seasonings', 'Poultry & Eggs', 'Livestock & Meat', 'Pantry Ingredients'];
const registration = z.object({ email, password: z.string().min(12).max(128), name: text(2, 100), phone, location: text(2, 100), storeName: text(2, 100).optional(), referralCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{8}$/).optional() }).strict();
const price = z.number().positive().max(10000000).refine(n => Math.abs(n * 100 - Math.round(n * 100)) < 0.000001);
const imageKey = z.string().regex(/^products\/[a-zA-Z0-9_-]+\/[a-f0-9-]+\.jpg$/);
const productFields = z.object({ name: text(3, 120), category: z.enum(categories), price, oldPrice: price.nullable().optional(), stockCount: z.number().int().min(1).max(100000), unit: text(1, 40), minimumOrder: text(1, 80), images: z.array(imageKey).min(1).max(8), location: text(2, 100), description: text(10, 3000) }).strict();
const validOldPrice = value => value.oldPrice == null || value.oldPrice > value.price;
const product = productFields.refine(validOldPrice, { path: ['oldPrice'], message: 'Old price must be higher than the selling price.' });
const productUpdate = productFields.omit({ images: true, stockCount: true }).extend({ images: productFields.shape.images.optional(), stockCount: z.number().int().min(0).max(100000) }).strict().refine(validOldPrice, { path: ['oldPrice'], message: 'Old price must be higher than the selling price.' });
module.exports = { z, text, email, phone, registration, product, productUpdate };
