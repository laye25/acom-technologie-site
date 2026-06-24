import React, { useState, useEffect } from 'react';
import { dbService as db } from '../../services/dbService';
import { Save, Plus, Trash2, Image as ImageIcon, Loader2, Layout, Info, Share2, Palette, Settings, Calculator, FileText, Briefcase, Users, Award, Star, CheckCircle2, Clock, Percent, Link as LinkIcon, Monitor, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { ConfirmModal } from './ConfirmModal';
import { OptimizedImage } from '../OptimizedImage';
import { SiteSettings, StatItem, WhyUsPoint, WhyUsSection, CTASection, HeroSlide, FooterSettings, PageSection, FAQItem, AboutContent } from '../../types';
import { compressImage, compressBase64Image } from '../../lib/imageUtils';
import { storage } from '../../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const PRESET_GRADIENTS = [
  { name: 'Acom Purple', value: 'from-[#8e008e] via-[#b000b0] to-[#ff00ff]' },
  { name: 'Deep Sea', value: 'from-primary-900 via-indigo-800 to-primary-600' },
  { name: 'Sunset', value: 'from-orange-600 via-red-600 to-pink-600' },
  { name: 'Emerald', value: 'from-emerald-600 via-teal-600 to-cyan-600' },
  { name: 'Midnight', value: 'from-gray-900 via-slate-800 to-gray-900' },
  { name: 'Royal Blue', value: 'from-blue-700 via-indigo-700 to-primary-800' },
  { name: 'Rose Gold', value: 'from-rose-400 via-fuchsia-500 to-indigo-500' },
  { name: 'Oceanic', value: 'from-cyan-500 via-blue-500 to-indigo-500' },
  { name: 'Lush', value: 'from-green-400 via-cyan-900 to-blue-500' },
  { name: 'Skyline', value: 'from-sky-400 via-indigo-900 to-blue-500' },
  { name: 'Fire', value: 'from-yellow-200 via-red-500 to-fuchsia-800' },
  { name: 'Forest', value: 'from-emerald-500 via-green-600 to-teal-700' },
  { name: 'Amethyst', value: 'from-purple-500 via-indigo-500 to-blue-500' },
  { name: 'Slate', value: 'from-slate-500 via-slate-700 to-slate-900' },
  { name: 'Golden', value: 'from-yellow-400 via-orange-500 to-red-500' },
  { name: 'Borealis', value: 'from-green-300 via-blue-500 to-purple-600' },
  { name: 'Candy', value: 'from-pink-300 via-purple-300 to-indigo-400' },
  { name: 'Deep Purple', value: 'from-fuchsia-900 via-purple-900 to-primary-900' },
  { name: 'Tropical', value: 'from-teal-400 via-yellow-200 to-orange-500' },
  { name: 'Steel', value: 'from-gray-400 via-gray-600 to-blue-gray-800' },
  { name: 'Berry', value: 'from-red-500 via-rose-500 to-fuchsia-600' },
  { name: 'Mint', value: 'from-emerald-400 via-teal-400 to-cyan-400' },
  { name: 'Lavender', value: 'from-indigo-300 via-purple-300 to-pink-300' },
  { name: 'Coffee', value: 'from-amber-900 via-orange-900 to-stone-900' },
  { name: 'Neon', value: 'from-lime-400 via-emerald-400 to-cyan-400' },
];

