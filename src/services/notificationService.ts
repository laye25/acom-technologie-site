import { dbService } from './dbService';
import { Order, UserProfile } from '../types';

export const notificationService = {
  async notifyStatusChange(order: Order, newStatus: string, client: UserProfile | null) {
    if (!client) return;

    const statusLabels: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      in_progress: 'En cours',
      completed: 'Terminée',
      delivered: 'Livrée',
      cancelled: 'Annulée'
    };

    const statusLabel = statusLabels[newStatus] || newStatus;
    const statusExplanations: Record<string, string> = {
      pending: "Votre commande a été reçue et est en attente de validation par notre équipe. Nous examinons vos besoins pour vous proposer la meilleure approche.",
      confirmed: "Votre commande a été validée et planifiée. Notre équipe se prépare à démarrer la réalisation de votre projet selon les termes convenus.",
      in_progress: "Votre projet est actuellement en cours de production par notre équipe. Nous travaillons activement sur la réalisation de vos livrables.",
      completed: "La réalisation technique de votre commande est terminée et validée. Vos livrables sont prêts et disponibles pour votre revue finale.",
      delivered: "Votre commande vous a été officiellement livrée et le projet est clos. Nous restons à votre disposition pour tout support complémentaire ou futur projet.",
      cancelled: "Votre commande a été annulée et ne fera pas l'objet d'un traitement ultérieur. N'hésitez pas à nous contacter pour toute question relative à cette annulation."
    };
    const statusExplanation = statusExplanations[newStatus] || "";
    const dashboardUrl = `${window.location.origin}/dashboard`;

    // 1. Save to Firestore
    try {
      await dbService.notifications.save({
        userId: order.userId,
        title: 'Mise à jour de votre commande',
        message: `Le statut de votre commande #${order.id.slice(0, 8)} est passé à : ${statusLabel}`,
        type: 'order_status',
        orderId: order.id,
        read: false
      });
    } catch (error) {
      console.error('Failed to save in-app notification:', error);
    }

    // 2. Send Email via API
    try {
      console.log(`Sending email notification to ${client.email} for status: ${statusLabel}`);
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: client.email,
          subject: `Acom Technologie - Commande #${order.id.slice(0, 8)} mise à jour`,
          html: `
            <div style="background-color: #f8f9fa; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #eee;">
                <!-- Logo Header -->
                <div style="background-color: white; padding: 40px 30px; text-align: center; border-bottom: 1px solid #f0f0f0;">
                  <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                      <td style="background-color: #b522c1; border-radius: 14px; width: 56px; height: 56px; text-align: center; vertical-align: middle;">
                        <span style="color: white; font-family: Arial, sans-serif; font-size: 38px; font-weight: 900; line-height: 56px;">A</span>
                      </td>
                      <td style="padding-left: 15px; text-align: left;">
                        <div style="color: #1e293b; font-family: Arial, sans-serif; font-size: 28px; font-weight: 900; line-height: 1; letter-spacing: -0.5px;">ACOM</div>
                        <div style="color: #94a3b8; font-family: Arial, sans-serif; font-size: 13px; letter-spacing: 4px; font-weight: bold; margin-top: 4px; text-transform: uppercase;">TECHNOLOGIE</div>
                      </td>
                    </tr>
                  </table>
                </div>

                <div style="padding: 45px; color: #1e293b; line-height: 1.6;">
                  <h2 style="color: #b522c1; margin-top: 0; font-size: 24px; font-weight: 800;">Mise à jour de votre commande</h2>
                  <p style="font-size: 16px;">Bonjour <strong>${client.displayName}</strong>,</p>
                  <p style="font-size: 16px; color: #475569;">Nous vous informons que le statut de votre commande <strong>#${order.id.slice(0, 8)}</strong> a été mis à jour par notre équipe technique.</p>
                  
                  <div style="margin: 35px 0; padding: 30px; background-color: #fdf2ff; border: 1px solid #f5d0fe; border-radius: 16px; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Nouveau statut</p>
                    <p style="margin: 12px 0 0 0; color: #b522c1; font-size: 32px; font-weight: 900;">${statusLabel}</p>
                    ${statusExplanation ? `<p style="margin: 18px 0 0 0; color: #64748b; font-size: 15px; line-height: 1.5; font-style: italic; max-width: 400px; margin-left: auto; margin-right: auto;">"${statusExplanation}"</p>` : ''}
                  </div>

                  <p style="color: #475569; font-size: 15px;">Vous pouvez suivre l'avancement détaillé de votre projet, consulter vos factures et échanger avec nous directement depuis votre espace client sécurisé.</p>
                  
                  <div style="text-align: center; margin-top: 45px;">
                    <a href="${dashboardUrl}" style="background-color: #b522c1; color: white; padding: 18px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 15px rgba(181, 34, 193, 0.3);">Accéder à mon espace client</a>
                  </div>
                </div>

                <div style="background-color: #1e293b; padding: 35px; text-align: center; color: #94a3b8; font-size: 13px;">
                  <p style="margin: 0; color: white; font-weight: bold; font-size: 15px;">Acom Technologie</p>
                  <p style="margin: 8px 0 0 0;">Solutions Digitales & Innovation</p>
                  <p style="margin: 20px 0 0 0; color: #64748b; border-top: 1px solid #334155; padding-top: 20px; font-size: 11px;">
                    Ceci est un message automatique envoyé par notre système de gestion.<br>Merci de ne pas y répondre directement.
                  </p>
                </div>
              </div>
            </div>
          `
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Email API error:', errorData);
      } else {
        console.log('Email notification sent successfully');
      }
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  },
  
  async notifyPrintingStatusChange(order: Order, newStatus: string, client: UserProfile | null) {
    if (!client) return;

    const statusLabels: Record<string, string> = {
      pending: 'En attente',
      in_production: 'En production',
      shipped: 'Expédiée',
      delivered: 'Livrée'
    };

    const statusLabel = statusLabels[newStatus] || newStatus;
    const dashboardUrl = `${window.location.origin}/dashboard`;

    // 1. Save to Firestore
    try {
      await dbService.notifications.save({
        userId: order.userId,
        title: 'Mise à jour de votre impression',
        message: `Votre commande #${order.id.slice(0, 8)} est désormais : ${statusLabel}`,
        type: 'order_status',
        orderId: order.id,
        read: false
      });
    } catch (error) {
      console.error('Failed to save in-app notification:', error);
    }

    // 2. Send Email via API
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: client.email,
          subject: `Acom Technologie - Impression #${order.id.slice(0, 8)} : ${statusLabel}`,
          html: `
            <div style="background-color: #f8f9fa; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #eee;">
                <!-- Logo Header -->
                <div style="background-color: white; padding: 40px 30px; text-align: center; border-bottom: 1px solid #f0f0f0;">
                  <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                      <td style="background-color: #b522c1; border-radius: 14px; width: 56px; height: 56px; text-align: center; vertical-align: middle;">
                        <span style="color: white; font-family: Arial, sans-serif; font-size: 38px; font-weight: 900; line-height: 56px;">A</span>
                      </td>
                      <td style="padding-left: 15px; text-align: left;">
                        <div style="color: #1e293b; font-family: Arial, sans-serif; font-size: 28px; font-weight: 900; line-height: 1; letter-spacing: -0.5px;">ACOM</div>
                        <div style="color: #94a3b8; font-family: Arial, sans-serif; font-size: 13px; letter-spacing: 4px; font-weight: bold; margin-top: 4px; text-transform: uppercase;">TECHNOLOGIE</div>
                      </td>
                    </tr>
                  </table>
                </div>

                <div style="padding: 45px; color: #1e293b; line-height: 1.6;">
                  <h2 style="color: #b522c1; margin-top: 0; font-size: 24px; font-weight: 800;">Suivi de votre impression</h2>
                  <p style="font-size: 16px;">Bonjour <strong>${client.displayName}</strong>,</p>
                  <p style="font-size: 16px; color: #475569;">Nous avons le plaisir de vous informer de l'avancement de l'impression pour votre commande <strong>#${order.id.slice(0, 8)}</strong>.</p>
                  
                  <div style="margin: 35px 0; padding: 30px; background-color: #fdf2ff; border: 1px solid #f5d0fe; border-radius: 16px; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Statut actuel</p>
                    <p style="margin: 12px 0 0 0; color: #b522c1; font-size: 32px; font-weight: 900;">${statusLabel}</p>
                    ${newStatus === 'shipped' && order.trackingNumber ? `
                      <p style="margin: 15px 0 0 0; color: #475569; font-size: 14px;">
                        Numéro de suivi : <strong>${order.trackingNumber}</strong>
                      </p>
                    ` : ''}
                  </div>

                  <p style="color: #475569; font-size: 15px;">
                    ${newStatus === 'in_production' ? "Vos supports sont actuellement sur nos presses. Nous apportons un soin particulier à la qualité du rendu." : ""}
                    ${newStatus === 'shipped' ? "Bonne nouvelle ! Vos supports ont été expédiés et sont en route vers votre adresse de livraison." : ""}
                    ${newStatus === 'delivered' ? "Vos supports ont été livrés. Nous espérons qu'ils vous donneront entière satisfaction !" : ""}
                  </p>
                  
                  <div style="text-align: center; margin-top: 45px;">
                    <a href="${dashboardUrl}" style="background-color: #b522c1; color: white; padding: 18px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 15px rgba(181, 34, 193, 0.3);">Suivre ma commande</a>
                  </div>
                </div>

                <div style="background-color: #1e293b; padding: 35px; text-align: center; color: #94a3b8; font-size: 13px;">
                  <p style="margin: 0; color: white; font-weight: bold; font-size: 15px;">Acom Technologie</p>
                  <p style="margin: 8px 0 0 0;">Service Impression & Logistique</p>
                  <p style="margin: 20px 0 0 0; color: #64748b; border-top: 1px solid #334155; padding-top: 20px; font-size: 11px;">
                    Ceci est un message automatique envoyé par notre système de gestion.<br>Merci de ne pas y répondre directement.
                  </p>
                </div>
              </div>
            </div>
          `
        })
      });
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  },

  async notifyNewMessage(order: Order, senderName: string, recipientId: string, recipientEmail: string, messageText: string) {
    const dashboardUrl = `${window.location.origin}/dashboard/order/${order.id}`;

    // 1. Save to Firestore
    try {
      await dbService.notifications.save({
        userId: recipientId,
        title: 'Nouveau message',
        message: `${senderName} vous a envoyé un message concernant la commande #${order.id.slice(0, 8)}`,
        type: 'new_message',
        orderId: order.id,
        read: false
      });
    } catch (error) {
      console.error('Failed to save in-app notification:', error);
    }

    // 2. Send Email via API
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: `Nouveau message - Commande #${order.id.slice(0, 8)}`,
          html: `
            <div style="background-color: #f8f9fa; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #eee;">
                <!-- Logo Header -->
                <div style="background-color: white; padding: 40px 30px; text-align: center; border-bottom: 1px solid #f0f0f0;">
                  <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                      <td style="background-color: #b522c1; border-radius: 14px; width: 56px; height: 56px; text-align: center; vertical-align: middle;">
                        <span style="color: white; font-family: Arial, sans-serif; font-size: 38px; font-weight: 900; line-height: 56px;">A</span>
                      </td>
                      <td style="padding-left: 15px; text-align: left;">
                        <div style="color: #1e293b; font-family: Arial, sans-serif; font-size: 28px; font-weight: 900; line-height: 1; letter-spacing: -0.5px;">ACOM</div>
                        <div style="color: #94a3b8; font-family: Arial, sans-serif; font-size: 13px; letter-spacing: 4px; font-weight: bold; margin-top: 4px; text-transform: uppercase;">TECHNOLOGIE</div>
                      </td>
                    </tr>
                  </table>
                </div>

                <div style="padding: 45px; color: #1e293b; line-height: 1.6;">
                  <h2 style="color: #b522c1; margin-top: 0; font-size: 24px; font-weight: 800;">Nouveau message reçu</h2>
                  <p style="font-size: 16px;">Bonjour,</p>
                  <p style="font-size: 16px; color: #475569;">Vous avez reçu un nouveau message de <strong>${senderName}</strong> concernant votre projet <strong>#${order.id.slice(0, 8)}</strong>.</p>
                  
                  <div style="margin: 30px 0; padding: 30px; border-left: 4px solid #b522c1; background-color: #fdf2ff; border-radius: 0 16px 16px 0; font-style: italic; color: #475569; font-size: 16px;">
                    "${messageText.length > 200 ? messageText.substring(0, 200) + '...' : messageText}"
                  </div>

                  <p style="color: #475569; font-size: 15px;">Connectez-vous à votre espace client pour lire le message complet et poursuivre la discussion avec notre équipe.</p>
                  
                  <div style="text-align: center; margin-top: 45px;">
                    <a href="${dashboardUrl}" style="background-color: #b522c1; color: white; padding: 18px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 15px rgba(181, 34, 193, 0.3);">Accéder à mon espace client</a>
                  </div>
                </div>

                <div style="background-color: #1e293b; padding: 35px; text-align: center; color: #94a3b8; font-size: 13px;">
                  <p style="margin: 0; color: white; font-weight: bold; font-size: 15px;">Acom Technologie</p>
                  <p style="margin: 8px 0 0 0;">Communication & Support</p>
                  <p style="margin: 20px 0 0 0; color: #64748b; border-top: 1px solid #334155; padding-top: 20px; font-size: 11px;">
                    Ceci est un message automatique envoyé par notre système de gestion.<br>Merci de ne pas y répondre directement.
                  </p>
                </div>
              </div>
            </div>
          `
        })
      });
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  },

  async notifyDeliverableUpdate(order: Order, deliverableTitle: string, status: string, client: UserProfile | null) {
    if (!client) return;

    const statusLabels: Record<string, string> = {
      to_validate: 'À valider',
      validated: 'Validé',
      rejected: 'Refusé'
    };

    const statusLabel = statusLabels[status] || status;
    const dashboardUrl = `${window.location.origin}/dashboard/order/${order.id}`;

    // 1. Save to Firestore
    try {
      await dbService.notifications.save({
        userId: order.userId,
        title: 'Mise à jour d\'un livrable',
        message: `Le livrable "${deliverableTitle}" de votre commande #${order.id.slice(0, 8)} est désormais : ${statusLabel}`,
        type: 'order_status',
        orderId: order.id,
        read: false
      });
    } catch (error) {
      console.error('Failed to save in-app notification:', error);
    }

    // 2. Send Email
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: client.email,
          subject: `Acom Technologie - Livrable ${statusLabel} : ${deliverableTitle}`,
          html: `
            <div style="background-color: #f8f9fa; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #eee;">
                <!-- Logo Header -->
                <div style="background-color: white; padding: 40px 30px; text-align: center; border-bottom: 1px solid #f0f0f0;">
                  <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                      <td style="background-color: #b522c1; border-radius: 14px; width: 56px; height: 56px; text-align: center; vertical-align: middle;">
                        <span style="color: white; font-family: Arial, sans-serif; font-size: 38px; font-weight: 900; line-height: 56px;">A</span>
                      </td>
                      <td style="padding-left: 15px; text-align: left;">
                        <div style="color: #1e293b; font-family: Arial, sans-serif; font-size: 28px; font-weight: 900; line-height: 1; letter-spacing: -0.5px;">ACOM</div>
                        <div style="color: #94a3b8; font-family: Arial, sans-serif; font-size: 13px; letter-spacing: 4px; font-weight: bold; margin-top: 4px; text-transform: uppercase;">TECHNOLOGIE</div>
                      </td>
                    </tr>
                  </table>
                </div>

                <div style="padding: 45px; color: #1e293b; line-height: 1.6;">
                  <h2 style="color: #b522c1; margin-top: 0; font-size: 24px; font-weight: 800;">Mise à jour d'un livrable</h2>
                  <p style="font-size: 16px;">Bonjour <strong>${client.displayName}</strong>,</p>
                  <p style="font-size: 16px; color: #475569;">Un livrable de votre projet <strong>#${order.id.slice(0, 8)}</strong> a été mis à jour.</p>
                  
                  <div style="margin: 35px 0; padding: 30px; background-color: #fdf2ff; border: 1px solid #f5d0fe; border-radius: 16px; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Livrable : ${deliverableTitle}</p>
                    <p style="margin: 12px 0 0 0; color: #b522c1; font-size: 28px; font-weight: 900;">${statusLabel}</p>
                  </div>

                  <p style="color: #475569; font-size: 15px;">
                    ${status === 'to_validate' 
                      ? "Ce livrable est prêt pour votre revue. Merci de vous connecter à votre espace client pour le valider officiellement." 
                      : "Le statut du livrable a été mis à jour dans votre suivi de projet."}
                  </p>
                  
                  <div style="text-align: center; margin-top: 45px;">
                    <a href="${dashboardUrl}" style="background-color: #b522c1; color: white; padding: 18px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 15px rgba(181, 34, 193, 0.3);">Voir le livrable</a>
                  </div>
                </div>

                <div style="background-color: #1e293b; padding: 35px; text-align: center; color: #94a3b8; font-size: 13px;">
                  <p style="margin: 0; color: white; font-weight: bold; font-size: 15px;">Acom Technologie</p>
                  <p style="margin: 8px 0 0 0;">Validation de Livrables</p>
                  <p style="margin: 20px 0 0 0; color: #64748b; border-top: 1px solid #334155; padding-top: 20px; font-size: 11px;">
                    Ceci est un message automatique envoyé par notre système de gestion.<br>Merci de ne pas y répondre directement.
                  </p>
                </div>
              </div>
            </div>
          `
        })
      });
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  },

  async notifyDeadlineAlert(order: Order, partner: UserProfile | null, daysLeft: number) {
    if (!partner) return;
    
    const dashboardUrl = `${window.location.origin}/partner-portal`;
    const deadlineStr = order.productionDeadline?.toDate ? order.productionDeadline.toDate().toLocaleDateString() : new Date(order.productionDeadline).toLocaleDateString();

    // 1. In-App for Partner
    try {
      await dbService.notifications.save({
        userId: partner.uid,
        title: 'Échéance de production imminente',
        message: `La commande #${order.id.slice(0, 8)} doit être livrée le ${deadlineStr} (dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}).`,
        type: 'deadline_alert',
        orderId: order.id,
        read: false
      });

      // Also notify Admin
      await dbService.notifications.save({
        userId: 'admin',
        title: `Alerte Échéance : ${partner.displayName}`,
        message: `La commande #${order.id.slice(0, 8)} arrive à échéance le ${deadlineStr} (${daysLeft}j).`,
        type: 'deadline_alert',
        orderId: order.id,
        read: false
      });
    } catch (error) {
      console.error('Failed to save in-app notification:', error);
    }

    // 2. Email for Partner
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: partner.email,
          subject: `⚠️ RAPPEL : Échéance Proche - Commande #${order.id.slice(0, 8)}`,
          html: `
            <div style="background-color: #fffaf0; padding: 40px 20px; font-family: sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; border: 2px solid #ed8936;">
                <div style="background-color: #ed8936; padding: 20px; text-align: center; color: white;">
                  <h2 style="margin: 0; font-size: 20px; font-weight: 900; text-transform: uppercase;">Échéance de Production</h2>
                </div>
                <div style="padding: 40px; color: #2d3748;">
                  <p>Bonjour <strong>\${partner.displayName}</strong>,</p>
                  <p>Ceci est un rappel concernant la commande <strong>#\${order.id.slice(0, 8)}</strong> (\${order.serviceName}).</p>
                  
                  <div style="margin: 30px 0; padding: 20px; background-color: #fff5f5; border-radius: 12px; border: 1px dashed #feb2b2; text-align: center;">
                    <p style="margin: 0; font-size: 14px; text-transform: uppercase; color: #e53e3e; font-weight: bold;">Date Limite</p>
                    <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: 900; color: #c53030;">\${deadlineStr}</p>
                    <p style="margin: 10px 0 0 0; font-weight: bold; color: #742a2a;">J - \${daysLeft}</p>
                  </div>

                  <p>Merci de vous assurer que la production est en cours et sera prête pour l'expédition à cette date.</p>
                  
                  <div style="text-align: center; margin-top: 40px;">
                    <a href="\${dashboardUrl}" style="background-color: #ed8936; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Gérer mon atelier</a>
                  </div>
                </div>
              </div>
            </div>
          `
        })
      });
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  },

  async notifyLowStock(productName: string, currentStock: number, minLevel: number) {
    try {
      await dbService.notifications.save({
        userId: 'admin',
        title: 'Alerte Stock Critique',
        message: `Le produit "${productName}" est en dessous du seuil critique (${currentStock} restants <= ${minLevel}).`,
        type: 'stock_alert',
        read: false
      });
    } catch (error) {
      console.error('Failed to save in-app stock notification:', error);
    }
  },

  async sendWeeklyScheduleRecap(partner: UserProfile, orders: Order[]) {
    const dashboardUrl = `${window.location.origin}/partner-portal`;
    
    // Filter active orders for the week
    const activeOrders = orders.filter(o => 
      o.supplierStatus === 'in_production' || o.supplierStatus === 'pending'
    );

    if (activeOrders.length === 0) return;

    const orderLines = activeOrders.map(o => {
      const deadline = o.productionDeadline?.toDate ? o.productionDeadline.toDate() : (o.productionDeadline ? new Date(o.productionDeadline) : null);
      const deadlineStr = deadline ? deadline.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Non planifié';
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <div style="font-weight: bold; color: #1e293b;">#${o.id.slice(0, 8)}</div>
            <div style="font-size: 11px; color: #64748b;">${o.serviceName}</div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
            <div style="font-size: 13px; color: ${deadline && deadline < new Date() ? '#ef4444' : '#64748b'}; font-weight: bold;">
              ${deadlineStr}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    try {
      console.log(`Sending weekly recap to partner ${partner.email}`);
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: partner.email,
          subject: `📋 Planning de Production : Semaine du ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`,
          html: `
            <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                <div style="background-color: #b522c1; padding: 30px; text-align: center; color: white;">
                  <h2 style="margin: 0; font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Récapitulatif Hebdomadaire</h2>
                  <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 14px;">Votre planning de production ACOM Technologie</p>
                </div>
                <div style="padding: 40px; color: #334155;">
                  <p>Bonjour <strong>${partner.displayName || partner.partnerDetails?.companyName}</strong>,</p>
                  <p>Voici l'état de votre atelier pour la semaine qui démarre. Vous avez <strong>${activeOrders.length} commande(s)</strong> actives à livrer.</p>
                  
                  <table style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                    <thead>
                      <tr style="background-color: #f8fafc;">
                        <th style="padding: 12px; text-align: left; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Commande</th>
                        <th style="padding: 12px; text-align: right; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Échéance</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${orderLines}
                    </tbody>
                  </table>

                  <div style="text-align: center; margin-top: 40px;">
                    <a href="${dashboardUrl}" style="background-color: #b522c1; color: white; padding: 18px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(181, 34, 193, 0.2);">Ouvrir mon Atelier</a>
                  </div>
                </div>
                <div style="background-color: #f8fafc; padding: 25px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9;">
                  <p style="margin: 0;">Besoin d'aide ? Contactez notre équipe support administration.</p>
                </div>
              </div>
            </div>
          `
        })
      });
    } catch (e) {
      console.error('Weekly recap email failed:', e);
    }
  },
  
  async notifyPartnerApproval(partner: UserProfile) {
    const dashboardUrl = `${window.location.origin}/partner-portal`;

    // 1. In-App Notification
    try {
      await dbService.notifications.save({
        userId: partner.uid,
        title: 'Félicitations ! Partenariat Approuvé',
        message: 'Votre candidature a été acceptée. Vous avez maintenant accès au portail de production.',
        type: 'order_status',
        read: false
      });
    } catch (error) {
      console.error('Failed to save in-app notification:', error);
    }

    // 2. Email Notification
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: partner.email,
          subject: '🎉 Bienvenue chez Acom Technologie - Votre compte partenaire est actif !',
          html: `
            <div style="background-color: #f8f9fa; padding: 40px 20px; font-family: sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
                <div style="background-color: #b522c1; padding: 50px 30px; text-align: center; color: white;">
                  <div style="background-color: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 40px;">🎊</span>
                  </div>
                  <h1 style="margin: 0; font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Partenariat Validé</h1>
                </div>
                <div style="padding: 50px; color: #1e293b; line-height: 1.8;">
                  <p style="font-size: 18px;">Bonjour <strong>${partner.displayName || partner.partnerDetails?.companyName}</strong>,</p>
                  <p style="font-size: 16px; color: #475569;">C'est un plaisir de vous annoncer que votre candidature pour rejoindre le réseau de partenaires d'Acom Technologie a été <strong>approuvée officiellement</strong> !</p>
                  
                  <div style="margin: 40px 0; padding: 30px; background-color: #fdf2ff; border-radius: 20px; border: 1px solid #f5d0fe;">
                    <h3 style="color: #b522c1; margin-top: 0; font-size: 18px;">Ce qui change pour vous :</h3>
                    <ul style="color: #475569; font-size: 15px; padding-left: 20px; margin-bottom: 0;">
                      <li style="margin-bottom: 12px;">Accès immédiat au <strong>Portail Production</strong> (Kanban).</li>
                      <li style="margin-bottom: 12px;">Réception de commandes directes selon votre expertise.</li>
                      <li style="margin-bottom: 12px;">Suivi de vos revenus et facturation automatisée.</li>
                      <li>Tableau de bord de performance en temps réel.</li>
                    </ul>
                  </div>

                  <p style="color: #475569; font-size: 15px;">Nous sommes impatients de démarrer cette collaboration et de réaliser ensemble des projets d'exception.</p>
                  
                  <div style="text-align: center; margin-top: 50px;">
                    <a href="${dashboardUrl}" style="background-color: #b522c1; color: white; padding: 20px 45px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 10px 20px rgba(181, 34, 193, 0.2);">Ouvrir mon Tableau de Bord</a>
                  </div>
                </div>
                <div style="background-color: #f1f5f9; padding: 30px; text-align: center; color: #64748b; font-size: 13px;">
                  <p style="margin: 0; font-weight: bold;">L'Équipe Partenariats Acom Technologie</p>
                  <p style="margin: 5px 0 0 0;">Dakar, Sénégal</p>
                </div>
              </div>
            </div>
          `
        })
      });
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  },

  async notifyPartnerRejection(partner: UserProfile) {
    // 1. In-App Notification
    try {
      await dbService.notifications.save({
        userId: partner.uid,
        title: 'Mise à jour de votre candidature',
        message: "Malheureusement, votre dossier n'a pas été retenu pour le moment.",
        type: 'order_status',
        read: false
      });
    } catch (error) {
      console.error('Failed to save in-app notification:', error);
    }

    // 2. Email Notification
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: partner.email,
          subject: 'Mise à jour concernant votre demande de partenariat - Acom Technologie',
          html: `
            <div style="background-color: #f8f9fa; padding: 40px 20px; font-family: sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0;">
                <div style="padding: 50px; color: #1e293b; line-height: 1.6;">
                  <h2 style="color: #1e293b; margin-top: 0; font-size: 22px; font-weight: 800;">Bonjour ${partner.displayName || partner.partnerDetails?.companyName},</h2>
                  <p style="font-size: 16px; color: #475569;">Nous vous remercions sincèrement pour l'intérêt porté à notre réseau de partenaires et pour le temps consacré à votre candidature.</p>
                  
                  <p style="font-size: 16px; color: #475569;">Après un examen attentif de votre dossier, nous avons le regret de vous informer que nous ne pouvons pas donner suite à votre demande pour le moment.</p>
                  
                  <p style="font-size: 16px; color: #475569;">Cette décision peut être liée à notre capacité de production actuelle ou à un décalage temporaire avec nos besoins stratégiques immédiats. Cela n'enlève rien à la qualité de votre travail.</p>

                  <p style="font-size: 16px; color: #475569;">Nous conservons vos coordonnées dans notre base de données et n'hésiterons pas à vous recontacter si nos besoins évoluent.</p>
                  
                  <p style="margin-top: 40px; font-size: 15px; color: #64748b;">Cordialement,<br><strong>L'Équipe Partenariats Acom Technologie</strong></p>
                </div>
              </div>
            </div>
          `
        })
      });
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  },

  async notifyPartnerInvoiceStatusChange(order: Order, status: 'paid' | 'rejected', partner: UserProfile | null) {
    if (!partner) return;

    const isPaid = status === 'paid';
    const title = isPaid ? 'Facture validée et paiement effectué' : 'Facture rejetée';
    const message = isPaid 
      ? `Votre facture pour la commande #${order.id.slice(0, 8)} a été validée. Le paiement est en route.`
      : `Votre facture pour la commande #${order.id.slice(0, 8)} a été rejetée. Veuillez vérifier et renvoyer le document.`;
    
    const dashboardUrl = `${window.location.origin}/partner-portal?tab=invoices`;

    // 1. In-App Notification
    try {
      await dbService.notifications.save({
        userId: partner.uid,
        title,
        message,
        type: 'order_status',
        orderId: order.id,
        read: false
      });
    } catch (error) {
      console.error('Failed to save in-app notification:', error);
    }

    // 2. Email Notification
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: partner.email,
          subject: `Acom Technologie - ${title} (#${order.id.slice(0, 8)})`,
          html: `
            <div style="background-color: #f8f9fa; padding: 40px 20px; font-family: sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0;">
                <div style="background-color: ${isPaid ? '#10b981' : '#ef4444'}; padding: 40px; text-align: center; color: white;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">${isPaid ? 'Paiement Validé' : 'Facture à Revoir'}</h1>
                </div>
                <div style="padding: 50px; color: #1e293b; line-height: 1.6;">
                  <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; font-weight: 800;">Bonjour ${partner.displayName || partner.partnerDetails?.companyName || 'Cher Partenaire'},</h2>
                  <p style="font-size: 16px; color: #475569;">${message}</p>
                  
                  <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px dashed #cbd5e1;">
                    <table style="width: 100%; font-size: 14px;">
                      <tr>
                        <td style="color: #64748b; padding-bottom: 8px;">Commande :</td>
                        <td style="text-align: right; font-weight: bold; color: #1e293b;">#${order.id.toUpperCase()}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding-bottom: 8px;">Service :</td>
                        <td style="text-align: right; font-weight: bold; color: #1e293b;">${order.serviceName || 'Travaux d\'impression'}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b;">Montant :</td>
                        <td style="text-align: right; font-weight: bold; color: #b522c1; font-size: 18px;">${order.partnerEarnings?.toLocaleString() || '0'} CFA</td>
                      </tr>
                    </table>
                  </div>

                  <p style="font-size: 15px; color: #475569;">${isPaid ? 'Le virement a été ordonné et devrait apparaître sur votre compte selon les délais bancaires habituels.' : 'Nous vous invitons à vérifier la conformité du document (tampon officiel, signature lisible, montant exact) puis à le soumettre à nouveau via votre portail.'}</p>
                  
                  <div style="text-align: center; margin-top: 40px;">
                    <a href="${dashboardUrl}" style="background-color: #1e293b; color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">Accéder à mes factures</a>
                  </div>
                  
                  <p style="margin-top: 40px; font-size: 13px; color: #94a3b8; text-align: center;">Merci pour votre professionnalisme et votre contribution au réseau Acom Technologie.</p>
                </div>
              </div>
            </div>
          `
        })
      });
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  }
};
