import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import { Resend } from "resend";
import admin from "firebase-admin";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Stripe Webhook MUST be before express.json() to keep the raw body for signature verification
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret || !process.env.STRIPE_SECRET_KEY) {
      return res.status(400).send('Webhook secret not configured.');
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const tenantId = session.client_reference_id; // We pass tenantId here when creating the checkout session
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;

          if (tenantId) {
            // Update Firestore: Stripe is the source of truth
            await admin.firestore().collection('merchants').doc(tenantId).set({
              billing: {
                status: 'active',
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                plan: 'pro', // Extract from line items in a real scenario
                updatedAt: new Date().toISOString()
              }
            }, { merge: true });
          }
          break;
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const status = subscription.status;

          // Find the tenant by customer ID
          const merchantsSnapshot = await admin.firestore().collection('merchants')
            .where('billing.stripeCustomerId', '==', customerId)
            .limit(1)
            .get();

          if (!merchantsSnapshot.empty) {
            const tenantDoc = merchantsSnapshot.docs[0];
            await tenantDoc.ref.set({
              billing: {
                status: status === 'active' ? 'active' : 'inactive',
                updatedAt: new Date().toISOString()
              }
            }, { merge: true });
          }
          break;
        }
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Email sending
  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, subject, html } = req.body;
      
      if (!process.env.RESEND_API_KEY) {
        return res.json({ success: true, message: "Email simulation (API key missing)" });
      }

      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: "Acom Technologie <service-technique@acomtechnologie.com>",
        to: [to],
        subject: subject,
        html: html,
      });

      if (error) {
        return res.status(500).json({ error: error.message, details: error });
      }

      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Email error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe PaymentIntent
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, currency = "xof", orderId } = req.body;

      if (!process.env.STRIPE_SECRET_KEY) {
        console.error("STRIPE_SECRET_KEY is not configured in environment variables.");
        return res.status(500).json({ error: "Le service de paiement n'est pas configuré sur le serveur (Clé secrète manquante)." });
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      // List of zero-decimal currencies in Stripe
      const zeroDecimalCurrencies = ['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'];
      const isZeroDecimal = zeroDecimalCurrencies.includes(currency.toUpperCase());
      
      // Calculate amount in the smallest unit (cents for most, full amount for zero-decimal)
      const stripeAmount = isZeroDecimal ? Math.round(amount) : Math.round(amount * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: stripeAmount,
        currency: currency.toLowerCase(),
        metadata: { orderId },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Custom Claims Management
  app.post("/api/auth/set-custom-claims", async (req, res) => {
    try {
      const { uid, claims } = req.body;
      await admin.auth().setCustomUserClaims(uid, claims);
      res.json({ success: true, message: `Custom claims set for user ${uid}` });
    } catch (error: any) {
      console.error("Custom claims error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Mock quote generation endpoint
  app.post("/api/quotes/generate", (req, res) => {
    const { orderId, items, total } = req.body;
    // In a real app, this would use jspdf on the server or similar
    // For now, we'll just return a mock URL
    res.json({ 
      quoteUrl: `https://example.com/quotes/${orderId}.pdf`,
      estimatedDelivery: "5-7 business days"
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