const PRESET_PRIMARY_COLORS = [
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Cyan', value: '#0891b2' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Lime', value: '#65a30d' },
  { name: 'Yellow', value: '#ca8a04' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Pink', value: '#db2777' },
  { name: 'Fuchsia', value: '#c026d3' },
  { name: 'Slate', value: '#475569' },
];

const SettingsManager = () => {
  const defaultSettings: SiteSettings = {
    brandName: 'Acom Technologie',
    heroSlides: [
      {
        title: "Impression Numérique & Offset",
        subtitle: "Qualité supérieure pour tous vos supports de communication.",
        image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=1200",
        color: "from-[#8e008e] via-[#b000b0] to-[#ff00ff]",
        badge: "SUPER PROMO",
        iconName: "Palette"
      }
    ],
    footer: {
      description: "Votre partenaire digital de confiance au Sénégal.",
      address: "Touba Khaira, Sénégal",
      phone: "+221 77 795 19 19",
      email: "contact@acomtechnologie.com",
      facebook: "#",
      instagram: "#",
      linkedin: "#",
      twitter: "#",
      aboutUrl: "/about",
      faqUrl: "/faq",
      termsUrl: "/terms",
      privacyUrl: "/privacy",
      copyrightText: "© 2026 Acom Technologie. Tous droits réservés."
    },
    primaryColor: '#7c3aed',
    taxRate: 18,
    cashThreshold: 50000,
    aboutContent: {
      heroTitle: "Votre Partenaire Digital de Confiance au Sénégal",
      heroSubtitle: "Acom Technologie est une agence de communication et de services numériques basée à Touba, dédiée à l'accompagnement des entreprises dans leur transformation digitale.",
      missionTitle: "Notre Mission",
      missionDescription: "Notre mission est de démocratiser l'accès aux technologies numériques de pointe pour les entreprises sénégalaises, quelle que soit leur taille.",
      missionPoints: [
        'Innovation constante dans nos solutions',
        'Qualité d\'impression et de design irréprochable',
        'Accompagnement personnalisé pour chaque client',
        'Respect des délais et des engagements'
      ],
      stats: [
        { label: 'Clients Satisfaits', value: '500+' },
        { label: 'Projets Terminés', value: '1200+' },
        { label: 'Années d\'Expérience', value: '8+' },
        { label: 'Experts Dédiés', value: '15+' },
      ]
    },
    faqContent: [
      {
        category: 'Général',
        question: 'Quels sont vos horaires d\'ouverture ?',
        answer: 'Nous sommes ouverts du lundi au samedi, de 8h30 à 18h30. Notre équipe de support en ligne est également disponible pour répondre à vos questions via le chat.'
      },
      {
        category: 'Général',
        question: 'Où se trouve votre agence ?',
        answer: 'Notre agence principale est située à Touba Khaira, Sénégal. Vous pouvez nous trouver facilement sur Google Maps.'
      },
      {
        category: 'Impression',
        question: 'Quels types de supports d\'impression proposez-vous ?',
        answer: 'Nous proposons une large gamme de supports : cartes de visite, flyers, dépliants, affiches grand format, bâches, autocollants, et bien plus encore.'
      },
      {
        category: 'Impression',
        question: 'Quel est le délai moyen pour une commande d\'impression ?',
        answer: 'Le délai varie selon la complexité et la quantité. En général, les petites commandes sont prêtes en 24-48h, tandis que les projets plus importants peuvent prendre 3 à 5 jours ouvrables.'
      },
      {
        category: 'Digital',
        question: 'Proposez-vous la création de sites web ?',
        answer: 'Oui, nous créons des sites vitrines, des boutiques en ligne (e-commerce) et des applications web sur mesure adaptées à vos besoins spécifiques.'
      },
      {
        category: 'Digital',
        question: 'Gérez-vous les réseaux sociaux pour les entreprises ?',
        answer: 'Absolument. Nous proposons des services de community management pour booster votre présence sur Facebook, Instagram et LinkedIn.'
      },
      {
        category: 'Paiement',
        question: 'Quels sont les modes de paiement acceptés ?',
        answer: 'Nous acceptons les paiements en espèces à l\'agence, ainsi que les transferts via Orange Money, Wave et Free Money pour plus de commodité.'
      },
      {
        category: 'Paiement',
        question: 'Dois-je payer la totalité à la commande ?',
        answer: 'Pour la plupart des projets, nous demandons un acompte de 50% à la commande et le solde à la livraison ou à la fin du projet.'
      }
    ],
    termsContent: [
      {
        title: 'Acceptation des Conditions',
        content: 'En accédant à ce site web et en utilisant nos services, vous acceptez d\'être lié par les présentes conditions d\'utilisation, toutes les lois et réglementations applicables, et acceptez que vous êtes responsable du respect de toutes les lois locales applicables.'
      },
      {
        title: 'Utilisation des Services',
        content: 'Nos services de communication, d\'impression et de développement numérique sont fournis pour un usage professionnel et personnel légal. Toute utilisation abusive ou frauduleuse de nos services entraînera la résiliation immédiate de votre accès.'
      },
      {
        title: 'Propriété Intellectuelle',
        content: 'Tous les contenus présents sur ce site, y compris les textes, graphiques, logos, icônes et images, sont la propriété exclusive d\'Acom Technologie ou de ses fournisseurs de contenu et sont protégés par les lois internationales sur le droit d\'auteur.'
      },
      {
        title: 'Limitation de Responsabilité',
        content: 'Acom Technologie ne pourra être tenu responsable des dommages directs, indirects, consécutifs ou spéciaux résultant de l\'utilisation ou de l\'impossibilité d\'utiliser nos services, même si nous avons été informés de la possibilité de tels dommages.'
      }
    ],
    privacyContent: [
      {
        title: 'Collecte des Données',
        content: 'Nous collectons les informations que vous nous fournissez directement, notamment votre nom, adresse e-mail, numéro de téléphone et détails de commande, afin de traiter vos demandes et d\'améliorer nos services.'
      },
      {
        title: 'Utilisation des Données',
        content: 'Vos données sont utilisées pour traiter vos commandes, communiquer avec vous sur l\'état de vos projets, et vous envoyer des informations pertinentes sur nos services si vous y avez consenti.'
      },
      {
        title: 'Sécurité des Données',
        content: 'Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, perte ou destruction.'
      },
      {
        title: 'Vos Droits',
        content: 'Vous avez le droit d\'accéder à vos données personnelles, de les rectifier ou de demander leur suppression à tout moment. Contactez-nous pour exercer ces droits.'
      }
    ],
    statsSection: [
      { label: 'Projets Terminés', value: '500+', iconName: 'Briefcase' },
      { label: 'Clients Satisfaits', value: '200+', iconName: 'Users' },
      { label: 'Années d\'Expérience', value: '10+', iconName: 'Award' },
      { label: 'Avis Positifs', value: '4.9/5', iconName: 'Star' },
    ],
    whyUsSection: {
      title: "L'Excellence Technique au Service de votre Vision",
      image: "https://picsum.photos/seed/team/1200/800",
      points: [
        { title: 'Qualité Premium', description: 'Nous utilisons les meilleures technologies et matériaux pour des résultats irréprochables.', iconName: 'CheckCircle2' },
        { title: 'Accompagnement Dédié', description: 'Une équipe d\'experts à votre écoute pour transformer vos idées en réalité.', iconName: 'Users' },
        { title: 'Délais Respectés', description: 'Nous comprenons l\'importance du temps dans vos projets de communication.', iconName: 'Clock' },
      ]
    },
    ctaSection: {
      title: "Prêt à Propulser",
      subtitle: "Votre Projet ?",
      description: "Contactez-nous dès aujourd'hui pour discuter de vos besoins et obtenir un devis personnalisé gratuit.",
      primaryButtonText: "Démarrer un Projet",
      primaryButtonLink: "/quote-request",
      secondaryButtonText: "Voir nos Travaux",
      secondaryButtonLink: "/portfolio"
    },
    expertiseSection: {
      titlePart1: "Une Expertise,",
      titlePart2: "Deux Univers.",
      subtitle: "Découvrez nos deux pôles d'excellence conçus pour répondre à l'intégralité de vos besoins digitaux et physiques.",
      universes: [
        {
          title: "Acom SaaS",
          image: "https://picsum.photos/seed/acom-saas/800/600",
          description: "Solutions logicielles métiers 100% cloud pour piloter votre activité. Une suite d'outils puissants adaptés à chaque secteur.",
          features: ["Gestion de stock", "Gestion de chantier (BTP)", "Ressources Humaines (RH)", "Gestion médicale", "Gestion des services", "Gestion de transport & flotte", "Gestion scolaire", "Gestion de pressing", "Gestion d'ateliers de couture"],
          linkText: "Explorer les solutions SaaS",
          linkUrl: "/solutions-saas",
          baseColor: "#8e008e"
        },
        {
          title: "Acom Studio",
          image: "https://picsum.photos/seed/acom-studio/800/600",
          description: "L'excellence du design et de l'impression. Personnalisez et commandez vos supports physiques avec une qualité irréprochable.",
          features: ["Goodies", "Papeterie & Bureautique", "Marketing & Publicité", "Signalétique"],
          linkText: "Explorer Acom Studio",
          linkUrl: "/merchants",
          baseColor: "#10b981"
        }
      ]
    },
    portfolioSection: {
      badge: "Portfolio",
      title: "Nos",
      subtitle: "Réalisations",
      description: "Découvrez comment nous aidons nos clients à atteindre leurs objectifs grâce à des solutions digitales innovantes et un design d'exception.",
      ctaTitle: "Votre Projet Mérite",
      ctaSubtitle: "L'Excellence.",
      ctaButtonText: "Discutons de votre Vision"
    },
    contactSection: {
      title: "Parlons de votre",
      titleAccent: "projet",
      description: "Vous avez une idée ? Une question ? Notre équipe est là pour vous accompagner dans votre transformation digitale.",
      phoneLabel: "Téléphone / WhatsApp",
      emailLabel: "Email",
      addressLabel: "Localisation",
      successTitle: "Message envoyé !",
      successMessage: "Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais.",
      submitButtonText: "Envoyer le message",
      whatsappText: "Discuter sur WhatsApp"
    }
  };

  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<number | string | null>(null);
  const [uploadingWhyUs, setUploadingWhyUs] = useState(false);
  const [customColors, setCustomColors] = useState<{ [key: number]: { from: string, to: string } }>({
    0: { from: '#8e008e', to: '#ff00ff' }
  });
  const [exeUploadProgress, setExeUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      // Safety timeout
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 5000);

      try {
        const data = await db.settings.get('global');

        if (data) {
          // Merge with defaults to ensure all fields exist
          const siteSettings = {
            ...defaultSettings,
            ...data,
            expertiseSection: {
              ...defaultSettings.expertiseSection,
              ...(data.expertiseSection || {}),
              universes: data.expertiseSection?.universes || defaultSettings.expertiseSection.universes
            },
            // Also check for nested config for backward compatibility
            primaryColor: data.primaryColor || (data.config && data.config.primaryColor) || defaultSettings.primaryColor
          } as SiteSettings;
          
          setSettings(siteSettings);
          
          const initialCustom: { [key: number]: { from: string, to: string } } = {};
          siteSettings.heroSlides.forEach((slide, idx) => {
            const match = slide.color.match(/from-\[(#[a-fA-F0-9]+)\] .* to-\[(#[a-fA-F0-9]+)\]/);
            if (match) {
              initialCustom[idx] = { from: match[1], to: match[2] };
            } else {
              initialCustom[idx] = { from: '#8e008e', to: '#ff00ff' };
            }
          });
          setCustomColors(initialCustom);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        // We already have defaults in state
      } finally {
        setLoading(false);
        clearTimeout(timeout);
      }
    };

    fetchSettings();
  }, []);

  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [compressing, setCompressing] = useState(false);

  const autoCompressImages = async () => {
    if (!settings) return;
    setCompressing(true);
    setNotification({ type: 'success', message: 'Compression des images en cours...' });
    
    try {
      const initialSize = JSON.stringify(settings).length;
      console.log(`Initial settings size: ${initialSize} chars`);
      
      const newSlides = [...settings.heroSlides];
      let changed = false;
      
      for (let i = 0; i < newSlides.length; i++) {
        if (newSlides[i].image && newSlides[i].image.length > 200000) {
          const oldSize = newSlides[i].image.length;
          console.log(`Compressing slide ${i} (size: ${oldSize})...`);
          newSlides[i].image = await compressBase64Image(newSlides[i].image, 1200, 800, 0.7);
          console.log(`Slide ${i} compressed to: ${newSlides[i].image.length} (saved ${oldSize - newSlides[i].image.length})`);
          changed = true;
        }
      }
      
      let newWhyUs = settings.whyUsSection;
      if (newWhyUs?.image && newWhyUs.image.length > 200000) {
        const oldSize = newWhyUs.image.length;
        console.log(`Compressing whyUs image (size: ${oldSize})...`);
        newWhyUs = {
          ...newWhyUs,
          image: await compressBase64Image(newWhyUs.image, 1200, 1200, 0.7)
        };
        console.log(`WhyUs image compressed to: ${newWhyUs.image.length} (saved ${oldSize - newWhyUs.image.length})`);
        changed = true;
      }
      
      if (changed) {
        const newSettings = {
          ...settings,
          heroSlides: newSlides,
          whyUsSection: newWhyUs
        };
        const finalSize = JSON.stringify(newSettings).length;
        console.log(`Final settings size: ${finalSize} chars (total saved: ${initialSize - finalSize})`);
        
        setSettings(newSettings);
        setNotification({ type: 'success', message: 'Images compressées ! Tentative d\'enregistrement...' });
        return newSettings;
      }
      return null;
    } catch (error) {
      console.error('Compression error:', error);
      setNotification({ type: 'error', message: 'Erreur lors de la compression automatique.' });
      return null;
    } finally {
      setCompressing(false);
    }
  };

  const [activePageEdit, setActivePageEdit] = useState<'about' | 'faq' | 'terms' | 'privacy' | 'home_sections' | 'portfolio' | 'contact'>('about');

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      let currentSettings = settings;
      
      // Check for large images in slides and whyUsSection
      const largeSlides = currentSettings.heroSlides.filter(s => s.image && s.image.length > 200000);
      const isWhyUsLarge = currentSettings.whyUsSection?.image && currentSettings.whyUsSection.image.length > 200000;
      
      if (largeSlides.length > 0 || isWhyUsLarge) {
        console.log('Large images detected, starting automatic compression...');
        const compressedSettings = await autoCompressImages();
        if (compressedSettings) {
          currentSettings = compressedSettings;
        } else {
          // If compression was needed but failed or didn't change anything, 
          // we still check the size later
        }
      }

      // Save with both root primaryColor and config.primaryColor for compatibility
      const dataToSave = {
        ...currentSettings,
        config: {
          ...((currentSettings as any).config || {}),
          primaryColor: currentSettings.primaryColor
        }
      };
      
      const size = JSON.stringify(dataToSave).length;
      console.log(`Saving settings, estimated size: ${size} chars`);
      
      if (size > 1000000) {
        setNotification({ 
          type: 'error', 
          message: `Erreur : Les données sont trop lourdes (${Math.round(size/1024)} Ko). Veuillez réduire le nombre d'images ou leur taille.` 
        });
        setSaving(false);
        return;
      }
      
      await db.settings.save('global', dataToSave);
      setNotification({ type: 'success', message: 'Paramètres enregistrés avec succès !' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      
      let errorStr = '';
      if (typeof error === 'string') {
        errorStr = error;
      } else if (error?.message) {
        errorStr = error.message;
      } else {
        errorStr = JSON.stringify(error);
      }
      
      let errorMessage = 'Erreur lors de l\'enregistrement.';
      
      // Check for document size limit error
      if (errorStr.includes('too large') || errorStr.includes('1048576')) {
        errorMessage = 'Erreur : Les données sont trop volumineuses (limite 1Mo). Essayez de réduire la taille des images.';
      } else if (errorStr.includes('quota')) {
        errorMessage = 'Erreur : Quota Firestore dépassé.';
      } else if (errorStr.includes('permission') || errorStr.includes('insufficient')) {
        errorMessage = 'Erreur : Permissions insuffisantes. Vérifiez votre accès administrateur.';
      } else {
        // Show the actual error message if it's something else
        errorMessage = `Erreur : ${errorStr.substring(0, 150)}`;
      }
      
      setNotification({ type: 'error', message: errorMessage });
      setTimeout(() => setNotification(null), 10000);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (index: number, file: File) => {
    setUploading(index);
    try {
      // Improved compression: 1200px max, 0.7 quality
      const compressedBase64 = await compressImage(file, 1200, 800, 0.7);
      const newSlides = [...(settings?.heroSlides || [])];
      newSlides[index].image = compressedBase64;
      setSettings(prev => prev ? { ...prev, heroSlides: newSlides } : null);
      setUploading(null);
    } catch (error) {
      console.error('Upload error:', error);
      setNotification({ type: 'error', message: 'Erreur lors de l\'upload.' });
      setTimeout(() => setNotification(null), 3000);
      setUploading(null);
    }
  };

  const handleWhyUsImageUpload = async (file: File) => {
    setUploadingWhyUs(true);
    try {
      // Improved compression: 1200px max, 0.7 quality
      const compressedBase64 = await compressImage(file, 1200, 1200, 0.7);
      if (settings?.whyUsSection) {
        setSettings({
          ...settings,
          whyUsSection: {
            ...settings.whyUsSection,
            image: compressedBase64
          }
        });
      }
      setUploadingWhyUs(false);
    } catch (error) {
      console.error('Upload error:', error);
      setNotification({ type: 'error', message: 'Erreur lors de l\'upload.' });
      setTimeout(() => setNotification(null), 3000);
      setUploadingWhyUs(false);
    }
  };

  const handleExpertiseImageUpload = async (index: number, file: File) => {
    setUploading(`expertise_${index}`);
    try {
      const compressedBase64 = await compressImage(file, 1200, 800, 0.7);
      const newUniverses = [...(settings?.expertiseSection?.universes || [])];
      newUniverses[index].image = compressedBase64;
      if (settings?.expertiseSection) {
        setSettings({
          ...settings,
          expertiseSection: {
            ...settings.expertiseSection,
            universes: newUniverses
          }
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setNotification({ type: 'error', message: 'Erreur lors de l\'upload.' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setUploading(null);
    }
  };

  const handleExeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.exe')) {
      toast.error('Le fichier doit être un exécutable (.exe)');
      return;
    }

    const storageRef = ref(storage, `downloads/${file.name.replace(/\s+/g, '_')}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setExeUploadProgress(0);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setExeUploadProgress(progress);
      },
      (error) => {
        console.error('Erreur lors du téléchargement de l\'exe:', error);
        toast.error('Erreur lors du téléchargement: ' + error.message);
        setExeUploadProgress(null);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setSettings({ ...settings, desktopDownloadUrl: downloadURL });
          toast.success('Exécutable uploadé avec succès ! N\'oubliez pas de sauvegarder.');
          setExeUploadProgress(null);
        });
      }
    );
  };

  const [showConfirmRestore, setShowConfirmRestore] = useState(false);

  const handleRestoreDefaults = async () => {
    setSaving(true);
    try {
      const defaultSettings: SiteSettings = {
        brandName: 'Acom Technologie',
        heroSlides: [
          {
            title: "Impression Numérique & Offset",
            subtitle: "Qualité supérieure pour tous vos supports de communication.",
            image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=1200",
            color: "from-[#8e008e] via-[#b000b0] to-[#ff00ff]",
            badge: "SUPER PROMO",
            iconName: "Palette"
          }
        ],
        footer: {
          description: "Votre partenaire digital de confiance au Sénégal.",
          address: "Touba Khaira, Sénégal",
          phone: "+221 77 795 19 19",
          email: "contact@acomtechnologie.com",
          facebook: "#",
          instagram: "#",
          linkedin: "#",
          twitter: "#",
          aboutUrl: "/about",
          faqUrl: "/faq",
          termsUrl: "/terms",
          privacyUrl: "/privacy",
          copyrightText: "© 2026 Acom Technologie. Tous droits réservés."
        },
        primaryColor: '#7c3aed',
        taxRate: 18,
        cashThreshold: 50000,
        aboutContent: {
          heroTitle: "Votre Partenaire Digital de Confiance au Sénégal",
          heroSubtitle: "Acom Technologie est une agence de communication et de services numériques basée à Touba, dédiée à l'accompagnement des entreprises dans leur transformation digitale.",
          missionTitle: "Notre Mission",
          missionDescription: "Notre mission est de démocratiser l'accès aux technologies numériques de pointe pour les entreprises sénégalaises, quelle que soit leur taille.",
          missionPoints: [
            'Innovation constante dans nos solutions',
            'Qualité d\'impression et de design irréprochable',
            'Accompagnement personnalisé pour chaque client',
            'Respect des délais et des engagements'
          ],
          stats: [
            { label: 'Clients Satisfaits', value: '500+' },
            { label: 'Projets Terminés', value: '1200+' },
            { label: 'Années d\'Expérience', value: '8+' },
            { label: 'Experts Dédiés', value: '15+' },
          ]
        },
        faqContent: [
          {
            category: 'Général',
            question: 'Quels sont vos horaires d\'ouverture ?',
            answer: 'Nous sommes ouverts du lundi au samedi, de 8h30 à 18h30. Notre équipe de support en ligne est également disponible pour répondre à vos questions via le chat.'
          },
          {
            category: 'Général',
            question: 'Où se trouve votre agence ?',
            answer: 'Notre agence principale est située à Touba Khaira, Sénégal. Vous pouvez nous trouver facilement sur Google Maps.'
          },
          {
            category: 'Impression',
            question: 'Quels types de supports d\'impression proposez-vous ?',
            answer: 'Nous proposons une large gamme de supports : cartes de visite, flyers, dépliants, affiches grand format, bâches, autocollants, et bien plus encore.'
          },
          {
            category: 'Impression',
            question: 'Quel est le délai moyen pour une commande d\'impression ?',
            answer: 'Le délai varie selon la complexité et la quantité. En général, les petites commandes sont prêtes en 24-48h, tandis que les projets plus importants peuvent prendre 3 à 5 jours ouvrables.'
          },
          {
            category: 'Digital',
            question: 'Proposez-vous la création de sites web ?',
            answer: 'Oui, nous créons des sites vitrines, des boutiques en ligne (e-commerce) et des applications web sur mesure adaptées à vos besoins spécifiques.'
          },
          {
            category: 'Digital',
            question: 'Gérez-vous les réseaux sociaux pour les entreprises ?',
            answer: 'Absolument. Nous proposons des services de community management pour booster votre présence sur Facebook, Instagram et LinkedIn.'
          },
          {
            category: 'Paiement',
            question: 'Quels sont les modes de paiement acceptés ?',
            answer: 'Nous acceptons les paiements en espèces à l\'agence, ainsi que les transferts via Orange Money, Wave et Free Money pour plus de commodité.'
          },
          {
            category: 'Paiement',
            question: 'Dois-je payer la totalité à la commande ?',
            answer: 'Pour la plupart des projets, nous demandons un acompte de 50% à la commande et le solde à la livraison ou à la fin du projet.'
          }
        ],
        termsContent: [
          {
            title: 'Acceptation des Conditions',
            content: 'En accédant à ce site web et en utilisant nos services, vous acceptez d\'être lié par les présentes conditions d\'utilisation, toutes les lois et réglementations applicables, et acceptez que vous êtes responsable du respect de toutes les lois locales applicables.'
          },
          {
            title: 'Utilisation des Services',
            content: 'Nos services de communication, d\'impression et de développement numérique sont fournis pour un usage professionnel et personnel légal. Toute utilisation abusive ou frauduleuse de nos services entraînera la résiliation immédiate de votre accès.'
          },
          {
            title: 'Propriété Intellectuelle',
            content: 'Tous les contenus présents sur ce site, y compris les textes, graphiques, logos, icônes et images, sont la propriété exclusive d\'Acom Technologie ou de ses fournisseurs de contenu et sont protégés par les lois internationales sur le droit d\'auteur.'
          },
          {
            title: 'Limitation de Responsabilité',
            content: 'Acom Technologie ne pourra être tenu responsable des dommages directs, indirects, consécutifs ou spéciaux résultant de l\'utilisation ou de l\'impossibilité d\'utiliser nos services, même si nous avons été informés de la possibilité de tels dommages.'
          }
        ],
        privacyContent: [
          {
            title: 'Collecte des Données',
            content: 'Nous collectons les informations que vous nous fournissez directement, notamment votre nom, adresse e-mail, numéro de téléphone et détails de commande, afin de traiter vos demandes et d\'améliorer nos services.'
          },
          {
            title: 'Utilisation des Données',
            content: 'Vos données sont utilisées pour traiter vos commandes, communiquer avec vous sur l\'état de vos projets, et vous envoyer des informations pertinentes sur nos services si vous y avez consenti.'
          },
          {
            title: 'Sécurité des Données',
            content: 'Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, perte ou destruction.'
          },
          {
            title: 'Vos Droits',
            content: 'Vous avez le droit d\'accéder à vos données personnelles, de les rectifier ou de demander leur suppression à tout moment. Contactez-nous pour exercer ces droits.'
          }
        ]
      };

      const dataToSave = {
        ...defaultSettings,
        config: {
          primaryColor: defaultSettings.primaryColor
        }
      };

      await db.settings.save('global', dataToSave);
      setSettings(defaultSettings);
      setNotification({ type: 'success', message: 'Paramètres réinitialisés avec succès !' });
      setTimeout(() => {
        setNotification(null);
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error restoring settings:', error);
      setNotification({ type: 'error', message: 'Erreur lors de la réinitialisation.' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setSaving(false);
      setShowConfirmRestore(false);
    }
  };

  const addSlide = () => {
    if (!settings) return;
    const newSlide: HeroSlide = {
      title: "Nouveau Titre",
      subtitle: "Nouveau sous-titre",
      image: "https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&q=80&w=1200",
      color: "from-primary-900 via-indigo-800 to-primary-600",
      iconName: "Rocket"
    };
    const newIndex = settings.heroSlides.length;
    setSettings({ ...settings, heroSlides: [...settings.heroSlides, newSlide] });
    setCustomColors({ ...customColors, [newIndex]: { from: '#4c1d95', to: '#7c3aed' } });
  };

  const removeSlide = (index: number) => {
    if (!settings) return;
    const newSlides = settings.heroSlides.filter((_, i) => i !== index);
    setSettings({ ...settings, heroSlides: newSlides });
    
    // Re-index custom colors
    const newCustom: { [key: number]: { from: string, to: string } } = {};
    newSlides.forEach((_, i) => {
      const oldIdx = i < index ? i : i + 1;
      newCustom[i] = customColors[oldIdx];
    });
    setCustomColors(newCustom);
  };

  const updateCustomColor = (index: number, type: 'from' | 'to', value: string) => {
    const newCustom = { ...customColors[index], [type]: value };
    setCustomColors({ ...customColors, [index]: newCustom });
    
    const newSlides = [...(settings?.heroSlides || [])];
    newSlides[index].color = `from-[${newCustom.from}] to-[${newCustom.to}]`;
    setSettings(prev => prev ? { ...prev, heroSlides: newSlides } : null);
  };

  if (loading) return (
    <div className="p-12 text-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
      <p className="text-gray-600 mb-4">Chargement des réglages...</p>
      <button 
        onClick={() => { setLoading(true); window.location.reload(); }}
        className="text-sm text-primary hover:underline"
      >
        Réessayer (Recharger la page)
      </button>
    </div>
  );
  if (!settings) return null;

  return (
    <div className="space-y-12 relative pt-8">
      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg font-bold text-white ${
              notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Actions */}
      <div className="flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md py-4 z-30 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <Settings className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-gray-900">Réglages du Site</h2>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowConfirmRestore(true)}
            className="flex items-center px-4 py-2 text-gray-500 hover:text-red-500 font-bold transition-all"
          >
            Réinitialiser
          </button>
          <button
            onClick={handleSave}
            disabled={saving || compressing}
            className="flex items-center px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {(saving || compressing) ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            {compressing ? 'Compression...' : saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmRestore}
        title="Réinitialiser les réglages ?"
        message="Cette action va rétablir tous les réglages par défaut (Bannières, Couleurs, Footer). Cette action est irréversible."
        type="warning"
        onConfirm={handleRestoreDefaults}
        onCancel={() => setShowConfirmRestore(false)}
      />

      {/* Template Colors Section */}
      <section className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center space-x-3 bg-gray-50/50">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-gray-900">Configuration Financière & Couleurs</h3>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <h4 className="text-sm font-bold text-gray-900 flex items-center">
              <Calculator className="w-4 h-4 mr-2 text-primary/40" />
              Taxes & TVA
            </h4>
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Taux de TVA (%)</label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  value={settings.taxRate || 0}
                  onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                  className="w-32 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-lg"
                />
                <span className="text-gray-500 font-medium">% appliqué sur le montant HT</span>
              </div>
              <p className="mt-4 text-xs text-gray-400 italic">Ce taux sera utilisé pour calculer le HT et le TTC dans vos rapports financiers.</p>
            </div>

            {/* Desktop Logo & Link Section */}
            <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-6">
              <div>
                <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Icône "Acom Gestion Desktop"</label>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-indigo-100 flex items-center justify-center overflow-hidden">
                    {settings.desktopLogo ? (
                      <img src={settings.desktopLogo} className="w-full h-full object-cover" alt="Desktop Logo Preview" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 opacity-30">
                        <ImageIcon className="w-8 h-8 text-indigo-600" />
                        <span className="text-[8px] font-black uppercase text-center px-1">Aucun Logo</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-indigo-600/70 mb-4 font-medium leading-relaxed">
                      Ce logo représente l'application Acom Gestion Desktop. Il sera utilisé pour l'icône de raccourci sur le bureau des clients.
                    </p>
                    <div className="flex gap-2">
                      <label className="px-4 py-2 bg-white border border-indigo-200 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-indigo-50 transition-all shadow-sm text-indigo-600">
                        Changer l'icône
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const base64 = await compressImage(file, 512, 512, 1, 'image/png');
                              setSettings({ ...settings, desktopLogo: base64 });
                              toast.success('Icône Desktop mise à jour !');
                            }
                          }}
                        />
                      </label>
                      {settings.desktopLogo && (
                        <button 
                          onClick={() => setSettings({ ...settings, desktopLogo: undefined })}
                          className="px-4 py-2 text-rose-500 text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-all"
                        >
                          Réinitialiser
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-indigo-100">
                <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-3 h-3" />
                    URL de téléchargement (.exe)
                  </div>
                  
                  <label className={`cursor-pointer px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 ${exeUploadProgress !== null ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}>
                    <UploadCloud className="w-3 h-3" />
                    Héberger l'exécutable
                    <input 
                      type="file" 
                      accept=".exe" 
                      className="hidden" 
                      onChange={handleExeUpload}
                      disabled={exeUploadProgress !== null}
                    />
                  </label>
                </label>
                
                {exeUploadProgress !== null && (
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-indigo-600 font-bold mb-1">
                      <span>Upload en cours...</span>
                      <span>{Math.round(exeUploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-indigo-100 rounded-full h-1.5">
                      <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${exeUploadProgress}%` }}></div>
                    </div>
                  </div>
                )}
                
                <input
                  type="url"
                  placeholder="https://votre-stockage.com/acom-gestion-setup.exe"
                  value={settings.desktopDownloadUrl || ''}
                  onChange={(e) => setSettings({ ...settings, desktopDownloadUrl: e.target.value })}
                  disabled={exeUploadProgress !== null}
                  className="w-full px-4 py-3 rounded-xl border border-indigo-100 outline-none focus:ring-4 focus:ring-indigo-50 bg-white font-mono text-[10px] text-indigo-900 disabled:opacity-50"
                />
                <p className="mt-2 text-[10px] text-gray-400 italic">
                  Lien direct vers l'exécutable Windows. Hébergez le fichier directement ici ou collez un lien. Si vide, le bouton affichera une simulation.
                </p>
              </div>
            </div>

            <h4 className="text-sm font-bold text-gray-900 flex items-center pt-4">
              <Percent className="w-4 h-4 mr-2 text-primary/40" />
              Rémunération Partenaire
            </h4>
            <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100">
              <label className="block text-xs font-black text-indigo-900 uppercase tracking-widest mb-2">Commission Partenaire par défaut (%)</label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  max="100"
                  min="0"
                  value={settings.defaultPartnerCommission || 80}
                  onChange={(e) => setSettings({ ...settings, defaultPartnerCommission: Number(e.target.value) })}
                  className="w-32 px-4 py-3 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-black text-lg text-indigo-900"
                />
                <span className="text-indigo-700 font-bold">% reversé au partenaire par défaut</span>
              </div>
              <p className="mt-4 text-xs text-indigo-600/70 italic font-medium leading-relaxed">
                Ce pourcentage est utilisé automatiquement pour calculer les revenus des nouveaux partenaires et lors des synchronisations automatiques si aucun taux spécifique n'est défini dans le profil du partenaire.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Seuil d'Alerte Caisse (FCFA)</label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  value={settings.cashThreshold || 0}
                  onChange={(e) => setSettings({ ...settings, cashThreshold: Number(e.target.value) })}
                  className="w-48 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-lg"
                />
                <span className="text-gray-500 font-medium">FCFA</span>
              </div>
              <p className="mt-4 text-xs text-gray-400 italic">Une alerte s'affichera sur le tableau de bord si le solde de la caisse descend sous ce montant.</p>
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="text-sm font-bold text-gray-900 flex items-center">
              <Palette className="w-4 h-4 mr-2 text-primary/40" />
              Identité Visuelle
            </h4>
            <div className="max-w-2xl">
              <label className="block text-sm font-bold text-gray-700 mb-4">Couleur Principale</label>
              
              {/* Brand Name */}
              <div className="mb-8">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nom de la Marque / Entreprise</label>
                <input
                  type="text"
                  value={settings.brandName || ''}
                  onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                  placeholder="Ex: Acom Technologie"
                />
              </div>

              {/* Logo Upload */}
              <div className="mb-8">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Logo de l'entreprise</label>
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 relative group">
                    {settings.logoUrl ? (
                      <>
                        <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSettings({ ...settings, logoUrl: '' })}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        {uploading === 'logo' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Uploader une image'}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploading('logo');
                            try {
                              const compressed = await compressImage(file, 800, 800, 0.8);
                              setSettings({ ...settings, logoUrl: compressed });
                            } catch (error) {
                              console.error('Error uploading logo:', error);
                            } finally {
                              setUploading(null);
                            }
                          }}
                        />
                      </label>
                      <p className="text-xs text-gray-400 mt-2">Format recommandé : PNG transparent, max 1Mo.</p>
                    </div>
                    <input
                      type="text"
                      value={settings.logoUrl || ''}
                      onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                      placeholder="Ou coller une URL d'image..."
                    />
                  </div>
                </div>
              </div>

              {/* Preset Primary Colors */}
              <div className="grid grid-cols-5 gap-3 mb-8">
                {PRESET_PRIMARY_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSettings({ ...settings, primaryColor: color.value })}
                    className={`group relative h-10 rounded-xl border-2 transition-all ${
                      settings.primaryColor === color.value ? 'border-primary scale-110 shadow-md z-10' : 'border-transparent hover:border-gray-200'
                    }`}
                    title={color.name}
                  >
                    <div className="absolute inset-1 rounded-lg" style={{ backgroundColor: color.value }} />
                  </button>
                ))}
              </div>

              {/* Custom Primary Color Picker */}
              <div className="flex items-center space-x-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="w-12 h-12 rounded-xl border border-gray-200 overflow-hidden relative flex-shrink-0">
                  <input
                    type="color"
                    value={settings.primaryColor || '#7c3aed'}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="absolute inset-[-5px] w-[calc(100%+10px)] h-[calc(100%+10px)] cursor-pointer"
                  />
                </div>
                <div className="flex-grow">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Couleur Personnalisée</p>
                  <input
                    type="text"
                    value={settings.primaryColor || '#7c3aed'}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="text-sm font-mono text-gray-600 bg-transparent border-none p-0 focus:ring-0 outline-none w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Banner Section */}
      <section className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-3">
            <Layout className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-gray-900">Bannière d'accueil (Slides)</h3>
          </div>
          <button
            onClick={addSlide}
            className="flex items-center px-4 py-2 bg-white text-primary border border-primary/10 rounded-xl text-sm font-bold hover:bg-primary/5 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une slide
          </button>
        </div>

        <div className="p-6 space-y-8">
          {settings.heroSlides.map((slide, index) => (
            <div key={index} className="p-6 rounded-2xl border border-gray-100 bg-gray-50/30 relative group">
              <button
                onClick={() => removeSlide(index)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Titre</label>
                    <input
                      type="text"
                      value={slide.title}
                      onChange={e => {
                        const newSlides = [...settings.heroSlides];
                        newSlides[index].title = e.target.value;
                        setSettings({ ...settings, heroSlides: newSlides });
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sous-titre</label>
                    <textarea
                      value={slide.subtitle}
                      onChange={e => {
                        const newSlides = [...settings.heroSlides];
                        newSlides[index].subtitle = e.target.value;
                        setSettings({ ...settings, heroSlides: newSlides });
                      }}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Badge (Optionnel)</label>
                      <input
                        type="text"
                        value={slide.badge || ''}
                        onChange={e => {
                          const newSlides = [...settings.heroSlides];
                          newSlides[index].badge = e.target.value;
                          setSettings({ ...settings, heroSlides: newSlides });
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="ex: PROMO"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Icône (Lucide Name)</label>
                      <input
                        type="text"
                        value={slide.iconName}
                        onChange={e => {
                          const newSlides = [...settings.heroSlides];
                          newSlides[index].iconName = e.target.value;
                          setSettings({ ...settings, heroSlides: newSlides });
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Palette, Rocket, Sparkles..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Couleur de la bannière (Palette & Dégradé)</label>
                    
                    {/* Preset Gradients */}
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-6">
                      {PRESET_GRADIENTS.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => {
                            const newSlides = [...settings.heroSlides];
                            newSlides[index].color = preset.value;
                            setSettings({ ...settings, heroSlides: newSlides });
                          }}
                          className={`group relative h-8 rounded-lg overflow-hidden border-2 transition-all ${
                            slide.color === preset.value ? 'border-primary scale-110 shadow-md z-10' : 'border-transparent hover:border-primary/10'
                          }`}
                          title={preset.name}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${preset.value}`} />
                          {slide.color === preset.value && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Custom Gradient Picker */}
                    <div className="p-4 rounded-xl bg-white border border-gray-100 space-y-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Option Dégradée Personnalisée</p>
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg border border-gray-200 overflow-hidden relative">
                            <input
                              type="color"
                              value={customColors[index]?.from || '#8e008e'}
                              onChange={(e) => updateCustomColor(index, 'from', e.target.value)}
                              className="absolute inset-[-5px] w-[calc(100%+10px)] h-[calc(100%+10px)] cursor-pointer"
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-500">Début</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg border border-gray-200 overflow-hidden relative">
                            <input
                              type="color"
                              value={customColors[index]?.to || '#ff00ff'}
                              onChange={(e) => updateCustomColor(index, 'to', e.target.value)}
                              className="absolute inset-[-5px] w-[calc(100%+10px)] h-[calc(100%+10px)] cursor-pointer"
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-500">Fin</span>
                        </div>
                        <div className="flex-grow h-8 rounded-lg border border-gray-100 overflow-hidden">
                          <div 
                            className="w-full h-full" 
                            style={{ background: `linear-gradient(to bottom right, ${customColors[index]?.from || '#8e008e'}, ${customColors[index]?.to || '#ff00ff'})` }} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Code Tailwind (Avancé)</label>
                      <input
                        type="text"
                        value={slide.color}
                        onChange={e => {
                          const newSlides = [...settings.heroSlides];
                          newSlides[index].color = e.target.value;
                          setSettings({ ...settings, heroSlides: newSlides });
                        }}
                        className="w-full px-4 py-2 rounded-lg border border-gray-100 bg-gray-50/50 outline-none font-mono text-[10px] text-gray-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Image de fond</label>
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 group-hover:border-primary/20 transition-all">
                    {slide.image ? (
                      <OptimizedImage src={slide.image} alt="" width={400} className="w-full h-full object-contain" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer bg-white text-gray-900 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
                        {uploading === index ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Changer l\'image'}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={e => e.target.files?.[0] && handleImageUpload(index, e.target.files[0])}
                        />
                      </label>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={slide.image}
                    onChange={e => {
                      const newSlides = [...settings.heroSlides];
                      newSlides[index].image = e.target.value;
                      setSettings({ ...settings, heroSlides: newSlides });
                    }}
                    placeholder="Ou coller une URL d'image..."
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Page Content Editor Section */}
      <section className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-gray-900">Édition du Contenu des Pages</h3>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto">
            {(['about', 'faq', 'terms', 'privacy', 'home_sections', 'portfolio', 'contact'] as const).map((page) => (
              <button
                key={page}
                onClick={() => setActivePageEdit(page)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activePageEdit === page
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {page === 'about' ? 'À propos' : 
                 page === 'faq' ? 'FAQ' : 
                 page === 'terms' ? 'Conditions' : 
                 page === 'privacy' ? 'Confidentialité' : 
                 page === 'portfolio' ? 'Portfolio' :
                 page === 'contact' ? 'Contact' : 'Accueil'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8">
          {activePageEdit === 'about' && settings.aboutContent && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Titre Hero</label>
                  <input
                    type="text"
                    value={settings.aboutContent.heroTitle}
                    onChange={e => setSettings({
                      ...settings,
                      aboutContent: { ...settings.aboutContent!, heroTitle: e.target.value }
                    })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sous-titre Hero</label>
                  <textarea
                    value={settings.aboutContent.heroSubtitle}
                    onChange={e => setSettings({
                      ...settings,
                      aboutContent: { ...settings.aboutContent!, heroSubtitle: e.target.value }
                    })}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Titre Mission</label>
                  <input
                    type="text"
                    value={settings.aboutContent.missionTitle}
                    onChange={e => setSettings({
                      ...settings,
                      aboutContent: { ...settings.aboutContent!, missionTitle: e.target.value }
                    })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description Mission</label>
                  <textarea
                    value={settings.aboutContent.missionDescription}
                    onChange={e => setSettings({
                      ...settings,
                      aboutContent: { ...settings.aboutContent!, missionDescription: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Points Clés Mission</label>
                <div className="space-y-3">
                  {settings.aboutContent.missionPoints.map((point, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={point}
                        onChange={e => {
                          const newPoints = [...settings.aboutContent!.missionPoints];
                          newPoints[idx] = e.target.value;
                          setSettings({
                            ...settings,
                            aboutContent: { ...settings.aboutContent!, missionPoints: newPoints }
                          });
                        }}
                        className="flex-grow px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                      <button
                        onClick={() => {
                          const newPoints = settings.aboutContent!.missionPoints.filter((_, i) => i !== idx);
                          setSettings({
                            ...settings,
                            aboutContent: { ...settings.aboutContent!, missionPoints: newPoints }
                          });
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      aboutContent: {
                        ...settings.aboutContent!,
                        missionPoints: [...settings.aboutContent!.missionPoints, 'Nouveau point']
                      }
                    })}
                    className="flex items-center text-xs font-bold text-primary hover:underline"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Ajouter un point
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Statistiques</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {settings.aboutContent.stats.map((stat, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                      <input
                        type="text"
                        value={stat.label}
                        onChange={e => {
                          const newStats = [...settings.aboutContent!.stats];
                          newStats[idx].label = e.target.value;
                          setSettings({
                            ...settings,
                            aboutContent: { ...settings.aboutContent!, stats: newStats }
                          });
                        }}
                        placeholder="Label"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={stat.value}
                        onChange={e => {
                          const newStats = [...settings.aboutContent!.stats];
                          newStats[idx].value = e.target.value;
                          setSettings({
                            ...settings,
                            aboutContent: { ...settings.aboutContent!, stats: newStats }
                          });
                        }}
                        placeholder="Valeur"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activePageEdit === 'faq' && settings.faqContent && (
            <div className="space-y-6">
              {settings.faqContent.map((faq, idx) => (
                <div key={idx} className="p-6 rounded-2xl border border-gray-100 bg-gray-50/30 relative group">
                  <button
                    onClick={() => {
                      const newFaq = settings.faqContent!.filter((_, i) => i !== idx);
                      setSettings({ ...settings, faqContent: newFaq });
                    }}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Question</label>
                        <input
                          type="text"
                          value={faq.question}
                          onChange={e => {
                            const newFaq = [...settings.faqContent!];
                            newFaq[idx].question = e.target.value;
                            setSettings({ ...settings, faqContent: newFaq });
                          }}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Réponse</label>
                        <textarea
                          value={faq.answer}
                          onChange={e => {
                            const newFaq = [...settings.faqContent!];
                            newFaq[idx].answer = e.target.value;
                            setSettings({ ...settings, faqContent: newFaq });
                          }}
                          rows={3}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Catégorie</label>
                      <select
                        value={faq.category}
                        onChange={e => {
                          const newFaq = [...settings.faqContent!];
                          newFaq[idx].category = e.target.value;
                          setSettings({ ...settings, faqContent: newFaq });
                        }}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                      >
                        <option value="Général">Général</option>
                        <option value="Impression">Impression</option>
                        <option value="Digital">Digital</option>
                        <option value="Paiement">Paiement</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setSettings({
                  ...settings,
                  faqContent: [...(settings.faqContent || []), { question: 'Nouvelle question', answer: 'Nouvelle réponse', category: 'Général' }]
                })}
                className="flex items-center px-6 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-primary hover:border-primary/20 transition-all w-full justify-center font-bold"
              >
                <Plus className="w-5 h-5 mr-2" /> Ajouter une question
              </button>
            </div>
          )}

          {(activePageEdit === 'terms' || activePageEdit === 'privacy') && (
            <div className="space-y-6">
              {(activePageEdit === 'terms' ? settings.termsContent : settings.privacyContent)?.map((section, idx) => (
                <div key={idx} className="p-6 rounded-2xl border border-gray-100 bg-gray-50/30 relative group">
                  <button
                    onClick={() => {
                      const field = activePageEdit === 'terms' ? 'termsContent' : 'privacyContent';
                      const newContent = (settings[field] as PageSection[]).filter((_, i) => i !== idx);
                      setSettings({ ...settings, [field]: newContent });
                    }}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Titre de la section</label>
                      <input
                        type="text"
                        value={section.title}
                        onChange={e => {
                          const field = activePageEdit === 'terms' ? 'termsContent' : 'privacyContent';
                          const newContent = [...(settings[field] as PageSection[])];
                          newContent[idx].title = e.target.value;
                          setSettings({ ...settings, [field]: newContent });
                        }}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contenu</label>
                      <textarea
                        value={section.content}
                        onChange={e => {
                          const field = activePageEdit === 'terms' ? 'termsContent' : 'privacyContent';
                          const newContent = [...(settings[field] as PageSection[])];
                          newContent[idx].content = e.target.value;
                          setSettings({ ...settings, [field]: newContent });
                        }}
                        rows={4}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => {
                  const field = activePageEdit === 'terms' ? 'termsContent' : 'privacyContent';
                  const current = (settings[field] as PageSection[]) || [];
                  setSettings({
                    ...settings,
                    [field]: [...current, { title: 'Nouveau titre', content: 'Nouveau contenu' }]
                  });
                }}
                className="flex items-center px-6 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-primary hover:border-primary/20 transition-all w-full justify-center font-bold"
              >
                <Plus className="w-5 h-5 mr-2" /> Ajouter une section
              </button>
            </div>
          )}
          {activePageEdit === 'home_sections' && (
            <div className="space-y-12">
              {/* Stats Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-gray-900">Section Statistiques</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {settings.statsSection?.map((stat, idx) => (
                    <div key={idx} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Label</label>
                          <input
                            type="text"
                            value={stat.label}
                            onChange={e => {
                              const newStats = [...(settings.statsSection || [])];
                              newStats[idx].label = e.target.value;
                              setSettings({ ...settings, statsSection: newStats });
                            }}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Valeur</label>
                          <input
                            type="text"
                            value={stat.value}
                            onChange={e => {
                              const newStats = [...(settings.statsSection || [])];
                              newStats[idx].value = e.target.value;
                              setSettings({ ...settings, statsSection: newStats });
                            }}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Icône (Lucide)</label>
                        <input
                          type="text"
                          value={stat.iconName}
                          onChange={e => {
                            const newStats = [...(settings.statsSection || [])];
                            newStats[idx].iconName = e.target.value;
                            setSettings({ ...settings, statsSection: newStats });
                          }}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Why Us Section */}
              <div className="space-y-6 pt-8 border-t border-gray-100">
                <h4 className="text-lg font-bold text-gray-900">Section "Pourquoi Nous ?"</h4>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Titre de la Section</label>
                      <input
                        type="text"
                        value={settings.whyUsSection?.title || ''}
                        onChange={e => setSettings({ ...settings, whyUsSection: { ...settings.whyUsSection!, title: e.target.value } })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Image de la Section</label>
                      <div className="flex items-center space-x-4">
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 group">
                          {settings.whyUsSection?.image ? (
                            <OptimizedImage src={settings.whyUsSection.image} alt="Preview" width={400} className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ImageIcon className="w-8 h-8" />
                            </div>
                          )}
                          {uploadingWhyUs && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                          )}
                          <label className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center cursor-pointer transition-all">
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={e => e.target.files?.[0] && handleWhyUsImageUpload(e.target.files[0])}
                            />
                            <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </label>
                        </div>
                        <div className="flex-grow">
                          <input
                            type="text"
                            value={settings.whyUsSection?.image || ''}
                            onChange={e => setSettings({ ...settings, whyUsSection: { ...settings.whyUsSection!, image: e.target.value } })}
                            placeholder="URL de l'image..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                          />
                          <p className="mt-2 text-[10px] text-gray-400">Cliquez sur l'aperçu pour uploader ou collez une URL.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {settings.whyUsSection?.points.map((point, idx) => (
                      <div key={idx} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-4">
                        <p className="text-xs font-bold text-primary uppercase">Point {idx + 1}</p>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Titre</label>
                          <input
                            type="text"
                            value={point.title}
                            onChange={e => {
                              const newPoints = [...(settings.whyUsSection?.points || [])];
                              newPoints[idx].title = e.target.value;
                              setSettings({ ...settings, whyUsSection: { ...settings.whyUsSection!, points: newPoints } });
                            }}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Description</label>
                          <textarea
                            value={point.description}
                            onChange={e => {
                              const newPoints = [...(settings.whyUsSection?.points || [])];
                              newPoints[idx].description = e.target.value;
                              setSettings({ ...settings, whyUsSection: { ...settings.whyUsSection!, points: newPoints } });
                            }}
                            rows={3}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Icône (Lucide)</label>
                          <input
                            type="text"
                            value={point.iconName}
                            onChange={e => {
                              const newPoints = [...(settings.whyUsSection?.points || [])];
                              newPoints[idx].iconName = e.target.value;
                              setSettings({ ...settings, whyUsSection: { ...settings.whyUsSection!, points: newPoints } });
                            }}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="space-y-6 pt-8 border-t border-gray-100">
                <h4 className="text-lg font-bold text-gray-900">Section Appel à l'Action (CTA)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Titre Principal</label>
                    <input
                      type="text"
                      value={settings.ctaSection?.title || ''}
                      onChange={e => setSettings({ ...settings, ctaSection: { ...settings.ctaSection!, title: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Sous-titre (Italique)</label>
                    <input
                      type="text"
                      value={settings.ctaSection?.subtitle || ''}
                      onChange={e => setSettings({ ...settings, ctaSection: { ...settings.ctaSection!, subtitle: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-4">
                    <p className="text-xs font-bold text-primary uppercase">Bouton Principal</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Texte</label>
                        <input
                          type="text"
                          value={settings.ctaSection?.primaryButtonText || ''}
                          onChange={e => setSettings({ ...settings, ctaSection: { ...settings.ctaSection!, primaryButtonText: e.target.value } })}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Lien</label>
                        <input
                          type="text"
                          value={settings.ctaSection?.primaryButtonLink || ''}
                          onChange={e => setSettings({ ...settings, ctaSection: { ...settings.ctaSection!, primaryButtonLink: e.target.value } })}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-4">
                    <p className="text-xs font-bold text-primary uppercase">Bouton Secondaire</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Texte</label>
                        <input
                          type="text"
                          value={settings.ctaSection?.secondaryButtonText || ''}
                          onChange={e => setSettings({ ...settings, ctaSection: { ...settings.ctaSection!, secondaryButtonText: e.target.value } })}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Lien</label>
                        <input
                          type="text"
                          value={settings.ctaSection?.secondaryButtonLink || ''}
                          onChange={e => setSettings({ ...settings, ctaSection: { ...settings.ctaSection!, secondaryButtonLink: e.target.value } })}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expertise Section */}
              <div className="space-y-6 pt-8 border-t border-gray-100">
                <h4 className="text-lg font-bold text-gray-900">Section Une Expertise, Deux Univers</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Titre (Partie 1)</label>
                    <input
                      type="text"
                      value={settings.expertiseSection?.titlePart1 || ''}
                      onChange={e => setSettings({ ...settings, expertiseSection: { ...settings.expertiseSection!, titlePart1: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Titre (Partie 2 - Accent)</label>
                    <input
                      type="text"
                      value={settings.expertiseSection?.titlePart2 || ''}
                      onChange={e => setSettings({ ...settings, expertiseSection: { ...settings.expertiseSection!, titlePart2: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Sous-titre / Description</label>
                    <textarea
                      value={settings.expertiseSection?.subtitle || ''}
                      onChange={e => setSettings({ ...settings, expertiseSection: { ...settings.expertiseSection!, subtitle: e.target.value } })}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Universes */}
                <div className="flex flex-col gap-8 mt-8">
                  {settings.expertiseSection?.universes && settings.expertiseSection.universes.length >= 2 && (
                    <>
                      {/* Univers 1 */}
                      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                        <div className="flex justify-between items-center mb-4">
                          <h5 className="font-bold text-gray-900 border-b-2 border-primary pb-1 inline-block">Partie 1</h5>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Titre (Partie 1)</label>
                            <input
                              type="text"
                              value={settings.expertiseSection.universes[0].title}
                              onChange={e => {
                                const newUniverses = [...(settings.expertiseSection?.universes || [])];
                                newUniverses[0] = { ...newUniverses[0], title: e.target.value };
                                setSettings({ ...settings, expertiseSection: { ...settings.expertiseSection!, universes: newUniverses } });
                              }}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Couleur thématique</label>
                            <div className="flex items-center space-x-3">
                              <input
                                type="color"
                                value={settings.expertiseSection.universes[0].baseColor || '#8e008e'}
                                onChange={e => {
                                  const newUniverses = [...(settings.expertiseSection?.universes || [])];
                                  newUniverses[0] = { ...newUniverses[0], baseColor: e.target.value };
                                  setSettings({ ...settings, expertiseSection: { ...settings.expertiseSection!, universes: newUniverses } });
                                }}
                                className="h-10 w-14 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={settings.expertiseSection.universes[0].baseColor || '#8e008e'}
                                onChange={e => {
                                  const newUniverses = [...(settings.expertiseSection?.universes || [])];
                                  newUniverses[0] = { ...newUniverses[0], baseColor: e.target.value };
                                  setSettings({ ...settings, expertiseSection: { ...settings.expertiseSection!, universes: newUniverses } });
                                }}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-mono uppercase"
                                placeholder="#000000"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Description</label>
                          <textarea
                            value={settings.expertiseSection.universes[0].description}
                            onChange={e => {
                              const newUniverses = [...(settings.expertiseSection?.universes || [])];
                              newUniverses[0] = { ...newUniverses[0], description: e.target.value };
                              setSettings({ ...settings, expertiseSection: { ...settings.expertiseSection!, universes: newUniverses } });
                            }}
                            rows={3}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none resize-none text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                            La liste des caractéristiques (séparées par des virgules)
                          </label>
                          <textarea
                            value={settings.expertiseSection.universes[0].features.join(', ')}
                            onChange={e => {
                              const newUniverses = [...(settings.expertiseSection?.universes || [])];
                              newUniverses[0] = { ...newUniverses[0], features: e.target.value.split(',').map(f => f.trim()).filter(Boolean) };
                              setSettings({ ...settings, expertiseSection: { ...settings.expertiseSection!, universes: newUniverses } });
                            }}
                            rows={3}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none resize-none text-sm"
                            placeholder="Caractéristique 1, Caractéristique 2, Caractéristique 3"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Joindre image (Partie 1)</label>
                          <div className="flex items-center space-x-4">
                            {settings.expertiseSection.universes[0].image && (
                              <img src={settings.expertiseSection.universes[0].image} alt="Univers 1" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
                            )}
                            <label className="cursor-pointer bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-50 flex items-center transition-colors">
                              <ImageIcon className="w-4 h-4 mr-2" />
                              {uploading === 'expertise_0' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Changer l\'image'}
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async e => {
                                  if (e.target.files && e.target.files[0]) {
                                    await handleExpertiseImageUpload(0, e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 mt-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Texte du lien</label>
                            <input
                              type="text"
                              value={settings.expertiseSection.universes[0].linkText}
                              onChange={e => {
                                const newUniverses = [...(settings.expertiseSection?.universes || [])];
                                newUniverses[0] = { ...newUniverses[0], linkText: e.target.value };
                                setSettings({ ...settings, expertiseSection: { ...settings.expertiseSection!, universes: newUniverses } });
                              }}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">URL du lien</label>
                            <input
                              type="text"
                              value={settings.expertiseSection.universes[0].linkUrl}
                              onChange={e => {
                                const newUniverses = [...(settings.expertiseSection?.universes || [])];
                                newUniverses[0] = { ...newUniverses[0], linkUrl: e.target.value };
                                setSettings({ ...settings, expertiseSection: { ...settings.expertiseSection!, universes: newUniverses } });
                              }}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Univers 2 */}
                      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                        <div className="flex justify-between items-center mb-4">
                          <h5 className="font-bold text-gray-900 border-b-2 border-primary pb-1 inline-block">Partie 2</h5>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Titre (Partie 2)</label>
                            <input
                              type="text"
                              value={settings.expertiseSection.universes[1].title}
                              onChange={e => {
                                const newUniverses = [...(settings.expertiseSection?.universes || [])];
                                newUniverses[1] = { ...newUniverses[1], title: e.target.value };
                                setSettings({ ...settings, expertiseSection: { ...settings.expertiseSection!, universes: newUniverses } });
                              }}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Couleur thématique</label>
                            <div className="flex items-center space-x-3">
                              <input
                                type="color"
                                value={settings.expertiseSection.universes[1].baseColor || '#10b981'}
                                onChange={e => {
                                  const newUniverses = [...(settings.expertiseSection?.universes || [])];
                                  newUniverses[1] = { ...newUniverses[1], baseColor: e.target.value };
                                  setSettings({ ...settings, expertiseSection: { ...settings.expertiseSection!, universes: newUniverses } });
                                }}
                                className="h-10 w-14 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={settings.expertiseSection.universes[1].baseColor || '#10b981'}
                                onChange={e => {
                                  const newUniverses = [...(settings.expertiseSection?.universes || [])];
                                  newUniverses[1] = { ...newUniverses[1], baseColor: e.target.value };
                                  setSettings({ ...settings, expertiseSection: { ...settings.expertiseSection!, universes: newUniverses } });
                                }}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-mono uppercase"
                                placeholder="#000000"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Description</label>
                          <textarea
                            value={settings.expertiseSection.universes[1].description}
                            onChange={e => {
                              const newUniverses = [...(settings.expertiseSection?.universes || [])];
                              newUniverses[1] = { ...newUniverses[1], description: e.target.value };
                              setSettings({ ...settings, expertiseSection: { ...settings.expertiseSection!, universes: newUniverses } });
                            }}
                            rows={3}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none resize-none text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                            La liste des caractéristiques (séparées par des virgules)
                          </label>
                          <textarea
                            value={settings.expertiseSection.universes[1].features.join(', ')}
                            onChange={e => {
                              const newUniverses = [...(settings.expertiseSection?.universes || [])];
                              newUniverses[1] = { ...newUniverses[1], features: e.target.value.split(',').map(f => f.trim()).filter(Boolean) };
                              setSettings({ ...settings, expertiseSection: { ...settings.expertiseSection!, universes: newUniverses } });
                            }}
                            rows={3}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none resize-none text-sm"
                            placeholder="Caractéristique 1, Caractéristique 2, Caractéristique 3"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Joindre image (Partie 2)</label>
                          <div className="flex items-center space-x-4">
                            {settings.expertiseSection.universes[1].image && (
                              <img src={settings.expertiseSection.universes[1].image} alt="Univers 2" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
                            )}
                            <label className="cursor-pointer bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-50 flex items-center transition-colors">
                              <ImageIcon className="w-4 h-4 mr-2" />
                              {uploading === 'expertise_1' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Changer l\'image'}
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async e => {
                                  if (e.target.files && e.target.files[0]) {
                                    await handleExpertiseImageUpload(1, e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 mt-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Texte du lien</label>
                            <input
                              type="text"
                              value={settings.expertiseSection.universes[1].linkText}
                              onChange={e => {
                                const newUniverses = [...(settings.expertiseSection?.universes || [])];
                                newUniverses[1] = { ...newUniverses[1], linkText: e.target.value };
                                setSettings({ ...settings, expertiseSection: { ...settings.expertiseSection!, universes: newUniverses } });
                              }}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">URL du lien</label>
                            <input
                              type="text"
                              value={settings.expertiseSection.universes[1].linkUrl}
                              onChange={e => {
                                const newUniverses = [...(settings.expertiseSection?.universes || [])];
                                newUniverses[1] = { ...newUniverses[1], linkUrl: e.target.value };
                                setSettings({ ...settings, expertiseSection: { ...settings.expertiseSection!, universes: newUniverses } });
                              }}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activePageEdit === 'portfolio' && settings.portfolioSection && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Badge</label>
                  <input
                    type="text"
                    value={settings.portfolioSection.badge}
                    onChange={e => setSettings({ ...settings, portfolioSection: { ...settings.portfolioSection!, badge: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Titre (Normal)</label>
                  <input
                    type="text"
                    value={settings.portfolioSection.title}
                    onChange={e => setSettings({ ...settings, portfolioSection: { ...settings.portfolioSection!, title: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Sous-titre (Accentué)</label>
                  <input
                    type="text"
                    value={settings.portfolioSection.subtitle}
                    onChange={e => setSettings({ ...settings, portfolioSection: { ...settings.portfolioSection!, subtitle: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Description</label>
                  <textarea
                    value={settings.portfolioSection.description}
                    onChange={e => setSettings({ ...settings, portfolioSection: { ...settings.portfolioSection!, description: e.target.value } })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 mb-6">Section Appel à l'Action (Bas de page)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Titre CTA</label>
                    <input
                      type="text"
                      value={settings.portfolioSection.ctaTitle}
                      onChange={e => setSettings({ ...settings, portfolioSection: { ...settings.portfolioSection!, ctaTitle: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Sous-titre CTA</label>
                    <input
                      type="text"
                      value={settings.portfolioSection.ctaSubtitle}
                      onChange={e => setSettings({ ...settings, portfolioSection: { ...settings.portfolioSection!, ctaSubtitle: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Texte du Bouton</label>
                    <input
                      type="text"
                      value={settings.portfolioSection.ctaButtonText}
                      onChange={e => setSettings({ ...settings, portfolioSection: { ...settings.portfolioSection!, ctaButtonText: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePageEdit === 'contact' && settings.contactSection && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Titre (Normal)</label>
                  <input
                    type="text"
                    value={settings.contactSection.title}
                    onChange={e => setSettings({ ...settings, contactSection: { ...settings.contactSection!, title: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Titre (Accentué)</label>
                  <input
                    type="text"
                    value={settings.contactSection.titleAccent}
                    onChange={e => setSettings({ ...settings, contactSection: { ...settings.contactSection!, titleAccent: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Description</label>
                  <textarea
                    value={settings.contactSection.description}
                    onChange={e => setSettings({ ...settings, contactSection: { ...settings.contactSection!, description: e.target.value } })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 mb-6">Libellés des Informations</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Libellé Téléphone</label>
                    <input
                      type="text"
                      value={settings.contactSection.phoneLabel}
                      onChange={e => setSettings({ ...settings, contactSection: { ...settings.contactSection!, phoneLabel: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Libellé Email</label>
                    <input
                      type="text"
                      value={settings.contactSection.emailLabel}
                      onChange={e => setSettings({ ...settings, contactSection: { ...settings.contactSection!, emailLabel: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Libellé Localisation</label>
                    <input
                      type="text"
                      value={settings.contactSection.addressLabel}
                      onChange={e => setSettings({ ...settings, contactSection: { ...settings.contactSection!, addressLabel: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 mb-6">Formulaire & Succès</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Titre Succès</label>
                    <input
                      type="text"
                      value={settings.contactSection.successTitle}
                      onChange={e => setSettings({ ...settings, contactSection: { ...settings.contactSection!, successTitle: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Texte du Bouton d'envoi</label>
                    <input
                      type="text"
                      value={settings.contactSection.submitButtonText}
                      onChange={e => setSettings({ ...settings, contactSection: { ...settings.contactSection!, submitButtonText: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Message de Succès</label>
                    <textarea
                      value={settings.contactSection.successMessage}
                      onChange={e => setSettings({ ...settings, contactSection: { ...settings.contactSection!, successMessage: e.target.value } })}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Texte WhatsApp</label>
                    <input
                      type="text"
                      value={settings.contactSection.whatsappText}
                      onChange={e => setSettings({ ...settings, contactSection: { ...settings.contactSection!, whatsappText: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Legal Links Section */}
      <section className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center space-x-3 bg-gray-50/50">
          <Share2 className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-gray-900">Liens de Navigation & Légal</h3>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-gray-900 flex items-center">
              <Layout className="w-4 h-4 mr-2 text-primary/40" />
              Pages de Navigation
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">À propos (URL)</label>
                <input
                  type="text"
                  value={settings.footer.aboutUrl || ''}
                  onChange={e => setSettings({ ...settings, footer: { ...settings.footer, aboutUrl: e.target.value } })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="/about"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">FAQ (URL)</label>
                <input
                  type="text"
                  value={settings.footer.faqUrl || ''}
                  onChange={e => setSettings({ ...settings, footer: { ...settings.footer, faqUrl: e.target.value } })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="/faq"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-bold text-gray-900 flex items-center">
              <Info className="w-4 h-4 mr-2 text-primary/40" />
              Légal & Copyright
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Conditions d'utilisation (URL)</label>
                <input
                  type="text"
                  value={settings.footer.termsUrl || ''}
                  onChange={e => setSettings({ ...settings, footer: { ...settings.footer, termsUrl: e.target.value } })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="/terms"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Politique de confidentialité (URL)</label>
                <input
                  type="text"
                  value={settings.footer.privacyUrl || ''}
                  onChange={e => setSettings({ ...settings, footer: { ...settings.footer, privacyUrl: e.target.value } })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="/privacy"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Texte de Copyright</label>
                <input
                  type="text"
                  value={settings.footer.copyrightText || ''}
                  onChange={e => setSettings({ ...settings, footer: { ...settings.footer, copyrightText: e.target.value } })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="© 2026 Acom Technologie. Tous droits réservés."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <section className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center space-x-3 bg-gray-50/50">
          <Info className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-gray-900">Informations du Pied de Page</h3>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-gray-900 flex items-center">
              <Layout className="w-4 h-4 mr-2 text-primary/40" />
              Général
            </h4>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description courte</label>
              <textarea
                value={settings.footer.description}
                onChange={e => setSettings({ ...settings, footer: { ...settings.footer, description: e.target.value } })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Adresse</label>
              <input
                type="text"
                value={settings.footer.address}
                onChange={e => setSettings({ ...settings, footer: { ...settings.footer, address: e.target.value } })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Téléphone</label>
                <input
                  type="text"
                  value={settings.footer.phone}
                  onChange={e => setSettings({ ...settings, footer: { ...settings.footer, phone: e.target.value } })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  value={settings.footer.email}
                  onChange={e => setSettings({ ...settings, footer: { ...settings.footer, email: e.target.value } })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-bold text-gray-900 flex items-center">
              <Share2 className="w-4 h-4 mr-2 text-primary/40" />
              Réseaux Sociaux
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Facebook URL</label>
                <input
                  type="text"
                  value={settings.footer.facebook}
                  onChange={e => setSettings({ ...settings, footer: { ...settings.footer, facebook: e.target.value } })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Instagram URL</label>
                <input
                  type="text"
                  value={settings.footer.instagram}
                  onChange={e => setSettings({ ...settings, footer: { ...settings.footer, instagram: e.target.value } })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">LinkedIn URL</label>
                <input
                  type="text"
                  value={settings.footer.linkedin}
                  onChange={e => setSettings({ ...settings, footer: { ...settings.footer, linkedin: e.target.value } })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Twitter URL</label>
                <input
                  type="text"
                  value={settings.footer.twitter}
                  onChange={e => setSettings({ ...settings, footer: { ...settings.footer, twitter: e.target.value } })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsManager;
