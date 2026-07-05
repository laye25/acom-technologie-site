
import { 
  useSchoolLiveTeacherData, 
  useSchoolLiveStudentProfile, 
  useSchoolLiveParentProfile 
} from '../modules/scolaire/hooks/useSchoolSaaS';
import React, { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react';

// Core Merchant & Module Lazy Loading (Clean Architecture & Performance Optimization)
const MerchantOnboarding = lazy(() => import('../modules/onboarding/components/MerchantOnboarding'));
const MerchantSettings = lazy(() => import('../modules/settings/components/MerchantSettings'));
const MerchantPOS = lazy(() => import('../modules/pos/components/MerchantPOS'));
const MerchantReports = lazy(() => import('../modules/reports/components/MerchantReports'));
const MerchantBilling = lazy(() => import('../modules/billing/components/MerchantBilling'));
const MerchantAccounting = lazy(() => import('../modules/accounting/components/MerchantAccounting'));
const ServiceManager = lazy(() => import('../modules/service/components/ServiceManager'));
const SupplierManager = lazy(() => import('../modules/supplier/components/SupplierManager'));
const InventoryManager = lazy(() => import('../modules/inventory/components/InventoryManager'));
const HRManager = lazy(() => import('../modules/rh/components/HRManager'));
const ProjectManager = lazy(() => import("../modules/btp/components/ProjectManager"));
const FleetManager = lazy(() => import("../modules/transport/components/FleetManager"));
const FleetMaintenanceManager = lazy(() => import('../modules/transport/components/FleetMaintenanceManager').then(m => ({ default: m.FleetMaintenanceManager })));

// Pressing Lazy Modules
const PressingTarifsManager = lazy(() => import('../modules/pressing/components/PressingTarifsManager').then(m => ({ default: m.PressingTarifsManager })));
const PressingClosureManager = lazy(() => import('../modules/pressing/components/PressingClosureManager').then(m => ({ default: m.PressingClosureManager })));
const PressingReceiptManager = lazy(() => import('../modules/pressing/components/PressingReceiptManager').then(m => ({ default: m.PressingReceiptManager })));
const PressingStockManager = lazy(() => import('../modules/pressing/components/PressingStockManager').then(m => ({ default: m.PressingStockManager })));
const PressingDeliveryManager = lazy(() => import('../modules/pressing/components/PressingDeliveryManager').then(m => ({ default: m.PressingDeliveryManager })));

// Tailleur Lazy Modules
const TailleurGalleryManager = lazy(() => import('../modules/tailleur/components/TailleurGalleryManager').then(m => ({ default: m.TailleurGalleryManager })));
const TailleurArtisansManager = lazy(() => import('../modules/tailleur/components/TailleurArtisansManager').then(m => ({ default: m.TailleurArtisansManager })));
const TailleurMercerieCostManager = lazy(() => import('../modules/tailleur/components/TailleurMercerieCostManager').then(m => ({ default: m.TailleurMercerieCostManager })));
const TailleurTissusManager = lazy(() => import('../modules/tailleur/components/TailleurTissusManager').then(m => ({ default: m.TailleurTissusManager })));
const TailleurBoutiqueManager = lazy(() => import('../modules/tailleur/components/TailleurBoutiqueManager').then(m => ({ default: m.TailleurBoutiqueManager })));
const TailleurClientsManager = lazy(() => import('../modules/tailleur/components/TailleurClientsManager').then(m => ({ default: m.TailleurClientsManager })));
const TailleurOrdersManager = lazy(() => import('../modules/tailleur/components/TailleurOrdersManager').then(m => ({ default: m.TailleurOrdersManager })));

// Scolaire Lazy Modules
const AlertParentsManager = lazy(() => import('../modules/scolaire/components/AlertParentsManager').then(m => ({ default: m.AlertParentsManager })));
const TeacherGradePortal = lazy(() => import('../modules/scolaire/components/TeacherGradePortal').then(m => ({ default: m.TeacherGradePortal })));
const TeacherManager = lazy(() => import('../modules/scolaire/components/TeacherManager').then(m => ({ default: m.TeacherManager })));
const AcademicManager = lazy(() => import('../modules/scolaire/components/AcademicManager').then(m => ({ default: m.AcademicManager })));
const ParentsManager = lazy(() => import('../modules/scolaire/components/ParentsManager').then(m => ({ default: m.ParentsManager })));
const AttendanceManager = lazy(() => import('../modules/scolaire/components/AttendanceManager').then(m => ({ default: m.AttendanceManager })));
const CommunicationManager = lazy(() => import('../modules/scolaire/components/CommunicationManager').then(m => ({ default: m.CommunicationManager })));
const AIEducationManager = lazy(() => import('../modules/scolaire/components/AIEducationManager').then(m => ({ default: m.AIEducationManager })));
const SchoolManager = lazy(() => import('../modules/scolaire/components/SchoolManager').then(m => ({ default: m.SchoolManager })));

// Medical Lazy Modules
const MedicalManager = lazy(() => import('../modules/medical/components/MedicalManager').then(m => ({ default: m.MedicalManager })));
const AppointmentManager = lazy(() => import('../modules/medical/components/AppointmentManager').then(m => ({ default: m.AppointmentManager })));
const PrescriptionManager = lazy(() => import('../modules/medical/components/PrescriptionManager').then(m => ({ default: m.PrescriptionManager })));

// Admin Lazy Modules
const SchoolScheduleManager = lazy(() => import('../components/admin/SchoolScheduleManager').then(m => ({ default: m.SchoolScheduleManager })));
const StudentPortalsManager = lazy(() => import('../components/admin/StudentPortalsManager').then(m => ({ default: m.StudentPortalsManager })));
const CashClosureManager = lazy(() => import('../components/admin/CashClosureManager').then(m => ({ default: m.CashClosureManager })));

import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { dbService as dbService } from '../services/dbService';
import { db } from '../db/db'; // Dexie
import { syncService } from '../services/syncService';
import { subscriptionEngine } from '../data/services/subscription.engine';
import { geminiService } from '../services/geminiService';
import { useLiveQuery } from 'dexie-react-hooks';
import { ParentPortalSimulation } from '../components/ParentPortalSimulation';
import { StudentPortalSimulation } from '../components/StudentPortalSimulation';
import { SchoolAccountingSaaS } from '../components/admin/SchoolAccountingSaaS';
import { Merchant, MerchantProduct, MerchantSale, MerchantQuote, MerchantQuoteItem, MerchantExpense, MerchantSupplier, MerchantPlan } from '../types';
import { motion, AnimatePresence } from 'motion/react';
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
import toast from 'react-hot-toast';
import { showMailSuccessToast } from '../components/MailSuccessToast';
import { getApiUrl, sendEmailDirectlyOrViaBackend } from '../lib/api';
import { triggerAcomAlert, AcomAlertEventProvider } from '../components/AcomAlertEventProvider';
import { AcomZoneMerchantPanel } from '../components/AcomZoneMerchantPanel';
import { DetergentSale, PressingTicket } from '../modules/pressing/types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { billingService } from '../services/billingService';
import { activityService } from '../services/activityService';
import { GlobalActivityFeed } from '../components/GlobalActivityFeed';
import { DailyBriefing } from '../components/DailyBriefing';
import { OptimizedImage } from '../components/OptimizedImage';
import { NetworkStatusIndicator } from '../components/NetworkStatusIndicator';
import { BarcodeScanner } from '../components/BarcodeScanner';
import ScannerModal from '../components/ScannerModal';
import { MerchantDashboard, StockStatCard, HealthIndicator } from '../components/MerchantDashboard';
import { TeacherDashboardSpace } from '../modules/scolaire/components/TeacherGradePortal';
import { StudentAcademicRecord } from '../modules/scolaire/components/StudentAcademicRecord';
import { StudentRegisterFormModal } from '../modules/scolaire/components/StudentRegisterFormModal';
import { payDunyaService } from '../services/payDunyaService';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentForm } from '../components/PaymentForm';
import { LogOut } from 'lucide-react';
import { ScheduleManager } from '../components/admin/ScheduleManager';

