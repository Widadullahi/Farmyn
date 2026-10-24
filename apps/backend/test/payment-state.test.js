const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const web = path.resolve(__dirname, '../../web');
function compile(file, requireFn, globals = {}) {
  const module = { exports: {} };
  const text = ts.transpileModule(fs.readFileSync(path.join(web, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(text, { module, exports: module.exports, require: requireFn, ...globals });
  return module.exports;
}
const data = compile('lib/app-data.ts', require);
const reference = `farmyn_${'a'.repeat(32)}`;
function harness(options = {}) {
  let saved = options.saved || JSON.stringify({ ...data.initialAppState, currentUserId: 'buyer-ada', cart: [{ productId: 'prod-tomatoes', quantity: 2 }] });
  const hooks = [], effects = [];
  let hookIndex = 0, effectIndex = 0, queued = [], dirty = false, current;
  const provider = 'app-provider';
  const react = {
    createContext: () => ({ Provider: provider }), useContext: () => current,
    useState(initial) {
      const index = hookIndex++;
      if (!(index in hooks)) hooks[index] = typeof initial === 'function' ? initial() : initial;
      return [hooks[index], next => { const value = typeof next === 'function' ? next(hooks[index]) : next; if (!Object.is(value, hooks[index])) { hooks[index] = value; dirty = true; } }];
    },
    useEffect(effect, dependencies) {
      const index = effectIndex++;
      if (!effects[index] || dependencies.some((value, i) => !Object.is(value, effects[index][i]))) { queued.push(effect); effects[index] = dependencies; }
    },
  };
  const api = {
    startCheckout: async () => { if (options.initError) throw Error('Payment setup needed'); return { authorizationUrl: 'https://checkout.paystack.com/test' }; },
    verifyCheckout: async () => options.receipt,
  };
  const storage = { getItem: () => saved, setItem: (key, value) => { saved = value; } };
  const app = compile('context/AppContext.tsx', name => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => { if (type === provider) current = props.value; return props; } };
    if (name === '@/lib/app-data') return data;
    if (name === '@/lib/paystack') return api;
    if (name === 'sonner') return { toast: { success() {}, error() {} } };
    throw Error(name);
  }, { window: { localStorage: storage } });
  function render() {
    let passes = 0;
    do {
      dirty = false; hookIndex = 0; effectIndex = 0; queued = [];
      app.AppProvider({ children: null }); queued.forEach(effect => effect());
      if (++passes > 10) throw Error('Unstable render');
    } while (dirty);
    return current;
  }
  return { render, saved: () => saved, api };
}
function paidReceipt(buyerId = 'buyer-ada') {
  return { reference, status: 'paid', orders: [{ ...data.seedOrders[0], id: `${reference}-1`, buyerId, paymentReference: reference, paymentStatus: 'Paid', status: 'Pending Seller Confirmation' }] };
}
test('initialization or provider failure never creates unpaid orders or clears the cart', async () => {
  for (const initError of [false, true]) {
    const h = harness({ initError }), before = h.render();
    const result = await before.checkout({ deliveryAddress: 'QA Test Address' });
    const after = h.render();
    assert.equal(result.ok, !initError); assert.equal(after.orders.length, before.orders.length); assert.equal(after.cart[0].quantity, 2);
  }
});
test('pending payment verification preserves the cart and order list', async () => {
  const h = harness({ receipt: { reference, status: 'pending', orders: [] } }), before = h.render();
  assert.equal((await before.confirmPayment(reference)).ok, false);
  const after = h.render(); assert.equal(after.orders.length, before.orders.length); assert.equal(after.cart.length, 1);
});
test('duplicate successful callbacks import a paid order and adjust stock only once', async () => {
  const h = harness({ receipt: paidReceipt() }), before = h.render();
  await before.confirmPayment(reference); let after = h.render();
  assert.equal(after.orders.length, before.orders.length + 1); assert.equal(after.cart.length, 0);
  assert.equal(after.products.find(p => p.id === 'prod-tomatoes').stockCount, 30);
  await after.confirmPayment(reference); after = h.render();
  assert.equal(after.orders.length, before.orders.length + 1);
  assert.equal(after.products.find(p => p.id === 'prod-tomatoes').stockCount, 30);
});
test('receipts for another buyer are rejected', async () => {
  const h = harness({ receipt: paidReceipt('other-buyer') }), before = h.render();
  await assert.rejects(before.confirmPayment(reference), /did not match/);
  assert.equal(h.render().orders.length, before.orders.length);
});
test('logout then reload preserves accounts and guest carts; legacy claims become unverified', () => {
  const h = harness(); let state = h.render();
  state.registerUser({ role: 'buyer', name: 'QA', email: 'qa@example.test', phone: '+2348000000099', password: 'test-only', location: 'Lagos' });
  state = h.render(); state.logout(); h.render();
  const reloaded = harness({ saved: h.saved() }).render();
  assert.ok(reloaded.users.some(u => u.email === 'qa@example.test')); assert.equal(reloaded.cart.length, 1);
  assert.equal(reloaded.currentUser, null);
  const raw = JSON.parse(h.saved()); raw.orders[0].paymentStatus = 'Held in Escrow';
  assert.equal(harness({ saved: JSON.stringify(raw) }).render().orders[0].paymentStatus, 'Unverified');
});
test('seller cannot complete delivery or change payment status; buyer confirmation retains Paid', () => {
  const initial = { ...data.initialAppState, currentUserId: 'seller-ngozi', orders: [{ ...data.seedOrders[0], paymentStatus: 'Paid', status: 'Delivered' }] };
  const h = harness({ saved: JSON.stringify(initial) }); let state = h.render();
  state.advanceOrderStatus('ord-1001'); state = h.render(); assert.equal(state.orders[0].status, 'Delivered');
  state.markOrderCompleted('ord-1001'); state = h.render(); assert.equal(state.orders[0].status, 'Delivered');
  state.login('ada@buyer.ng', 'demo1234'); state = h.render(); state.markOrderCompleted('ord-1001'); state = h.render();
  assert.equal(state.orders[0].status, 'Completed'); assert.equal(state.orders[0].paymentStatus, 'Paid');
});
