import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Eye, Send, Printer, Truck, Package, CheckCircle } from 'lucide-react';

const EmailPreview = () => {
  const [activeTemplate, setActiveTemplate] = useState('shipped');
  
  const mockData = {
    clientName: 'Abdoulaye Ndiaye',
    orderId: 'ORD-87654321',
    trackingNumber: 'DHL-SN-998877',
    dashboardUrl: window.location.origin + '/dashboard'
  };

  const templates = {
    in_production: {
      label: 'En production',
      icon: Printer,
      color: 'bg-blue-600',
      subject: `Acom Technologie - Impression #${mockData.orderId.slice(0, 8)} : En production`,
      html: `
        <div style="background-color: #f8f9fa; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #eee;">
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
              <p style="font-size: 16px;">Bonjour <strong>${mockData.clientName}</strong>,</p>
              <p style="font-size: 16px; color: #475569;">Nous avons le plaisir de vous informer de l'avancement de l'impression pour votre commande <strong>#${mockData.orderId.slice(0, 8)}</strong>.</p>
              <div style="margin: 35px 0; padding: 30px; background-color: #fdf2ff; border: 1px solid #f5d0fe; border-radius: 16px; text-align: center;">
                <p style="margin: 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Statut actuel</p>
                <p style="margin: 12px 0 0 0; color: #b522c1; font-size: 32px; font-weight: 900;">En production</p>
              </div>
              <p style="color: #475569; font-size: 15px;">Vos supports sont actuellement sur nos presses. Nous apportons un soin particulier à la qualité du rendu.</p>
              <div style="text-align: center; margin-top: 45px;">
                <a href="${mockData.dashboardUrl}" style="background-color: #b522c1; color: white; padding: 18px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 15px rgba(181, 34, 193, 0.3);">Suivre ma commande</a>
              </div>
            </div>
            <div style="background-color: #1e293b; padding: 35px; text-align: center; color: #94a3b8; font-size: 13px;">
              <p style="margin: 0; color: white; font-weight: bold; font-size: 15px;">Acom Technologie</p>
              <p style="margin: 8px 0 0 0;">Service Impression & Logistique</p>
            </div>
          </div>
        </div>
      `
    },
    shipped: {
      label: 'Expédiée',
      icon: Truck,
      color: 'bg-purple-600',
      subject: `Acom Technologie - Impression #${mockData.orderId.slice(0, 8)} : Expédiée`,
      html: `
        <div style="background-color: #f8f9fa; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #eee;">
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
              <p style="font-size: 16px;">Bonjour <strong>${mockData.clientName}</strong>,</p>
              <p style="font-size: 16px; color: #475569;">Nous avons le plaisir de vous informer de l'avancement de l'impression pour votre commande <strong>#${mockData.orderId.slice(0, 8)}</strong>.</p>
              <div style="margin: 35px 0; padding: 30px; background-color: #fdf2ff; border: 1px solid #f5d0fe; border-radius: 16px; text-align: center;">
                <p style="margin: 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Statut actuel</p>
                <p style="margin: 12px 0 0 0; color: #b522c1; font-size: 32px; font-weight: 900;">Expédiée</p>
                <p style="margin: 15px 0 0 0; color: #475569; font-size: 14px;">
                  Numéro de suivi : <strong>${mockData.trackingNumber}</strong>
                </p>
              </div>
              <p style="color: #475569; font-size: 15px;">Bonne nouvelle ! Vos supports ont été expédiés et sont en route vers votre adresse de livraison.</p>
              <div style="text-align: center; margin-top: 45px;">
                <a href="${mockData.dashboardUrl}" style="background-color: #b522c1; color: white; padding: 18px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 15px rgba(181, 34, 193, 0.3);">Suivre ma commande</a>
              </div>
            </div>
            <div style="background-color: #1e293b; padding: 35px; text-align: center; color: #94a3b8; font-size: 13px;">
              <p style="margin: 0; color: white; font-weight: bold; font-size: 15px;">Acom Technologie</p>
              <p style="margin: 8px 0 0 0;">Service Impression & Logistique</p>
            </div>
          </div>
        </div>
      `
    },
    delivered: {
      label: 'Livrée',
      icon: CheckCircle,
      color: 'bg-emerald-600',
      subject: `Acom Technologie - Impression #${mockData.orderId.slice(0, 8)} : Livrée`,
      html: `
        <div style="background-color: #f8f9fa; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #eee;">
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
              <p style="font-size: 16px;">Bonjour <strong>${mockData.clientName}</strong>,</p>
              <p style="font-size: 16px; color: #475569;">Nous avons le plaisir de vous informer de l'avancement de l'impression pour votre commande <strong>#${mockData.orderId.slice(0, 8)}</strong>.</p>
              <div style="margin: 35px 0; padding: 30px; background-color: #fdf2ff; border: 1px solid #f5d0fe; border-radius: 16px; text-align: center;">
                <p style="margin: 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Statut actuel</p>
                <p style="margin: 12px 0 0 0; color: #b522c1; font-size: 32px; font-weight: 900;">Livrée</p>
              </div>
              <p style="color: #475569; font-size: 15px;">Vos supports ont été livrés. Nous espérons qu'ils vous donneront entière satisfaction !</p>
              <div style="text-align: center; margin-top: 45px;">
                <a href="${mockData.dashboardUrl}" style="background-color: #b522c1; color: white; padding: 18px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 15px rgba(181, 34, 193, 0.3);">Voir ma commande</a>
              </div>
            </div>
            <div style="background-color: #1e293b; padding: 35px; text-align: center; color: #94a3b8; font-size: 13px;">
              <p style="margin: 0; color: white; font-weight: bold; font-size: 15px;">Acom Technologie</p>
              <p style="margin: 8px 0 0 0;">Service Impression & Logistique</p>
            </div>
          </div>
        </div>
      `
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
              <Mail className="w-8 h-8 text-primary" />
              Email Previewer
            </h1>
            <p className="text-gray-500 font-medium mt-1">Visualisez le rendu réel des emails envoyés à vos clients</p>
          </div>
          
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
            {Object.entries(templates).map(([id, template]) => (
              <button
                key={id}
                onClick={() => setActiveTemplate(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTemplate === id 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <template.icon className="w-4 h-4" />
                {template.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Détails du Template
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Objet de l'email</label>
                  <div className="p-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-700 border border-gray-100">
                    {templates[activeTemplate as keyof typeof templates].subject}
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Destinataire</label>
                  <div className="p-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-700 border border-gray-100">
                    {mockData.clientName} &lt;client@example.com&gt;
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Send className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-emerald-800 uppercase tracking-widest">Auto-Notification</p>
                      <p className="text-[10px] text-emerald-600 font-medium">Activée pour ce statut</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary p-8 rounded-[2rem] shadow-xl shadow-primary/20 text-white">
              <h3 className="text-lg font-bold mb-4">Conseil Design</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Nos emails sont conçus pour être "Mobile-First" et s'adapter parfaitement sur Outlook, Gmail et Apple Mail.
              </p>
            </div>
          </div>

          {/* Email Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-xl overflow-hidden min-h-[800px] flex flex-col">
              <div className="bg-gray-900 p-4 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <div className="mx-auto bg-white/10 px-4 py-1 rounded-lg text-[10px] font-bold text-white/40">
                  mail-preview.acom.tech
                </div>
              </div>
              
              <div className="flex-1 bg-[#f8f9fa] overflow-auto">
                <div 
                  dangerouslySetInnerHTML={{ __html: templates[activeTemplate as keyof typeof templates].html }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;
