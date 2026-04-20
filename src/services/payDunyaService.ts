export const payDunyaService = {
  /**
   * Créer une facture (Checkout Invoice) via notre serveur Node.js
   * @param amount Le montant total de la facture (en FCFA)
   * @param description Description de la facture
   * @param orderId Identifiant unique de la commande ou de l'instance SaaS
   * @param returnUrl URL de redirection après un paiement réussi
   * @param cancelUrl URL de redirection après une annulation
   * @returns Le lien de paiement (receipt_url) si succès
   */
  async createPaymentLink(params: {
    amount: number;
    description: string;
    orderId: string;
    paymentType?: 'deposit' | 'balance' | 'full';
    returnUrl?: string;
    cancelUrl?: string;
  }): Promise<string> {
    try {
      const response = await fetch('/api/paydunya/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la communication avec le serveur de paiement.');
        } else {
          const text = await response.text();
          throw new Error(`Erreur inattendue du serveur: ${response.status} - L'API a retourné du HTML. Veuillez vérifier la connexion ou les logs du serveur.`);
        }
      }

      const data = await response.json();

      // Dans l'API Checkout de PayDunya, l'URL de paiement est souvent dans response_text
      // ou parfois dans receipt_url selon la version/le type de facture.
      const paymentUrl = data.response_text?.startsWith('http') ? data.response_text : data.receipt_url;

      if (data.response_code === '00' && paymentUrl) {
        return paymentUrl;
      } else {
        throw new Error(data.response_text || 'Incapable de générer le lien de paiement PayDunya.');
      }
    } catch (error: any) {
      console.error('Erreur PayDunya:', error);
      throw error;
    }
  }
};
