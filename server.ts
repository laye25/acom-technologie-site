import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import { Resend } from "resend";
import admin from "firebase-admin";
import { createServer } from "http";
import { Server } from "socket.io";
import fs from "fs";


// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

let customDbId: string | undefined;
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    customDbId = config.firestoreDatabaseId;
    console.log(`[Firebase Admin] Detected custom firestoreDatabaseId: ${customDbId}`);
  }
} catch (e) {
  console.error("[Firebase Admin] Failed to parse firebase-applet-config.json:", e);
}

function getFirestoreDb() {
  if (customDbId) {
    return (admin.firestore as any)(customDbId);
  }
  return admin.firestore();
}

// Handle ESM and CJS
let currentFilename, currentDirname;
try { currentFilename = __filename; } catch (e) { currentFilename = ''; }
try { currentDirname = __dirname; } catch (e) { currentDirname = ''; }
const filename = currentFilename;
const dirname = currentDirname;

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

  // Enable CORS manually to allow requests from any local or desktop applications
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
    
    // Handle OPTIONS preflight requests
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

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
            await getFirestoreDb().collection('merchants').doc(tenantId).set({
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
          const merchantsSnapshot = await getFirestoreDb().collection('merchants')
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

  app.use(express.json({ limit: "50mb" }));

  // Dynamic icon serving based on custom desktopLogo from Firebase Firestore
  app.get("/icon.png", async (req, res, next) => {
    try {
      const snap = await getFirestoreDb().collection("settings").doc("global").get();
      if (snap.exists) {
        const data = snap.data();
        const base64Data = data?.desktopLogo || data?.data?.desktopLogo;
        if (base64Data && typeof base64Data === 'string' && base64Data.startsWith('data:image/')) {
          const matches = base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const buffer = Buffer.from(matches[2], 'base64');
            const contentType = base64Data.split(';')[0].split(':')[1];
            res.setHeader("Content-Type", contentType);
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            return res.send(buffer);
          }
        }
      }
    } catch (e) {
      console.error("Error serving dynamic /icon.png:", e);
    }
    // Fallback to static icon.png
    next();
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });


  // Helper to sanitize API keys (removes quotes and whitespace)
  function sanitizeApiKey(key: any): string | null {
    if (!key || typeof key !== 'string') return null;
    const cleaned = key.trim().replace(/^["']|["']$/g, '').trim();
    if (!cleaned || cleaned === '.' || cleaned === 'null' || cleaned === 'undefined' || cleaned.length < 5) return null;
    return cleaned;
  }

  // Helper to validate email addresses and "Name <email@domain>" format
  function cleanAndValidateFromEmail(email: any): string {
    const defaultFrom = "Acom Technologie <gestion@acomtechnologie.com>";
    if (!email || typeof email !== 'string') {
      return defaultFrom;
    }
    
    const trimmed = email.trim().replace(/^["']|["']$/g, '').trim();
    if (trimmed === '.' || trimmed === '') {
      return defaultFrom;
    }
    
    // Simple checks for email containing @ and .
    // Accept standard: test@example.com
    // Accept name with email inside brackets: Name <test@example.com>
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameWithEmailRegex = /^[^<]+<[^\s@]+@[^\s@]+\.[^\s@]+>$/;
    
    if (emailRegex.test(trimmed) || nameWithEmailRegex.test(trimmed)) {
      return trimmed;
    }
    
    console.warn(`[Email Service] Format de l'expéditeur ("from") invalide détecté: "${trimmed}". Rabattement sur: "${defaultFrom}"`);
    return defaultFrom;
  }

  // Email sending
  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, subject, html, from, de, overrideApiKey } = req.body;
      
      // Sanitize custom key or system env key
      let validOverrideKey = sanitizeApiKey(overrideApiKey);
      let systemEnvKey = sanitizeApiKey(process.env.RESEND_API_KEY);
      
      const apiKeyToUse = validOverrideKey || systemEnvKey;

      if (!apiKeyToUse) {
        console.log("[Email Service] No valid Resend API key available (format re_...). Simulating email dispatch.");
        return res.json({ success: true, simulated: true, message: "Email simulation (Valid Resend API key missing)" });
      }

      let resend = new Resend(apiKeyToUse);
      
      // Extract from request body if available (both standard 'from' and French 'de'), 
      // then try environment variable, and fallback to default.
      const fromEmailRaw = from || de || (process.env.RESEND_FROM && process.env.RESEND_FROM.trim() !== '.' ? process.env.RESEND_FROM : null);
      let fromEmail = cleanAndValidateFromEmail(fromEmailRaw);

      let result = await resend.emails.send({
        from: fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: html,
      });

      let { data, error } = result;

      // If overrideApiKey was supplied but failed with an API key error,
      // and we have a valid systemEnvKey, retry using systemEnvKey
      if (error && (error.message?.includes("API key") || error.message?.includes("api_key") || String(error.name).toLowerCase().includes("api_key")) && validOverrideKey && systemEnvKey && systemEnvKey !== validOverrideKey) {
        console.warn("[Email Service] Custom overrideApiKey failed. Retrying with system RESEND_API_KEY...");
        resend = new Resend(systemEnvKey);
        const retryResult = await resend.emails.send({
          from: fromEmail,
          to: Array.isArray(to) ? to : [to],
          subject: subject,
          html: html,
        });
        data = retryResult.data;
        error = retryResult.error;
      }

      // If sending fails due to domain / from restrictions, retry with onboarding@resend.dev
      if (error && error.message && (
        error.message.includes("from") || 
        error.message.includes("domain") || 
        error.message.includes("registered") ||
        error.message.includes("verify") ||
        error.name === "validation_error"
      ) && fromEmail !== "onboarding@resend.dev") {
        console.warn(`Resend sender '${fromEmail}' rejected. Retrying with onboarding@resend.dev fallback...`);
        fromEmail = "onboarding@resend.dev";
        const retryResult = await resend.emails.send({
          from: fromEmail,
          to: Array.isArray(to) ? to : [to],
          subject: subject,
          html: html,
        });
        if (retryResult.data) {
          data = retryResult.data;
          error = null;
        } else {
          error = retryResult.error;
        }
      }

      if (error) {
        let msg = error.message || "";
        let userFriendlyError = msg;

        const isApiKeyError = msg.includes("API key") || msg.includes("api_key") || msg.includes("invalid_api_key") || String(error.name).toLowerCase().includes("api_key");
        const isDomainOrSandboxError = msg.includes("testing emails") || msg.includes("domain") || msg.includes("verify") || msg.includes("onboarding@resend.dev") || msg.includes("registered") || msg.includes("validation_error");

        if (isApiKeyError) {
          userFriendlyError = `La clé API Resend configurée est refusée par Resend. Veuillez vérifier votre clé sur resend.com/api-keys (elle doit commencer par re_).`;
        } else if (isDomainOrSandboxError) {
          userFriendlyError = `Limite Sandbox / Domaine Resend : En mode de test gratuit Resend, vous pouvez envoyer des e-mails uniquement à votre propre adresse e-mail d'inscription Resend (depuis onboarding@resend.dev). Pour envoyer à d'autres destinataires, validez votre nom de domaine sur https://resend.com/domains.`;
        }
        
        console.error("[Email Service] Resend dispatch error:", error);
        return res.json({ success: false, error: userFriendlyError, details: error });
      }

      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Email error:", error);
      res.json({ success: false, error: error.message || "Erreur serveur lors de l'envoi de l'email" });
    }
  });


  // Gemini Business Analysis & Specialized assistants (like Couture Designer)
  app.post("/api/gemini/analyze-business", async (req, res) => {
    const startTime = Date.now();
    let modelToUse = "gemini-2.0-flash";
    let finalPrompt = "";
    let imageSummary: any[] = [];
    
    try {
      const { orders, expenses, tenantId, isDesignerAssist, prompt: customPrompt, images } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY2 || process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        console.error("[Gemini API Proxy] ERROR: No API Key configured.");
        return res.status(500).json({ 
          error: "GEMINI_API_KEY ou GEMINI_API_KEY2 non configurée.",
          diagnostics: {
            step: "API_KEY_CHECK",
            errorType: "MissingApiKey",
            message: "Neither GEMINI_API_KEY nor GEMINI_API_KEY2 is set in environment variables.",
            envKeysPresent: Object.keys(process.env).filter(k => k.includes("GEMINI"))
          }
        });
      }

      const maskedKey = apiKey.length > 8 
        ? `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}`
        : "invalid-short-key";

      // Track usage BEFORE calling AI (Proactive)
      console.log(`[Gemini API Proxy] Tracking billing usage for tenant: ${tenantId}`);
      try {
        const { trackUsage } = await import("./src/services/billingService.js");
        await trackUsage(tenantId, 'ai_generations');
      } catch (billingErr: any) {
        console.warn("[Gemini API Proxy] Non-blocking warning: Failed to track billing usage:", billingErr.message);
      }

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ 
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      if (isDesignerAssist) {
        finalPrompt = customPrompt;
        modelToUse = "gemini-2.0-flash";
      } else {
        finalPrompt = `
          Tu es un analyste financier expert. Analyse les performances suivantes (Dernières commandes et dépenses) pour Acom Technologie.
          Fournis un résumé concis comprenant:
          - Tendance globale du CA
          - Analyse de la rentabilité (par rapport aux dépenses)
          - Points d'attention ou opportunités.
          
          Données :
          Commandes : ${JSON.stringify(orders ? orders.slice(-30) : [])}
          Dépenses : ${JSON.stringify(expenses ? expenses.slice(-30) : [])}
        `;
      }

      let contents: any = finalPrompt;

      if (images && Array.isArray(images) && images.length > 0) {
        const parts: any[] = [{ text: finalPrompt }];
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const match = img.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,(.*)$/);
          if (match) {
            imageSummary.push({
              index: i,
              mimeType: match[1],
              base64Length: match[2].length
            });
            parts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2]
              }
            });
          } else {
            imageSummary.push({
              index: i,
              error: "Invalid base64 pattern or data uri"
            });
          }
        }
        contents = parts;
      }

      const expectedUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent`;
      const configObj = isDesignerAssist ? { responseMimeType: "application/json" } : undefined;

      console.log("======================================================================");
      console.log(`[Gemini API Request Log] [Timestamp: ${new Date().toISOString()}]`);
      console.log(`- Target URL: ${expectedUrl}`);
      console.log(`- Selected Model: ${modelToUse}`);
      console.log(`- API Key (Masked): ${maskedKey}`);
      console.log(`- Prompt length: ${finalPrompt?.length || 0} chars`);
      console.log(`- Prompt Preview: "${finalPrompt?.substring(0, 150).replace(/\n/g, ' ')}..."`);
      console.log(`- Images Sent: ${imageSummary.length}`);
      if (imageSummary.length > 0) {
        console.log(`- Images Metadata: ${JSON.stringify(imageSummary)}`);
      }
      console.log(`- Request Config: ${JSON.stringify(configObj)}`);
      console.log("======================================================================");

      console.log(`[Gemini API Call] Invoking ai.models.generateContent()...`);
      
      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: contents,
        config: configObj
      });

      const duration = Date.now() - startTime;
      const responseText = response.text || "";
      
      console.log("======================================================================");
      console.log(`[Gemini API Response Log] [Status: SUCCESS] [Duration: ${duration}ms]`);
      console.log(`- Response Character Count: ${responseText.length}`);
      console.log(`- Response Preview: "${responseText.substring(0, 150).replace(/\n/g, ' ')}..."`);
      console.log("======================================================================");

      res.json({ 
        analysis: responseText,
        diagnostics: {
          status: "success",
          durationMs: duration,
          model: modelToUse,
          responseLength: responseText.length
        }
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error("======================================================================");
      console.error(`[Gemini API Response Log] [Status: FAILURE] [Duration: ${duration}ms]`);
      console.error(`- Error Name: ${error.name || "Error"}`);
      console.error(`- Error Message: ${error.message}`);
      
      // Inspect all fields of the error object for maximum visibility
      const errorDetails: Record<string, any> = {};
      try {
        const keys = Object.getOwnPropertyNames(error);
        for (const key of keys) {
          if (key === 'stack') continue; // Skip raw stack in structured fields, but will print it below
          errorDetails[key] = error[key];
        }
      } catch (e) {
        errorDetails.parseError = "Failed to extract all property names";
      }

      console.error(`- Error Properties:`, JSON.stringify(errorDetails, null, 2));
      if (error.stack) {
        console.error(`- Stack Trace:\n${error.stack}`);
      }
      console.error("======================================================================");

      res.status(500).json({ 
        error: error.message || "An error occurred during Gemini API generation.",
        diagnostics: {
          status: "failure",
          durationMs: duration,
          model: modelToUse,
          errorType: error.name || "UnknownError",
          errorMessage: error.message,
          errorProperties: errorDetails,
          promptLength: finalPrompt?.length || 0,
          imagesCount: imageSummary.length,
          imagesMetadata: imageSummary
        }
      });
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
          const db = getFirestoreDb();
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
        await getFirestoreDb().collection('messages').add(message);
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
