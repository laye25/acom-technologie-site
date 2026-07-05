import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_STUDENT_DATA } from './StudentAcademicRecord';
import { geminiService } from '../../../services/geminiService';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { dbService } from '../../../services/dbService';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { 
  Store, Package, ShoppingCart, PieChart, Plus, Trash2, Trash2 as Trash,
  Edit2, Search, Loader2, Save, X, TrendingUp, Download, Eye,
  DollarSign, ArrowUpRight, ArrowDownRight, AlertCircle, Info,
  BarChart3, Settings, User, Phone, Mail, MapPin,
  Calculator, Receipt, CreditCard, Smartphone, Banknote,
  Clock, CheckCircle, TrendingDown, ArrowRight, FileText, Truck,
  Wrench, HardHat, Car, Users, GraduationCap, Stethoscope, Calendar, MessageSquare,
  Briefcase, ClipboardList, ClipboardCheck, UserPlus, Building2, Check, Zap, Minus,
  Printer, HardDrive, Database, RefreshCw, Upload, Cpu, Terminal,
  Lock as LockIcon, GitBranch, Github, Monitor, MonitorUp, Rocket,
  Filter, SlidersHorizontal, ArrowUpDown, Tag, Scissors, Palette, ScanLine, PenTool, BookOpen,
  ShieldAlert, Heart, FileCheck, Fingerprint, Sparkles, LayoutDashboard, Key, Bus, Utensils, WashingMachine, ShoppingBag
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, Cell 
} from 'recharts';
import { 
  format, subDays, startOfDay, endOfDay, eachDayOfInterval, 
  startOfYear, eachMonthOfInterval, isSameDay, isSameMonth,
  startOfMonth, endOfMonth, getDay, addDays, startOfWeek, endOfWeek,
  addMonths
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Merchant } from '../../../types';
import { triggerAcomAlert } from '../../../components/AcomAlertEventProvider';
import { sendEmailDirectlyOrViaBackend } from '../../../lib/api';

