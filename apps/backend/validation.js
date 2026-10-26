const { z } = require('zod');
const text = (min, max) => z.string().trim().min(min).max(max);
const categories = ['Vegetables', 'Fruits', 'Grains & Cereals', 'Spices & Seasonings', 'Poultry & Eggs', 'Livestock & Meat', 'Pantry Ingredients'];
const registration = z.object({ email: z.string().email().max(254).transform(v => v.toLowerCase()), password: z.string().min(12).max(128), name: text(2, 100), phone: z.string().regex(/^\+[1-9]\d{7,14}$/), role: z.enum(['buyer', 'seller']), location: text(2, 100), storeName: text(2, 100).optional() }).strict();
const product = z.object({ name: text(3, 120), category: z.enum(categories), price: z.number().positive().max(10000000).refine(n => Math.abs(n * 100 - Math.round(n * 100)) < 0.000001), stockCount: z.number().int().min(1).max(100000), unit: text(1, 40), minimumOrder: text(1, 80), image: z.string().regex(/^products\/[a-zA-Z0-9_-]+\/[a-f0-9-]+\.jpg$/), location: text(2, 100), description: text(10, 3000) }).strict();
const checkout = z.object({ items: z.array(z.object({ productId: text(1, 100), quantity: z.number().int().min(1).max(100) }).strict()).min(1).max(20), deliveryAddress: text(5, 500), note: z.string().trim().max(1000).default('') }).strict();
const bulk = z.object({ title: text(5, 150), category: z.enum(categories), quantity: text(1, 100), budget: z.number().positive().max(100000000), location: text(2, 100), notes: z.string().trim().max(3000) }).strict();
module.exports = { z, text, registration, product, checkout, bulk };
