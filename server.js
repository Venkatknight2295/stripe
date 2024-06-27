const express = require('express');
const stripe = require('stripe')('sk_test_51PScdJAn7bgEz383kMZNevVxrgOBAHmriG0ZQicQUVbURV41czYS0ldsJpIMASjuP9qiGImUwUtRp6iAcUV1W7JB00FyVm1EDO');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const YOUR_DOMAIN = 'http://localhost:3002';
const SUCCESS_PAGE = 'http://venkat.dev.com/payment-success';
const FAILURE_PAGE = 'http://venkat.dev.com/payment-failed';

app.get('/pay', async (req, res) => {
  const { amount } = req.query;
  
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).send('Invalid amount');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: 'Payment',
            },
            unit_amount: amount * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/cancel`,
    });

    res.redirect(303, session.url);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.redirect(FAILURE_PAGE);
  }
});

app.get('/success', async (req, res) => {
  const { session_id } = req.query;
  
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status === 'paid') {
      // Payment was successful
      await callPostbackUrl(session);
      res.redirect(SUCCESS_PAGE);
    } else {
      // Payment was not successful
      res.redirect(FAILURE_PAGE);
    }
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.redirect(FAILURE_PAGE);
  }
});

app.get('/cancel', (req, res) => {
  res.redirect(FAILURE_PAGE);
});

async function callPostbackUrl(session) {
  // Implement your postback logic here
  console.log('Calling postback URL with session:', session.id);
  // Example: await axios.post('YOUR_POSTBACK_URL', { session_id: session.id, amount: session.amount_total });
}

const PORT = 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));