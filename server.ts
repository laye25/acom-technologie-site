import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import { Resend } from "resend";
import admin from "firebase-admin";
import { createServer } from "http";
import { Server } from "socket.io";


// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Ensure SQLite assets are copied to public before serving
  try {
    const fs = await import('fs');
    const path = await import('path');
    const sourceDir = path.join(process.cwd(), 'node_modules', '@sqlite.org', 'sqlite-wasm', 'dist');
    const destDir = path.join(process.cwd(), 'public');
    
    if (fs.existsSync(sourceDir)) {
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      const filesToCopy = [
        'sqlite3.wasm',
        'sqlite3-opfs-async-proxy.js',
        'sqlite3-worker1.mjs'
      ];
      for (const file of filesToCopy) {
        const src = path.join(sourceDir, file);
        const dest = path.join(destDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
          console.log(`[SQLite Init] Copied ${file} to public/`);
        }
      }
    } else {
      console.warn(`[SQLite Init] Warning: Source SQLite WASM directory not found at ${sourceDir}`);
    }
  } catch (e) {
    console.error("[SQLite Init] Failed to copy SQLite assets on server start:", e);
  }

  const app = express();
  const PORT = 3000;

  // Log all requests
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    
    // EXEMPTION FOR PAYDUNYA
    if (req.url === '/api/paydunya/create-invoice') {
      return next();
    }
    
    next();
  });

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


  // Gemini Business Analysis
  app.post("/api/gemini/analyze-business", async (req, res) => {
    try {
      const { orders, expenses, tenantId } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY non configurée." });
      }

      // Track usage BEFORE calling AI (Proactive)
      const { trackUsage } = await import("./src/services/billingService.js");
      await trackUsage(tenantId, 'ai_generations');

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const prompt = `
        Tu es un analyste financier expert. Analyse les performances suivantes (Dernières commandes et dépenses) pour Acom Technologie.
        Fournis un résumé concis comprenant:
        - Tendance globale du CA
        - Analyse de la rentabilité (par rapport aux dépenses)
        - Points d'attention ou opportunités.
        
        Données :
        Commandes : ${JSON.stringify(orders.slice(-30))}
        Dépenses : ${JSON.stringify(expenses.slice(-30))}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: prompt
      });

      res.json({ analysis: response.text || "" });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, currency = 'xof', orderId } = req.body;

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

      // Ensure amount is at least 0.50 EUR equivalent (approx 328 XOF)
      // Stripe requires a minimum amount, let's enforce a minimum of 500 XOF for safety
      const minAmount = 500;
      const finalAmount = Math.max(stripeAmount, minAmount);
      
      console.log('DEBUG: Stripe amount calculation', { originalAmount: amount, stripeAmount, finalAmount });

      const paymentIntent = await stripe.paymentIntents.create({
        amount: finalAmount,
        currency: 'xof', // Force XOF for all payments
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

  // PayDunya Invoice Creation
  app.post("/api/paydunya/create-invoice", express.json(), async (req, res) => {
    console.log("PAYDUNYA API: Requête reçue POST /api/paydunya/create-invoice");
    try {
      const { amount, description, orderId, paymentType, returnUrl, cancelUrl } = req.body;

      const masterKey = process.env.PAYDUNYA_MASTER_KEY?.trim();
      const privateKey = process.env.PAYDUNYA_PRIVATE_KEY?.trim();
      const token = process.env.PAYDUNYA_TOKEN?.trim();
      const mode = (process.env.PAYDUNYA_MODE || 'test').toLowerCase().trim();

      console.log('DEBUG PAYDUNYA: received returnUrl:', returnUrl); // Debug log

      // Choisir l'URL en fonction du mode (sandbox pour test, app pour live)
      const baseUrl = mode === 'live' 
        ? "https://app.paydunya.com/api/v1/checkout-invoice/create"
        : "https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create";

      if (!masterKey || !privateKey || !token) {
        const missing = [];
        if (!masterKey) missing.push('PAYDUNYA_MASTER_KEY');
        if (!privateKey) missing.push('PAYDUNYA_PRIVATE_KEY');
        if (!token) missing.push('PAYDUNYA_TOKEN');
        
        return res.status(500).json({ 
          error: `Configuration incomplète. Variables manquantes dans AI Studio: ${missing.join(', ')}.` 
        });
      }

      const payload = {
        invoice: {
          total_amount: amount,
          description: description || `Paiement pour la commande #${orderId}`,
          store: {
            name: "Acom Technologie",
            website_url: "https://ais-dev-327rgzmctyg4mxcz3fseur-324146592868.europe-west2.run.app",
            logo_url: process.env.APP_LOGO_URL || "https://picsum.photos/seed/acom/400/100" // Placeholder si pas de logo fourni
          }
        },
        store: {
          name: "Acom Technologie",
          tagline: "L'excellence technologique à votre service",
          postal_address: "Dakar, Sénégal",
          phone_number: "+221 33 000 00 00",
          website_url: "https://ais-dev-327rgzmctyg4mxcz3fseur-324146592868.europe-west2.run.app",
          logo_url: process.env.APP_LOGO_URL || "https://picsum.photos/seed/acom/400/100"
        },
        custom_data: {
          order_id: orderId,
          payment_type: paymentType || 'full'
        },
        actions: {
          cancel_url: cancelUrl || "https://ais-dev-327rgzmctyg4mxcz3fseur-324146592868.europe-west2.run.app/merchant/saas",
          return_url: returnUrl || "https://ais-dev-327rgzmctyg4mxcz3fseur-324146592868.europe-west2.run.app/merchant/saas?payment=success",
          callback_url: "https://ais-dev-327rgzmctyg4mxcz3fseur-324146592868.europe-west2.run.app/api/webhooks/paydunya"
        }
      };

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "PAYDUNYA-MASTER-KEY": masterKey,
          "PAYDUNYA-PRIVATE-KEY": privateKey,
          "PAYDUNYA-TOKEN": token
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.response_code !== "00") {
        console.error("PayDunya Error Response:", data);
      }
      
      res.json(data);
    } catch (error: any) {
      console.error("PayDunya invoice creation error:", error);
      res.status(500).json({ error: "Erreur techniquePayDunya", details: error.message });
    }
  });

  // PayDunya Webhook
  app.post("/api/webhooks/paydunya", async (req, res) => {
    try {
      const { data } = req.body;
      const hash = req.body.hash;
      const invoice = data.invoice;
      const custom_data = data.custom_data;
      const status = data.status;

      console.log(`Webhook PayDunya reçu pour la commande ${custom_data?.order_id} - Statut: ${status}`);

      // Here you would normally verify the hash using PAYDUNYA_MASTER_KEY
      // Update order/merchant status in firestore
      if (status === 'completed' && custom_data?.order_id) {
        const orderId = custom_data.order_id;
        console.log(`Updating order ${orderId} as paid via webhook`);
        
        try {
          const db = admin.firestore();
          // Update order status and payment fields
          await db.collection('orders').doc(orderId).set({
            paid: true,
            depositPaid: true,
            balancePaid: true,
            status: 'confirmed',
            paidAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true });
          console.log(`Order ${orderId} successfully updated to paid`);
        } catch (dbError) {
          console.error(`Error updating Firestore for order ${orderId}:`, dbError);
        }
      }

      res.status(200).send("Webhook handled successfully");
    } catch (error: any) {
      console.error("PayDunya webhook error:", error);
      res.status(500).send("Internal Server Error");
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

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("join", (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on("sendMessage", async (data) => {
      // data: { senderId, receiverId, text, chatId }
      const { senderId, receiverId, text, chatId } = data;
      
      const message = {
        senderId,
        receiverId,
        text,
        chatId,
        timestamp: new Date().toISOString(),
        read: false
      };

      // 1. Save to Firestore for persistence
      try {
        await admin.firestore().collection('messages').add(message);
      } catch (error) {
        console.error("Error saving message:", error);
      }

      // 2. Broadcast to the room
      io.to(chatId).emit("message", message);
      console.log(`Message sent in room ${chatId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
