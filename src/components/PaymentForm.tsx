import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CreditCard, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface PaymentFormProps {
  amount: number;
  totalAmount: number;
  originalTotal?: number;
  discountPercentage?: number;
  orderId: string;
  paymentType: 'deposit' | 'balance' | 'full';
  returnUrl?: string;
  onSuccess: (type: 'deposit' | 'balance' | 'full', stripePaymentIntentId?: string) => void;
  onCancel: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ 
  amount, 
  totalAmount, 
  originalTotal,
  discountPercentage = 0,
  orderId, 
  paymentType, 
  returnUrl,
  onSuccess, 
  onCancel 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const hasDiscount = discountPercentage > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Une erreur est survenue lors de la validation du formulaire.');
      setProcessing(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl || `${window.location.origin}/order-details/${orderId}?payment_success=true&payment_type=${paymentType}`,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Le paiement a échoué.');
      setProcessing(false);
    } else {
      setSucceeded(true);
      setProcessing(false);
      onSuccess(paymentType, paymentIntent?.id);
    }
  };

  if (succeeded) {
    return (
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">
          <div className="bg-emerald-100 p-3 rounded-full">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Paiement réussi !</h3>
        <p className="text-gray-600">Merci pour votre paiement. Votre commande est en cours de traitement.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
        {hasDiscount && (
          <>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500 font-medium">Montant total de la facture</span>
              <span className="text-sm font-bold text-gray-500">{(originalTotal || totalAmount).toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-indigo-600 font-bold">Total avec offre (-{discountPercentage}%)</span>
              <span className="text-sm font-bold text-indigo-600">{totalAmount.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="h-px bg-gray-200 my-3" />
          </>
        )}
        <div className="flex justify-between items-center">
          <span className="text-sm font-black text-indigo-600 uppercase tracking-tight">
            {paymentType === 'deposit' ? 'Acompte à régler (50%)' : 
             paymentType === 'balance' ? 'Reliquat à régler (50%)' : 
             'Montant à régler (100%)'}
          </span>
          <span className="text-2xl font-black text-indigo-600">{amount.toLocaleString('fr-FR')} FCFA</span>
        </div>
        <div className="flex items-center text-[10px] text-gray-400 uppercase tracking-widest mt-2">
          <CreditCard className="w-3 h-3 mr-1" />
          <span>Paiement sécurisé par Stripe</span>
        </div>
      </div>

      <PaymentElement />

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm mt-4">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-6 sticky bottom-0 bg-white pb-2 mt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Traitement...
            </>
          ) : (
            `Payer ${(amount || 0).toLocaleString('fr-FR')} FCFA`
          )}
        </button>
      </div>
    </form>
  );
};