import { getApiUrl } from '../../../lib/api';
export const StudentRegisterFormModal = ({ 
  student, 
  merchant, 
  onClose, 
  onSave, 
  saving 
}: { 
  student: any; 
  merchant: Merchant; 
  onClose: () => void; 
  onSave: (updated: any) => Promise<void>; 
  saving: boolean; 
}) => {
  const [activeTab, setActiveTab] = useState<'profil' | 'parents' | 'academique' | 'finances' | 'smart'>('profil');
  const [editedStudent, setEditedStudent] = useState<any>(() => {
    const transportVal = student?.hasTransport !== undefined 
      ? !!student.hasTransport 
      : (student?.serviceTransport !== undefined ? !!student.serviceTransport : false);
    
    const canteenVal = student?.hasCanteen !== undefined 
      ? !!student.hasCanteen 
      : (student?.serviceCantine !== undefined ? !!student.serviceCantine : false);

    return {
      ...DEFAULT_STUDENT_DATA,
      schoolName: merchant.name || '',
      schoolCode: `EST-${merchant.id?.substring(0, 4).toUpperCase() || 'DKR'}-2026`,
      matricule: student?.matricule || `MAT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      adminSignName: merchant.name || 'Direction',
      ...student,
      hasTransport: transportVal,
      serviceTransport: transportVal,
      hasCanteen: canteenVal,
      serviceCantine: canteenVal,
    };
  });

  const [cardFlipped, setCardFlipped] = useState(false);
  
  const dbClasses = useLiveQuery(() =>
    db.classes?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const dbClassNames = dbClasses.map((c: any) => c.name).filter(Boolean);

  const standardClasses = [
    // Élémentaire
    'CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2',
    // Moyen / Collège
    '6ème A', '6ème B', '5ème A', '5ème B', '4ème A', '4ème B', '3ème A', '3ème B',
    '6ème', '5ème', '4ème', '3ème',
    // Lycée / Secondaire
    'Seconde L', 'Seconde S', 'Première L1', 'Première L2', 'Première S1', 'Première S2', 'Terminale L1', 'Terminale L2', 'Terminale S1', 'Terminale S2',
    // Maternelle
    'Petite Section', 'Moyenne Section', 'Grande Section',
    // Supérieur / Université
    'Licence 1', 'Licence 2', 'Licence 3',
    'Master 1', 'Master 2',
    'Doctorat 1', 'Doctorat 2', 'Doctorat 3',
    'BTS 1', 'BTS 2',
    'Classes Préparatoires 1', 'Classes Préparatoires 2',
    'Cycle d\'Ingénieur 1', 'Cycle d\'Ingénieur 2', 'Cycle d\'Ingénieur 3'
  ];

  const allClassOptions = Array.from(new Set([...dbClassNames, ...standardClasses]));

  const [showCustomGradeField, setShowCustomGradeField] = useState(() => {
    if (student?.grade && !allClassOptions.includes(student.grade)) {
      return true;
    }
    return false;
  });

  const [ocrScanningDoc, setOcrScanningDoc] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState<string | null>(null);

  const [iaAnalyzing, setIaAnalyzing] = useState(false);
  const [iaFeedback, setIaFeedback] = useState<string | null>(null);

  const [isPayingOnline, setIsPayingOnline] = useState(false);
  const [onlinePayMethod, setOnlinePayMethod] = useState<'wave' | 'om' | 'card'>('wave');
  const [onlinePayNum, setOnlinePayNum] = useState('');
  const [onlineProcessing, setOnlineProcessing] = useState(false);
  
  const [historyLogs, setHistoryLogs] = useState<string[]>(() => {
    const time = new Date().toLocaleTimeString();
    return [
      `[${time}] Dossier d'inscription initialisé - statut: Brouillon`,
      student?.id ? `[${time}] Chargement des données de l'étudiant existant` : `[${time}] Génération d'une nouvelle clé d'accès ERP`,
    ];
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSignDrawing, setIsSignDrawing] = useState(false);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setHistoryLogs(prev => [`[${time}] ${msg}`, ...prev]);
  };

  const updateField = (key: string, value: any) => {
    setEditedStudent((prev: any) => {
      const updated = { ...prev, [key]: value };
      if (key === 'regime') {
        const reg = value;
        let regTransport = false;
        let regCanteen = false;
        let regInternat = false;
        if (reg === 'demi-pension') {
          regCanteen = true;
        } else if (reg === 'interne') {
          regCanteen = true;
          regInternat = true;
        }
        updated.hasTransport = regTransport;
        updated.serviceTransport = regTransport;
        updated.hasCanteen = regCanteen;
        updated.serviceCantine = regCanteen;
        updated.hasInternat = regInternat;
        updated.serviceInternat = regInternat;

        // Auto-populate exact canteen & internat amounts from database based on the chosen class (if any)
        const classId = prev.classId || prev.grade;
        if (merchant?.id && classId) {
          db.merchants.get(merchant.id).then((currentMerchant) => {
            if (currentMerchant && currentMerchant.schoolPricing) {
              const pricing = currentMerchant.schoolPricing;
              const matchedClass = dbClasses.find(c => c.id === classId || c.name === classId);
              let tp: any = null;
              if (matchedClass) {
                const classPricing = pricing.classes?.[matchedClass.id] || pricing.classes?.[matchedClass.name];
                const normalizeStr = (str: string) => {
                    if (!str) return '';
                    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
                };
                const gradeStr = normalizeStr(matchedClass.name);
                let levelKey = '';
                if (gradeStr.includes('mat') || gradeStr.includes('crech') || gradeStr.includes('garde')) {
                  levelKey = 'Maternelle';
                } else if (gradeStr.includes('ci') || gradeStr.includes('cp') || gradeStr.includes('ce1') || gradeStr.includes('ce2') || gradeStr.includes('cm1') || gradeStr.includes('cm2') || gradeStr.includes('elemen') || gradeStr.includes('primai')) {
                  levelKey = 'Primaire';
                } else if (gradeStr.includes('6eme') || gradeStr.includes('5eme') || gradeStr.includes('4eme') || gradeStr.includes('3eme') || gradeStr.includes('moyen') || gradeStr.includes('colleg') || gradeStr.includes('6e') || gradeStr.includes('5e') || gradeStr.includes('4e') || gradeStr.includes('3e')) {
                  levelKey = 'Collège';
                } else if (gradeStr.includes('2nd') || gradeStr.includes('1ere') || gradeStr.includes('tle') || gradeStr.includes('terminale') || gradeStr.includes('lycee') || gradeStr.includes('second')) {
                  levelKey = 'Lycée';
                } else if (gradeStr.includes('sup') || gradeStr.includes('licence') || gradeStr.includes('master') || gradeStr.includes('univer') || gradeStr.includes('pro')) {
                  levelKey = 'Formation Professionnelle';
                }
                const levelPricing = pricing.levels?.[levelKey] || pricing.levels?.[matchedClass.level];
                tp = classPricing || levelPricing;
              }
              if (tp) {
                setEditedStudent((latest: any) => {
                  let cantineVal = '0';
                  let internatVal = '0';
                  let transportVal = '0';
                  if (reg === 'demi-pension') {
                    cantineVal = (tp.annualCanteen || '90000').toString();
                  } else if (reg === 'interne') {
                    cantineVal = (tp.annualCanteenInterne || tp.annualCanteen || '90000').toString();
                    internatVal = (tp.annualInternat || tp.internat || '0').toString();
                  }
                  return {
                    ...latest,
                    annualTransport: transportVal,
                    annualCanteen: cantineVal,
                    annualInternat: internatVal
                  };
                });
              }
            }
          });
        } else {
          updated.annualTransport = '0';
          updated.annualCanteen = regCanteen ? '90000' : '0';
          updated.annualInternat = regInternat ? '0' : '0';
        }
      }
      if (key === 'hasTransport' || key === 'serviceTransport') {
        const val = !!value;
        updated.hasTransport = val;
        updated.serviceTransport = val;
      }
      if (key === 'hasCanteen' || key === 'serviceCantine') {
        const val = !!value;
        updated.hasCanteen = val;
        updated.serviceCantine = val;
      }
      if (key === 'hasInternat' || key === 'serviceInternat') {
        const val = !!value;
        updated.hasInternat = val;
        updated.serviceInternat = val;
      }
      return updated;
    });
  };

  // Autogen matricule
  const handleRegenMatricule = () => {
    const year = new Date().getFullYear();
    const randNum = Math.floor(10000 + Math.random() * 90000);
    const newMat = `MAT-${year}-${randNum}`;
    updateField('matricule', newMat);
    addLog(`Matricule générée automatiquement: ${newMat}`);
    toast.success('Matricule générée !');
  };

  // Simulated OCR cloud upload
  const handleSimulateOCR = (docType: string) => {
    setOcrScanningDoc(docType);
    setOcrProgress(0);
    setOcrResult(null);
    addLog(`Simulation d'upload cloud pour le document: ${docType}`);
    
    const interval = setInterval(() => {
      setOcrProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          let rawExtracted = '';
          if (docType === 'birth') {
            rawExtracted = `Extrait de Naissance Num. #9284/DKR. Prénom: ${editedStudent.firstName || 'Non renseigné'}, Nom: ${editedStudent.lastName || 'Non renseigné'}, Sexe: ${editedStudent.gender === 'M' ? 'Masculin' : 'Féminin'}, Nationalité: ${editedStudent.nationality}. Statut: CONFORME.`;
            updateField('docBirthCert', true);
          } else if (docType === 'school') {
            rawExtracted = `Certificat de scolarité valide. Établissement d'origine: ${editedStudent.prevSchoolName || 'Non spécifié'}. Niveau: ${editedStudent.prevSchoolGrade || 'Non spécifié'}.`;
            updateField('docSchoolCert', true);
          } else {
            rawExtracted = `Scan du document complété. Validation intégrité réussie.`;
          }
          setOcrResult(rawExtracted);
          addLog(`Extraction OCR terminée pour ${docType}. Statut de conformité déterminé.`);
          toast.success('Document analysé avec succès par OCR !');
          return 100;
        }
        return prev + 20;
      });
    }, 450);
  };

  // Simulated parent cursive sign
  const handleGenererCursiveSign = () => {
    if (!editedStudent.parentSignName) {
      toast.error("Veuillez d'abord saisir le nom du signataire parent");
      return;
    }
    const signatureText = `Parent: ${editedStudent.parentSignName} - le ${new Date().toLocaleDateString()}`;
    updateField('parentSignature', signatureText);
    addLog(`Signature électronique cursive générée pour le parent d'élève`);
    toast.success('Signature électronique générée !');
  };

  // Simulated admin digital stamp
  const handleAdminStamp = () => {
    const signatureText = `✔️ Certifié Administratif - ${editedStudent.adminSignName} (${editedStudent.adminSignRole})`;
    updateField('adminSignature', signatureText);
    addLog(`Dossier tamponné électroniquement par l'administration scolaires`);
    toast.success('Tampon officiel appliqué !');
  };

  // AI Diagnostic with Gemini
  const handleIaAnalyzeIncomplete = async () => {
    setIaAnalyzing(true);
    setIaFeedback(null);
    addLog('Appel de l\'intelligence artificielle pour l\'audit du dossier...');
    
    try {
      const docList = [
        editedStudent.docBirthCert ? "Extrait de Naissance" : "Extrait de Naissance (MANQUANT)",
        editedStudent.docSchoolCert ? "Certificat de Scolarité" : "Certificat de Scolarité (MANQUANT)",
        editedStudent.docPrevReport ? "Bulletins de notes" : "Bulletins de notes (MANQUANT)",
        editedStudent.docIdentityPhotos ? "Photos d'identité" : "Photos d'identité (MANQUANT)",
        editedStudent.docReceipt ? "Reçu de paiement" : "Reçu de paiement (MANQUANT)",
      ];

      const prompt = `Assume le rôle d'un contrôleur ERP scolaire de scolarité sénégalais très rigoureux.
      Évalue la conformité de ce dossier d'inscription :
      - Élève: ${editedStudent.firstName} ${editedStudent.lastName}
      - Matricule: ${editedStudent.matricule || 'Non spécifié'}
      - Sexe: ${editedStudent.gender === 'M' ? 'Homme' : 'Femme'}
      - Nationalité: ${editedStudent.nationality}
      - Niveau requis: ${editedStudent.grade || 'Non spécifiées'}
      - Moyenne de l'école précédente: ${editedStudent.prevSchoolAverage || 'Inconnue'}/20 (Admis/Redoublant: ${editedStudent.prevSchoolResult})
      - Documents fournis: ${docList.join(', ')}
      - Frais de scolarité d'inscription prévus: ${editedStudent.registrationFee} FCFA (Méthode de règlement: ${editedStudent.paymentMethod}, Réduction: ${editedStudent.hasDiscount === 'oui' ? editedStudent.discountAmount + ' FCFA' : 'Aucune'})
      - Signatures d'authentification: Parent (${editedStudent.parentSignature ? 'Validée' : 'Pas de signature parent'}), Admin (${editedStudent.adminSignature ? 'Validée' : 'Pas de signature administrative'})
      
      Donne tes remarques et ton appréciation en français sous la forme de l'évaluation ERP suivante :
      1. Résumé de conformité globale (avec un score sur 100).
      2. Alertes sur les anomalies graves (Pièces manquantes, débits, signatures, moyenne faible).
      3. Workflow recommandé (ex: Accepter, Mettre en attente, Suspendre).
      Rend l'appréciation synthétique, polie et engageante avec des émojis clairs. Ne mentionne aucun paramètre interne.`;

      const text = await geminiService.generateText(prompt);
      setIaFeedback(text);
      addLog('Audit intelligent du dossier complété.');
      toast.success('Analyse IA achevée !');
    } catch (err) {
      setIaFeedback("⚠️ Diagnostic local de secours : Veillez à finaliser l'émargement parent et l'upload de l'Acte de Naissance.");
      addLog('Échec de la connexion IA de conformité.');
    } finally {
      setIaAnalyzing(false);
    }
  };

  // Mock Online payment integration
  const handleStartOnlinePay = () => {
    setIsPayingOnline(true);
    setOnlinePayNum(editedStudent.parentContact || '');
  };

  const handleSimulateOnlineSuccess = async () => {
    if (!onlinePayNum) {
      toast.error('Veuillez entrer un numéro de téléphone');
      return;
    }
    setOnlineProcessing(true);
    addLog(`Requête de paiement en ligne de ${editedStudent.registrationFee} FCFA initiée via ${onlinePayMethod.toUpperCase()}`);
    
    setTimeout(async () => {
      setOnlineProcessing(false);
      setOnlinePayNum('');
      setIsPayingOnline(false);
      
      const newRef = `TX-${Math.floor(100000 + Math.random() * 900000)}`;
      
      const newPayment = {
        id: crypto.randomUUID(),
        amount: parseFloat(editedStudent.registrationFee) || 25000,
        category: "Frais d'inscription",
        mode: onlinePayMethod,
        date: new Date().toISOString(),
        receiptNumber: newRef,
        details: {
          scolarite: 0,
          transport: 0,
          cantine: 0,
          inscription: parseFloat(editedStudent.registrationFee) || 25000,
          autres: 0
        }
      };

      setEditedStudent((prev: any) => ({
        ...prev,
        stripePaid: true,
        paymentRef: newRef,
        docReceipt: true,
        workflowStatus: 'approved',
        tuitionPayments: [...(prev.tuitionPayments || []), newPayment]
      }));
      
      addLog(`Paiement de scolarité réussi via ${onlinePayMethod.toUpperCase()} | Réf: ${newRef}`);
      toast.success('Paiement reçu en temps réel ! Le reçu a été généré.');

      // Persist to accounting (integrate direct financial transaction logs into sales database)
      try {
        const saleId = uuidv4();
        const saleData = {
          id: saleId,
          merchantId: merchant.id,
          items: [{
            id: uuidv4(),
            name: `Frais d'inscription - Élève ${editedStudent.firstName} ${editedStudent.lastName}`,
            quantity: 1,
            price: parseFloat(editedStudent.registrationFee) || 25000,
            total: parseFloat(editedStudent.registrationFee) || 25000,
          }],
          totalAmount: parseFloat(editedStudent.registrationFee) || 25000,
          paidAmount: parseFloat(editedStudent.registrationFee) || 25000,
          balance: 0,
          payments: [{
            id: uuidv4(),
            method: onlinePayMethod,
            amount: parseFloat(editedStudent.registrationFee) || 25000,
            date: new Date()
          }],
          paymentMethod: onlinePayMethod as any,
          customerName: `${editedStudent.firstName} ${editedStudent.lastName}`,
          customerPhone: editedStudent.parentContact || '',
          createdAt: new Date(),
          processedBy: merchant.ownerId || (merchant as any).owner_id || 'system',
          updatedAt: new Date().toISOString()
        };

        // Integration with global SaaS database sales
        await dbService.merchantSales.save(saleData);
        addLog('Versement financier injecté dans les comptes globaux de comptabilité de l\'établissement.');
      } catch (fErr) {
        console.error('Error logging payment transaction:', fErr);
      }
    }, 2000);
  };

  // Draw signatures tactile mouse triggers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsSignDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSignDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsSignDrawing(false);
    if (canvasRef.current) {
      const base64 = canvasRef.current.toDataURL();
      updateField('parentSignature', base64);
      addLog('Signature tactile capturée par le pavé signatures.');
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0,0, canvas.width, canvas.height);
    updateField('parentSignature', '');
    addLog('Signature tactile parent réinitialisée.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedStudent.firstName || !editedStudent.lastName) {
      toast.error("Veuillez remplir le prénom et le nom de l'élève.");
      return;
    }
    addLog(`Fin de l'enregistrement. Transmission de la fiche d'inscription.`);
    onSave(editedStudent);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-100">
      <motion.div 
        initial={{ opacity: 0, scale: 1, y: 0 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        className="bg-white w-full h-full overflow-hidden flex flex-col"
      >
        {/* Header Ribbon */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/30 text-xs font-mono font-bold tracking-widest uppercase">ERP SCOLAIRE</span>
              <h3 className="text-xl font-black">Fiche d'Inscription Élève — Dossier complet</h3>
            </div>
            <p className="text-[10px] font-mono text-indigo-200 uppercase tracking-widest mt-1">Établissement: {editedStudent.schoolName} ({editedStudent.schoolYear})</p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors shrink-0 border border-white/10 text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Outer Split layout: Left Tab Form | Right Student Live Actions */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0 bg-gray-50/20">
          
          {/* Main Form Left Column */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 flex flex-col space-y-6">
            
            {/* Nav Tabs */}
            <div className="flex space-x-1 p-1 bg-gray-100/80 rounded-2xl overflow-x-auto scrollbar-none shrink-0 border border-black/[0.02]">
              {[
                { id: 'profil', label: '🏫 Éléve & Profil' },
                { id: 'parents', label: '👨👩 Parents & Urgence' },
                { id: 'academique', label: '🎓 Académique & Santé' },
                { id: 'finances', label: '💰 Finances & Pièces' },
                { id: 'smart', label: '🤖 Assistant Intelligent' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap uppercase tracking-wider transition-all ${
                    activeTab === t.id 
                      ? 'bg-primary text-white shadow-md' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Inner Form Panels */}
            <form onSubmit={handleSubmit} className="flex-1 space-y-6 min-h-0">
              
              {/* Tab 1: Identification de l'élève */}
              {activeTab === 'profil' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-500" /> Identité de l'Étudiant
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Prénom(s)</label>
                        <input type="text" required value={editedStudent.firstName} onChange={e => updateField('firstName', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold bg-gray-50/50" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Nom de famille</label>
                        <input type="text" required value={editedStudent.lastName} onChange={e => updateField('lastName', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold bg-gray-50/50" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Sexe</label>
                        <select value={editedStudent.gender} onChange={e => updateField('gender', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold">
                          <option value="M">Masculin</option>
                          <option value="F">Féminin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Date de naissance</label>
                        <input type="date" value={editedStudent.birthDate} onChange={e => updateField('birthDate', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-mono font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Lieu de naissance</label>
                        <input type="text" placeholder="Dakar, Sénégal" value={editedStudent.birthPlace} onChange={e => updateField('birthPlace', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Nationalité</label>
                        <input type="text" value={editedStudent.nationality} onChange={e => updateField('nationality', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Situation matrimoniale</label>
                        <select value={editedStudent.maritalStatus} onChange={e => updateField('maritalStatus', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold">
                          <option value="célibataire">Célibataire</option>
                          <option value="marié">Marié(e)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Numéro d’ID National (NIN)</label>
                        <input type="text" placeholder="Ex: 1 234 1999 4802" value={editedStudent.nationalId} onChange={e => updateField('nationalId', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-mono font-bold" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-500" /> Adresse & Coordonnées de Contact
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Adresse complète</label>
                        <input type="text" placeholder="Parcelles Assainies U24" value={editedStudent.address} onChange={e => updateField('address', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Ville</label>
                        <input type="text" placeholder="Dakar" value={editedStudent.city} onChange={e => updateField('city', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none font-bold" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Quartier</label>
                        <input type="text" value={editedStudent.neighborhood} onChange={e => updateField('neighborhood', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Région</label>
                        <input type="text" value={editedStudent.region} onChange={e => updateField('region', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Pays</label>
                        <input type="text" value={editedStudent.country} onChange={e => updateField('country', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Code Postal</label>
                        <input type="text" value={editedStudent.zipCode} onChange={e => updateField('zipCode', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none font-mono" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-dashed border-gray-100 pt-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Téléphone personnel</label>
                        <input type="tel" placeholder="+221..." value={editedStudent.phone} onChange={e => updateField('phone', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Email</label>
                        <input type="email" placeholder="eleve@ecole.com" value={editedStudent.email} onChange={e => updateField('email', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">WhatsApp éléve</label>
                        <input type="tel" placeholder="+221..." value={editedStudent.whatsApp} onChange={e => updateField('whatsApp', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Parents & Urgence */}
              {activeTab === 'parents' && (
                <div className="space-y-6">
                  {/* Parent principal à contacter en priorité */}
                  <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                          <Phone className="w-4 h-4 text-indigo-600 animate-pulse" /> Parent principal à contacter
                        </h4>
                        <p className="text-[11px] text-slate-600 font-medium">Choisissez le représentant de l'élève qui doit être contacté en priorité par SMS et WhatsApp.</p>
                      </div>
                      
                      <select
                        id="select-edit-primary-parent"
                        value={editedStudent.primaryParentContact || 'father'}
                        onChange={e => {
                          const val = e.target.value;
                          updateField('primaryParentContact', val);
                          
                          // Auto sync standard parentContact
                          let phoneVal = '';
                          if (val === 'father') phoneVal = editedStudent.fatherPhone;
                          else if (val === 'mother') phoneVal = editedStudent.motherPhone;
                          else if (val === 'guardian') phoneVal = editedStudent.guardianPhone;
                          else if (val === 'emergency') phoneVal = editedStudent.emergencyPhone;
                          
                          if (phoneVal) {
                            updateField('parentContact', phoneVal);
                          }
                          addLog(`Parent à contacter en priorité configuré sur : ${val}`);
                        }}
                        className="px-4 py-2.5 bg-white border border-indigo-200 rounded-xl text-xs font-black text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-100/45 min-w-[200px]"
                      >
                        <option value="father">👨 Père ({editedStudent.fatherName || 'Non renseigné'})</option>
                        <option value="mother">👩 Mère ({editedStudent.motherName || 'Non renseigné'})</option>
                        <option value="guardian">👤 Tuteur Légal ({editedStudent.guardianName || 'Non renseigné'})</option>
                        <option value="emergency">🚨 Contact d'urgence ({editedStudent.emergencyName || 'Non renseigné'})</option>
                      </select>
                    </div>
                  </div>

                  {/* Father Container */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" /> Informations concernant le Père
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Nom complet du père</label>
                        <input type="text" value={editedStudent.fatherName} onChange={e => updateField('fatherName', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Profession du père</label>
                        <input type="text" value={editedStudent.fatherProfession} onChange={e => updateField('fatherProfession', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Téléphone père</label>
                        <input type="text" value={editedStudent.fatherPhone} onChange={e => updateField('fatherPhone', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">WhatsApp père</label>
                        <input type="text" value={editedStudent.fatherWhatsApp} onChange={e => updateField('fatherWhatsApp', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Email père</label>
                        <input type="email" value={editedStudent.fatherEmail} onChange={e => updateField('fatherEmail', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Adresse de domicile père</label>
                      <input type="text" value={editedStudent.fatherAddress} onChange={e => updateField('fatherAddress', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                    </div>
                  </div>

                  {/* Mother Container */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
                      <User className="w-4 h-4 text-pink-500" /> Informations concernant la Mère
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Nom complet de la mère</label>
                        <input type="text" value={editedStudent.motherName} onChange={e => updateField('motherName', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Profession de la mère</label>
                        <input type="text" value={editedStudent.motherProfession} onChange={e => updateField('motherProfession', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Téléphone mère</label>
                        <input type="text" value={editedStudent.motherPhone} onChange={e => updateField('motherPhone', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">WhatsApp mère</label>
                        <input type="text" value={editedStudent.motherWhatsApp} onChange={e => updateField('motherWhatsApp', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Email mère</label>
                        <input type="email" value={editedStudent.motherEmail} onChange={e => updateField('motherEmail', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">Adresse de domicile mère <button type="button" onClick={() => updateField('motherAddress', editedStudent.fatherAddress)} className="text-[8px] text-indigo-500 font-mono underline hover:text-indigo-700 ml-2">Copier adresse père</button></label>
                      <input type="text" value={editedStudent.motherAddress} onChange={e => updateField('motherAddress', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                    </div>
                  </div>

                  {/* Legal Guardian (Tuteur Légal) */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
                      <User className="w-4 h-4 text-violet-500" /> Tuteur Légal d'élève alternative
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Nom du tuteur</label>
                        <input type="text" value={editedStudent.guardianName} onChange={e => updateField('guardianName', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Relation avec l'élève</label>
                        <input type="text" placeholder="Ex: Oncle, Tante, Frère ainé" value={editedStudent.guardianRelation} onChange={e => updateField('guardianRelation', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Profession tuteur</label>
                        <input type="text" value={editedStudent.guardianProfession} onChange={e => updateField('guardianProfession', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Téléphone tuteur</label>
                        <input type="text" value={editedStudent.guardianPhone} onChange={e => updateField('guardianPhone', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Email tuteur</label>
                        <input type="email" value={editedStudent.guardianEmail} onChange={e => updateField('guardianEmail', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-red-50/40 p-6 rounded-3xl border border-red-100 shadow-sm space-y-4">
                    <h4 className="text-sm font-black text-rose-950 uppercase tracking-wider border-b border-red-200/50 pb-3 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-600" /> CONTACT D'URGENCE (CRITIQUE)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-rose-700 uppercase tracking-widest mb-1">Nom complet contact</label>
                        <input type="text" value={editedStudent.emergencyName} onChange={e => updateField('emergencyName', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-red-200/40 bg-white outline-none font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-rose-700 uppercase tracking-widest mb-1">Téléphone d'urgence</label>
                        <input type="text" placeholder="+221..." value={editedStudent.emergencyPhone} onChange={e => updateField('emergencyPhone', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-red-200/40 bg-white outline-none font-mono font-black text-red-600" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-rose-700 uppercase tracking-widest mb-1">Lien de parenté</label>
                        <input type="text" placeholder="Ex: Grand-père, Voisin" value={editedStudent.emergencyRelation} onChange={e => updateField('emergencyRelation', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-red-200/40 bg-white outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-rose-700 uppercase tracking-widest mb-1">Adresse contact urgence</label>
                      <input type="text" value={editedStudent.emergencyAddress} onChange={e => updateField('emergencyAddress', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-red-200/40 bg-white outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Académique & Médical */}
              {activeTab === 'academique' && (
                <div className="space-y-6">
                  {/* Academic Requirements */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-indigo-500" /> Informations Académiques Requises
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Classe de l'élève (Pédagogie & Classes)</label>
                        {dbClasses.length === 0 ? (
                          <div className="p-3 bg-red-50 border border-red-100/80 text-red-900 rounded-2xl text-[11px] leading-relaxed">
                            <span className="font-bold flex items-center gap-1.5 text-red-700 mb-1">
                              ⚠️ Aucune classe configurée
                            </span>
                            Veuillez configurer l'onglet <span className="font-bold">Pédagogie & Classes</span>.
                          </div>
                        ) : (
                          <select 
                            required
                            value={dbClasses.find((c: any) => c.name === editedStudent.grade)?.id || ''} 
                            onChange={async (e) => {
                              const val = e.target.value;
                              const matchedClass = dbClasses.find((c: any) => c.id === val);
                              if (matchedClass) {
                                const mapClassLevelToStudentLevel = (classLevel: string) => {
                                  if (!classLevel) return 'Secondaire';
                                  const norm = classLevel.toLowerCase();
                                  if (norm.includes('maternelle')) return 'Maternelle';
                                  if (norm.includes('élémentaire') || norm.includes('primaire') || norm.includes('elementaire')) return 'Élémentaire';
                                  if (norm.includes('moyen') || norm.includes('collège') || norm.includes('college')) return 'Moyen-Orientation';
                                  if (norm.includes('lycée') || norm.includes('secondaire') || norm.includes('lycee')) return 'Secondaire';
                                  if (norm.includes('supérieur') || norm.includes('université') || norm.includes('universitaire') || norm.includes('superieur')) return 'Université';
                                  return 'Secondaire';
                                };
                                const requestedLvl = mapClassLevelToStudentLevel(matchedClass.level);

                                let tp: any = null;

                                // Auto-adopt billing settings fetching latest
                                if (merchant?.id) {
                                    const currentMerchant = await db.merchants.get(merchant.id);
                                    if (currentMerchant && currentMerchant.schoolPricing) {
                                      const pricing = currentMerchant.schoolPricing;
                                      const classPricing = pricing.classes?.[matchedClass.id] || pricing.classes?.[matchedClass.name];
                                      
                                      const normalizeStr = (str: string) => {
                                          if (!str) return '';
                                          return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
                                      };
                                      const gradeStr = normalizeStr(matchedClass.name);
                                      let levelKey = '';
                                      if (gradeStr.includes('mat') || gradeStr.includes('crech') || gradeStr.includes('garde')) {
                                        levelKey = 'Maternelle';
                                      } else if (gradeStr.includes('ci') || gradeStr.includes('cp') || gradeStr.includes('ce1') || gradeStr.includes('ce2') || gradeStr.includes('cm1') || gradeStr.includes('cm2') || gradeStr.includes('elemen') || gradeStr.includes('primai')) {
                                        levelKey = 'Primaire';
                                      } else if (gradeStr.includes('6eme') || gradeStr.includes('5eme') || gradeStr.includes('4eme') || gradeStr.includes('3eme') || gradeStr.includes('moyen') || gradeStr.includes('colleg') || gradeStr.includes('6e') || gradeStr.includes('5e') || gradeStr.includes('4e') || gradeStr.includes('3e')) {
                                        levelKey = 'Collège';
                                      } else if (gradeStr.includes('2nd') || gradeStr.includes('1ere') || gradeStr.includes('tle') || gradeStr.includes('terminale') || gradeStr.includes('lycee') || gradeStr.includes('second')) {
                                        levelKey = 'Lycée';
                                      } else if (gradeStr.includes('sup') || gradeStr.includes('licence') || gradeStr.includes('master') || gradeStr.includes('univer') || gradeStr.includes('pro')) {
                                        levelKey = 'Formation Professionnelle';
                                      }
                                      
                                      const levelPricing = pricing.levels?.[levelKey] || pricing.levels?.[matchedClass.level];
                                      tp = classPricing || levelPricing;
                                    }
                                }
                                
                                setEditedStudent((prev: any) => {
                                  const currentRegime = prev.regime || 'externe';
                                  let regTransport = false;
                                  let regCanteen = false;
                                  let regInternat = false;
                                  if (currentRegime === 'demi-pension') {
                                    regCanteen = true;
                                  } else if (currentRegime === 'interne') {
                                    regCanteen = true;
                                    regInternat = true;
                                  }
                                  
                                  const pricingFields = tp ? {
                                    registrationFee: tp.registrationFee?.toString() || prev.registrationFee,
                                    annualTuition: tp.annualTuition?.toString() || prev.annualTuition,
                                    uniformFee: tp.uniformFee?.toString() || prev.uniformFee,
                                    annualTransport: regTransport ? (tp.annualTransport?.toString() || prev.annualTransport) : '0',
                                    annualCanteen: currentRegime === 'interne' 
                                      ? (tp.annualCanteenInterne || tp.annualCanteen || '90000').toString() 
                                      : (currentRegime === 'demi-pension' ? (tp.annualCanteen || '90000').toString() : '0'),
                                    annualInternat: currentRegime === 'interne' 
                                      ? (tp.annualInternat || tp.internat || '0').toString() 
                                      : '0',
                                    monthsDuration: tp.monthsDuration?.toString() || prev.monthsDuration,
                                    hasDiscount: 'non',
                                    discountAmount: '0'
                                  } : {};

                                  return {
                                    ...prev,
                                    grade: matchedClass.name,
                                    classId: matchedClass.id,
                                    requestedLevel: requestedLvl,
                                    hasTransport: regTransport,
                                    serviceTransport: regTransport,
                                    hasCanteen: regCanteen,
                                    serviceCantine: regCanteen,
                                    hasInternat: regInternat,
                                    serviceInternat: regInternat,
                                    ...pricingFields
                                  };
                                });

                                addLog(`Classe affectée : ${matchedClass.name} - Niveau associé : ${matchedClass.level}`);
                              } else {
                                updateField('grade', '');
                              }
                            }} 
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none font-bold text-xs h-[42px]"
                          >
                            <option value="">Sélectionner une classe...</option>
                            {dbClasses.map((cl: any) => (
                              <option key={cl.id} value={cl.id}>
                                {cl.name} ({cl.level || 'Sans Niveau'})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Niveau d'études (Automatique)</label>
                        <input 
                          type="text" 
                          readOnly 
                          placeholder="Calculé automatiquement par la classe..."
                          value={
                            dbClasses.find((c: any) => c.name === editedStudent.grade)?.level || 'Non attribué'
                          } 
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-100 bg-gray-100/50 text-gray-500 font-bold outline-none text-xs h-[42px] select-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Filière / Série d'études</label>
                        <input type="text" placeholder="Scientifique, Littéraire, Économique" value={editedStudent.filiere} onChange={e => updateField('filiere', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none text-xs h-[42px]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Régime élève</label>
                        <div className="grid grid-cols-3 gap-1">
                          {['externe', 'demi-pension', 'interne'].map((rg) => (
                            <button
                              key={rg}
                              type="button"
                              onClick={() => { updateField('regime', rg); addLog(`Régime de scolarité modifié pour : ${rg}`); }}
                              className={`p-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-center border transition-all ${
                                editedStudent.regime === rg 
                                  ? 'bg-indigo-600 text-white border-indigo-600' 
                                  : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {rg}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Langue principale</label>
                        <input type="text" value={editedStudent.primaryLanguage} onChange={e => updateField('primaryLanguage', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Option(s) choisie(s)</label>
                        <input type="text" placeholder="Latin, Arabe, Dessin, Musique" value={editedStudent.chosenOptions} onChange={e => updateField('chosenOptions', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Previous school background */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-500" /> Établement Précédent & Origine
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Nom de l'école précédente</label>
                        <input type="text" value={editedStudent.prevSchoolName} onChange={e => updateField('prevSchoolName', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Ville de l'établissement</label>
                        <input type="text" value={editedStudent.prevSchoolCity} onChange={e => updateField('prevSchoolCity', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Dernière classe fréquentée</label>
                        <input type="text" value={editedStudent.prevSchoolGrade} onChange={e => updateField('prevSchoolGrade', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Résultat annuel</label>
                        <select value={editedStudent.prevSchoolResult} onChange={e => updateField('prevSchoolResult', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none text-xs font-bold">
                          <option value="admis">Admis</option>
                          <option value="redoublant">Redoublant</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Moyenne trimestrielle générale obtenue</label>
                        <input type="number" step="0.01" placeholder="/20" value={editedStudent.prevSchoolAverage} onChange={e => updateField('prevSchoolAverage', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none font-mono font-bold text-indigo-700" />
                      </div>
                    </div>
                  </div>

                  {/* Medical Background */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
                       <Heart className="w-4 h-4 text-rose-500" /> Dossier Clinique & Données Médicales
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Groupe Sanguin</label>
                        <select value={editedStudent.bloodType} onChange={e => updateField('bloodType', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none font-mono text-xs font-black">
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">A-t-il un handicap / besoin spécifique ?</label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {['oui', 'non'].map(_handi => (
                            <button
                              key={_handi}
                              type="button"
                              onClick={() => { updateField('hasDisability', _handi); addLog(`Statut handicap mis à jour: ${_handi}`); }}
                              className={`py-1.5 rounded-lg text-[9px] font-black uppercase border text-center transition-all ${
                                editedStudent.hasDisability === _handi 
                                  ? 'bg-rose-600 text-white border-rose-600' 
                                  : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {_handi}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Précisions handicap</label>
                        <input type="text" placeholder="Préciser si Oui" disabled={editedStudent.hasDisability !== 'oui'} value={editedStudent.disabilityDetails} onChange={e => updateField('disabilityDetails', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none text-xs disabled:opacity-40" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Allergies connues</label>
                      <input type="text" placeholder="Pénicilline, fruits à coque, pollen, poussière (laisser vide sinon)" value={editedStudent.allergies} onChange={e => updateField('allergies', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Traitement médical lourd en cours</label>
                      <input type="text" placeholder="Ordonnances habituelles, horaires de prise..." value={editedStudent.medicalTreatment} onChange={e => updateField('medicalTreatment', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none text-xs" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Médecin traitant attitré</label>
                        <input type="text" placeholder="Dr. Ndiaye" value={editedStudent.doctorName} onChange={e => updateField('doctorName', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Téléphone médecin</label>
                        <input type="text" placeholder="+221..." value={editedStudent.doctorPhone} onChange={e => updateField('doctorPhone', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none font-mono" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Finances & Documents */}
              {activeTab === 'finances' && (
                <div className="space-y-6">
                  {/* Finances config */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
                       <CreditCard className="w-4 h-4 text-emerald-500" /> Écolage écolier, Réductions et Paiements
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Frais d'inscription annuel (FCFA)</label>
                        <input type="number" value={editedStudent.registrationFee} onChange={e => updateField('registrationFee', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none font-mono font-bold text-indigo-700" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Scolarité annuelle (FCFA)</label>
                        <input type="number" value={editedStudent.annualTuition} onChange={e => updateField('annualTuition', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none font-mono font-bold text-indigo-700" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Uniforme scolaire (FCFA)</label>
                        <input type="number" value={editedStudent.uniformFee} onChange={e => updateField('uniformFee', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none font-mono font-bold text-indigo-700" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Transport annuel (FCFA)</label>
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!editedStudent.hasTransport}
                              onChange={e => {
                                const checked = e.target.checked;
                                updateField('hasTransport', checked);
                                addLog(`Transport optionnel coché: ${checked}`);
                              }}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">Optionnel</span>
                          </label>
                        </div>
                        <input 
                          type="number" 
                          disabled={!editedStudent.hasTransport}
                          value={editedStudent.annualTransport} 
                          onChange={e => updateField('annualTransport', e.target.value)} 
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none font-mono font-bold text-indigo-700 disabled:opacity-40 disabled:bg-slate-100" 
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Cantine annuelle (FCFA)</label>
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!editedStudent.hasCanteen}
                              onChange={e => {
                                const checked = e.target.checked;
                                updateField('hasCanteen', checked);
                                addLog(`Cantine optionnelle cochée: ${checked}`);
                              }}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">Optionnel</span>
                          </label>
                        </div>
                        <input 
                          type="number" 
                          disabled={!editedStudent.hasCanteen}
                          value={editedStudent.annualCanteen} 
                          onChange={e => updateField('annualCanteen', e.target.value)} 
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none font-mono font-bold text-indigo-700 disabled:opacity-40 disabled:bg-slate-100" 
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Internat annuel (FCFA)</label>
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!editedStudent.hasInternat}
                              onChange={e => {
                                const checked = e.target.checked;
                                updateField('hasInternat', checked);
                                if (checked) {
                                  updateField('regime', 'interne');
                                }
                                addLog(`Internat optionnel coché: ${checked}`);
                              }}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">Optionnel</span>
                          </label>
                        </div>
                        <input 
                          type="number" 
                          disabled={!editedStudent.hasInternat}
                          value={editedStudent.annualInternat || ''} 
                          onChange={e => updateField('annualInternat', e.target.value)} 
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none font-mono font-bold text-indigo-700 disabled:opacity-40 disabled:bg-slate-100" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Durée (mois)</label>
                        <input type="number" value={editedStudent.monthsDuration} onChange={e => updateField('monthsDuration', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none font-mono font-bold text-indigo-700" style={{ height: '42px' }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">A-t-il une Bourse ou Réduction ?</label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {['oui', 'non'].map(_disc => (
                            <button
                              key={_disc}
                              type="button"
                              onClick={() => { updateField('hasDiscount', _disc); addLog(`Statut bourse d'études: ${_disc}`); }}
                              className={`py-1.5 rounded-lg text-[9px] font-black uppercase border text-center transition-all ${
                                editedStudent.hasDiscount === _disc 
                                  ? 'bg-indigo-600 text-white border-indigo-600' 
                                  : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'
                              }`}
                            >
                              {_disc}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Montant réduction annuel (FCFA)</label>
                        <input type="number" disabled={editedStudent.hasDiscount !== 'oui'} value={editedStudent.discountAmount} onChange={e => updateField('discountAmount', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none text-sm font-bold disabled:opacity-40" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-dashed border-gray-100 pt-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Mode de règlement par défaut</label>
                        <select value={editedStudent.paymentMethod} onChange={e => updateField('paymentMethod', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none text-xs font-bold font-mono">
                          <option value="cash">💵 Espèces (Guichet Scolaire)</option>
                          <option value="mobile_money">📱 Mobile Money (Wave / Orange Money)</option>
                          <option value="card">💳 Carte de paiement bancaire / TPE</option>
                          <option value="transfer">🏦 Virement Académique direct</option>
                        </select>
                      </div>

                      {/* Payment simulator option */}
                      <div className="bg-slate-50 p-4 rounded-2xl flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">Passerelle de paiement intégrée</p>
                          {editedStudent.stripePaid ? (
                            <p className="text-[10px] font-mono text-emerald-600 font-bold mt-1">✓ Frais d'inscription réglés par Wave/CB | Ref: {editedStudent.paymentRef}</p>
                          ) : (
                            <p className="text-[10px] text-slate-500 mt-1">Vous pouvez simuler la réception de fonds en direct d'un parent.</p>
                          )}
                        </div>
                        {!editedStudent.stripePaid && (
                          <button type="button" onClick={handleStartOnlinePay} className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider self-start hover:bg-emerald-700 transition-colors">
                            Encaisser en ligne (Wave / CB Simulator)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Documents checklist & Simulation Upload */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-orange-500" /> Documents Fournis obligatoires
                    </h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Cochez les documents versés au dossier. Utilisez le module d'OCR intelligent de la section "Assistant" pour automatiser la vérification de conformité.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {[
                        { key: 'docBirthCert', label: '☐ Extrait d’acte de naissance (Obligatoire)' },
                        { key: 'docSchoolCert', label: '☐ Certificat de scolarité établissement précédant' },
                        { key: 'docPrevReport', label: '☐ Bulletins de notes de l’année précédente' },
                        { key: 'docIdentityPhotos', label: '☐ Photos d’identité règlementaires (x4)' },
                        { key: 'docMedicalCert', label: '☐ Certificat médical d’aptitude d\'inscription' },
                        { key: 'docIdentityCard', label: '☐ Copie Pièce d’Identité Nationale ou Passeport' },
                        { key: 'docReceipt', label: '☐ Reçu de paiement de scolarité / caisse' },
                      ].map(d => (
                        <label key={d.key} className="flex items-center space-x-3 p-2.5 hover:bg-slate-50 rounded-xl border border-gray-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editedStudent[d.key]}
                            onChange={e => { updateField(d.key, e.target.checked); addLog(`Modification doc: ${d.key} => ${e.target.checked}`); }}
                            className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                          />
                          <span className="text-xs font-medium text-gray-700">{d.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Extra school services */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
                       🚌 Options de services scolaires complémentaires
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { key: 'serviceTransport', label: 'Transport Scolaire / Bus' },
                        { key: 'serviceCantine', label: 'Cantine de Cantinement' },
                        { key: 'serviceInternat', label: 'Internat de logement' },
                      ].map(s => (
                        <label key={s.key} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-200/50 cursor-pointer hover:bg-gray-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={editedStudent[s.key]}
                            onChange={e => { updateField(s.key, e.target.checked); addLog(`Option ${s.label}: ${e.target.checked}`); }}
                            className="rounded border-gray-300 text-primary w-4 h-4"
                          />
                          <span className="text-xs font-bold text-gray-700">{s.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Digital access preferences & Auths */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
                       <LockIcon className="w-4 h-4 text-slate-500" /> Accès Numérique Cloud Tuteurs & Consentements
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Email de connexion Portails Parent</label>
                        <input type="email" placeholder="parent.acces@compte.com" value={editedStudent.parentAccountEmail} onChange={e => updateField('parentAccountEmail', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Téléphone OTP Parent</label>
                        <input type="tel" placeholder="+221..." value={editedStudent.parentAccountPhone} onChange={e => updateField('parentAccountPhone', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none font-mono" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Canaux de notification souscrits</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { key: 'notifSms', label: 'SMS Alerte' },
                          { key: 'notifWhatsApp', label: 'WhatsApp Instant' },
                          { key: 'notifEmail', label: 'Courriel e-mail' },
                          { key: 'notifMobileApp', label: 'Push App mobile' },
                        ].map(ch => (
                          <label key={ch.key} className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-100">
                            <input
                              type="checkbox"
                              checked={editedStudent[ch.key]}
                              onChange={e => updateField(ch.key, e.target.checked)}
                              className="rounded border-gray-300 text-primary w-3.5 h-3.5"
                            />
                            <span>{ch.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-dashed border-gray-100 pt-4 space-y-3">
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Consentements & Clauses de l'école</label>
                      <div className="space-y-2">
                        {[
                          { key: 'authMedia', label: 'Autorisation d\'utilisation des photos et vidéos scolaires scolaires (activités, kermesse)' },
                          { key: 'authExcursion', label: 'Autorisation globale de participation aux sorties d\'étude pédagogiques réglementées' },
                          { key: 'authRulesAccepted', label: 'Engagement formel et acceptation complète du règlement intérieur de l\'établissement' },
                        ].map(au => (
                          <label key={au.key} className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editedStudent[au.key]}
                              onChange={e => updateField(au.key, e.target.checked)}
                              className="rounded border-gray-300 text-primary mt-0.5 w-4 h-4"
                            />
                            <span className="text-xs text-slate-600 font-medium">{au.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Assistant ERP Intelligent & Signatures */}
              {activeTab === 'smart' && (
                <div className="space-y-6">
                  {/* Digital signatures box */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
                       <Fingerprint className="w-4 h-4 text-indigo-500" /> Émargement électronique & Signatures Légales
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Parent signatures */}
                      <div className="border border-gray-100 p-5 rounded-2xl bg-slate-50/50 space-y-4">
                        <div>
                          <p className="text-xs font-black text-slate-900 font-mono uppercase tracking-wider">Signataire Parent / Tuteur Éducatif</p>
                          <p className="text-[10px] text-slate-500 mt-1">Saisissez l'émargement textuel ou dessinez directement sur l'écran.</p>
                        </div>
                        
                        <input 
                          type="text" 
                          placeholder="Saisir Nom du parent (ex: Amadou Diallo)" 
                          value={editedStudent.parentSignName} 
                          onChange={e => updateField('parentSignName', e.target.value)} 
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 outline-none" 
                        />

                        {/* Signature Render space */}
                        <div className="h-28 bg-white rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-2 relative overflow-hidden group">
                          {editedStudent.parentSignature ? (
                            editedStudent.parentSignature.startsWith('data:') ? (
                              <img src={editedStudent.parentSignature} alt="Parent touch drawing" className="max-h-full object-contain pointer-events-none" />
                            ) : (
                              <div className="text-center font-serif italic text-indigo-800 text-lg md:text-xl font-bold p-3 decoration-double border-b border-indigo-200 font-cursive">
                                {editedStudent.parentSignature}
                              </div>
                            )
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Aucune signature parentale active</span>
                          )}
                          {editedStudent.parentSignature && (
                            <button 
                              type="button" 
                              onClick={() => { updateField('parentSignature', ''); clearCanvas(); }} 
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-100 p-1.5 rounded-lg text-red-600 transition-opacity hover:bg-red-200"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Action Drawing signature */}
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={handleGenererCursiveSign} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all">
                            Générer cursive
                          </button>
                          <div className="flex-1"></div>
                          <button 
                            type="button" 
                            onClick={() => {
                              toast("Dessinez directement sur la box ci-dessous pour capturer votre signature.", { icon: "ℹ️" });
                            }} 
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
                          >
                            Écran tactile
                          </button>
                        </div>

                        {/* Interactive sign board pad */}
                        <div className="border border-slate-200/60 rounded-xl bg-white p-1">
                          <p className="text-[9px] font-mono text-slate-400 text-center select-none pb-1">Pavé de signature tactile direct (Cliquer-glisser)</p>
                          <canvas
                            ref={canvasRef}
                            width={220}
                            height={90}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            className="w-full bg-slate-50 cursor-crosshair rounded-lg border border-slate-100 touch-none block"
                          />
                          <button type="button" onClick={clearCanvas} className="w-full text-center text-[10px] text-slate-500 py-1 hover:text-red-500 font-bold">Vider le pavé tactile</button>
                        </div>
                      </div>

                      {/* Admin validation stamp */}
                      <div className="border border-gray-100 p-5 rounded-2xl bg-indigo-50/20 space-y-4 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-black text-indigo-950 font-mono uppercase tracking-wider">Émargement Direction & Sceau</p>
                            <p className="text-[10px] text-slate-500 mt-1">Tampon électronique officiel ERP rattaché au matricule de l'ordinateur.</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-mono text-slate-400 block mb-0.5">Admin inspecteur</label>
                              <input type="text" value={editedStudent.adminSignName} onChange={e => updateField('adminSignName', e.target.value)} className="w-full px-2 py-1.5 text-xs bg-white border rounded-lg" />
                            </div>
                            <div>
                              <label className="text-[9px] font-mono text-slate-400 block mb-0.5">Fonction</label>
                              <input type="text" value={editedStudent.adminSignRole} onChange={e => updateField('adminSignRole', e.target.value)} className="w-full px-2 py-1.5 text-xs bg-white border rounded-lg animate-fade-in" />
                            </div>
                          </div>

                          <div className="h-28 bg-white border border-indigo-100 rounded-xl flex items-center justify-center p-3 relative overflow-hidden text-center">
                            {editedStudent.adminSignature ? (
                              <div className="border-4 border-emerald-600/30 text-emerald-600 rounded-full font-mono text-xs font-black p-3 select-none flex flex-col uppercase tracking-widest bg-emerald-500/[0.04] scale-96 transition-transform rotate-[-6deg]">
                                <span>{editedStudent.adminSignRole}</span>
                                <span className="text-[10px] text-emerald-700/80">{editedStudent.adminSignName}</span>
                                <span className="text-[8px] font-normal leading-tight font-sans tracking-normal mt-0.5">VALIDÉ LE {new Date().toLocaleDateString()}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-indigo-400 font-bold">Absence de sceau secrétaires</span>
                            )}
                          </div>
                        </div>

                        <button type="button" onClick={handleAdminStamp} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors shadow shadow-indigo-600/20">
                          Apposer le Tampon Académique Officiel
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Document cloud simulation OCR */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-emerald-500" /> Numérisation de pièces jointes cloud & OCR Scanner
                    </h4>
                    <p className="text-xs text-gray-500">
                      Simuler l'upload d'un justificatif au format PDF ou JPG pour déclencher l'extraction de coordonnées par l'OCR intelligent de l'ERP.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Acte naissance ocr */}
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col">
                        <span className="text-xs font-bold text-slate-800">Acte d'état civil (Naissance)</span>
                        <p className="text-[10px] text-slate-500 mt-1">Extraction de date de naissance, identifiants territoriaux dakarois.</p>
                        
                        {ocrScanningDoc === 'birth' ? (
                          <div className="mt-4 space-y-2">
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600 transition-all" style={{ width: `${ocrProgress}%` }}></div>
                            </div>
                            <span className="text-[10px] font-mono text-indigo-600 font-bold block">Traitement OCR Cloud : {ocrProgress}%</span>
                          </div>
                        ) : (
                          <button type="button" onClick={() => handleSimulateOCR('birth')} className="mt-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 transition-all rounded-lg text-[10px] font-bold uppercase tracking-wider">
                            Simuler OCR Acte Naissance
                          </button>
                        )}
                      </div>

                      {/* Certificat d'ecole ocr */}
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col">
                        <span className="text-xs font-bold text-slate-800">Certificat de Scolarité originel</span>
                        <p className="text-[10px] text-slate-500 mt-1">Identification des filières antérieures, validité des bourses.</p>
                        
                        {ocrScanningDoc === 'school' ? (
                          <div className="mt-4 space-y-2">
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600 transition-all" style={{ width: `${ocrProgress}%` }}></div>
                            </div>
                            <span className="text-[10px] font-mono text-indigo-600 font-bold block">Traitement OCR Cloud : {ocrProgress}%</span>
                          </div>
                        ) : (
                          <button type="button" onClick={() => handleSimulateOCR('school')} className="mt-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 transition-all rounded-lg text-[10px] font-bold uppercase tracking-wider">
                            Simuler OCR Certificat Scolarité
                          </button>
                        )}
                      </div>
                    </div>

                    {ocrResult && (
                      <div className="p-4 bg-indigo-50 text-indigo-900 rounded-2xl border border-indigo-100 text-xs font-mono leading-relaxed space-y-1">
                        <p className="font-black text-[10px] uppercase text-indigo-500">🔥 RÉSULTATS OCR SCOLAIRE DIRECTS :</p>
                        <p>{ocrResult}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Right Sidebar Actions & Live ID CARD */}
          <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-gray-100 p-6 lg:p-8 shrink-0 flex flex-col gap-6 bg-slate-50/50 min-h-0 overflow-y-auto">
            
            {/* School card preview widget */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Carte d'Élève Automatique</span>
                <button type="button" onClick={() => setCardFlipped(!cardFlipped)} className="flex items-center gap-1 hover:text-indigo-600 text-slate-500 transition-colors">
                  <span className="text-[9px] font-black uppercase tracking-widest">{cardFlipped ? "Voir Recto" : "Voir Verso"}</span>
                  <RefreshCw className="w-3 h-3 animate-spin-slow" />
                </button>
              </div>

              {/* Physical styled ID Card container */}
              <div className="relative w-full aspect-[1.586/1] rounded-[1.8rem] bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 shadow-lg border border-white/10 overflow-hidden flex flex-col justify-between shrink-0 select-none">
                {/* Decorative glowing backdrops */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -ml-12 -mb-12 pointer-events-none"></div>

                {!cardFlipped ? (
                  // Front Card Layout
                  <div className="h-full flex flex-col justify-between relative z-10 text-left">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-white/5 pb-2">
                      <div>
                        <h5 className="text-[10px] font-black uppercase leading-none tracking-tight">{merchant.name?.substring(0, 24) || "ÉCOLE SUPÉRIEURE"}</h5>
                        <span className="text-[7px] text-indigo-300 font-mono tracking-widest uppercase">SYSTÈME BANCAIRE ÉLÈVE</span>
                      </div>
                      <span className="text-[7px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded uppercase leading-none tracking-widest">CARTE SCOLAIRE</span>
                    </div>

                    {/* Middle info */}
                    <div className="flex gap-4.5 my-3 items-center">
                      {/* Student photo */}
                      <div className="w-13 h-13 rounded-xl bg-white/10 border border-white/25 flex items-center justify-center text-xl font-black shrink-0 shadow-inner overflow-hidden relative">
                        {student?.photoData || editedStudent.photoData ? (
                          <img src={student?.photoData || editedStudent.photoData} alt="eleve portrait" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white/60 text-lg uppercase font-black leading-none">{editedStudent.firstName[0] || '?'}{editedStudent.lastName[0] || '?'}</span>
                        )}
                        <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-[6px] font-sans font-medium text-center py-0.5 uppercase tracking-tighter text-indigo-200">photo link</span>
                      </div>

                      {/* Bio identification */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm leading-tight text-white line-clamp-1">{editedStudent.firstName} {editedStudent.lastName}</p>
                        <div className="mt-1.5 space-y-0.5 font-mono text-[8px] text-slate-300 leading-none">
                          <p>CLASSE: <span className="font-bold text-white uppercase">{editedStudent.grade || "PAS DE CLASSE"}</span></p>
                          <p>MATRICULE: <span className="font-bold text-indigo-200 uppercase">{editedStudent.matricule}</span></p>
                          <p>NIN: <span className="text-slate-400 font-bold">{editedStudent.nationalId || "--------"}</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-end border-t border-white/5 pt-2">
                      {/* Styled decorative Barcode CSS lines */}
                      <div className="flex items-center h-4.5 gap-[1.5px] bg-white px-1 py-0.5 rounded shrink-0">
                        {[2,1,4,1,2,3,1,2,1,3,2,1].map((w, idx) => (
                          <div key={idx} className="bg-black h-full" style={{ width: `${w}px` }}></div>
                        ))}
                      </div>

                      <div className="text-right leading-none shrink-0">
                        <p className="text-[6px] text-indigo-300 font-mono">ANNÉE SCOLAIRE</p>
                        <p className="text-[9px] font-bold text-white leading-none mt-0.5">{editedStudent.schoolYear}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Back Card Layout
                  <div className="h-full flex flex-col justify-between relative z-10 text-left">
                    <div className="pb-2 border-b border-white/5">
                      <p className="text-[7px] text-slate-400 uppercase font-bold tracking-wider">Instructions ERP d'urgence</p>
                      <p className="text-[8px] text-slate-200 leading-relaxed mt-1">Cette carte est strictement personnelle. En cas d'accident ou de malaise de l'élève, contactez en priorité l'établissement scolaires ou le médecin référent désigné.</p>
                    </div>

                    <div className="my-2 grid grid-cols-2 gap-2 text-[8px] font-mono leading-relaxed text-slate-300">
                      <div>
                        <span className="block text-[6px] text-indigo-300 uppercase leading-none">URGENCE PARENTAL</span>
                        <span className="font-bold text-white">{editedStudent.emergencyPhone || editedStudent.parentContact || "Non configuré"}</span>
                      </div>
                      <div>
                        <span className="block text-[6px] text-indigo-300 uppercase leading-none">GROUPE SANGUIN</span>
                        <span className="font-bold text-rose-400 text-sm leading-none">{editedStudent.bloodType}</span>
                      </div>
                      <div>
                        <span className="block text-[6px] text-indigo-300 uppercase leading-none">AUTORISATIONS SORTIES</span>
                        <span className="font-bold text-white">{editedStudent.authExcursion ? "OUI (AUTORISÉ)" : "NON ATTENDU"}</span>
                      </div>
                      <div>
                        <span className="block text-[6px] text-indigo-300 uppercase leading-none">MÉDECIN DÉCIRE :</span>
                        <span className="font-bold text-white">{editedStudent.doctorPhone || "---"}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-end border-t border-white/5 pt-2">
                      <div className="flex items-center gap-2">
                        {/* Interactive dynamic QR code link */}
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&color=ffffff&bgcolor=1e1b4b&data=${encodeURIComponent(editedStudent.matricule || 'N/A')}`} 
                          alt="ID Card Scanner QR Code" 
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded border border-white/10 outline-none shrink-0" 
                        />
                        <div className="leading-tight">
                          <p className="text-[6px] text-slate-400 leading-none">SIGNATURE ADMIN</p>
                          <p className="text-[8px] font-bold leading-none text-indigo-200 mt-1 line-clamp-1">{editedStudent.adminSignName}</p>
                        </div>
                      </div>

                      <div className="text-right leading-none text-indigo-300 text-[6px] font-mono whitespace-nowrap">
                        PROPRIÉTÉ DE L'INSTITUT
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Workflow state setter */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 text-left">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">État du Workflow de Validation</span>
              <div className="grid grid-cols-4 gap-1 pt-1.5">
                {[
                  { id: 'draft', label: 'Brouillon' },
                  { id: 'pending', label: 'Examen' },
                  { id: 'approved', label: 'Validé' },
                  { id: 'enrolled', label: 'Inscrit' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { updateField('workflowStatus', s.id); addLog(`Statut de validation d'inscription modifié pour : ${s.label}`); }}
                    className={`py-1.5 rounded-lg text-[8px] font-black uppercase text-center border transition-all ${
                      editedStudent.workflowStatus === s.id 
                        ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' 
                        : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Status color coded banner alerts */}
              <div className={`p-3 rounded-2xl border text-xs font-medium uppercase text-center ${
                editedStudent.workflowStatus === 'draft' ? 'bg-slate-50 border-slate-100 text-slate-500' :
                editedStudent.workflowStatus === 'pending' ? 'bg-yellow-50 border-yellow-100 text-yellow-600' :
                editedStudent.workflowStatus === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                'bg-blue-50 border-blue-100 text-blue-600'
              }`}>
                ● Actuellement : {
                  editedStudent.workflowStatus === 'draft' ? 'Fiche brute modifiable' :
                  editedStudent.workflowStatus === 'pending' ? 'Dossier complet en validation' :
                  editedStudent.workflowStatus === 'approved' ? 'Validation académique conforme' :
                  'Inscrit / Établissement validé'
                }
              </div>
            </div>

            {/* Diagnostic Compliance verification block */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Fidélité & Diagnostic IA</span>
                {iaAnalyzing && <Loader2 className="w-4.5 h-4.5 animate-spin text-primary" />}
              </div>

              {iaFeedback ? (
                <div className="p-3.5 bg-indigo-50/50 text-indigo-950 font-medium text-[11px] rounded-2xl border border-indigo-100/40 relative max-h-48 overflow-y-auto leading-relaxed">
                  <div className="whitespace-pre-line text-xs font-sans text-slate-700 leading-relaxed font-normal">
                    {iaFeedback}
                  </div>
                  <button type="button" onClick={() => setIaFeedback(null)} className="w-full text-center text-[9px] font-mono text-slate-400 hover:text-red-500 mt-3 block underline">Fermer l'audit IA</button>
                </div>
              ) : (
                <div className="space-y-3.5 pt-1">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Cliquez sur le diagnostiqueur pour soumettre automatiquement l'exhaustivité des signatures, pièces réglementaires et de la scolarité d'inscription à l'intelligence artificielle.
                  </p>
                  <button 
                    type="button" 
                    onClick={handleIaAnalyzeIncomplete} 
                    disabled={iaAnalyzing}
                    className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Contrôler la conformité IA
                  </button>
                </div>
              )}
            </div>

            {/* Quick action buttons (Print escolar regist) */}
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button" 
                onClick={() => {
                  toast("Feuille d'instruction d'accès par carte prête. Impression du dossier d'inscription en cours d'envoi à l'impression...", { icon: "ℹ️" });
                  window.print();
                }} 
                className="py-2.5 bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> imprimer
              </button>
              
              <button 
                type="button" 
                onClick={handleRegenMatricule} 
                className="py-2.5 bg-slate-100 border border-slate-200 text-indigo-600 hover:bg-indigo-50 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
              >
                Générer Matricule
              </button>
            </div>

            {/* History Logs Feed (Audit Trail) */}
            <div className="bg-slate-900 text-indigo-300 p-4 rounded-3xl border border-slate-800 shadow-inner flex-1 min-h-[140px] max-h-[220px] md:max-h-none overflow-y-auto flex flex-col justify-start text-left">
              <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider block border-b border-slate-800 pb-1.5 mb-2 font-mono">Workflow Audit Log trail</span>
              <div className="space-y-2 font-mono text-[9px] leading-normal select-text">
                {historyLogs.map((log, lIdx) => (
                  <p key={lIdx} className="line-clamp-2">{log}</p>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Global Footer modal actions */}
        <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4 shrink-0">
          <button type="button" onClick={onClose} className="flex-1 py-4 border border-gray-200 rounded-2xl font-black text-xs uppercase tracking-wider text-gray-600 hover:bg-white transition-colors">Fermer la fiche</button>
          
          <button onClick={handleSubmit} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Sauvegarder et valider dans l'ERP</span>}
          </button>
        </div>
      </motion.div>

      {/* Embedded direct micro online-payment gateway panel simulator */}
      {isPayingOnline && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-950 text-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5 text-left border border-white/10 select-none">
            
            {/* Payment Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[8px] font-mono uppercase font-black tracking-widest leading-none">Live Gateway</span>
                <p className="font-black text-sm mt-1">Secured Wave & CB Checkout</p>
              </div>
              <button onClick={() => setIsPayingOnline(false)} className="text-white/40 hover:text-white border border-white/5 rounded-lg p-1.5"><X className="w-4 h-4" /></button>
            </div>

            {/* Choice mode */}
            <div className="grid grid-cols-3 gap-2">
              {(['wave', 'om', 'card'] as const).map(mMode => (
                <button
                  key={mMode}
                  type="button"
                  onClick={() => setOnlinePayMethod(mMode)}
                  className={`p-2 rounded-xl text-[10px] font-mono font-black border text-center uppercase tracking-wider transition-all ${
                    onlinePayMethod === mMode ? 'bg-indigo-600 text-white border-indigo-600' : 'border-white/10 text-white/50 hover:bg-white/5'
                  }`}
                >
                  {mMode === 'wave' ? '🌊 Wave' : mMode === 'om' ? '🍊 OM' : '💳 Carte'}
                </button>
              ))}
            </div>

            {/* Input field parent phone */}
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Numéro de téléphone payeur</label>
              <input
                type="text"
                required
                placeholder="+221..."
                value={onlinePayNum}
                onChange={e => setOnlinePayNum(e.target.value)}
                className="w-full p-3 font-mono font-black bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500 outline-none text-sm text-indigo-100"
              />
            </div>

            {/* Total summary */}
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wide">Frais d'Écolage dû :</span>
              <span className="font-mono font-black text-base text-emerald-400">{editedStudent.registrationFee || 25000} FCFA</span>
            </div>

            {/* Call Action buttons */}
            <button 
              type="button" 
              onClick={handleSimulateOnlineSuccess} 
              disabled={onlineProcessing}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 leading-none"
            >
              {onlineProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Traitement des fonds ...</span>
                </>
              ) : (
                <span>Confirmer l'encaissement direct</span>
              )}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
