import React, { useState } from 'react';
import { Star, Send, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dbService } from '../services/dbService';
import { toast } from 'react-hot-toast';
import { PartnerRating, Order } from '../types';

interface PartnerRatingComponentProps {
  order: Order;
  onRatingSubmitted?: () => void;
}

export const PartnerRatingComponent: React.FC<PartnerRatingComponentProps> = ({ order, onRatingSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Veuillez sélectionner une note.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!order.partnerId && !(order as any).partner_id) {
        toast.error('Aucun partenaire associé à cette commande.');
        return;
      }

      await dbService.partnerRatings.save({
        orderId: order.id,
        partnerId: order.partnerId || (order as any).partner_id,
        score: rating,
        comment,
        createdAt: new Date()
      });

      // Update partner reputation (could be done in a cloud function, but here we do it client-side for "intelligence")
      // We would need to fetch all ratings for this partner and average them.
      // For now, we just inform the user.
      
      setHasRated(true);
      toast.success('Merci pour votre retour ! Votre avis aide à améliorer nos services.');
      if (onRatingSubmitted) onRatingSubmitted();
    } catch (e) {
      console.error('Rating failed:', e);
      toast.error('Erreur lors de l\'envoi de la note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasRated) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 text-center"
      >
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Star className="text-emerald-500 fill-emerald-500 w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-emerald-900 mb-2">Avis Enregistré !</h3>
        <p className="text-sm text-emerald-800/70">Merci d'avoir pris le temps de noter la qualité de notre service.</p>
      </motion.div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-xl">
          <Star className="text-primary w-5 h-5" />
        </div>
        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Notez la Qualité</h3>
      </div>

      <p className="text-sm text-gray-500 mb-8">
        Votre commande est arrivée ! Prenez un instant pour noter la qualité du travail fourni par notre partenaire.
      </p>

      <div className="space-y-8">
        {/* Star Rating */}
        <div className="flex justify-center gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
            >
              <Star
                size={40}
                className={`transition-colors ${
                  (hover || rating) >= star 
                    ? 'text-primary fill-primary' 
                    : 'text-gray-200 fill-transparent'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Comment Box */}
        <div className="relative">
          <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Un commentaire sur la qualité, les délais ou l'emballage ? (Optionnel)"
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl min-h-[120px] text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none font-medium placeholder:text-gray-300"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || rating === 0}
          className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Envoyer mon avis
              <Send size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
