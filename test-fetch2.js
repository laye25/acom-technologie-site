import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 10000, orderId: 'SUBSCRIPTION_abcdefghijklmnopqrstuvwxyz123456789_LICENCE_LOCALE_1714243456123' })
    });
    console.log(await res.text());
  } catch (e) {
    console.log(e);
  }
}

test();
