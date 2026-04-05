import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import { Resend } from "resend";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

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
        console.warn("RESEND_API_KEY not configured. Skipping email sending.");
        return res.json({ success: true, message: "Email simulation (API key missing)" });
      }

      console.log(`Attempting to send email to ${to} from service-technique@acomtechnologie.com`);
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: "Acom Technologie <service-technique@acomtechnologie.com>",
        to: [to],
        subject: subject,
        html: html,
      });

      if (error) {
        console.error("Resend API error details:", JSON.stringify(error, null, 2));
        return res.status(500).json({ error: error.message, details: error });
      }

      console.log("Email sent successfully via Resend:", data?.id);
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

      console.log(`Creating PaymentIntent: ${amount} ${currency} -> ${stripeAmount} units`);

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
    console.log("RESEND_API_KEY is", process.env.RESEND_API_KEY ? "configured" : "MISSING");
  });
}

startServer();
