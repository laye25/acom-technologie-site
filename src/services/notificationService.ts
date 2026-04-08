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
      // We don't throw here to allow the email and status update to proceed
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
  }
};