const isDesktop = typeof window !== 'undefined' && (
  ('__TAURI__' in window) || 
  (window.process && (window.process as any).type) || 
  (navigator && navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron')) || 
  (window.location && window.location.protocol && !['http:', 'https:'].includes(window.location.protocol))
);

import { TeacherDashboardWrapper } from '../modules/scolaire/components/TeacherDashboardWrapper';

const MerchantSaaS = () => {
  const { user, signOut } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isSpecialManager = user?.email === 'contact.abdoulayendiaye@gmail.com' || user?.email === 'contact.acomtechnologie@gmail.com' || user?.email === 'gestionnaire.acomtechnologie@gmail.com';
  const [overrideType, setOverrideType] = useState<string | null>(() => searchParams.get('type') || null);
  const [dbMerchant, setMerchant] = useState<Merchant | null>(null);
  
  const displayMerchant = useMemo(() => {
    if (!dbMerchant) return null;
    const activeSaaSType = (isSpecialManager && overrideType) ? overrideType : (dbMerchant.type || 'boutique');
    return { ...dbMerchant, type: activeSaaSType };
  }, [dbMerchant, isSpecialManager, overrideType]);

  const merchant = displayMerchant || dbMerchant;

  useEffect(() => {
    const urlType = searchParams.get('type');
    if (urlType && isSpecialManager) {
      setOverrideType(urlType);
    }
  }, [searchParams, isSpecialManager]);

  const [loadingMerchant, setLoadingMerchant] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [loggedTeacherProfile, setLoggedTeacherProfile] = useState<any>(null);
  const [loggedParentProfile, setLoggedParentProfile] = useState<any>(null);
  const [loggedStudentProfile, setLoggedStudentProfile] = useState<any>(null);

  useEffect(() => {
    if (merchant?.managerNotifications?.apiBaseUrl) {
      try {
        localStorage.setItem('acom_desktop_api_base_url', merchant.managerNotifications.apiBaseUrl);
      } catch (e) {
        console.error('Failed to cache apiBaseUrl:', e);
      }
    }
  }, [merchant]);
  const activeTeacherId = typeof window !== 'undefined' ? localStorage.getItem('activeTeacherId') : null;
  const activeParentId = typeof window !== 'undefined' ? localStorage.getItem('activeParentId') : null;
  const activeStudentId = typeof window !== 'undefined' ? localStorage.getItem('activeStudentId') : null;

  // Reactively track student and parent profile changes using imported hooks (highly optimized)
  const liveStudentProfile = useSchoolLiveStudentProfile(activeStudentId);
  const liveParentProfile = useSchoolLiveParentProfile(activeParentId);

  // Sync reactive profiles with component local state
  useEffect(() => {
    if (liveStudentProfile) {
      setLoggedStudentProfile(liveStudentProfile);
    }
  }, [liveStudentProfile]);

  useEffect(() => {
    if (liveParentProfile) {
      setLoggedParentProfile(liveParentProfile);
    }
  }, [liveParentProfile]);
  
  // Handle payment success from PayDunya
  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const isSuccess = searchParams.get('payment_success') === 'true';
      const newPlan = searchParams.get('new_plan') as MerchantPlan;
      const merchantId = searchParams.get('merchant_id');

      if (isSuccess && newPlan && merchantId && merchant && merchant.id === merchantId) {
        if (merchant.plan !== newPlan) {
          try {
            const updatedMerchant = { 
              ...merchant, 
              plan: newPlan,
              licenseType: newPlan === 'LOCAL' ? 'local' : merchant.licenseType,
              updatedAt: new Date() 
            };
            await dbService.merchants.save(updatedMerchant);
            setMerchant(updatedMerchant);
            toast.success(`Votre plan a été mis à jour avec succès : ${newPlan} !`, {
              duration: 5000,
              icon: '🎉'
            });
            
            // Clear URL parameters
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('payment_success');
            newParams.delete('new_plan');
            newParams.delete('merchant_id');
            newParams.delete('token');
            setSearchParams(newParams, { replace: true });
          } catch (error) {
            console.error('Error updating plan after payment:', error);
            toast.error('Erreur lors de la mise à jour de votre forfait.');
          }
        }
      }
    };
    
    if (merchant) {
      handlePaymentSuccess();
    }
  }, [searchParams, merchant, setSearchParams]);

  // Handle auto-show upgrade modal from URL
  useEffect(() => {
    if (searchParams.get('show_upgrade') === 'true') {
      setShowUpgradeModal(true);
      
      // Optionally clear the param so it doesn't pop up again on refresh
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('show_upgrade');
      // We keep target_plan for the modal to use if we want
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch merchant profile
  useEffect(() => {
    const fetchMerchant = async () => {
      const activeTeacherId = localStorage.getItem('activeTeacherId');
      const activeParentId = localStorage.getItem('activeParentId');
      const activeStudentId = localStorage.getItem('activeStudentId');
      if (!user && !activeTeacherId && !activeParentId && !activeStudentId) return;
      try {
        setLoadingMerchant(true);
        setError(null);
        
        let finalMerchant = null;

        if (activeStudentId) {
          // Student Login active session
          let student = await db.students?.where('id').equals(activeStudentId).first();
          if (!student) {
            try {
              const { studentRepository } = await import('../data/repositories/student.repository');
              const sCloud = await studentRepository.getById(activeStudentId);
              if (sCloud) {
                student = sCloud;
                await db.students.put({ ...sCloud, id: sCloud.id });
              }
            } catch (err) {
              console.error("Failed to fetch student from cloud on page load:", err);
            }
          }
          if (student) {
            setLoggedStudentProfile({
              id: student.id,
              name: `${student.firstName || ''} ${student.lastName || ''}`,
              firstName: student.firstName || '',
              lastName: student.lastName || '',
              phone: student.phone || '',
              studentUsername: student.studentUsername || student.username || '',
              studentPassword: student.studentPassword || student.password || '',
              student: student
            });
            const mId = student.merchantId || student.merchant_id;
            if (mId) {
              let mLocal = await db.merchants.filter((m: any) => m.id === mId).first();
              if (!mLocal) {
                try {
                  const { merchantRepository } = await import('../data/repositories/merchant.repository');
                  const mCloud = await merchantRepository.getById(mId);
                  if (mCloud) {
                    mLocal = mCloud;
                    await db.merchants.put({ ...mCloud, id: mCloud.id });
                  }
                } catch (cloudErr) {
                  console.error("Failed to fetch merchant from cloud for student login:", cloudErr);
                }
              }
              finalMerchant = mLocal;
            }
          }
        } else if (activeParentId) {
          // Parent Login active session
          const allStudents = await db.students?.toArray() || [];
          const matchingStudents = allStudents.filter((student: any) => {
            const cleanActiveParent = activeParentId.replace(/[^0-9]/g, '');
            if (!cleanActiveParent) return false;

            // Extremely robust matching: check any parents' phone lists
            const phonesToCheck = [
              student.fatherPhone,
              student.motherPhone,
              student.guardianPhone,
              student.parentContact
            ].filter(Boolean);

            return phonesToCheck.some((phone: string) => {
              const cleanPhone = phone.replace(/[^0-9]/g, '');
              if (!cleanPhone) return false;
              if (cleanPhone === cleanActiveParent) return true;
              if (cleanPhone.slice(-9) === cleanActiveParent.slice(-9) && cleanActiveParent.slice(-9).length >= 8) return true;
              return false;
            });
          });

          // Look up parent record
          let dbParent = await db.parents?.where('phone').equals(activeParentId).first();
          if (!dbParent) {
            dbParent = await db.parents?.where('username').equals(activeParentId).first();
          }
          if (!dbParent) {
            dbParent = await db.parents?.where('id').equals(activeParentId).first();
          }

          let mId = dbParent?.merchantId || dbParent?.merchant_id || localStorage.getItem('merchantId');
          if (!mId && matchingStudents.length > 0) {
            mId = matchingStudents[0].merchantId || matchingStudents[0].merchant_id;
          }

          if (mId) {
            let mLocal = await db.merchants.filter((m: any) => m.id === mId).first();
            if (!mLocal) {
              try {
                const { merchantRepository } = await import('../data/repositories/merchant.repository');
                const mCloud = await merchantRepository.getById(mId);
                if (mCloud) {
                  mLocal = mCloud;
                  await db.merchants.put({ ...mCloud, id: mCloud.id });
                }
              } catch (cloudErr) {
                console.error("Failed to fetch merchant from cloud for parent login:", cloudErr);
              }
            }
            finalMerchant = mLocal;
          }

          const exam = matchingStudents[0];
          const parentName = exam 
            ? (exam.primaryParentContact === 'mother' ? exam.motherName : exam.primaryParentContact === 'guardian' ? exam.guardianName : exam.fatherName)
            : (dbParent?.name || "Parent d'élève");
          
          const parts = (parentName || "Parent").trim().split(' ');
          let customUsername = activeParentId;
          let customPassword = '';
          if (dbParent) {
            customUsername = dbParent.username || activeParentId;
            customPassword = dbParent.password || dbParent.pin || '';
          }

          const parentObj = {
            id: activeParentId,
            name: parentName || "Parent",
            firstName: parts[0] || '?',
            lastName: parts.slice(1).join(' ') || '',
            phone: dbParent?.phone || (exam?.parentContact || exam?.fatherPhone || activeParentId),
            username: customUsername,
            password: customPassword,
            studentsAmount: matchingStudents.length,
            childrenNames: matchingStudents.map(s => `${s.firstName || s.name} ${s.lastName || ''}`),
            children: matchingStudents
          };

          setLoggedParentProfile(parentObj);
        } else if (activeTeacherId) {
          // It's a teacher login
          let teacher = await db.teachers?.where('id').equals(activeTeacherId).first();
          if (!teacher) {
            // Fallback: fetch from cloud (Firestore)
            try {
              const { teacherRepository } = await import('../data/repositories/teacher.repository');
              const tCloud = await teacherRepository.getById(activeTeacherId);
              if (tCloud) {
                teacher = tCloud;
                await db.teachers.put({ ...tCloud, id: activeTeacherId });
              }
            } catch (err) {
              console.error("Failed to fetch teacher from cloud:", err);
            }
          }
          const mId = teacher?.merchantId || teacher?.merchant_id;
          if (teacher && mId) {
            let mLocal = await db.merchants.filter((m: any) => m.id === mId).first();
            if (!mLocal) {
              // Try to fetch from cloud (Firestore)
              try {
                const { merchantRepository } = await import('../data/repositories/merchant.repository');
                const mCloud = await merchantRepository.getById(mId);
                if (mCloud) {
                  mLocal = mCloud;
                  // Cache it/save it locally so next queries find it instantly!
                  await db.merchants.put({ ...mCloud, id: mCloud.id });
                }
              } catch (cloudErr) {
                console.error("Failed to fetch merchant from cloud for teacher:", cloudErr);
              }
            }
            finalMerchant = mLocal;
            setLoggedTeacherProfile(teacher); // Set Teacher info
          }
        } else if (user) {
          let localMerchant = await db.merchants.where('owner_id').equals(user.uid).first();
          if (!localMerchant) {
            const allMerchants = await db.merchants.toArray();
            localMerchant = allMerchants.find(m => m.ownerId === user.uid || m.owner_id === user.uid);
          }

          // Fetch from Supabase via dbService
          const m = await dbService.merchants.getByOwner(user.uid);
          
          finalMerchant = m || localMerchant;
          
          if (m && m.id) {
              // Update local cache
              await db.merchants.put({ ...m, id: m.id });
          } else if (localMerchant && localMerchant.id) {
              // Rescue: it's local but not in cloud, push it to cloud now!
              await dbService.merchants.save(localMerchant);
          }
        }
        
        // Check for quota
        const quotaExceeded = localStorage.getItem('firebase_quota_exceeded');
        if (quotaExceeded && !finalMerchant) {
          setError(`Quota Firestore épuisé. Impossible de charger le profil marchand.`);
        } else {
          setMerchant(finalMerchant || null);
        }
      } catch (error: any) {
        console.error('Error fetching merchant:', error);
        // If it's a new user and there's an error fetching, we don't block them.
        // We set merchant to null which will trigger the Onboarding screen.
        setMerchant(null);
      } finally {
        setLoadingMerchant(false);
      }
    };
    fetchMerchant();
  }, [user, activeTeacherId, activeParentId, activeStudentId]);

  const isCloudSyncEnabled = merchant?.plan === 'BASIC' || merchant?.plan === 'STANDARD' || merchant?.plan === 'PREMIUM';
  
  const [siteSettings, setSiteSettings] = useState<any>(null);
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const globalSettings = await dbService.settings.get('global');
        setSiteSettings(globalSettings);
      } catch (error) {
        console.error('Error fetching global settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Data Synchronization: BackgroundSyncManager handles it

  const getTabs = (type: string, plan: string) => {
    let tabs: any[] = [];

    switch (type) {
      case 'entreprise':
        tabs = [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'interventions', label: 'Interventions', icon: Wrench },
          { id: 'accounting', label: 'Compta', icon: BarChart3 },
          { id: 'reports', label: 'Rapports', icon: FileText },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
        break;
      case 'chantier':
        tabs = [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'projects', label: 'Projets', icon: HardHat },
          { id: 'inventory', label: 'Matériel', icon: Package },
          { id: 'accounting', label: 'Compta', icon: BarChart3 },
          { id: 'reports', label: 'Rapports', icon: FileText },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
        break;
      case 'transport':
        tabs = [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'vehicles', label: 'Véhicules', icon: Car },
          { id: 'fleet_maintenance', label: '⚙️ Entretien Flotte', icon: Wrench },
          { id: 'accounting', label: 'Compta', icon: BarChart3 },
          { id: 'reports', label: 'Rapports', icon: FileText },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
        break;
      case 'rh':
        tabs = [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'employees', label: 'Employés', icon: Users },
          { id: 'reports', label: 'Rapports', icon: FileText },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
        break;
      case 'scolaire':
        tabs = [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart, group: 'Général' },
          { id: 'students', label: 'Administration', icon: GraduationCap, group: 'Administration Scolaire' },
          { id: 'alerte', label: 'Alerte Parents', icon: Zap, group: 'Administration Scolaire' },
          { id: 'teachers', label: 'Portail Enseignant', icon: Users, group: 'Administration Scolaire' },
          { id: 'classes', label: 'Pédagogie', icon: BookOpen, group: 'Administration Scolaire' },
          { id: 'schedule', label: 'Emploi du Temps', icon: Calendar, group: 'Administration Scolaire' },
          { id: 'grades', label: 'SAISIE RAPIDE DES NOTES', icon: PenTool, group: 'Administration Scolaire' },
          { id: 'parents', label: 'Portail Parents', icon: Users, group: 'Administration Scolaire' },
          { id: 'student-portals', label: 'Portails Élèves', icon: Key, group: 'Administration Scolaire' },
          { id: 'attendance', label: 'Présences', icon: ClipboardCheck, group: 'Administration Scolaire' },
          { id: 'communication', label: 'Communication', icon: MessageSquare, group: 'Administration Scolaire' },
          { id: 'ai', label: 'A.I. Éducation', icon: Zap, group: 'Administration Scolaire' },
          { id: 'fin_kpi', label: 'Tableau de Bord', icon: PieChart, group: 'Comptabilité / Finance' },
          { id: 'fin_scolarite', label: 'Scolarité (Inscrits)', icon: GraduationCap, group: 'Comptabilité / Finance' },
          { id: 'fin_caisse', label: 'Journal de Caisse', icon: Banknote, group: 'Comptabilité / Finance' },
          { id: 'fin_depenses', label: 'Dépenses Générale', icon: TrendingDown, group: 'Comptabilité / Finance' },
          { id: 'fin_salaires', label: 'Salaires & Personnel', icon: Users, group: 'Comptabilité / Finance' },
          { id: 'fin_stock', label: 'Fournitures & Uniformes', icon: Package, group: 'Comptabilité / Finance' },
          { id: 'fin_transport', label: 'Transport Scolaire', icon: Bus, group: 'Comptabilité / Finance' },
          { id: 'fin_cantine', label: 'Cantine & Repas', icon: Utensils, group: 'Comptabilité / Finance' },
          { id: 'fin_pricing', label: 'Paramètres Tarifs', icon: DollarSign, group: 'Comptabilité / Finance' },
          { id: 'reports', label: 'Rapports', icon: FileText, group: 'Comptabilité / Finance' },
          { id: 'settings', label: 'Réglages', icon: Settings, group: 'Comptabilité / Finance' },
        ];
        break;
      case 'medical':
        tabs = [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'patients', label: 'Patients', icon: Stethoscope },
          { id: 'appointments', label: 'Rendez-vous', icon: Calendar },
          { id: 'prescriptions', label: 'Ordonnances', icon: FileCheck },
          { id: 'accounting', label: 'Compta', icon: BarChart3 },
          { id: 'reports', label: 'Rapports', icon: FileText },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
        break;
      case 'pressing':
        tabs = [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'pressing_receipt', label: '🧺 Fiche Réception', icon: ClipboardList },
          { id: 'pressing_delivery', label: '🚚 Livraisons', icon: Truck },
          { id: 'pressing_stock', label: 'Vente & Stock', icon: Package },
          { id: 'inventory', label: 'Catalogue En Ligne', icon: ShoppingBag },
          { id: 'pressing_tarifs', label: '⚙️ Paramètres Tarifs', icon: DollarSign },
          { id: 'pressing_closure', label: '🔒 Clôture de Caisse', icon: LockIcon },
          { id: 'accounting', label: 'Compta', icon: BarChart3 },
          { id: 'reports', label: 'Rapports', icon: FileText },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
        break;
      case 'tailleur':
        tabs = [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'tailleur_clients', label: 'Clients Couture', icon: Users },
          { id: 'tailleur_orders', label: 'Commandes Mesures', icon: Scissors },
          { id: 'tailleur_tissus', label: 'Tissus & Wax', icon: Palette },
          { id: 'tailleur_boutique', label: 'Boutique Prêt-à-porter', icon: ShoppingBag },
          { id: 'tailleur_gallery', label: 'Inspirations & Moodboards', icon: Sparkles },
          { id: 'tailleur_artisans', label: 'Artisans & Équipe', icon: Users },
          { id: 'tailleur_mercerie', label: 'Mercerie & Coût de Revient', icon: Calculator },
          { id: 'accounting', label: 'Compta', icon: BarChart3 },
          { id: 'reports', label: 'Rapports', icon: FileText },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
        break;
      default: // boutique
        tabs = [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'pos', label: 'Caisse POS', icon: ShoppingCart },
          { id: 'inventory', label: 'Stock', icon: Package },
          { id: 'suppliers', label: 'Fournisseurs', icon: Truck },
          { id: 'billing', label: 'Facture/Devis', icon: Receipt },
          { id: 'audit', label: 'Audit', icon: Clock },
          { id: 'accounting', label: 'Compta', icon: BarChart3 },
          { id: 'cash_closure', label: 'Clôture de Caisse', icon: LockIcon },
          { id: 'reports', label: 'Rapports', icon: FileText },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
        break;
    }
    
    // AcomZone is now isolated in the header directly, not injected in tabs list
    return tabs;
  };

  useEffect(() => {
    console.log('MerchantSaaS: Render - merchant:', merchant, 'activeTab:', activeTab);
  }, [merchant, activeTab]);

  if (loadingMerchant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl max-w-md w-full text-center border border-red-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-ink mb-4 tracking-tight">Erreur de chargement</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-ink text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-lg shadow-ink/20"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (loggedTeacherProfile) {
    return (
      <TeacherDashboardWrapper 
        teacher={loggedTeacherProfile} 
        merchant={merchant || { id: loggedTeacherProfile.merchantId || loggedTeacherProfile.merchant_id || 'fallback-id', name: 'ACOM Éducation', type: 'scolaire', plan: 'STANDARD' }} 
      />
    );
  }

  if (loggedParentProfile) {
    return (
      <ParentPortalSimulation 
        parent={loggedParentProfile} 
        merchant={merchant || { id: 'fallback-id', name: 'ACOM Éducation', type: 'scolaire', plan: 'STANDARD' }} 
        onClose={() => {
          localStorage.removeItem('activeParentId');
          localStorage.removeItem('activeStudentId');
          localStorage.removeItem('activeTeacherId');
          localStorage.removeItem('merchantId');
          window.location.href = '/login';
        }}
      />
    );
  }

  if (loggedStudentProfile) {
    return (
      <StudentPortalSimulation 
        student={loggedStudentProfile} 
        merchant={merchant || { id: 'fallback-id', name: 'ACOM Éducation', type: 'scolaire', plan: 'STANDARD' }} 
        onClose={() => {
          localStorage.removeItem('activeParentId');
          localStorage.removeItem('activeStudentId');
          localStorage.removeItem('activeTeacherId');
          localStorage.removeItem('merchantId');
          window.location.href = '/login';
        }}
      />
    );
  }

  if (!merchant) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 animate-spin text-ink" />
        </div>
      }>
        <MerchantOnboarding onComplete={(m) => setMerchant(m)} />
      </Suspense>
    );
  }

  if (merchant.plan !== 'FREE' && merchant.subscriptionStatus !== 'active') {
    return <PaymentPendingView merchant={merchant} onPaymentSuccess={() => window.location.reload()} />;
  }

  const tabs = getTabs(merchant.type || 'boutique', merchant.plan || '');

  return (
    <div className="min-h-screen bg-gray-50 pt-6 md:pt-12 lg:pt-24 pb-12">
        <AcomAlertEventProvider />
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col mb-6 md:mb-12 gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/10 shadow-inner overflow-hidden shrink-0">
                  {merchant.logo ? (
                    <img src={merchant.logo} alt="Logo" className="w-full h-full object-contain bg-white p-1" />
                  ) : (
                    <Store className="w-8 h-8 text-primary" />
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-black text-ink tracking-tight">{merchant.name}</h1>
                  <div className="flex flex-wrap items-center mt-1.5 gap-y-2">
                    <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em]">
                      {merchant.type === 'entreprise' ? 'Management Entreprise' :
                       merchant.type === 'chantier' ? 'Management BTP / Chantier' :
                       merchant.type === 'transport' ? 'Management Flotte' :
                       merchant.type === 'rh' ? 'Management RH' :
                       merchant.type === 'scolaire' ? 'Management Scolaire' :
                       merchant.type === 'medical' ? 'Management Médical' :
                       merchant.type === 'pressing' ? 'Management Pressing' :
                       merchant.type === 'tailleur' ? 'Ateliers de Couture' :
                       'Management Commerce'}
                    </span>
                    <span className="mx-3 w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="text-[10px] font-mono font-black text-primary uppercase tracking-[0.2em]">
                      Plan {merchant.plan}
                    </span>
                    {merchant.licenseType && (
                      <>
                        <span className="mx-3 w-1 h-1 bg-gray-300 rounded-full"></span>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                          merchant.licenseType === 'cloud' 
                            ? 'bg-blue-50 border-blue-100 text-blue-600' 
                            : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                        }`}>
                          {merchant.licenseType === 'cloud' ? <Database className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
                          <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                            {merchant.licenseType === 'cloud' ? 'Licence Cloud' : 'Licence Locale'}
                          </span>
                        </div>
                      </>
                    )}
                    {isSpecialManager && (
                      <>
                        <span className="mx-3 w-1 h-1 bg-gray-300 rounded-full"></span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100/60 shadow-sm">
                          <SlidersHorizontal className="w-3 h-3 text-indigo-500 shrink-0" />
                          <select
                            value={merchant.type || 'boutique'}
                            onChange={(e) => {
                              const selected = e.target.value;
                              setOverrideType(selected);
                              setActiveTab('dashboard');
                              const newParams = new URLSearchParams(searchParams);
                              newParams.set('type', selected);
                              setSearchParams(newParams, { replace: true });
                              toast.success(`Logiciel SaaS activé : ${selected.toUpperCase()}`);
                            }}
                            className="bg-transparent border-none text-[9px] font-black font-mono text-indigo-700 uppercase tracking-widest focus:outline-none cursor-pointer outline-none p-0 pr-6"
                            title="Changer de logiciel de gestion SaaS"
                          >
                            <option value="boutique">🛒 Commerce / Boutique</option>
                            <option value="entreprise">🛠️ Service & Intervention</option>
                            <option value="chantier">🚧 BTP & Chantier</option>
                            <option value="transport">🚚 Flotte & Transport</option>
                            <option value="rh">👥 Ressources Humaines</option>
                            <option value="scolaire">🎓 Gestion Scolaire</option>
                            <option value="medical">🏥 Clinique & Médical</option>
                            <option value="pressing">🧺 Pressing & Laverie</option>
                            <option value="tailleur">🪡 Ateliers de Couture</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <NetworkStatusIndicator position="inline" plan={merchant.plan} />
              
              <button
                onClick={() => setActiveTab('acom_zone')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm ${
                  activeTab === 'acom_zone' 
                    ? 'bg-[#0a0a0a] text-white shadow-lg shadow-black/20 ring-2 ring-violet-500 scale-105' 
                    : 'bg-[#0a0a0a] text-white hover:bg-neutral-900 hover:scale-105'
                }`}
                title="Accéder à l'espace AcomZone"
              >
                <Store className="w-4 h-4 text-violet-400" />
                <span>AcomZone</span>
              </button>

              <button
                onClick={() => setActiveTab('build')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm ${
                  activeTab === 'build' ? 'bg-primary text-white shadow-primary/20' : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="hidden md:inline">App Desktop</span>
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Déconnexion</span>
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {Object.entries(
              tabs.reduce((acc, tab) => {
                const group = tab.group || 'Général';
                if (!acc[group]) acc[group] = [];
                acc[group].push(tab);
                return acc;
              }, {} as Record<string, any[]>)
            ).map(([groupName, groupTabs]) => (
              <div key={groupName} className="bg-white p-3 rounded-2xl border border-black/5 shadow-sm">
                {groupName !== 'Général' && tabs[0].group && (
                  <h4 className="text-[10px] font-black font-mono uppercase tracking-[0.2em] text-gray-400 mb-2 px-2">{groupName}</h4>
                )}
                <div className="flex overflow-x-auto whitespace-nowrap snap-x snap-mandatory gap-2 pb-1 -mx-1 px-1">
                  {(groupTabs as any[]).map((tab: any) => (
                    <div key={tab.id} className="snap-start shrink-0">
                      <TabButton 
                        active={activeTab === tab.id} 
                        onClick={() => setActiveTab(tab.id)} 
                        icon={tab.icon} 
                        label={tab.label} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <Suspense fallback={
          <div className="py-20 flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-10 h-10 animate-spin text-ink mb-4" />
            <p className="text-sm text-gray-500 font-medium font-sans">Chargement du module...</p>
          </div>
        }>
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && <MerchantDashboard key="dashboard" merchant={merchant} onUpdate={setMerchant} showUpgradeModal={showUpgradeModal} setShowUpgradeModal={setShowUpgradeModal} setActiveTab={setActiveTab} />}
            {activeTab === 'inventory' && <InventoryManager key="inventory" merchant={merchant} setShowUpgradeModal={setShowUpgradeModal} />}
            {activeTab === 'suppliers' && <SupplierManager key="suppliers" merchant={merchant} />}
            {activeTab === 'pos' && <MerchantPOS key="pos" merchant={merchant} setShowUpgradeModal={setShowUpgradeModal} />}
            {activeTab === 'audit' && <MerchantAuditLog key="audit" merchant={merchant} />}
            {activeTab === 'billing' && <MerchantBilling key="billing" merchant={merchant} />}
            {(activeTab === 'accounting' || activeTab.startsWith('fin_')) && <MerchantAccounting key="accounting" merchant={merchant} subTab={activeTab.startsWith('fin_') ? activeTab.replace('fin_', '') : undefined} />}
            {activeTab === 'cash_closure' && <CashClosureManager key="cash_closure" merchant={merchant} />}
            {activeTab === 'pressing_closure' && <PressingClosureManager key="pressing_closure" merchant={merchant} />}
            {activeTab === 'reports' && <MerchantReports key="reports" merchant={merchant} />}
            {activeTab === 'settings' && <MerchantSettings key="settings" merchant={merchant} onUpdate={(m) => setMerchant(m)} setActiveTab={setActiveTab} />}
            
            
            {/* Specialized SaaS Tabs */}
            {activeTab === 'interventions' && <ServiceManager key="interventions" merchant={merchant} />}
            {activeTab === 'projects' && <ProjectManager key="projects" merchant={merchant} />}
            {activeTab === 'vehicles' && <FleetManager key="vehicles" merchant={merchant} />}
            {activeTab === 'fleet_maintenance' && <FleetMaintenanceManager key="fleet_maintenance" merchant={merchant} />}
            {activeTab === 'employees' && <HRManager key="employees" merchant={merchant} />}
            {activeTab === 'alerte' && <AlertParentsManager key="alerte" merchant={merchant} />}
            {activeTab === 'students' && <SchoolManager key="students" merchant={merchant} />}
            {activeTab === 'teachers' && <TeacherManager key="teachers" merchant={merchant} />}
            {activeTab === 'classes' && <AcademicManager key="classes" merchant={merchant} />}
            {activeTab === 'schedule' && <SchoolScheduleManager key="schedule" merchantId={merchant.id} />}
            {activeTab === 'grades' && <TeacherGradePortal key="grades" merchant={merchant} />}
            {activeTab === 'parents' && <ParentsManager key="parents" merchant={merchant} />}
            {activeTab === 'student-portals' && <StudentPortalsManager key="student-portals" merchant={merchant} />}
            {activeTab === 'attendance' && <AttendanceManager key="attendance" merchant={merchant} />}
            {activeTab === 'communication' && <CommunicationManager key="communication" merchant={merchant} />}
            {activeTab === 'ai' && <AIEducationManager key="ai" merchant={merchant} />}
            {activeTab === 'patients' && <MedicalManager key="patients" merchant={merchant} />}
            {activeTab === 'appointments' && <AppointmentManager key="appointments" merchant={merchant} />}
            {activeTab === 'prescriptions' && <PrescriptionManager key="prescriptions" merchant={merchant} />}
            {activeTab === 'tailleur_clients' && <TailleurClientsManager key="tailleur_clients" merchant={merchant} />}
            {activeTab === 'tailleur_orders' && <TailleurOrdersManager key="tailleur_orders" merchant={merchant} />}
            {activeTab === 'tailleur_tissus' && <TailleurTissusManager key="tailleur_tissus" merchant={merchant} />}
            {activeTab === 'tailleur_boutique' && <TailleurBoutiqueManager key="tailleur_boutique" merchant={merchant} />}
            {activeTab === 'tailleur_gallery' && <TailleurGalleryManager key="tailleur_gallery" merchant={merchant} />}
            {activeTab === 'tailleur_artisans' && <TailleurArtisansManager key="tailleur_artisans" merchant={merchant} />}
            {activeTab === 'tailleur_mercerie' && <TailleurMercerieCostManager key="tailleur_mercerie" merchant={merchant} />}
            {activeTab === 'pressing_receipt' && <PressingReceiptManager key="pressing_receipt" merchant={merchant} />}
            {activeTab === 'pressing_delivery' && <PressingDeliveryManager key="pressing_delivery" merchant={merchant} />}
            {activeTab === 'pressing_stock' && <PressingStockManager key="pressing_stock" merchant={merchant} />}
            {activeTab === 'pressing_tarifs' && <PressingTarifsManager key="pressing_tarifs" merchant={merchant} />}
            {activeTab === 'acom_zone' && <AcomZoneMerchantPanel key="acom_zone" merchant={merchant} />}
          </AnimatePresence>
        </Suspense>

        {/* SaaS Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 font-medium">
          <p>© {new Date().getFullYear()} Acom Technologie. Tous droits réservés.</p>
          <a 
            href="mailto:contact.abdoulayendiaye@gmail.com" 
            className="hover:text-primary transition-colors mt-2 md:mt-0 flex items-center gap-1.5"
          >
            Support technique
          </a>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2.5 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
      active 
        ? 'bg-ink text-white shadow-xl shadow-ink/20 scale-105' 
        : 'text-gray-400 hover:text-ink hover:bg-gray-50'
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-primary' : ''}`} />
    <span>{label}</span>
  </button>
);



const PAYMENT_PLANS = [
  { id: 'FREE', name: 'TESTE', price: '0 FCFA', desc: 'Basique' },
  { id: 'BASIC', name: 'BASIC', price: '10.000 FCFA', desc: 'Essentiel' },
  { id: 'STANDARD', name: 'STANDARD', price: '25.000 FCFA', desc: 'Populaire' },
  { id: 'PREMIUM', name: 'PREMIUM', price: '45.000 FCFA', desc: 'Complet' },
  { id: 'LOCAL', name: 'LICENCE LOCALE', price: '350.000 FCFA', desc: 'A vie (Logiciel Local)' },
];

// --- Payment Pending View ---
const PaymentPendingView = ({ merchant, onPaymentSuccess }: { merchant: Merchant, onPaymentSuccess: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [showMockPayment, setShowMockPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRetryPayment = async () => {
    setLoading(true);
    // Simulate delay
    setTimeout(() => {
       setShowMockPayment(true);
       setLoading(false);
    }, 500);
  };

  const selectedPlan = PAYMENT_PLANS.find(p => p.id === merchant.plan);
  const amountStr = selectedPlan?.price.replace(/\D/g, '') || '0';
  const amountNum = parseInt(amountStr, 10);

  if (showMockPayment) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">CARTE BANCAIRE</h2>
                <p className="text-xs text-gray-500">Paiement Sécurisé (Mode Démo)</p>
              </div>
            </div>
            <button onClick={() => setShowMockPayment(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <div className="space-y-6">
             <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-indigo-600 uppercase tracking-tight">Montant à régler</span>
                  <span className="text-2xl font-black text-indigo-600">{amountNum.toLocaleString('fr-FR')} FCFA</span>
                </div>
             </div>

             <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Numéro de carte</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono placeholder:text-gray-300" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Expiration</label>
                    <input type="text" placeholder="MM/AA" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono placeholder:text-gray-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">CVC</label>
                    <input type="text" placeholder="123" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono placeholder:text-gray-300" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nom sur la carte</label>
                  <input type="text" placeholder="Nom du titulaire" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
                </div>
             </div>

             <div className="flex gap-3 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setShowMockPayment(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  disabled={isProcessing}
                  onClick={async () => {
                    if (isProcessing) return;
                    setIsProcessing(true);
                    try {
                      toast.loading("Validation en cours...", { id: 'payment' });
                      const updatedMerchant = { 
                        ...merchant, 
                        subscriptionStatus: 'active' as const,
                        updatedAt: new Date() 
                      };
                      await dbService.merchants.save(updatedMerchant);
                      toast.success("Paiement simulé avec succès !", { id: 'payment' });
                      setShowMockPayment(false);
                      onPaymentSuccess();
                    } catch (err) {
                      toast.error("Erreur de sauvegarde", { id: 'payment' });
                      setIsProcessing(false);
                    }
                  }}
                  className={`flex-1 ${isProcessing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'} text-white px-4 py-3 rounded-xl font-bold transition-colors flex items-center justify-center`}
                >
                  {isProcessing ? 'Traitement...' : `Payer ${amountNum.toLocaleString('fr-FR')} FCFA`}
                </button>
             </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <CreditCard className="w-16 h-16 text-primary mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-4">Paiement en attente</h2>
        <p className="mb-6 text-gray-600">Votre compte est en attente de paiement pour le plan {merchant.plan}. Veuillez compléter le paiement pour activer votre espace.</p>
        <button 
          onClick={handleRetryPayment}
          disabled={loading}
          className="w-full bg-primary text-white py-3 px-4 rounded-xl font-bold hover:bg-primary/90 transition-all"
        >
          {loading ? 'Redirection...' : 'Payer maintenant'}
        </button>
      </div>
    </div>
  );
}

// --- Onboarding ---

// --- Dashboard ---
import { PlanUpgradeModal } from '../components/PlanUpgradeModal';

// Refactored: AlertParentsManager is now imported from src/modules/scolaire/components/AlertParentsManager.tsx

// --- Merchant POS ---


// --- Merchant Audit Log ---
const MerchantAuditLog = ({ merchant }: { merchant: Merchant }) => {
  const [auditLimit, setAuditLimit] = useState(10);
  const products = useLiveQuery(() => 
    db.products.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const movements = useLiveQuery(() => 
    db.movements.where('merchantId').equals(merchant.id).reverse().toArray()
  , [merchant.id]) || [];

  const loading = false;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Journal d'Audit</h2>
          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Traçabilité complète des flux de stock</p>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 bg-white border border-black/5 rounded-xl shadow-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Temps Réel</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-4 sm:px-8 py-3 md:py-5">Horodatage</th>
                  <th className="px-4 sm:px-8 py-3 md:py-5">Produit</th>
                  <th className="px-4 sm:px-8 py-3 md:py-5">Type de Flux</th>
                  <th className="px-4 sm:px-8 py-3 md:py-5">Quantité</th>
                  <th className="px-4 sm:px-8 py-3 md:py-5">Delta Stock</th>
                  <th className="px-4 sm:px-8 py-3 md:py-5">Motif / Raison</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.slice(0, auditLimit).map((m: any) => {
                  const product = products.find(p => p.id === m.productId);
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-4 sm:px-8 py-4 sm:py-5">
                        <p className="text-[11px] font-mono font-bold text-gray-400">
                          {m.createdAt?.seconds ? format(new Date(m.createdAt.seconds * 1000), 'dd.MM.yyyy') : '--'}
                        </p>
                        <p className="text-[10px] font-mono text-gray-300">
                          {m.createdAt?.seconds ? format(new Date(m.createdAt.seconds * 1000), 'HH:mm:ss') : '--'}
                        </p>
                      </td>
                      <td className="px-4 sm:px-8 py-4 sm:py-5 max-w-[150px] sm:max-w-[200px]">
                        <p className="font-bold text-gray-900 text-sm leading-tight truncate">{product?.name || 'Produit supprimé'}</p>
                        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter mt-0.5 truncate">ID: {m.productId.slice(0, 8)}</p>
                      </td>
                      <td className="px-4 sm:px-8 py-4 sm:py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          m.type === 'in' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          m.type === 'sale' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-600 border-gray-100'
                        }`}>
                          {m.type === 'in' ? 'ENTRÉE' : m.type === 'sale' ? 'VENTE' : m.type}
                        </span>
                      </td>
                      <td className="px-4 sm:px-8 py-4 sm:py-5">
                        <div className={`flex items-center font-mono font-black text-sm ${m.type === 'in' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {m.type === 'in' ? <Plus className="w-3 h-3 mr-1" /> : <Minus className="w-3 h-3 mr-1" />}
                          {m.quantity}
                        </div>
                      </td>
                      <td className="px-4 sm:px-8 py-4 sm:py-5">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-mono text-gray-400">{m.previousQuantity}</span>
                          <ArrowRight className="w-3 h-3 text-gray-300" />
                          <span className="text-[11px] font-mono font-black text-ink">{m.newQuantity}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-8 py-4 sm:py-5">
                        <p className="text-xs text-gray-500 italic leading-relaxed max-w-[150px] sm:max-w-xs line-clamp-2">{m.reason || 'Aucune raison spécifiée'}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {movements.length > auditLimit && (
              <div className="p-4 flex justify-center border-t border-gray-100">
                <button 
                  onClick={() => setAuditLimit(prev => prev + 10)}
                  className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                >
                  Voir plus
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// --- Merchant Accounting ---


// --- Merchant Sales History ---
// --- Merchant Billing (Invoices & Quotes) ---

// --- Merchant Payment Modal ---

// --- Supplier Manager ---

// --- Merchant Reports ---


// --- Merchant Quote Modal ---

// --- Merchant Settings ---

// --- Specialized SaaS Managers ---

// 1. Service Manager (Gestion des services)

// 2. Project Manager (Gestion de chantier)

// 3. Fleet Manager (Gestion de transport et de flotte)

// 4. HR Manager (Gestion des ressources humaines)

// Refactored: TeacherGradePortal is now imported from src/modules/scolaire/components/TeacherGradePortal.tsx
// Refactored: TeacherManager is now imported from src/modules/scolaire/components/TeacherManager.tsx
// Refactored: AcademicManager is now imported from src/modules/scolaire/components/AcademicManager.tsx
// Refactored: ParentsManager is now imported from src/modules/scolaire/components/ParentsManager.tsx
// Refactored: AttendanceManager is now imported from src/modules/scolaire/components/AttendanceManager.tsx
// Refactored: CommunicationManager is now imported from src/modules/scolaire/components/CommunicationManager.tsx
// Refactored: AIEducationManager is now imported from src/modules/scolaire/components/AIEducationManager.tsx
// Refactored: StudentAcademicRecord is now imported from src/modules/scolaire/components/StudentAcademicRecord.tsx
// Refactored: StudentRegisterFormModal is now imported from src/modules/scolaire/components/StudentRegisterFormModal.tsx
// Refactored: SchoolManager is now imported from src/modules/scolaire/components/SchoolManager.tsx
// 6. Medical Manager & 7. Appointment Manager are now imported from src/modules/medical/components/


export default MerchantSaaS;
