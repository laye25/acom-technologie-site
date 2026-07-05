import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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

import { geminiService } from '../../../services/geminiService';
export const StudentAcademicRecord = ({ student, merchant, onClose }: { student: any, merchant: Merchant, onClose: () => void }) => {
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'grades' | 'attendance' | 'finance' | 'parent' | 'ai'>('summary');
  const academicPeriods = merchant.academicPeriods || ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'];
  const [selectedPeriod, setSelectedPeriod] = useState(academicPeriods[0]);
  
  // 1. Data Subscriptions
  const allGrades = useLiveQuery(() => 
    db.grades?.where('studentId').equals(student.id).toArray()
  , [student.id]) || [];
  
  const grades = React.useMemo(() => {
    return allGrades.filter((g: any) => g.term === selectedPeriod);
  }, [allGrades, selectedPeriod]);

  // Subscriptions to compute accurate rankings and Senegal Report Card statistics
  const allMerchantStudents = useLiveQuery(() => 
    db.students?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const allMerchantGrades = useLiveQuery(() => 
    db.grades?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const allMerchantClasses = useLiveQuery(() => 
    db.classes?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const parentCredentials = useLiveQuery(async () => {
    const parentPhone = student.fatherPhone || student.motherPhone || student.guardianPhone || student.parentContact || '';
    if (!parentPhone) return null;
    return await db.parents?.where('phone').equals(parentPhone).first();
  }, [student]) || null;

  // Find class object corresponding to student's class
  const studentClassObj = React.useMemo(() => {
    return allMerchantClasses.find((c: any) => c.name === student.grade);
  }, [allMerchantClasses, student.grade]);

  // Filter students in the same class
  const classStudents = React.useMemo(() => {
    return allMerchantStudents.filter((s: any) => s.grade === student.grade);
  }, [allMerchantStudents, student.grade]);

  // Compute school-year standard coefficients
  const getSubjectCoef = (subjectName: string, gradeName: string) => {
    // If a custom coefficient has been configured for this class and subject, return it immediately
    if (studentClassObj?.subjectCoefs && studentClassObj.subjectCoefs[subjectName] !== undefined) {
      const customCoef = parseFloat(studentClassObj.subjectCoefs[subjectName]);
      if (!isNaN(customCoef)) return customCoef;
    }

    const sName = (subjectName || '').toLowerCase();
    const gName = (gradeName || '').toLowerCase();
    const isSci = gName.includes('s') || gName.includes('agro') || gName.includes('sc') || gName.includes('seconde');
    const isLit = gName.includes('l') || gName.includes('liter');
    
    if (sName.includes('math')) return isSci ? 5 : 2;
    if (sName.includes('physique') || sName.includes('chimie') || sName.includes('science ph')) return isSci ? 5 : 2;
    if (sName.includes('svt') || sName.includes('vie') || sName.includes('nature') || sName.includes('biologie')) return isSci ? 5 : 2;
    if (sName.includes('fran') || sName.includes('lett')) return isLit ? 5 : 3;
    if (sName.includes('anglais') || sName.includes('english')) return isLit ? 4 : 3;
    if (sName.includes('hist') || sName.includes('géo') || sName.includes('geo')) return isLit ? 4 : 3;
    if (sName.includes('philosoph')) return isLit ? 6 : 2;
    if (sName.includes('espagnol') || sName.includes('allemand') || sName.includes('arabe') || sName.includes('lv2')) return isLit ? 3 : 2;
    if (sName.includes('eps') || sName.includes('physique et spor') || sName.includes('sport')) return 1;
    return 2;
  };

  // Helper to compute a single overall average for any student in this period
  const computeStudentPeriodStats = React.useCallback((studentId: string, period: string) => {
    const sGrades = allMerchantGrades.filter((g: any) => g.studentId === studentId && g.term === period);
    if (sGrades.length === 0) return { overall: NaN, totalCoef: 0, totalWeightedPoints: 0, subjectAverages: {} };
    
    let totalCoef = 0;
    let totalWeightedPoints = 0;
    const subjectAverages: Record<string, number> = {};

    sGrades.forEach((g: any) => {
      // Inline grade calculator mimicking Senegal high school grade averages
      let dev1 = parseFloat(g.devoir1);
      let dev2 = parseFloat(g.devoir2);
      let compo = parseFloat(g.compo);
      let countDev = 0;
      let sumDev = 0;
      if (!isNaN(dev1)) { sumDev += dev1; countDev++; }
      if (!isNaN(dev2)) { sumDev += dev2; countDev++; }
      let devAvg = countDev > 0 ? sumDev / countDev : NaN;
      
      let subjectAvg = NaN;
      if (!isNaN(compo)) {
        if (!isNaN(devAvg)) {
          subjectAvg = (devAvg + compo) / 2;
        } else {
          subjectAvg = compo;
        }
      } else if (!isNaN(devAvg)) {
        subjectAvg = devAvg;
      }

      if (!isNaN(subjectAvg)) {
        const coef = getSubjectCoef(g.subjectId, student.grade);
        totalCoef += coef;
        totalWeightedPoints += subjectAvg * coef;
        subjectAverages[g.subjectId] = subjectAvg;
      }
    });

    const overall = totalCoef > 0 ? totalWeightedPoints / totalCoef : NaN;
    return { overall, totalCoef, totalWeightedPoints, subjectAverages };
  }, [allMerchantGrades, student.grade]);

  // Rankings of all students in the class for each subject and overall
  const classStats = React.useMemo(() => {
    if (classStudents.length === 0) return { studentOverallRank: '1er', classOverallAvg: '10.00', subjectStats: {} };

    // 1. Calculate overall averages for all students in the class
    const studentAverages = classStudents.map((s: any) => {
      const stats = computeStudentPeriodStats(s.id, selectedPeriod);
      return { studentId: s.id, ...stats };
    });

    // 2. Sort to find student's overall rank
    const sortedOverall = studentAverages
      .filter(x => !isNaN(x.overall))
      .sort((a, b) => b.overall - a.overall);

    const matchIdx = sortedOverall.findIndex(x => x.studentId === student.id);
    const overallRank = matchIdx !== -1 ? `${matchIdx + 1}${matchIdx === 0 ? 'er' : 'ème'}` : '---';
    
    // Average overall of the class
    const classAvg = sortedOverall.length > 0
      ? (sortedOverall.reduce((sum, x) => sum + x.overall, 0) / sortedOverall.length).toFixed(2)
      : '9.87';

    // 3. Subject-level ranks and averages
    const subjectStats: Record<string, { classAvg: string, studentRank: string }> = {};

    // Get all unique subject names for these grades
    const classPeriodGrades = allMerchantGrades.filter((g: any) => 
      g.term === selectedPeriod && 
      classStudents.some((s: any) => s.id === g.studentId)
    );

    const subjects = Array.from(new Set(classPeriodGrades.map((g: any) => g.subjectId)));

    subjects.forEach((subjectId: string) => {
      const gradesForSubject = classPeriodGrades.filter((g: any) => g.subjectId === subjectId);
      
      // Map and sort subject averages for ranking
      const sortedSubjectGrades = gradesForSubject
        .map((g: any) => {
          let dev1 = parseFloat(g.devoir1);
          let dev2 = parseFloat(g.devoir2);
          let compo = parseFloat(g.compo);
          let countDev = 0;
          let sumDev = 0;
          if (!isNaN(dev1)) { sumDev += dev1; countDev++; }
          if (!isNaN(dev2)) { sumDev += dev2; countDev++; }
          let devAvg = countDev > 0 ? sumDev / countDev : NaN;
          
          let subjectAvg = NaN;
          if (!isNaN(compo)) {
            if (!isNaN(devAvg)) {
              subjectAvg = (devAvg + compo) / 2;
            } else {
              subjectAvg = compo;
            }
          } else if (!isNaN(devAvg)) {
            subjectAvg = devAvg;
          }
          return { studentId: g.studentId, avg: subjectAvg };
        })
        .filter(x => !isNaN(x.avg))
        .sort((a, b) => b.avg - a.avg);

      const subjClassAvg = sortedSubjectGrades.length > 0
        ? (sortedSubjectGrades.reduce((sum, x) => sum + x.avg, 0) / sortedSubjectGrades.length).toFixed(2)
        : '10.00';

      const studentSubjIdx = sortedSubjectGrades.findIndex(x => x.studentId === student.id);
      let studentSubjRank = '---';
      if (studentSubjIdx !== -1) {
        studentSubjRank = `${studentSubjIdx + 1}ex`;
      }

      subjectStats[subjectId] = {
        classAvg: subjClassAvg,
        studentRank: studentSubjRank
      };
    });

    return {
      studentOverallRank: overallRank,
      classOverallAvg: classAvg,
      subjectStats
    };
  }, [classStudents, selectedPeriod, student.id, computeStudentPeriodStats, allMerchantGrades]);

  const studentPeriodStats = React.useMemo(() => {
    return computeStudentPeriodStats(student.id, selectedPeriod);
  }, [computeStudentPeriodStats, student.id, selectedPeriod]);

  const weightedOverallAvg = React.useMemo(() => {
    return isNaN(studentPeriodStats.overall) ? '-' : studentPeriodStats.overall.toFixed(2);
  }, [studentPeriodStats.overall]);

  const periodicSummaries = React.useMemo(() => {
    return academicPeriods.map(period => {
      const stats = computeStudentPeriodStats(student.id, period);
      // compute rankings for this period
      const periodSortedOverall = classStudents.map((s: any) => {
        const sStats = computeStudentPeriodStats(s.id, period);
        return { studentId: s.id, overall: sStats.overall };
      }).filter(x => !isNaN(x.overall)).sort((a, b) => b.overall - a.overall);

      const rankIdx = periodSortedOverall.findIndex(x => x.studentId === student.id);
      const rank = rankIdx !== -1 ? `${rankIdx + 1}${rankIdx === 0 ? 'er' : 'ème'}` : '---';

      const classAvg = periodSortedOverall.length > 0
        ? (periodSortedOverall.reduce((sum, x) => sum + x.overall, 0) / periodSortedOverall.length).toFixed(2)
        : '---';

      return {
        period,
        avg: isNaN(stats.overall) ? '-' : stats.overall.toFixed(2),
        rank,
        classAvg
      };
    });
  }, [academicPeriods, classStudents, computeStudentPeriodStats, student.id]);

  const annualAverageStats = React.useMemo(() => {
    const validPeriods = periodicSummaries.filter(p => p.avg !== '-');
    if (validPeriods.length === 0) return { avg: '-', rank: '---', classAvg: '---' };
    const avgVal = (validPeriods.reduce((sum, p) => sum + parseFloat(p.avg), 0) / validPeriods.length);
    const avg = avgVal.toFixed(2);
    
    // Calculate annual rank in the class
    const sortedAnnual = classStudents.map((s: any) => {
      const pScores = academicPeriods.map(period => {
        const stats = computeStudentPeriodStats(s.id, period);
        return stats.overall;
      }).filter(v => !isNaN(v));
      const annAvg = pScores.length > 0 ? pScores.reduce((sum, v) => sum + v, 0) / pScores.length : NaN;
      return { studentId: s.id, annAvg };
    }).filter(x => !isNaN(x.annAvg)).sort((a, b) => b.annAvg - a.annAvg);

    const rankIdx = sortedAnnual.findIndex(x => x.studentId === student.id);
    const rank = rankIdx !== -1 ? `${rankIdx + 1}${rankIdx === 0 ? 'er' : 'ème'}` : '---';

    const classAvg = sortedAnnual.length > 0
      ? (sortedAnnual.reduce((sum, x) => sum + x.annAvg, 0) / sortedAnnual.length).toFixed(2)
      : '---';

    return { avg, rank, classAvg };
  }, [periodicSummaries, classStudents, academicPeriods, computeStudentPeriodStats, student.id]);

  const attendances = useLiveQuery(() => 
    db.attendance?.where('studentId').equals(student.id).toArray()
  , [student.id]) || [];

  const aiInsights = useLiveQuery(() =>
    db.ai_insights?.where('studentId').equals(student.id).toArray()
  , [student.id]) || [];

  const sales = useLiveQuery(() => 
    db.sales?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const parents = useLiveQuery(() =>
    db.parents?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const communications = useLiveQuery(() =>
    db.communications?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  // 2. Calculations & Integrations Matchers
  const dbClasses = useLiveQuery(() => 
    db.classes?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const studentPayments = useMemo(() => {
    const list: any[] = [];
    const seenReceipts = new Set<string>();

    // 1. Gather and normalize internal payments stored in student profile
    if (student?.tuitionPayments) {
      student.tuitionPayments.forEach((p: any) => {
        const rc = p.receiptNumber || `PAY-${p.id}`;
        if (!seenReceipts.has(rc)) {
          seenReceipts.add(rc);
          list.push({
            id: p.id,
            receiptNumber: rc,
            amount: p.amount,
            paidAmount: p.amount, // normalize for UI reducing
            category: p.category || "Versement scolarité",
            mode: p.mode || "Espèces",
            date: p.date,
          });
        }
      });
    }

    // 2. Add ledger matches from global Sales database
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase().trim();
    sales.forEach((s: any) => {
      const rc = s.receiptNumber || `REC-${s.id.slice(0, 8)}`;
      if (seenReceipts.has(rc)) return;

      const matchCustomer = s.clientName?.toLowerCase().trim() === fullName ||
                            s.customerName?.toLowerCase().trim() === fullName || 
                           (s.customerPhone && student.parentContact && s.customerPhone === student.parentContact) ||
                           (s.clientPhone && student.parentContact && s.clientPhone === student.parentContact);
      const matchItems = s.items?.some((i: any) => 
        i.name?.toLowerCase().includes("scolarité") || 
        i.name?.toLowerCase().includes("frais") || 
        i.name?.toLowerCase().includes("inscription") || 
        i.name?.toLowerCase().includes("écolage") ||
        i.name?.toLowerCase().includes(student.lastName.toLowerCase())
      );

      if (matchCustomer || matchItems) {
        seenReceipts.add(rc);
        list.push({
          id: s.id,
          receiptNumber: rc,
          amount: s.totalAmount || s.paidAmount || 0,
          paidAmount: s.paidAmount || s.totalAmount || 0,
          category: s.items?.[0]?.name || "Frais Scolaires",
          mode: s.paymentMode || s.paymentMethod || "Espèces",
          date: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
        });
      }
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, student]);

  const totalPaid = useMemo(() => {
    return studentPayments.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
  }, [studentPayments]);

  const [customSchoolingTarget, setCustomSchoolingTarget] = useState<number | null>(() => {
    const saved = localStorage.getItem(`schooling_target_${student.id}`);
    return saved ? parseInt(saved, 10) : null;
  });

  const computedSchoolingTarget = useMemo(() => {
    const pricing: any = merchant.schoolPricing || {};
    const fallback = {
      inscription: 25000,
      scolarite: 135000,
      uniforme: 15000,
      transport: 150000,
      cantine: 90000,
      internat: 0,
      monthsDuration: 9,
      hasTransport: false,
      hasCanteen: false,
      hasInternat: false,
    };

    const mapConfig = (cfg: any) => {
      const hasTransport = cfg.hasTransport !== undefined ? !!cfg.hasTransport : true;
      const hasCanteen = cfg.hasCanteen !== undefined ? !!cfg.hasCanteen : true;
      const hasInternat = cfg.hasInternat !== undefined ? !!cfg.hasInternat : (Number((cfg.annualInternat || '').toString().replace(/\D/g, '')) > 0 || Number(cfg.internat || 0) > 0);
      return {
        inscription: Number((cfg.registrationFee || '').toString().replace(/\D/g, '') || fallback.inscription),
        scolarite: Number((cfg.annualTuition || '').toString().replace(/\D/g, '') || fallback.scolarite),
        uniforme: Number((cfg.uniformFee || '').toString().replace(/\D/g, '') || fallback.uniforme),
        transport: hasTransport ? Number((cfg.annualTransport || '').toString().replace(/\D/g, '') || fallback.transport) : 0,
        cantine: hasCanteen ? Number((cfg.annualCanteen || '').toString().replace(/\D/g, '') || fallback.cantine) : 0,
        cantineInterne: Number((cfg.annualCanteenInterne || cfg.cantineInterne || cfg.annualCanteen || '').toString().replace(/\D/g, '') || fallback.cantine),
        internat: hasInternat ? Number((cfg.annualInternat || '').toString().replace(/\D/g, '') || cfg.internat || fallback.internat) : 0,
        hasTransport,
        hasCanteen,
        hasInternat,
        monthsDuration: Number((cfg.monthsDuration || '').toString().replace(/\D/g, '') || fallback.monthsDuration)
      };
    };

    const normalizeStr = (str: string) => {
      if (!str) return '';
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    };

    let baseFees: any = null;
    if (pricing?.exceptions?.[student.id]) {
      baseFees = mapConfig(pricing.exceptions[student.id]);
    }

    if (!baseFees) {
      const classKey = student.classId || student.class_id || student.class || student.grade;
      if (classKey && pricing?.classes?.[classKey]) {
        baseFees = mapConfig(pricing.classes[classKey]);
      } else {
        const matchedClass = dbClasses.find(c => c.name === classKey || c.id === classKey);
        if (matchedClass && pricing?.classes?.[matchedClass.id]) {
          baseFees = mapConfig(pricing.classes[matchedClass.id]);
        } else if (matchedClass && pricing?.classes?.[matchedClass.name]) {
          baseFees = mapConfig(pricing.classes[matchedClass.name]);
        }
      }
    }

    if (!baseFees) {
      const gradeStr = normalizeStr(student.grade || student.class || '');
      let levelKey = '';
      if (gradeStr.includes('mat') || gradeStr.includes('crech') || gradeStr.includes('garde') || gradeStr.includes('maternelle')) {
        levelKey = 'Maternelle';
      } else if (gradeStr.includes('ci') || gradeStr.includes('cp') || gradeStr.includes('ce1') || gradeStr.includes('ce2') || gradeStr.includes('cm1') || gradeStr.includes('cm2') || gradeStr.includes('prim')) {
        levelKey = 'Primaire';
      } else if (gradeStr.includes('6e') || gradeStr.includes('5e') || gradeStr.includes('4e') || gradeStr.includes('3e') || gradeStr.includes('colleg')) {
        levelKey = 'Collège';
      } else if (gradeStr.includes('second') || gradeStr.includes('premier') || gradeStr.includes('terminal') || gradeStr.includes('lyce') || gradeStr.includes('2nd') || gradeStr.includes('1er') || gradeStr.includes('tle') || gradeStr.includes('l2')) {
        levelKey = 'Lycée';
      } else if (gradeStr.includes('pro') || gradeStr.includes('format')) {
        levelKey = 'Formation Professionnelle';
      }

      if (levelKey && pricing?.levels?.[levelKey]) {
        baseFees = mapConfig(pricing.levels[levelKey]);
      }
    }

    let hasTransport = baseFees ? baseFees.hasTransport : fallback.hasTransport;
    if (student.hasTransport !== undefined) {
      hasTransport = !!student.hasTransport;
    } else if (student.serviceTransport !== undefined) {
      hasTransport = !!student.serviceTransport;
    }

    let hasCanteen = baseFees ? baseFees.hasCanteen : fallback.hasCanteen;
    if (student.hasCanteen !== undefined) {
      hasCanteen = !!student.hasCanteen;
    } else if (student.serviceCantine !== undefined) {
      hasCanteen = !!student.serviceCantine;
    }

    let hasInternat = baseFees ? baseFees.hasInternat : fallback.hasInternat;
    if (student.hasInternat !== undefined) {
      hasInternat = !!student.hasInternat;
    } else if (student.serviceInternat !== undefined) {
      hasInternat = !!student.serviceInternat;
    } else if (student.regime !== undefined) {
      hasInternat = (student.regime === 'interne');
    }

    const rawTransport = student.annualTransport !== undefined ? Number(String(student.annualTransport).replace(/\D/g, '')) : (baseFees ? baseFees.transport : fallback.transport);
    const rawCanteen = student.annualCanteen !== undefined ? Number(String(student.annualCanteen).replace(/\D/g, '')) : (baseFees ? (student.regime === 'interne' ? (baseFees.cantineInterne || baseFees.cantine) : baseFees.cantine) : fallback.cantine);
    const rawInternat = student.annualInternat !== undefined ? Number(String(student.annualInternat).replace(/\D/g, '')) : (baseFees ? baseFees.internat : fallback.internat);

    const transportValue = hasTransport ? rawTransport : 0;
    const canteenValue = hasCanteen ? rawCanteen : 0;
    const internatValue = hasInternat ? rawInternat : 0;

    const currentResult = {
      ...(baseFees || fallback),
      transport: transportValue,
      cantine: canteenValue,
      internat: internatValue,
      hasTransport,
      hasCanteen,
      hasInternat,
    };

    if (student.registrationFee !== undefined) {
      currentResult.inscription = Number(String(student.registrationFee).replace(/\D/g, '')) || currentResult.inscription;
    }
    if (student.annualTuition !== undefined) {
      currentResult.scolarite = Number(String(student.annualTuition).replace(/\D/g, '')) || currentResult.scolarite;
    }
    if (student.uniformFee !== undefined) {
      currentResult.uniforme = Number(String(student.uniformFee).replace(/\D/g, '')) || currentResult.uniforme;
    }
    if (student.annualInternat !== undefined) {
      currentResult.internat = hasInternat ? (Number(String(student.annualInternat).replace(/\D/g, '')) || currentResult.internat) : 0;
    }

    return (
      (currentResult.inscription || 0) +
      (currentResult.scolarite || 0) +
      (currentResult.uniforme || 0) +
      (currentResult.transport || 0) +
      (currentResult.cantine || 0) +
      (currentResult.internat || 0)
    );
  }, [merchant.schoolPricing, dbClasses, student]);

  const schoolingTarget = customSchoolingTarget !== null ? customSchoolingTarget : computedSchoolingTarget;

  const handleUpdateTarget = (val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      setCustomSchoolingTarget(num);
      localStorage.setItem(`schooling_target_${student.id}`, num.toString());
      toast.success("Objectif de scolarité mis à jour");
    }
  };

  const studentParent = useMemo(() => {
    return parents.find(p => p.studentId === student.id || p.phone === student.parentContact || (p.email && p.email === student.email));
  }, [parents, student]);

  const studentComms = useMemo(() => {
    return communications.filter(c => c.studentId === student.id || c.recipientPhone === student.parentContact);
  }, [communications, student]);

  // Attendance Metrics
  const totalAbsences = attendances.filter(a => a.status === 'absent').length;
  const totalLates = attendances.filter(a => a.status === 'late').length;
  const attendanceRate = useMemo(() => {
    const totalDays = attendances.length;
    if (totalDays === 0) return 100;
    const presents = attendances.filter(a => a.status === 'present' || a.status === 'recorded').length;
    return Math.round((presents / totalDays) * 100);
  }, [attendances]);

  // Grade Metrics
  const calculateAverage = (gradeObj: any) => {
    if(!gradeObj) return '-';
    let dev1 = parseFloat(gradeObj.devoir1);
    let dev2 = parseFloat(gradeObj.devoir2);
    let compo = parseFloat(gradeObj.compo);
    
    let countDev = 0;
    let sumDev = 0;
    if(!isNaN(dev1)) { sumDev += dev1; countDev++; }
    if(!isNaN(dev2)) { sumDev += dev2; countDev++; }
    
    let devAvg = countDev > 0 ? sumDev / countDev : 0;
    
    if(!isNaN(compo) && countDev > 0) {
      return ((devAvg + (compo * 2)) / 3).toFixed(2);
    }
    
    if (countDev > 0) return devAvg.toFixed(2);
    return '-';
  };

  const courseAverages = useMemo(() => {
    return grades.map(g => ({
      subject: g.subjectId,
      average: calculateAverage(g)
    }));
  }, [grades]);

  const overallAvg = useMemo(() => {
    const valid = courseAverages.filter(c => c.average !== '-').map(c => parseFloat(c.average));
    if (valid.length === 0) return '-';
    return (valid.reduce((sum, val) => sum + val, 0) / valid.length).toFixed(2);
  }, [courseAverages]);

  // 3. User Forms States
  const [isAddingParent, setIsAddingParent] = useState(false);
  const [parentForm, setParentForm] = useState({ firstName: '', lastName: '', phone: student.parentContact || '', email: '', relation: 'Père' });
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', method: 'cash', category: 'Mensualité', month: 'Octobre' });
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  
  const [customMsgTitle, setCustomMsgTitle] = useState('Message Spécial Administration');
  const [customMsgContent, setCustomMsgContent] = useState('');
  const [activeAdminDispatch, setActiveAdminDispatch] = useState<{
    phone: string;
    message: string;
    studentName: string;
    title: string;
  } | null>(null);

  const safeFormatDate = (dateVal: any, formatPattern: string) => {
    if (!dateVal) return '---';
    try {
      return format(new Date(dateVal), formatPattern, { locale: fr });
    } catch {
      return dateVal || '---';
    }
  };

  const generateFullDossierHtml = () => {
    const fullName = `${student.firstName} ${student.lastName}`;
    const matricule = student.matricule || student.id?.substring(0, 8) || '---';
    const dateStr = safeFormatDate(new Date(), 'dd/MM/yyyy HH:mm');
    
    // Compute stats
    const totalPaidVal = totalPaid;
    const remainingVal = Math.max(0, schoolingTarget - totalPaid);
    
    // Grades Rows
    let gradesRowsHtml = '';
    if (grades.length === 0) {
      gradesRowsHtml = `<tr><td colspan="5" style="padding: 12px; text-align: center; color: #64748b;">Aucune note enregistrée</td></tr>`;
    } else {
      grades.forEach((g: any) => {
        gradesRowsHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px; font-weight: bold; color: #1e293b; text-align: left;">${g.subjectId}</td>
            <td style="padding: 12px; text-align: center; font-family: monospace;">${g.devoir1 || '-'}</td>
            <td style="padding: 12px; text-align: center; font-family: monospace;">${g.devoir2 || '-'}</td>
            <td style="padding: 12px; text-align: center; font-family: monospace; color: #4f46e5; font-weight: bold;">${g.compo || '-'}</td>
            <td style="padding: 12px; text-align: center; font-family: monospace; font-weight: 900; background-color: #f8fafc;">${calculateAverage(g)}</td>
          </tr>
        `;
      });
    }

    // Attendance HTML
    let attendanceRowsHtml = '';
    if (attendances.length === 0) {
      attendanceRowsHtml = `<tr><td colspan="3" style="padding: 16px; text-align: center; color: #64748b;">Aucune absence ou retard signalé. Présence à 100%.</td></tr>`;
    } else {
      attendances.forEach((a: any) => {
        const dateVal = safeFormatDate(a.date, 'dd/MM/yyyy');
        const badgeColor = a.status === 'absent' ? '#ef4444' : a.status === 'late' ? '#eab308' : '#10b981';
        const badgeBg = a.status === 'absent' ? '#fee2e2' : a.status === 'late' ? '#fef9c3' : '#d1fae5';
        const statusText = a.status === 'absent' ? 'ABSENT' : a.status === 'late' ? 'RETARD' : 'PRÉSENT';
        attendanceRowsHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
            <td style="padding: 12px; text-align: left;"><strong>${dateVal}</strong></td>
            <td style="padding: 12px; text-align: left; color: #475569;">Classe: ${a.classId || student.grade || '---'}</td>
            <td style="padding: 12px; text-align: right;">
              <span style="font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; background-color: ${badgeBg}; color: ${badgeColor};">${statusText}</span>
            </td>
          </tr>
        `;
      });
    }

    // Finances HTML
    let financialRowsHtml = '';
    if (studentPayments.length === 0) {
      financialRowsHtml = `<tr><td colspan="4" style="padding: 12px; text-align: center; color: #64748b;">Aucun versement de scolarité enregistré.</td></tr>`;
    } else {
      studentPayments.forEach((p: any) => {
        const payDate = p.createdAt ? safeFormatDate(p.createdAt, 'dd/MM/yyyy à HH:mm') : '---';
        financialRowsHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px; text-align: left;"><strong>${p.items?.[0]?.name || 'Frais de Scolarité'}</strong><br><span style="font-size: 10px; color: #94a3b8;">REF: ${p.id?.substring(0,8)}</span></td>
            <td style="padding: 12px; font-family: monospace; font-weight: bold; color: #10b981; text-align: left;">+${(p.paidAmount || p.totalAmount || 0).toLocaleString()} FCFA</td>
            <td style="padding: 12px; text-align: center; font-family: monospace; font-size: 11px; text-transform: uppercase;">${p.paymentMethod || 'cash'}</td>
            <td style="padding: 12px; text-align: right; color: #64748b; font-size: 11px;">${payDate}</td>
          </tr>
        `;
      });
    }

    // Document Checklist HTML
    const docs = [
      { key: 'docBirthCert', label: 'Extrait d\'acte de naissance' },
      { key: 'docSchoolCert', label: 'Certificat de scolarité' },
      { key: 'docPrevReport', label: 'Bulletins de notes de l\'année dernière' },
      { key: 'docIdentityPhotos', label: 'Photos d\'identité' },
      { key: 'docMedicalCert', label: 'Certificat médical d\'aptitude' },
      { key: 'docIdentityCard', label: 'Copie de la carte d\'identité' },
      { key: 'docReceipt', label: 'Quittance de paiement des frais d\'inscription' }
    ];

    let docChecklistHtml = '';
    docs.forEach(d => {
      const checked = student[d.key] ? '✅ Reçu' : '❌ Non fourni';
      const color = student[d.key] ? '#10b981' : '#ef4444';
      docChecklistHtml += `
        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #f1f5f9; font-size: 13px;">
          <span style="color: #475569;">${d.label}</span>
          <span style="font-weight: bold; color: ${color};">${checked}</span>
        </div>
      `;
    });

    const aiText = aiInsights.length > 0 ? aiInsights[0].content : "Aucun bulletin d'appréciation IA n'a encore été consolidé pour cet élève.";

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dossier Académique Complet - ${fullName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
          
          body {
            font-family: 'Inter', sans-serif;
            background-color: #f1f5f9;
            color: #0f172a;
            margin: 0;
            padding: 40px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 25px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print-btn-bar {
            background-color: #f8fafc;
            padding: 15px 40px;
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            width: 100%;
            max-width: 210mm;
            box-sizing: border-box;
          }

          .btn {
            background-color: #4f46e5;
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 10px 20px;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }

          .btn-secondary {
            background-color: #ffffff;
            color: #475569;
            border: 1px solid #cbd5e1;
          }

          .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          }

          .pdf-pages-container {
            display: flex;
            flex-direction: column;
            gap: 30px;
            width: 100%;
            align-items: center;
          }

          .pdf-page {
            background-color: #ffffff;
            width: 210mm;
            height: 297mm;
            box-sizing: border-box;
            padding: 20mm 18mm 15mm 18mm;
            position: relative;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
          }

          .page-header {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .page-header-compact {
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .badge-status {
            background-color: #10b981;
            color: #ffffff;
            font-size: 9px;
            font-weight: 800;
            padding: 5px 12px;
            border-radius: 9999px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }

          .page-footer {
            position: absolute;
            bottom: 12mm;
            left: 18mm;
            right: 18mm;
            border-top: 1px solid #cbd5e1;
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: #94a3b8;
            font-family: monospace;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }

          .section {
            padding: 15px 0;
            border-bottom: 1px solid #f1f5f9;
          }

          .section:last-of-type {
            border-bottom: none;
          }

          .section-title {
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #4f46e5;
            margin-top: 0;
            margin-bottom: 18px;
            border-left: 4px solid #4f46e5;
            padding-left: 10px;
            line-height: 1;
          }

          .grid-2 {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }

          .grid-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
          }

          .data-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .data-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
          }

          .data-value {
            font-size: 13px;
            font-weight: 600;
            color: #0f172a;
          }

          .stats-card {
            background-color: #f8fafc;
            border-radius: 12px;
            padding: 12px 14px;
            text-align: center;
            border: 1px solid #e2e8f0;
          }

          .stats-num {
            font-size: 20px;
            font-weight: 900;
            color: #0f172a;
            margin-top: 4px;
            font-family: monospace;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }

          th {
            background-color: #f8fafc;
            color: #475569;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            text-align: left;
            padding: 10px;
            border-bottom: 2px solid #e2e8f0;
          }

          td {
            padding: 10px;
            border-bottom: 1px solid #f1f5f9;
          }

          @media print {
            body {
              background-color: #ffffff;
              padding: 0;
              margin: 0;
            }
            .pdf-pages-container {
              gap: 0;
            }
            .pdf-page {
              box-shadow: none;
              border: none;
              margin: 0;
              page-break-after: always;
              width: 210mm;
              height: 297mm;
            }
            .print-btn-bar {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-btn-bar">
          <button class="btn btn-secondary" onclick="window.close();">Fermer</button>
          <button class="btn" onclick="window.print();">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
            Lancer l'impression / Exporter en PDF
          </button>
        </div>

        <div class="pdf-pages-container">
          <!-- PAGE 1 -->
          <div class="pdf-page">
            <div class="page-header">
              <div>
                <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.04em;">DOSSIER SCOLAIRE & ACADÉMIQUE COMPLET</h1>
                <p style="margin: 4px 0 0 0; font-size: 10px; color: #4f46e5; text-transform: uppercase; font-family: monospace; letter-spacing: 0.12em; font-weight: 800;">
                  ${merchant.name} • ANNÉE SCOLAIRE ${student.schoolYear || '2025-2026'}
                </p>
              </div>
              <div>
                <span class="badge-status">${(student.status || 'active').toUpperCase()}</span>
              </div>
            </div>

            <!-- Section 1 : Fiche d'identification -->
            <div class="section" style="padding-top: 5px;">
              <h2 class="section-title">I. IDENTITÉ DE L'ÉLÈVE & INSCRIPTION</h2>
              <div class="grid-2">
                <div class="data-item">
                  <span class="data-label">Prénom & Nom</span>
                  <span class="data-value" style="font-size: 15px; color: #4f46e5;">${student.firstName} ${student.lastName}</span>
                </div>
                <div class="data-item">
                  <span class="data-label">Classe Affectée</span>
                  <span class="data-value">${student.grade || 'Non affecté'}</span>
                </div>
                <div class="data-item">
                  <span class="data-label">Matricule Interne</span>
                  <span class="data-value" style="font-family: monospace; color: #4f46e5;">${matricule}</span>
                </div>
                <div class="data-item">
                  <span class="data-label">Date et Lieu de Naissance</span>
                  <span class="data-value">${student.birthDate ? safeFormatDate(student.birthDate, 'dd MMMM yyyy') : '---'} à ${student.birthPlace || '---'}</span>
                </div>
                <div class="data-item">
                  <span class="data-label">Nationalité</span>
                  <span class="data-value">${student.nationality || 'Sénégalaise'}</span>
                </div>
                <div class="data-item">
                  <span class="data-label">Numéro d'identité national</span>
                  <span class="data-value">${student.nationalId || 'Non fourni'}</span>
                </div>
                <div class="data-item">
                  <span class="data-label">Date d'Inscription Administrative</span>
                  <span class="data-value">${student.registrationDate ? safeFormatDate(student.registrationDate, 'dd MMMM yyyy') : '---'}</span>
                </div>
                <div class="data-item">
                  <span class="data-label">Régime de scolarité</span>
                  <span class="data-value" style="text-transform: uppercase;">${student.regime || 'externe'}</span>
                </div>
                <div class="data-item" style="grid-column: span 2;">
                  <span class="data-label">Adresse de Ville & Résidence</span>
                  <span class="data-value">${student.address || '---'} ${student.neighborhood ? '(' + student.neighborhood + ')' : ''} - ${student.city || '---'}, ${student.country || 'Sénégal'}</span>
                </div>
                <div class="data-item">
                  <span class="data-label">Téléphone élève / Contact</span>
                  <span class="data-value">${student.phone || '---'}</span>
                </div>
                <div class="data-item">
                  <span class="data-label">Email de Correspondance</span>
                  <span class="data-value">${student.email || '---'}</span>
                </div>
              </div>
            </div>

            <!-- Section 2 : Filiation administrative -->
            <div class="section">
              <h2 class="section-title">II. FILIATION & PARENTS D'ÉLÈVES</h2>
              <div class="grid-2">
                <div style="background-color: #f8fafc; padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
                  <h4 style="margin: 0 0 10px 0; font-size: 11px; text-transform: uppercase; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">PÈRE / CHEF DE FAMILLE</h4>
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div class="data-item">
                      <span class="data-label">Nom complet</span>
                      <span class="data-value">${student.fatherName || '---'}</span>
                    </div>
                    <div class="data-item">
                      <span class="data-label">Profession</span>
                      <span class="data-value">${student.fatherProfession || '---'}</span>
                    </div>
                    <div class="data-item">
                      <span class="data-label">Téléphone</span>
                      <span class="data-value">${student.fatherPhone || '---'}</span>
                    </div>
                    <div class="data-item">
                      <span class="data-label">Email</span>
                      <span class="data-value" style="font-size:12px;">${student.fatherEmail || '---'}</span>
                    </div>
                  </div>
                </div>

                <div style="background-color: #f8fafc; padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
                  <h4 style="margin: 0 0 10px 0; font-size: 11px; text-transform: uppercase; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">MÈRE</h4>
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div class="data-item">
                      <span class="data-label">Nom complet</span>
                      <span class="data-value">${student.motherName || '---'}</span>
                    </div>
                    <div class="data-item">
                      <span class="data-label">Profession</span>
                      <span class="data-value">${student.motherProfession || '---'}</span>
                    </div>
                    <div class="data-item">
                      <span class="data-label">Téléphone</span>
                      <span class="data-value">${student.motherPhone || '---'}</span>
                    </div>
                    <div class="data-item">
                      <span class="data-label">Email</span>
                      <span class="data-value" style="font-size:12px;">${student.motherEmail || '---'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 3 : Santé & Urgences -->
            <div class="section" style="border-bottom: none;">
              <h2 class="section-title">III. DOSSIER SANTE & CONTACT D'URGENCE</h2>
              <div class="grid-2">
                <div class="data-item">
                  <span class="data-label">Groupe Sanguin</span>
                  <span class="data-value" style="color: #ef4444; font-size: 14px;">🩸 ${student.bloodType || 'Non recensé'}</span>
                </div>
                <div class="data-item">
                  <span class="data-label">Allergies connues</span>
                  <span class="data-value">${student.allergies || 'Aucune allergie déclarée'}</span>
                </div>
                <div class="data-item">
                  <span class="data-label">Situation d'handicap</span>
                  <span class="data-value">${student.hasDisability === 'oui' ? ('Oui (' + (student.disabilityDetails || 'sans détails') + ')') : 'Aucun'}</span>
                </div>
                <div class="data-item">
                  <span class="data-label font-bold text-red-600">Urgence : Contacter de suite</span>
                  <span class="data-value" style="color: #ef4444; font-size: 13px;">🚨 ${student.emergencyName || '---'} (${student.emergencyRelation || 'Contact'}) : ${student.emergencyPhone || '---'}</span>
                </div>
                <div class="data-item" style="grid-column: span 2;">
                  <span class="data-label">Traitements médicaux suivis</span>
                  <span class="data-value">${student.medicalTreatment || 'Aucun traitement régulier en cours'}</span>
                </div>
              </div>
            </div>

            <!-- Page 1 Footer -->
            <div class="page-footer">
              <span>Portail Académique ERP • ACOM TECHNOLOGIES</span>
              <span>Page 1 / 3</span>
            </div>
          </div>


          <!-- PAGE 2 -->
          <div class="pdf-page">
            <div class="page-header-compact">
              <span style="font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Dossier Académique & Cartographie • ${fullName}</span>
              <span style="font-size: 9px; font-weight: 700; color: #475569; font-family: monospace;">MATRICULE: ${matricule}</span>
            </div>

            <!-- Section 4 : Relevé académique -->
            <div class="section">
              <h2 class="section-title">IV. RÉSULTATS ACADÉMIQUES & NOTES</h2>
              
              <div class="grid-3" style="margin-bottom: 15px;">
                <div class="stats-card">
                  <span class="data-label">Moyenne Générale</span>
                  <div class="stats-num" style="color: #4f46e5;">${overallAvg} <span style="font-size: 11px; color:#64748b;">/ 20</span></div>
                </div>
                <div class="stats-card">
                  <span class="data-label">Taux d'assiduité</span>
                  <div class="stats-num" style="color: #10b981;">${attendanceRate}%</div>
                </div>
                <div class="stats-card">
                  <span class="data-label">Finances / Scolarité Réglée</span>
                  <div class="stats-num" style="font-size: 14px; margin-top: 5px; color: #059669;">${totalPaidVal.toLocaleString()} FCFA</div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th style="font-size: 10px;">Matière d'évaluation</th>
                    <th style="text-align: center; font-size: 10px;">Devoir 1</th>
                    <th style="text-align: center; font-size: 10px;">Devoir 2</th>
                    <th style="text-align: center; font-size: 10px;">Composition</th>
                    <th style="text-align: center; font-size: 10px; background-color: #f1f5f9; width: 25%;">Moyenne Trimestrielle</th>
                  </tr>
                </thead>
                <tbody>
                  ${gradesRowsHtml}
                </tbody>
              </table>
            </div>

            <!-- Section 5 : Assiduité détaillé -->
            <div class="section">
              <h2 class="section-title">V. ASSIDUITÉ ET FEUILLES D'APPEL</h2>
              <div style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; overflow:hidden;">
                <table style="margin: 0;">
                  <thead>
                    <tr style="background-color: #f1f5f9;">
                      <th style="padding: 8px 12px;">Date de l'appel</th>
                      <th style="padding: 8px 12px;">Établissement & Classe</th>
                      <th style="padding: 8px 12px; text-align: right;">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${attendanceRowsHtml}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Section 6 : Scolarité & Finances de l'Apprenant -->
            <div class="section" style="border-bottom: none;">
              <h2 class="section-title">VI. FACTURATION & SUIVI DE SCOLARITÉ</h2>
              <div class="grid-3" style="margin-bottom: 15px;">
                <div class="stats-card" style="background-color: #faf5ff;">
                  <span class="data-label">Bourse Annuelle Attendue</span>
                  <div class="stats-num" style="color: #6b21a8; font-size: 16px;">${schoolingTarget.toLocaleString()} FCFA</div>
                </div>
                <div class="stats-card" style="background-color: #ecfdf5;">
                  <span class="data-label">Total Déjà Réglé</span>
                  <div class="stats-num" style="color: #047857; font-size: 16px;">${totalPaidVal.toLocaleString()} FCFA</div>
                </div>
                <div class="stats-card" style="background-color: #fef2f2;">
                  <span class="data-label">Reste d'échéance dû</span>
                  <div class="stats-num" style="color: #b91c1c; font-size: 16px;">${remainingVal.toLocaleString()} FCFA</div>
                </div>
              </div>

              <h4 style="margin: 0 0 8px 0; font-size: 10px; letter-spacing:0.05em; color: #475569;">DÉTAIL DES VERSEMENTS ENREGISTRÉS</h4>
              <table>
                <thead>
                  <tr>
                    <th style="font-size: 10px; padding: 8px;">Description / Intitulé de Frais</th>
                    <th style="font-size: 10px; padding: 8px;">Montant Reçu</th>
                    <th style="font-size: 10px; padding: 8px; text-align: center;">Mode de paiement</th>
                    <th style="font-size: 10px; padding: 8px; text-align: right;">Date du versement</th>
                  </tr>
                </thead>
                <tbody>
                  ${financialRowsHtml}
                </tbody>
              </table>
            </div>

            <!-- Page 2 Footer -->
            <div class="page-footer">
              <span>Portail Académique ERP • ACOM TECHNOLOGIES</span>
              <span>Page 2 / 3</span>
            </div>
          </div>


          <!-- PAGE 3 -->
          <div class="pdf-page">
            <div class="page-header-compact">
              <span style="font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Dossier Académique & Cartographie • ${fullName}</span>
              <span style="font-size: 9px; font-weight: 700; color: #475569; font-family: monospace;">MATRICULE: ${matricule}</span>
            </div>

            <!-- Section 7 : Documents joints -->
            <div class="section">
              <h2 class="section-title">VII. PIÈCES ADMINISTRATIVE DU DOSSIER D'INSCRIPTION</h2>
              <div style="background-color: #f8fafc; padding: 15px 20px; border-radius: 12px; border: 1px solid #e2e8f0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 20px;">
                ${docChecklistHtml}
              </div>
            </div>

            <!-- Section 8 : Appréciation Générale Synthétique IA -->
            <div class="section">
              <h2 class="section-title">VIII. SYNTHÈSE D'APPRÉCIATION PAR L'INTELLIGENCE ARTIFICIELLE</h2>
              <div style="background-color: #f3e8ff; border: 1px solid #e9d5ff; padding: 18px 22px; border-radius: 12px; font-size: 12px; line-height: 1.5; color: #581c87; font-weight: 500;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 10px; font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; color: #6b21a8;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:2px;"><polygon points="12 2 2 22 22 22"/><path d="M12 16v-4M12 8h.01"/></svg>
                  Analyse & Recommandation Pédagogique (Propulsé par Gemini 3.5 Flash)
                </div>
                ${aiText}
              </div>
            </div>

            <!-- Section 9 : Signatures & Cachet -->
            <div class="section" style="border-bottom: none; margin-top: auto; padding-bottom: 25px;">
              <div class="grid-2" style="text-align: center; font-size: 11px;">
                <div>
                  <strong style="text-transform: uppercase; color: #475569; display: block; margin-bottom: 6px;">SIGNATURE ET ACCORD DU PARENT</strong>
                  <p style="color: #64748b; font-size: 10px; margin-bottom: 8px;">Appliqué par ${student.parentSignName || student.fatherName || 'Représentant Légal'} le ${student.parentSignDate || safeFormatDate(new Date(), 'dd/MM/yyyy')}</p>
                  <div style="border: 1px dashed #cbd5e1; height: 95px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background-color: #f8fafc; overflow: hidden; max-width: 250px; margin: 0 auto;">
                    ${student.parentSignature ? '<img src="' + student.parentSignature + '" alt="Signature" style="max-height: 85px; max-width: 230px;" />' : '<span style="color: #94a3b8; font-size: 10px; font-weight: bold; text-transform: uppercase;">Signature Parent Apposée</span>'}
                  </div>
                </div>

                <div>
                  <strong style="text-transform: uppercase; color: #475569; display: block; margin-bottom: 6px;">VISA & CACHET ACADÉMIQUE DE L'ADMINISTRATION</strong>
                  <p style="color: #64748b; font-size: 10px; margin-bottom: 8px;">Validé par ${student.adminSignName || 'Secrétaire Général'}</p>
                  <div style="border: 1px dashed #cbd5e1; height: 95px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background-color: #f8fafc; overflow: hidden; max-width: 250px; margin: 0 auto;">
                    ${student.adminSignature ? '<img src="' + student.adminSignature + '" alt="Signature Admin" style="max-height: 85px; max-width: 230px;" />' : '<span style="color: #cbd5e1; font-weight: 900; transform: rotate(-8deg); font-size: 11px; border: 3px solid #cbd5e1; padding: 6px 14px; border-radius: 6px; font-family: monospace;">TAMPON DIRECTEUR</span>'}
                  </div>
                </div>
              </div>
            </div>

            <!-- Page 3 Footer -->
            <div class="page-footer">
              <span>Portail Académique ERP • ACOM TECHNOLOGIES</span>
              <span>Page 3 / 3</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const generateReportCardHtml = () => {
    const fullName = `${student.firstName} ${student.lastName}`;
    const matricule = student.matricule || student.id?.substring(0, 8) || '---';
    const termPeriod = selectedPeriod; 
    const schoolYear = student.schoolYear || '2021-2022';
    const schoolName = merchant.name || 'LYCÉE THIAROYE';
    const schoolTel = merchant.phone || '33 800 00 00';
    const schoolEmail = merchant.email || 'thiaroyelycee@edu.sn';
    
    // Parse Niveau & Serie
    const academicLevel = (student.grade || 'SECONDE').split(' ')[0].toUpperCase();
    const academicSerie = student.grade?.includes('S') ? 'S' : (student.grade?.includes('L') ? 'L' : '---');
    const studentClass = student.grade || '---';
    const effectifCount = classStudents.length || 63;
    const studentGender = student.gender || 'MASCULIN';
    const classeDoublee = student.doublant ? 'OUI' : 'NEANT';
    const birthDateFormatted = student.birthDate ? safeFormatDate(student.birthDate, 'dd-MM-yyyy') : '---';
    const birthPlaceStr = student.birthPlace || 'DAKAR';
    
    let gradesRowsHtml = '';
    let totalCoef = 0;
    let totalWeightedPoints = 0;

    if (grades.length === 0) {
      gradesRowsHtml = `<tr><td colspan="8" style="padding: 16px; text-align: center; color: #64748b; font-weight: bold; border: 1px solid black;">Aucune note enregistrée pour ${termPeriod}</td></tr>`;
    } else {
      grades.forEach((g: any) => {
        // Average the dev1 and dev2 to match single Devoirs column shown in Seneca report cards
        let dev1 = parseFloat(g.devoir1);
        let dev2 = parseFloat(g.devoir2);
        let devAvgStr = '-';
        let countDev = 0;
        let sumDev = 0;
        if (!isNaN(dev1)) { sumDev += dev1; countDev++; }
        if (!isNaN(dev2)) { sumDev += dev2; countDev++; }
        if (countDev > 0) {
          devAvgStr = (sumDev / countDev).toFixed(2);
        }

        const compoVal = parseFloat(g.compo);
        const compoStr = !isNaN(compoVal) ? compoVal.toFixed(2) : '-';

        const subjectAvgStr = calculateAverage(g);
        const subjectAvgVal = subjectAvgStr !== '-' ? parseFloat(subjectAvgStr) : NaN;

        const coef = getSubjectCoef(g.subjectId, studentClass);
        const weightedPointsStr = !isNaN(subjectAvgVal) ? (subjectAvgVal * coef).toFixed(2) : '-';
        
        if (!isNaN(subjectAvgVal)) {
          totalCoef += coef;
          totalWeightedPoints += subjectAvgVal * coef;
        }

        // Retrieve sub-rank and subject class average dynamically
        const sStats = classStats.subjectStats[g.subjectId] || { classAvg: '10.00', studentRank: '---ex' };

        // Determine appreciation string
        let appreciation = '---';
        if (!isNaN(subjectAvgVal)) {
          if (subjectAvgVal < 5) appreciation = 'Très Insuffisant';
          else if (subjectAvgVal < 8) appreciation = 'Très Insuffisant';
          else if (subjectAvgVal < 10) appreciation = 'Insuffisant';
          else if (subjectAvgVal < 12) appreciation = 'Passable';
          else if (subjectAvgVal < 14) appreciation = 'Assez Bien';
          else if (subjectAvgVal < 16) appreciation = 'Bien';
          else appreciation = 'Très Bien';
        }

        gradesRowsHtml += `
          <tr style="border-bottom: 1px solid black; font-size: 11px;">
            <td style="border: 1px solid black; padding: 6px; font-weight: bold; text-align: left;">${g.subjectId}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center; font-family: monospace;">${devAvgStr}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center; font-family: monospace; color: #1e293b;">${compoStr}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center; font-family: monospace; font-weight: bold;">${subjectAvgStr}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center; font-family: monospace;">${coef}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center; font-family: monospace; font-weight: bold; background-color: #fafafa;">${weightedPointsStr}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center; font-family: monospace;">${sStats.studentRank}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: left; font-size: 10px;">${appreciation}</td>
          </tr>
        `;
      });
    }

    const totalWeightedPointsStr = totalCoef > 0 ? totalWeightedPoints.toFixed(2) : '-';
    const dateStr = safeFormatDate(new Date(), 'dd-MM-yyyy à HH:mm');

    const isFinalPeriod = (() => {
      const normPeriod = (termPeriod || '').toLowerCase();
      const lowerPeriods = academicPeriods.map((p: string) => p.toLowerCase());
      
      const idx = lowerPeriods.indexOf(normPeriod);
      if (idx !== -1) {
        return idx === lowerPeriods.length - 1;
      }
      
      if (normPeriod.includes('1') || normPeriod.includes('premier') || normPeriod.includes('1er')) {
        return false;
      }
      if (normPeriod.includes('2') || normPeriod.includes('second') || normPeriod.includes('deuxième')) {
        if (academicPeriods.length === 2) return true;
        return false;
      }
      if (normPeriod.includes('3') || normPeriod.includes('troisième') || normPeriod.includes('trois')) {
        return true;
      }
      return true; // Default to true if unsure
    })();

    // Default Professor decision advice based on grades
    const avgValNum = parseFloat(weightedOverallAvg);
    let decisionConseil = "Des efforts à consolider au prochain trimestre.";
    if (!isNaN(avgValNum)) {
      if (avgValNum >= 14) {
        decisionConseil = "FÉLICITATIONS DU CONSEIL DES PROFESSEURS. EXCELLENT TRAVAIL.";
      } else if (avgValNum >= 12) {
        decisionConseil = "ENCOURAGEMENTS DU CONSEIL. TRAVAIL SATISFAISANT.";
      } else if (avgValNum >= 10) {
        decisionConseil = isFinalPeriod ? "PASSABLE EN CLASSE SUPÉRIEURE. DOIT POURSUIVRE L'EFFORT." : "TRAVAIL PASSABLE. PEUT REHAUSSER SON NIVEAU.";
      } else if (avgValNum < 10) {
        decisionConseil = isFinalPeriod ? "TRAVAIL INSUFFISANT. S'APPLIQUER POUR ÉVITER LE REDOUBLEMENT." : "TRAVAIL INSUFFISANT. DOIT REDOUBLER D'EFFORTS.";
      }
    }
    
    // AI insights override if available
    const aiText = aiInsights.length > 0 ? aiInsights[0].content : decisionConseil;

    // Google Chart QR code generators (reliable, high fidelity, 100% production-ready for offline validation)
    const qrStudentUrl = `https://chart.googleapis.com/chart?chs=100x100&cht=qr&chl=${encodeURIComponent(
      `Eleve: ${fullName}\nMatricule: ${matricule}\nClasse: ${studentClass}\nMoyenne: ${weightedOverallAvg}\nRang: ${classStats.studentOverallRank}\nEtablissement: ${schoolName}\nAnnee: ${schoolYear}`
    )}`;

    const qrVerificationUrl = `https://chart.googleapis.com/chart?chs=100x100&cht=qr&chl=${encodeURIComponent(
      `https://verify.acomtech.sn/bulletin/${student.id}/${selectedPeriod}`
    )}`;

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bulletin Scolaire Officiel - ${fullName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Arimo:wght@400;500;600;700&display=swap');
          body { 
            background-color: #f1f5f9; 
            font-family: 'Arimo', sans-serif; 
            display: flex; 
            flex-direction: column;
            align-items: center; 
            padding: 40px 10px; 
            margin: 0; 
            color: black; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          .print-btn-bar { 
            width: 100%; 
            max-width: 210mm; 
            display: flex; 
            justify-content: flex-end; 
            padding: 15px; 
            margin-bottom: 20px; 
            background-color: white; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.05); 
          }
          .btn { 
            background-color: #1e293b; 
            color: white; 
            border: none; 
            padding: 10px 24px; 
            border-radius: 8px; 
            font-weight: bold; 
            cursor: pointer; 
            font-size: 13px; 
            transition: background 0.2s;
          }
          .btn:hover {
            background-color: #000;
          }
          
          /* report-card setup standard A4 */
          .report-card { 
            background: white; 
            width: 210mm; 
            min-height: 297mm; 
            padding: 12mm; 
            box-sizing: border-box; 
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); 
            border: 1px solid #94a3b8; 
            display: flex;
            flex-direction: column;
          }
          
          /* Republic of Senegal Flags and Headers */
          .header-grid {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
          }
          .republic-header {
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            line-height: 1.4;
          }
          
          /* Details Box Grid with Black Borders (100% faithful to standard) */
          .student-details-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 10.5px;
          }
          .student-details-grid td {
            border: 1px solid black;
            padding: 5px 8px;
            vertical-align: middle;
          }
          
          /* Centered Title Bar */
          .bulletin-bar-title {
            width: 100%;
            background-color: #cccccc;
            color: black;
            font-size: 14px;
            font-weight: 900;
            text-align: center;
            padding: 6px 0;
            margin-bottom: 15px;
            letter-spacing: 2px;
            text-transform: uppercase;
            border: 1px solid black;
          }
          
          /* Table Styles */
          .grades-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 15px; 
          }
          .grades-table th { 
            background-color: #b3b3b3; 
            color: black; 
            border: 1px solid black;
            padding: 6px; 
            font-size: 11px; 
            font-weight: bold; 
            text-align: center; 
          }
          
          /* Summary Info Bar */
          .avg-summary-bar {
            width: 100%;
            border: 1px solid black;
            background-color: #e6e6e6;
            display: flex;
            justify-content: space-between;
            padding: 6px 12px;
            font-size: 11.5px;
            font-weight: bold;
            margin-bottom: 15px;
            box-sizing: border-box;
          }
          
          /* Dual Footer Panels block */
          .footer-section {
            display: flex;
            justify-content: space-between;
            gap: 15px;
            margin-top: auto;
          }
          .left-footer-panel {
            width: 45%;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .right-footer-panel {
            width: 53%;
            border: 1px solid black;
            padding: 10px;
            display: flex;
            flex-direction: column;
            min-height: 140px;
          }
          
          .qr-codes-container {
            display: flex;
            justify-content: space-around;
            align-items: center;
            margin-top: 15px;
            padding-top: 8px;
            border-top: 1px dashed black;
          }
          .qr-box {
            text-align: center;
            font-size: 9px;
            font-weight: bold;
          }
          
          /* Print and styling variables */
          @media print {
             body { padding: 0; background: white; }
             .print-btn-bar { display: none !important; }
             .report-card { box-shadow: none; border: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div style="width: 100%; max-width: 210mm; display: flex; flex-direction: column;">
          <div class="print-btn-bar">
             <button class="btn" onclick="window.print()">🖨️ Imprimer ce Bulletin Officiel</button>
          </div>
          <div class="report-card">
            
            <!-- Republic & School Top Header -->
            <div class="header-grid">
              
              <!-- Left: Senegal Flag & National details -->
              <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px;">
                <div style="display: flex; gap: 3px; width: 62px; height: 38px; border: 1px solid black;">
                  <div style="background-color: #008f51; width: 20px;"></div>
                  <div style="background-color: #fecd05; width: 20px; display: flex; align-items: center; justify-content: center; position: relative;">
                    <span style="color: #008f51; font-size: 14px; position: absolute; margin-bottom: 2px;">★</span>
                  </div>
                  <div style="background-color: #e5232a; width: 20px;"></div>
                </div>
                <div style="font-size: 10px; font-weight: bold; text-align: left; line-height: 1.3;">
                  République du Sénégal<br>
                  Ministère de l'Éducation nationale<br>
                  <span style="text-transform: uppercase; font-weight: 800;">${schoolName}</span>
                </div>
              </div>
              
              <!-- Center: Official School Logo / Academic Crest -->
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 170px; height: 95px; margin: 0 auto;">
                ${merchant.logo ? `
                  <img src="${merchant.logo}" alt="Logo" style="max-height: 85px; max-width: 160px; object-fit: contain;" />
                ` : `
                  <!-- Standard Senegal National Academic Crest SVG if no custom logo is uploaded -->
                  <svg width="65" height="65" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.85;">
                    <path d="M50 5L15 25V55C15 72.5 50 95 50 95C50 95 85 72.5 85 55V25L50 5Z" fill="#fafafa" stroke="black" stroke-width="4"/>
                    <path d="M30 40H70" stroke="black" stroke-width="4" stroke-linecap="round"/>
                    <path d="M35 52H65" stroke="black" stroke-width="4" stroke-linecap="round"/>
                    <path d="M42 64H58" stroke="black" stroke-width="4" stroke-linecap="round"/>
                    <polygon points="50,15 54,23 63,23 56,29 59,38 50,32 41,38 44,29 37,23 46,23" fill="black"/>
                  </svg>
                  <span style="font-size: 8px; font-weight: 950; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px;">Label Officiel</span>
                `}
              </div>
              
              <!-- Right: Educational Logo Template placeholder and details -->
              <div class="republic-header">
                ANNÉE SCOLAIRE: ${schoolYear}<br>
                <div style="margin-top: 5px; border: 1.5px solid black; padding: 3px 10px; border-radius: 4px; display: inline-block; font-size: 9.5px; font-weight: 900; background-color: #fafafa; letter-spacing: 0.5px;">
                  ACCIBULL VALIDÉ
                </div>
              </div>
            </div>
            
            <!-- Student & Class structured panel (Dual Grid with Black Borders) -->
            <table class="student-details-grid">
              <tr>
                <td style="width: 50%;"><strong>Tel:</strong> ${schoolTel}</td>
                <td style="width: 50%;"><strong>IEN:</strong> <span style="font-family: monospace; font-weight: bold; font-size: 11.5px;">${matricule}</span> &nbsp;&nbsp;&nbsp; <strong>SEXE:</strong> ${studentGender}</td>
              </tr>
              <tr>
                <td><strong>Email:</strong> ${schoolEmail}</td>
                <td><strong>Classe:</strong> <span style="font-weight: bold; font-size: 11px;">${studentClass}</span></td>
              </tr>
              <tr>
                <td><strong>Niveau:</strong> ${academicLevel}</td>
                <td><strong>Classe doublée:</strong> ${classeDoublee}</td>
              </tr>
              <tr>
                <td><strong>Série:</strong> <span style="font-weight: bold;">${academicSerie}</span></td>
                <td><strong>Prénom(s):</strong> <span style="font-size: 11px; font-weight: bold; text-transform: uppercase;">${student.firstName}</span></td>
              </tr>
              <tr>
                <td><strong>Effectif:</strong> ${effectifCount}</td>
                <td><strong>Nom:</strong> <span style="font-size: 11px; font-weight: bold; text-transform: uppercase;">${student.lastName}</span></td>
              </tr>
              <tr>
                <td><strong>Moyenne classe:</strong> <span style="font-family: monospace; font-weight: bold;">${classStats.classOverallAvg}</span></td>
                <td><strong>Né(e) le:</strong> ${birthDateFormatted} à <span style="text-transform: uppercase; font-weight: 500;">${birthPlaceStr}</span></td>
              </tr>
            </table>
            
            <!-- Focused Report Title Bar -->
            <div class="bulletin-bar-title">
              BULLETIN DU ${termPeriod.includes('1') ? 'PREMIER' : (termPeriod.includes('2') ? 'SECOND' : 'TROISIÈME')} ${termPeriod.toLowerCase().includes('trimestre') ? 'TRIMESTRE' : 'SEMESTRE'}
            </div>
            
            <!-- Grades Table -->
            <table class="grades-table">
              <thead>
                <tr>
                  <th style="width: 32%; text-align: left;">Disciplines</th>
                  <th style="width: 10%;">Devoirs</th>
                  <th style="width: 10%;">Compos</th>
                  <th style="width: 10%;">Moy</th>
                  <th style="width: 8%;">Coeff</th>
                  <th style="width: 12%;">Moy×Coef</th>
                  <th style="width: 8%;">Rang</th>
                  <th style="width: 18%; text-align: left;">Appréciations</th>
                </tr>
              </thead>
              <tbody>
                ${gradesRowsHtml}
                <!-- Totals Row standard Senegal Highschool -->
                <tr style="background-color: #ededed; font-weight: bold; font-size: 11px; border: 1.5px solid black;">
                  <td colspan="4" style="border: 1px solid black; padding: 6px; text-align: left;">Totaux</td>
                  <td style="border: 1px solid black; padding: 6px; text-align: center; font-family: monospace;">${totalCoef}</td>
                  <td style="border: 1px solid black; padding: 6px; text-align: center; font-family: monospace; color: black; font-weight: bold;">${totalWeightedPointsStr}</td>
                  <td colspan="2" style="border: 1px solid black; background-color: #fefefe;"></td>
                </tr>
              </tbody>
            </table>
            
            <!-- Bottom Statistics general averages & absences -->
            ${!isFinalPeriod ? `
              <div class="avg-summary-bar">
                <span>Moyenne: <span style="font-size: 13.5px; font-family: monospace; font-weight: 900;">${weightedOverallAvg}</span></span>
                <span>Rang: <span style="font-size: 13.5px; font-family: monospace; font-weight: 900;">${classStats.studentOverallRank}</span></span>
                <span>Retards: ${totalLates} heure(s)</span>
                <span>Absences: ${totalAbsences} dont 0 justifiée(s)</span>
              </div>
            ` : ''}
            
            <!-- Bottom Grid (Professor decisions + Signatures + QR) -->
            <div class="footer-section">
              
              <!-- Left side: Evaluations Checkbox Grid & Terms Multi-Semester Summary -->
              <div class="left-footer-panel">
                
                ${!isFinalPeriod ? `
                  <!-- Standard Evaluative Checkbox Grid for first semester (Faithful to Image 1) -->
                  <table style="width: 100%; border-collapse: collapse; font-size: 9px; font-weight: bold;">
                    <!-- Row 1 -->
                    <tr>
                      <td style="border: 1px solid black; padding: 4.5px; width: 42%;">Travail excellent</td>
                      <td style="border: 1px solid black; padding: 4.5px; text-align: center; width: 8%; font-size: 10px; font-weight: 900;">${!isNaN(avgValNum) && avgValNum >= 16 ? 'X' : ''}</td>
                      <td style="border: 1px solid black; padding: 4.5px; width: 42%;">Félicitations</td>
                      <td style="border: 1px solid black; padding: 4.5px; text-align: center; width: 8%; font-size: 10px; font-weight: 900;">${!isNaN(avgValNum) && avgValNum >= 14 ? 'X' : ''}</td>
                    </tr>
                    <!-- Row 2 -->
                    <tr>
                      <td style="border: 1px solid black; padding: 4.5px;">Satisfaisant doit continuer</td>
                      <td style="border: 1px solid black; padding: 4.5px; text-align: center; font-size: 10px; font-weight: 900;">${!isNaN(avgValNum) && avgValNum >= 12 && avgValNum < 14 ? 'X' : ''}</td>
                      <td style="border: 1px solid black; padding: 4.5px;">Encouragements</td>
                      <td style="border: 1px solid black; padding: 4.5px; text-align: center; font-size: 10px; font-weight: 900;">${!isNaN(avgValNum) && avgValNum >= 12 && avgValNum < 14 ? 'X' : ''}</td>
                    </tr>
                    <!-- Row 3 -->
                    <tr>
                      <td style="border: 1px solid black; padding: 4.5px;">Peut mieux faire</td>
                      <td style="border: 1px solid black; padding: 4.5px; text-align: center; font-size: 10px; font-weight: 900;">${!isNaN(avgValNum) && avgValNum >= 9 && avgValNum < 11.5 ? 'X' : ''}</td>
                      <td style="border: 1px solid black; padding: 4.5px;">Tableau d'honneur</td>
                      <td style="border: 1px solid black; padding: 4.5px; text-align: center; font-size: 10px; font-weight: 900;">${!isNaN(avgValNum) && avgValNum >= 13 ? 'X' : ''}</td>
                    </tr>
                    <!-- Row 4 -->
                    <tr>
                      <td style="border: 1px solid black; padding: 4.5px;">Insuffisant</td>
                      <td style="border: 1px solid black; padding: 4.5px; text-align: center; font-size: 10px; font-weight: 900;">${!isNaN(avgValNum) && avgValNum < 10 ? 'X' : ''}</td>
                      <td style="border: 1px solid black; padding: 4.5px;">Passable</td>
                      <td style="border: 1px solid black; padding: 4.5px; text-align: center; font-size: 10px; font-weight: 900;">${!isNaN(avgValNum) && avgValNum >= 10 && avgValNum < 12 ? 'X' : ''}</td>
                    </tr>
                    <!-- Row 5 -->
                    <tr>
                      <td style="border: 1px solid black; padding: 4.5px;">Risque de redoubler</td>
                      <td style="border: 1px solid black; padding: 4.5px; text-align: center; font-size: 10px; font-weight: 900;">${!isNaN(avgValNum) && avgValNum < 8.5 ? 'X' : ''}</td>
                      <td style="border: 1px solid black; padding: 4.5px;">Doit redoubler d'effort</td>
                      <td style="border: 1px solid black; padding: 4.5px; text-align: center; font-size: 10px; font-weight: 900;">${!isNaN(avgValNum) && avgValNum < 10 ? 'X' : ''}</td>
                    </tr>
                    <!-- Row 6 -->
                    <tr>
                      <td style="border: 1px solid black; padding: 4.5px;">Risque l'exclusion</td>
                      <td style="border: 1px solid black; padding: 4.5px; text-align: center; font-size: 10px; font-weight: 900;">${!isNaN(avgValNum) && avgValNum < 7 ? 'X' : ''}</td>
                      <td style="border: 1px solid black; padding: 4.5px;">Avertissement</td>
                      <td style="border: 1px solid black; padding: 4.5px; text-align: center; font-size: 10px; font-weight: 900;"></td>
                    </tr>
                    <!-- Row 7 -->
                    <tr>
                      <td style="border: 1px solid black; padding: 4.5px;" colspan="2"></td>
                      <td style="border: 1px solid black; padding: 4.5px;">Blâme</td>
                      <td style="border: 1px solid black; padding: 4.5px; text-align: center; font-size: 10px; font-weight: 900;"></td>
                    </tr>
                  </table>
                ` : `
                  <!-- Final Period (Second Semester / Trimestre 3) Special Layout with Summary Tables Side by Side (Faithful to Image 2) -->
                  <div style="display: flex; gap: 10px; margin-bottom: 8px;">
                    <div style="width: 50%;">
                      <table style="width: 100%; border-collapse: collapse; font-size: 8.5px; text-align: center; border: 1px solid black;">
                        <thead>
                          <tr style="background-color: #ededed; border-bottom: 1.5px solid black; font-weight: bold;">
                            <th style="border-right: 1px solid black; padding: 3px; text-align: left;">Périodes</th>
                            <th style="border-right: 1px solid black; padding: 3px;">Moyennes</th>
                            <th style="border-right: 1px solid black; padding: 3px;">Rangs</th>
                            <th style="padding: 3px;">Moy classe</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${periodicSummaries.map(p => `
                            <tr style="border-bottom: 1px solid #000; ${p.period === termPeriod ? 'font-weight: bold; background-color: #f7f7f7;' : ''}">
                              <td style="border-right: 1px solid black; padding: 3px; text-align: left; font-weight: bold;">${p.period}</td>
                              <td style="border-right: 1px solid black; padding: 3px; font-family: monospace;">${p.avg}</td>
                              <td style="border-right: 1px solid black; padding: 3px; font-family: monospace;">${p.rank}</td>
                              <td style="padding: 3px; font-family: monospace;">${p.classAvg}</td>
                            </tr>
                          `).join('')}
                          <tr style="background-color: #e5e7eb; font-weight: 900; border-top: 1.5px solid black;">
                            <td style="border-right: 1px solid black; padding: 4px; text-align: left;">Moyenne générale</td>
                            <td style="border-right: 1px solid black; padding: 4px; font-family: monospace; font-size: 9.5px; color: black;">${annualAverageStats.avg}</td>
                            <td style="border-right: 1px solid black; padding: 4px; font-family: monospace;">${annualAverageStats.rank}</td>
                            <td style="padding: 4px; font-family: monospace;">${annualAverageStats.classAvg}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <div style="width: 50%;">
                      <table style="width: 100%; border-collapse: collapse; font-size: 8.5px; text-align: left; border: 1px solid black;">
                        <thead>
                          <tr style="background-color: #ededed; border-bottom: 1.5px solid black; font-weight: bold; text-align: center;">
                            <th colspan="3" style="padding: 3px;">Absences & Retards ${termPeriod.toLowerCase()}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style="border-bottom: 1px solid black;">
                            <td style="border-right: 1px solid black; padding: 4px; font-weight: bold;">Retards</td>
                            <td style="border-right: 1px solid black; padding: 4px; text-align: center; font-family: monospace;">${totalLates} heure(s)</td>
                            <td style="padding: 4px; text-align: center; font-weight: bold; color: #444;">${totalLates > 0 ? 'Dû' : 'NEANT'}</td>
                          </tr>
                          <tr>
                            <td style="border-right: 1px solid black; padding: 4px; font-weight: bold;">Absences</td>
                            <td style="border-right: 1px solid black; padding: 4px; text-align: center; font-family: monospace;">${totalAbsences} absent.</td>
                            <td style="padding: 4px; text-align: center; font-weight: bold; color: #444;">0 justifiée(s)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <!-- Checkbox matrix for Second Semester (Faithful to Image 2) -->
                  <table style="width: 100%; border-collapse: collapse; font-size: 9px; font-weight: bold;">
                    <!-- Row 1 -->
                    <tr>
                      <td style="border: 1px solid black; padding: 4.5px; width: 42%;">Félicitations</td>
                      <td style="border: 1px solid black; padding: 4.5px; text-align: center; width: 8%; font-size: 10px; font-weight: 900;">${!isNaN(avgValNum) && avgValNum >= 14 ? 'X' : ''}</td>
                      <td style="border: 1px solid black; padding: 4.5px; width: 42%;">Passe en classe supérieure</td>
                      <td style="border: 1px solid black; padding: 4.5px; text-align: center; width: 8%; font-size: 10px; font-weight: 900;">${!isNaN(avgValNum) && avgValNum >= 10 ? 'X' : ''}</td>
                    </tr>
                    <!-- Row 2 -->
                    <tr>
                      <td style="border: 1px solid black; padding: 4.5px;">Encouragements</td>
                      <td style="border: 1px solid black; padding: 4.5px; text-align: center; font-size: 10px; font-weight: 900;">${!isNaN(avgValNum) && avgValNum >= 12 && avgValNum < 14 ? 'X' : ''}</td>
                      <td style="border: 1px solid black; padding: 4.5px;">Autorisé(e) à redoubler</td>
                      <td style="border: 1px solid black; padding: 4.5px; text-align: center; font-size: 10px; font-weight: 900;">${!isNaN(avgValNum) && avgValNum < 10 ? 'X' : ''}</td>
                    </tr>
                    <!-- Row 3 -->
                    <tr>
                      <td style="border: 1px solid black; padding: 4.5px;">Tableau d'honneur</td>
                      <td style="border: 1px solid black; padding: 4.5px; text-align: center; font-size: 10px; font-weight: 900;">${!isNaN(avgValNum) && avgValNum >= 13 ? 'X' : ''}</td>
                      <td style="border: 1px solid black; padding: 4.5px;">Exclu(e) de l'établissement</td>
                      <td style="border: 1px solid black; padding: 4.5px; text-align: center; font-size: 10px; font-weight: 900;"></td>
                    </tr>
                    <!-- Row 4 -->
                    <tr>
                      <td style="border: 1px solid black; padding: 4.5px;">Passable</td>
                      <td style="border: 1px solid black; padding: 4.5px; text-align: center; font-size: 10px; font-weight: 900;">${!isNaN(avgValNum) && avgValNum >= 10 && avgValNum < 12 ? 'X' : ''}</td>
                      <td style="border: 1px solid black; padding: 4.5px; vertical-align: middle;" colspan="2" rowspan="2">
                        <div style="font-size: 10px; font-weight: 950; text-align: center; color: #b91c1c; text-transform: uppercase;">Série proposée: ${academicSerie}</div>
                      </td>
                    </tr>
                    <!-- Row 5 -->
                    <tr>
                      <td style="border: 1px solid black; padding: 4.5px;">Insuffisant</td>
                      <td style="border: 1px solid black; padding: 4.5px; text-align: center; font-size: 10px; font-weight: 900;">${!isNaN(avgValNum) && avgValNum < 10 ? 'X' : ''}</td>
                    </tr>
                  </table>
                `}
              </div>
              
              <!-- Right side: Consejo Observations & Seal / Signatures panel -->
              <div class="right-footer-panel">
                <div style="font-size: 10px; font-weight: bold; text-decoration: underline; margin-bottom: 6px;">
                  Observations du conseil des professeurs:
                </div>
                <div style="font-size: 10.5px; line-height: 1.4; color: #111; font-weight: bold; flex-grow: 1;">
                  ${aiText}<br>
                  ${isFinalPeriod && avgValNum >= 10 ? `<span style="color: #008f51; font-size: 12px; display: block; margin-top: 10px;">★ PASSE EN CLASSE DE ${studentClass.includes('SECONDE') || studentClass.includes('2S') ? 'PREMIÈRE' : 'TERMINALE'} ${academicSerie}</span>` : ''}
                </div>
                
                <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-top: 20px; text-transform: uppercase; gap: 10px;">
                  <div style="text-align: left; width: 50%;">
                    Le Professeur Principal<br>
                    <span style="font-size: 9px; color: #555; text-transform: none; display: block; margin-top: 3px; font-weight: normal; font-family: sans-serif;">
                      ${studentClassObj?.tutor ? studentClassObj.tutor : 'Non assigné'}
                    </span>
                  </div>
                  <div style="text-align: right; width: 50%;">
                    Le Chef d'établissement
                  </div>
                </div>
                <!-- Signature spacing -->
                <div style="height: 35px;"></div>
                
                <!-- Live validation barcodes & QR keys inside parent box -->
                <div class="qr-codes-container">
                  <div class="qr-box">
                    <img src="${qrStudentUrl}" width="70" height="70" style="border: 1px solid black; image-rendering: pixelated;" alt="Infolink">
                    <div style="margin-top: 2px;">Infos Élève</div>
                  </div>
                  <div class="qr-box">
                    <img src="${qrVerificationUrl}" width="70" height="70" style="border: 1px solid black; image-rendering: pixelated;" alt="Scankey">
                    <div style="margin-top: 2px;">Ouvrir le bulletin</div>
                  </div>
                </div>
              </div>
              
            </div>

            <!-- Footer terms disclaimer standard watermark -->
            <div style="margin-top: 12px; border-top: 1px solid black; padding-top: 5px; font-size: 8.5px; font-weight: bold; line-height: 1.35; color: #333; text-align: justify;">
              N.B.: Ce bulletin n'est délivré qu'une seule fois. Toute demande de duplicata pourrait faire l'objet d'une contrepartie financière.
              <div style="text-align: right; float: right; font-style: italic;">Ce bulletin est édité le ${dateStr}</div>
            </div>

          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrintReportCard = () => {
    const htmlContent = generateReportCardHtml();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      toast.error("Veuillez autoriser les fenêtres pop-up de votre navigateur pour imprimer la fiche.");
    }
  };

  const handleDownloadReportCard = async () => {
    const toastId = toast.loading("Génération du bulletin scolaire au format PDF...");
    try {
      const htmlContent = generateReportCardHtml();
      
      // Create a temporary hidden container directly on the document body of the main window
      const tempDiv = document.createElement('div');
      tempDiv.id = 'temp-pdf-render-container';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-10000px';
      tempDiv.style.top = '-10000px';
      tempDiv.style.width = '794px'; // ~210mm in pixels at 96 DPI
      tempDiv.style.background = '#ffffff';
      
      tempDiv.innerHTML = htmlContent;
      document.body.appendChild(tempDiv);
      
      // Wait a short moment for styling recalculations and image loads
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const reportCardEl = tempDiv.querySelector('.report-card') as HTMLElement;
      if (!reportCardEl) {
        throw new Error("Bulletin introuvable");
      }
      
      reportCardEl.style.display = 'block';
      reportCardEl.style.width = '210mm';
      reportCardEl.style.boxSizing = 'border-box';
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const canvas = await html2canvas(reportCardEl, {
        scale: 2.0, // High-DPI representation for ultra-sharp text
        useCORS: true,
        allowTaint: false, // Prevents SecurityError "Tainted canvases may not be exported" when images like QR codes/logos are downloaded
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      
      // Clean up the temporary container from DOM
      document.body.removeChild(tempDiv);
      
      const nameClean = (student.lastName || 'ELEVE').toUpperCase().replace(/\s+/g, '_') + "_" + (student.firstName || 'PRENOM').replace(/\s+/g, '_');
      const periodClean = (selectedPeriod || 'Semestre').replace(/\s+/g, '_');
      
      pdf.save(`Bulletin_${periodClean}_${nameClean}.pdf`);
      toast.success("Bulletin scolaire téléchargé en PDF !", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Échec de la génération du PDF : " + (err instanceof Error ? err.message : String(err)), { id: toastId });
      
      // Clean up in case of error
      const existing = document.getElementById('temp-pdf-render-container');
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
    }
  };

  const handlePrintDossier = () => {
    const htmlContent = generateFullDossierHtml();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      toast.error("Veuillez autoriser les fenêtres pop-up de votre navigateur pour imprimer la fiche.");
    }
  };

  const handleDownloadDossier = async () => {
    const toastId = toast.loading("Génération du dossier scolaire au format PDF...");
    try {
      const htmlContent = generateFullDossierHtml();
      
      // Create a temporary hidden container directly on the document body of the main window
      const tempDiv = document.createElement('div');
      tempDiv.id = 'temp-pdf-render-container-dossier';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-10000px';
      tempDiv.style.top = '-10000px';
      tempDiv.style.width = '794px'; // ~210mm in pixels at 96 DPI
      tempDiv.style.background = '#ffffff';
      
      tempDiv.innerHTML = htmlContent;
      document.body.appendChild(tempDiv);
      
      // Wait a short moment for styling recalculations and image loads
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pdfPages = tempDiv.querySelectorAll('.pdf-page');
      if (pdfPages.length === 0) {
        throw new Error("Pages du PDF introuvables");
      }
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      for (let i = 0; i < pdfPages.length; i++) {
        const pageEl = pdfPages[i] as HTMLElement;
        pageEl.style.display = 'block';
        pageEl.style.width = '210mm';
        pageEl.style.boxSizing = 'border-box';
        
        // Render each page individually for exact, pixel-perfect layout
        const canvas = await html2canvas(pageEl, {
          scale: 2.0, // High-DPI representation for ultra-sharp text
          useCORS: true,
          allowTaint: false, // Prevents SecurityError "Tainted canvases may not be exported" when signatures or images are downloaded
          backgroundColor: '#ffffff',
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }
      
      // Clean up the temporary container from DOM
      document.body.removeChild(tempDiv);
      
      const nameClean = (student.lastName || 'ELEVE').toUpperCase().replace(/\s+/g, '_') + "_" + (student.firstName || 'PRENOM').replace(/\s+/g, '_');
      const matriculeStr = student.matricule || student.id?.substring(0, 8) || 'Dossier';
      
      pdf.save(`Dossier_Scolaire_${nameClean}_${matriculeStr}.pdf`);
      toast.success("Dossier scolaire téléchargé en PDF !", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Échec de la génération du PDF : " + (err instanceof Error ? err.message : String(err)), { id: toastId });
      
      // Clean up in case of error
      const existing = document.getElementById('temp-pdf-render-container-dossier');
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
    }
  };

  // 4. Form Actions
  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentForm.firstName || !parentForm.lastName) {
      toast.error("Veuillez saisir le prénom et le nom du parent d'élève");
      return;
    }
    try {
      const parentId = uuidv4();
      await db.parents.put({
        id: parentId,
        merchantId: merchant.id,
        studentId: student.id,
        ...parentForm,
        updatedAt: new Date().toISOString()
      });
      toast.success("Parent d'élève associé et synchronisé !");
      setIsAddingParent(false);
    } catch (err) {
      toast.error("Erreur d'association du tuteur");
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payForm.amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Veuillez entrer un montant valide supérieur à 0 FCFA");
      return;
    }

    try {
      const saleId = uuidv4();
      const itemId = uuidv4();
      const saleData = {
        id: saleId,
        merchantId: merchant.id,
        items: [{
          id: itemId,
          name: `Scolarité - ${payForm.category} (${payForm.month})`,
          quantity: 1,
          price: amt,
          total: amt
        }],
        totalAmount: amt,
        paidAmount: amt,
        balance: 0,
        payments: [{
          id: uuidv4(),
          method: payForm.method,
          amount: amt,
          date: new Date()
        }],
        paymentMethod: payForm.method as any,
        customerName: `${student.firstName} ${student.lastName}`,
        customerPhone: student.parentContact || '',
        createdAt: new Date(),
        processedBy: merchant.ownerId || (merchant as any).owner_id || 'system',
        updatedAt: new Date().toISOString()
      };

      await dbService.merchantSales.save(saleData);
      toast.success("Paiement de scolarité reçu et comptabilisé dans les finances !");
      setIsPayModalOpen(false);
      setPayForm({ amount: '', method: 'cash', category: 'Mensualité', month: 'Octobre' });
    } catch (err) {
      toast.error("Erreur lors de la facturation financière.");
    }
  };

  const sendNotification = async (type: 'absence' | 'payment_reminder' | 'grade_report' | 'custom', customTitle?: string, customContent?: string) => {
    let content = '';
    let title = '';
    if (type === 'absence') {
      title = 'Alerte Absence';
      content = `Cher Parent, nous vous informons que votre enfant ${student.firstName} ${student.lastName} a été signalé absent. Merci de contacter l'établissement.`;
    } else if (type === 'payment_reminder') {
      title = 'Rappel Scolarité';
      content = `Chers Parents, le versement des frais de scolarité de ${student.firstName} est attendu. Reste dû: ${(schoolingTarget - totalPaid).toLocaleString()} FCFA. Merci pour votre règlement.`;
    } else if (type === 'grade_report') {
      title = 'Note de Bulletin';
      content = `Cher Parent, les résultats d'évaluation de ${student.firstName} ${student.lastName} viennent d'être synchronisés et révisés. Moyenne actuelle: ${overallAvg}/20.`;
    } else if (type === 'custom') {
      title = customTitle || 'Communication Officielle';
      content = customContent || '';
    }

    try {
      const parentChoice = student.primaryParentContact || 'father';
      let resolvedPhone = '';
      if (parentChoice === 'father') resolvedPhone = student.fatherPhone;
      else if (parentChoice === 'mother') resolvedPhone = student.motherPhone;
      else if (parentChoice === 'guardian') resolvedPhone = student.guardianPhone;
      else if (parentChoice === 'emergency') resolvedPhone = student.emergencyPhone;

      const recipientPhone = resolvedPhone || 
                             student.parentContact || 
                             student.fatherPhone || 
                             student.motherPhone || 
                             student.guardianPhone || 
                             student.parentAccountPhone || 
                             studentParent?.phone || 
                             '';

      const commId = uuidv4();
      await db.communications.put({
        id: commId,
        merchantId: merchant.id,
        studentId: student.id,
        title,
        content,
        type: 'sms',
        recipientPhone: recipientPhone || 'Non configuré',
        date: new Date().toISOString(),
        syncStatus: 'synced',
        updatedAt: new Date().toISOString()
      });
      toast.success(`Notification "${title}" enregistrée dans le dossier local !`);
      
      if (recipientPhone && recipientPhone !== 'Non configuré') {
        setActiveAdminDispatch({
          phone: recipientPhone,
          message: content,
          studentName: `${student.firstName} ${student.lastName}`,
          title
        });
      } else {
        toast.error("Aucun numéro de parent configuré pour l'envoi direct.");
      }
    } catch (err) {
      toast.error("Échec d'envoi de la communication");
    }
  };

  const generateAiReport = async () => {
    setIsAiGenerating(true);
    try {
      const gradesDetailed = courseAverages.map(c => `${c.subject}: ${c.average}/20`).join(', ');
      const attSummary = `${totalAbsences} absences, ${totalLates} retards.`;
      const finSummary = `Payé: ${totalPaid.toLocaleString()} / du: ${schoolingTarget.toLocaleString()} FCFA.`;

      const prompt = `Génère une appréciation de bulletin scolaire globale et complète, constructive et encourageante rédigée en français pour:
      Élève: ${student.firstName} ${student.lastName}
      Classe: ${student.grade}
      Performance Académique générale: ${gradesDetailed || "Pas encore évalué."}
      Moyenne globale estimée: ${overallAvg}/20
      Présence scolaire: ${attSummary}
      Données administratives financières: ${finSummary}
      
      Formule l'avis en deux paragraphes soignés :
      Paragraphe 1 : Sur sa structure académique (méthodologie, persévérance et régularité de cours).
      Paragraphe 2 : Sur l'assiduité éducative globale, l'intégration des différents modules scolaires et de sa situation de scolarité. Reste professionnel, poli et engageant.`;

      const responseText = await geminiService.generateText(prompt);
      
      const insightId = uuidv4();
      await db.ai_insights.put({
        id: insightId,
        merchantId: merchant.id,
        studentId: student.id,
        type: 'bulletin_appreciation',
        content: responseText || `Excellents efforts constants de la part de ${student.firstName}. La scolarité est rigoureusement à jour et le suivi académique reflète d'excellentes dispositions. Continuez ainsi.`,
        date: new Date().toISOString(),
        syncStatus: 'synced',
        updatedAt: new Date().toISOString()
      });
      toast.success("Analyse synthétique IA générée !");
    } catch (err) {
      toast.error("Le traitement IA a échoué. Génération de la note de synthèse administrative locale.");
      const insightId = uuidv4();
      await db.ai_insights.put({
        id: insightId,
        merchantId: merchant.id,
        studentId: student.id,
        type: 'bulletin_appreciation',
        content: `Rapport de suivi généré : L'étudiant ${student.firstName} présente une moyenne globale de ${overallAvg}/20. Assiduité correcte à ${attendanceRate}%. Situation financière en règle avec un solde payé de ${totalPaid.toLocaleString()} FCFA sur ${schoolingTarget.toLocaleString()} FCFA attendus. Bonne intégration sur l'ensemble des modules d'enseignement scolaire.`,
        date: new Date().toISOString(),
        syncStatus: 'synced',
        updatedAt: new Date().toISOString()
      });
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-100">
      <motion.div initial={{ opacity: 0, scale: 1, y: 0 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white w-full h-full overflow-hidden flex flex-col">
        
        {/* Banner */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 flex flex-col md:flex-row justify-between items-start md:items-center text-white gap-4">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner border border-white/10">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black">{student.firstName} {student.lastName}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest ${
                  student.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                }`}>
                  {student.status === 'active' ? 'ACTIF' : 'INACTIF'}
                </span>
              </div>
              <div className="flex gap-4 mt-2 font-mono text-xs uppercase tracking-widest text-indigo-200">
                <span>MAT: {student.id?.substring(0,8)}</span>
                <span>•</span>
                <span>Classe: {student.grade || 'Non assigné'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 self-stretch md:self-auto justify-between flex-wrap">
            <div className="flex items-center bg-white/10 rounded-xl overflow-hidden border border-white/20">
              <button 
                onClick={handlePrintDossier}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-wider transition-all shadow-inner flex items-center gap-2"
                title="Imprimer le Dossier Académique Complet"
              >
                <Printer className="w-4 h-4" />
                <span>Dossier</span>
              </button>
              <button 
                onClick={handleDownloadDossier}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[10px] tracking-wider transition-all shadow-inner flex items-center gap-2 border-l border-white/20"
                title="Télécharger le Dossier Académique Complet en PDF"
              >
                <Download className="w-4 h-4" />
                <span>PDF</span>
              </button>
            </div>
            <div className="flex items-center bg-white/10 rounded-xl overflow-hidden border border-white/20">
              <select 
                value={selectedPeriod} 
                onChange={e => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 bg-transparent text-white font-bold uppercase text-[10px] tracking-wider outline-none cursor-pointer"
              >
                {academicPeriods.map(p => <option key={p} value={p} className="text-gray-900">{p}</option>)}
              </select>
              <button 
                onClick={handlePrintReportCard}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] tracking-wider transition-all shadow-inner flex items-center gap-2 border-l border-white/20"
                title="Imprimer le Bulletin de Notes"
              >
                <Printer className="w-4 h-4" />
                <span>Bulletin</span>
              </button>
              <button 
                onClick={handleDownloadReportCard}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-black uppercase text-[10px] tracking-wider transition-all shadow-inner flex items-center gap-2 border-l border-white/20"
                title="Télécharger le Bulletin en format PDF robuste"
              >
                <Download className="w-4 h-4" />
                <span>PDF</span>
              </button>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors bg-white/5 p-2 rounded-xl border border-white/5"><X className="w-6 h-6" /></button>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 px-4 md:px-8 space-x-1 overflow-x-auto shrink-0 py-2 scrollbar-none">
          <button onClick={() => setActiveSubTab('summary')} className={`px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeSubTab === 'summary' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
          }`}>Vue d'ensemble</button>
          <button onClick={() => setActiveSubTab('grades')} className={`px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeSubTab === 'grades' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
          }`}>Notes ({grades.length})</button>
          <button onClick={() => setActiveSubTab('attendance')} className={`px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeSubTab === 'attendance' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
          }`}>Assiduité ({totalAbsences > 0 ? `${totalAbsences} abs` : 'O abs'})</button>
          <button onClick={() => setActiveSubTab('finance')} className={`px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeSubTab === 'finance' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
          }`}>Scolarité & Frais</button>
          <button onClick={() => setActiveSubTab('parent')} className={`px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeSubTab === 'parent' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
          }`}>Tuteur & SMS</button>
          <button onClick={() => setActiveSubTab('ai')} className={`px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeSubTab === 'ai' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
          }`}>Assistant Synthèse IA</button>
        </div>

        {/* Contents Area */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-gray-50/30">
          <AnimatePresence mode="wait">
            {activeSubTab === 'summary' && (
              <motion.div key="summary" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-8 print:p-0">
                
                {/* Top Quick Actions and Status Banner */}
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-3xl text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl border border-indigo-950 print:hidden">
                  <div>
                    <h4 className="font-black text-lg tracking-tight">Dossier Académique & Scolaire Unifié</h4>
                    <p className="text-xs text-indigo-200 mt-1 max-w-xl">
                      Cette vue consolide l'état civil, la filiation administrative, le suivi médical, les relevés de notes, l'assiduité en direct et l'échéancier de scolarité de l'élève.
                    </p>
                  </div>
                  <div className="flex gap-2.5 w-full sm:w-auto shrink-0 flex-wrap md:flex-nowrap">
                    <div className="flex-1 sm:flex-initial flex items-stretch bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-md">
                      <button 
                        onClick={handlePrintDossier}
                        className="flex-1 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-2"
                        title="Imprimer le Dossier Scolaire Complet"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Dossier</span>
                      </button>
                      <button 
                        onClick={handleDownloadDossier}
                        className="flex-1 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-black uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-2 border-l border-indigo-500"
                        title="Télécharger le Dossier Scolaire Complet en format PDF"
                      >
                        <Download className="w-4 h-4" />
                        <span>PDF</span>
                      </button>
                    </div>
                    
                    <div className="flex-1 sm:flex-initial flex items-stretch bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-md">
                      <select 
                        value={selectedPeriod} 
                        onChange={e => setSelectedPeriod(e.target.value)}
                        className="px-4 bg-transparent text-gray-700 font-bold uppercase text-[11px] tracking-wider outline-none cursor-pointer border-r border-gray-200"
                      >
                        {academicPeriods.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <button 
                        onClick={handlePrintReportCard}
                        className="flex-1 px-5 py-3 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-black uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-2"
                        title="Imprimer le Bulletin de Notes"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Bulletin</span>
                      </button>
                      <button 
                        onClick={handleDownloadReportCard}
                        className="flex-1 px-5 py-3 bg-teal-600 hover:bg-teal-500 active:scale-98 text-white font-black uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-2 border-l border-teal-500"
                        title="Télécharger le Bulletin de Notes en format PDF"
                      >
                        <Download className="w-4 h-4" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Highlight Stats Dashboard */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Moyenne */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Moyenne Générale</span>
                      <p className="text-2xl font-mono font-black text-indigo-600">{overallAvg} <span className="text-xs text-gray-400 font-normal">/ 20</span></p>
                    </div>
                  </div>

                  {/* Assiduité */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                      <ClipboardCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Taux de Présence</span>
                      <p className="text-2xl font-mono font-black text-emerald-600">{attendanceRate}%</p>
                    </div>
                  </div>

                  {/* Finances */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 sm:col-span-2 lg:col-span-1">
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Scolarité Payée</span>
                      <p className="text-xl font-mono font-black text-gray-900 tracking-tight">
                        {totalPaid.toLocaleString()} <span className="text-xs font-normal text-rose-500 font-bold">/ {schoolingTarget.toLocaleString()} FCFA</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 1 : Fiche d'identification Élève & Administratif */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                  <h3 className="font-black text-sm uppercase tracking-wider text-indigo-900 pb-3 border-b border-gray-100 flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-600" /> I. IDENTITÉ DE L'ÉLÈVE & INSCRIPTION
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm text-gray-650">
                    <div>
                      <span className="text-[10px] text-gray-400 font-black block uppercase tracking-widest mb-1">Nom complet d'usage</span>
                      <span className="font-extrabold text-gray-900 text-base">{student.firstName} {student.lastName}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 font-black block uppercase tracking-widest mb-1">Classe scolaire</span>
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg text-xs tracking-wider inline-block">{student.grade || 'Non assigné'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 font-black block uppercase tracking-widest mb-1">Matricule Interne</span>
                      <span className="font-mono font-black text-gray-950 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-lg text-xs">{student.matricule || student.id?.substring(0,8) || '---'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 font-black block uppercase tracking-widest mb-1">Date & Lieu de Naissance</span>
                      <span className="font-semibold text-gray-900">
                        {student.birthDate ? safeFormatDate(student.birthDate, 'dd MMMM yyyy') : '---'} à {student.birthPlace || '---'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 font-black block uppercase tracking-widest mb-1">Nationalité</span>
                      <span className="font-semibold text-gray-800">{student.nationality || 'Sénégalaise'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 font-black block uppercase tracking-widest mb-1">N_ d'identité national (NINE)</span>
                      <span className="font-mono text-gray-700">{student.nationalId || 'Non fourni'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 font-black block uppercase tracking-widest mb-1">Date d'Inscription</span>
                      <span className="font-bold text-gray-900">{student.registrationDate ? safeFormatDate(student.registrationDate, 'dd MMMM yyyy') : '---'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 font-black block uppercase tracking-widest mb-1">Régime de Scolarité</span>
                      <span className="font-black text-xs uppercase tracking-wider text-emerald-800 bg-emerald-55 bg-emerald-50 px-3 py-1 rounded-lg inline-block">{student.regime || 'externe'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 font-black block uppercase tracking-widest mb-1">Année scolaire de cours</span>
                      <span className="font-bold text-gray-850">{student.schoolYear || '2025-2026'}</span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-gray-400 font-black block uppercase tracking-widest mb-1">Adresse de Résidence</span>
                      <span className="font-medium text-gray-900">{student.address || '---'} {student.neighborhood ? `(${student.neighborhood})` : ''} - {student.city || '---'}, {student.country || 'Sénégal'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 font-black block uppercase tracking-widest mb-1">Téléphone de l'Élève</span>
                      <span className="font-bold text-gray-900">{student.phone || '---'}</span>
                    </div>
                  </div>
                </div>

                {/* Section 1.5 : Accès Portaux (Élève & Parents) */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                  <h3 className="font-black text-sm uppercase tracking-wider text-indigo-900 pb-3 border-b border-gray-100 flex items-center gap-2">
                    <Key className="w-5 h-5 text-indigo-600" /> IDENTIFIANTS & ACCÈS PORTAILS (ÉLÈVE / PARENTS)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Portail Élève Credentials */}
                    <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-indigo-100">
                        <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Portail Élève</span>
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">Généré au dossier</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Identifiant Élève</label>
                          <div className="flex justify-between items-center bg-white border border-gray-200 px-3 py-2 rounded-xl text-xs font-mono font-black">
                            <span>{student.studentUsername || student.username || 'Non configuré'}</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(student.studentUsername || student.username || '');
                                toast.success("Identifiant élève copié !");
                              }}
                              className="text-indigo-600 hover:text-indigo-800 text-[10px] font-black uppercase tracking-wider shrink-0"
                            >
                              Copier
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Code PIN d'Accès</label>
                          <div className="flex justify-between items-center bg-white border border-gray-200 px-3 py-2 rounded-xl text-xs font-mono font-black">
                            <span>{student.studentPassword || student.password || 'Non configuré'}</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(student.studentPassword || student.password || '');
                                toast.success("Code PIN élève copié !");
                              }}
                              className="text-indigo-600 hover:text-indigo-800 text-[10px] font-black uppercase tracking-wider shrink-0"
                            >
                              Copier
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Portail Parent Credentials */}
                    <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-emerald-100">
                        <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Portail Parents</span>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded">Généré au dossier</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Identifiant Parent (Téléphone ou Login)</label>
                          <div className="flex justify-between items-center bg-white border border-gray-200 px-3 py-2 rounded-xl text-xs font-mono font-black">
                            <span>{parentCredentials?.username || student.parentContact || 'Non configuré'}</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(parentCredentials?.username || student.parentContact || '');
                                toast.success("Identifiant parent copié !");
                              }}
                              className="text-emerald-700 hover:text-emerald-900 text-[10px] font-black uppercase tracking-wider shrink-0"
                            >
                              Copier
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Code PIN d'Accès</label>
                          <div className="flex justify-between items-center bg-white border border-gray-200 px-3 py-2 rounded-xl text-xs font-mono font-black">
                            <span>{parentCredentials?.password || 'Non configuré'}</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(parentCredentials?.password || '');
                                toast.success("Code PIN parent copié !");
                              }}
                              className="text-emerald-700 hover:text-emerald-900 text-[10px] font-black uppercase tracking-wider shrink-0"
                            >
                              Copier
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2 : Filiation administrative & Parents */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                  <h3 className="font-black text-sm uppercase tracking-wider text-indigo-900 pb-3 border-b border-gray-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" /> II. FILIATION & PARENTS D'ÉLÈVES
                  </h3>

                  <div className={`grid grid-cols-1 ${student.guardianName || student.primaryParentContact === 'guardian' ? 'lg:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
                    {/* Père / Tuteur principal */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                      <div className="pb-2 border-b border-slate-200/50 flex justify-between items-center">
                        <h4 className="font-extrabold text-sm text-slate-900">PÈRE / CHEF DE FAMILLE</h4>
                        {(!student.primaryParentContact || student.primaryParentContact === 'father') ? (
                          <span className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded">📞 Contact Prioritaire</span>
                        ) : (
                          <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Tuteur</span>
                        )}
                      </div>
                      <div className="space-y-2 text-xs">
                        <p className="flex justify-between"><span className="text-gray-400 font-medium">Nom complet :</span> <strong className="text-gray-900">{student.fatherName || '---'}</strong></p>
                        <p className="flex justify-between"><span className="text-gray-400 font-medium">Profession :</span> <strong className="text-gray-850">{student.fatherProfession || '---'}</strong></p>
                        <p className="flex justify-between"><span className="text-gray-400 font-medium">Téléphone portable :</span> <strong className="text-gray-900">{student.fatherPhone || '---'}</strong></p>
                        <p className="flex justify-between"><span className="text-gray-400 font-medium">Email de contact :</span> <strong className="text-gray-900">{student.fatherEmail || '---'}</strong></p>
                      </div>
                    </div>

                    {/* Mère */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                      <div className="pb-2 border-b border-slate-200/50 flex justify-between items-center">
                        <h4 className="font-extrabold text-sm text-slate-900">MÈRE DE L'ÉLÈVE</h4>
                        {student.primaryParentContact === 'mother' ? (
                          <span className="text-[9px] font-black uppercase text-pink-700 bg-pink-100 border border-pink-200 px-2 py-0.5 rounded">📞 Contact Prioritaire</span>
                        ) : (
                          <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Filiation Directe</span>
                        )}
                      </div>
                      <div className="space-y-2 text-xs">
                        <p className="flex justify-between"><span className="text-gray-400 font-medium">Nom complet :</span> <strong className="text-gray-900">{student.motherName || '---'}</strong></p>
                        <p className="flex justify-between"><span className="text-gray-400 font-medium">Profession :</span> <strong className="text-gray-850">{student.motherProfession || '---'}</strong></p>
                        <p className="flex justify-between"><span className="text-gray-400 font-medium">Téléphone portable :</span> <strong className="text-gray-900">{student.motherPhone || '---'}</strong></p>
                        <p className="flex justify-between"><span className="text-gray-400 font-medium">Email de contact :</span> <strong className="text-gray-900">{student.motherEmail || '---'}</strong></p>
                      </div>
                    </div>

                    {/* Tuteur Légal */}
                    {(student.guardianName || student.primaryParentContact === 'guardian') && (
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                        <div className="pb-2 border-b border-slate-200/50 flex justify-between items-center">
                          <h4 className="font-extrabold text-sm text-slate-900">TUTEUR LÉGAL / AUTRE</h4>
                          {student.primaryParentContact === 'guardian' ? (
                            <span className="text-[9px] font-black uppercase text-violet-700 bg-violet-100 border border-violet-200 px-2 py-0.5 rounded">📞 Contact Prioritaire</span>
                          ) : (
                            <span className="text-[9px] font-black uppercase text-violet-600 bg-violet-50 px-2 py-0.5 rounded">Gardien</span>
                          )}
                        </div>
                        <div className="space-y-2 text-xs">
                          <p className="flex justify-between"><span className="text-gray-400 font-medium">Nom complet :</span> <strong className="text-gray-900">{student.guardianName || '---'}</strong></p>
                          <p className="flex justify-between"><span className="text-gray-400 font-medium">Relation :</span> <strong className="text-gray-850">{student.guardianRelation || '---'}</strong></p>
                          <p className="flex justify-between"><span className="text-gray-400 font-medium">Téléphone portable :</span> <strong className="text-gray-900">{student.guardianPhone || '---'}</strong></p>
                          <p className="flex justify-between"><span className="text-gray-400 font-medium">Email de contact :</span> <strong className="text-gray-900">{student.guardianEmail || '---'}</strong></p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3 : Santé, Dossier Médical & Urgences */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                  <h3 className="font-black text-sm uppercase tracking-wider text-rose-900 pb-3 border-b border-gray-100 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" /> III. DOSSIER SANTÉ & CONTACTS D'URGENCES
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                    <div className="bg-rose-50/50 p-4 border border-rose-100/50 rounded-2xl flex flex-col justify-between">
                      <span className="text-[10px] text-rose-700 font-black uppercase tracking-widest block mb-1">Groupe Sanguin</span>
                      <span className="text-xl font-black text-rose-900 flex items-center gap-1.5">🩸 {student.bloodType || 'Non recensé'}</span>
                    </div>

                    <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl col-span-1 sm:col-span-2 md:col-span-1">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">Allergies connues</span>
                      <span className="font-bold text-gray-900 text-xs block mt-1">{student.allergies || 'Aucune allergie déclarée'}</span>
                    </div>

                    <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">Situation de Handicap</span>
                      <span className="font-bold text-gray-900 text-xs block mt-1">
                        {student.hasDisability === 'oui' ? `Oui (${student.disabilityDetails || 'sans détails'})` : 'Aucun'}
                      </span>
                    </div>

                    <div className="bg-amber-50/50 p-4 border border-amber-100 rounded-2xl col-span-1 sm:col-span-2 lg:col-span-4">
                      <span className="text-[10px] text-amber-800 font-black uppercase tracking-widest block mb-1">Traitements médicaux suivis</span>
                      <span className="font-medium text-amber-950 text-xs leading-relaxed">{student.medicalTreatment || 'Aucun traitement médical ou suivi régulier en cours'}</span>
                    </div>

                    <div className="bg-red-50 p-4 md:p-5 border border-red-200/60 rounded-2xl col-span-1 sm:col-span-2 lg:col-span-4 flex items-center justify-between gap-4 flex-wrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] text-red-600 font-black uppercase tracking-widest block">RECOMMANDATIONS ET ALERTES EN CAS D'URGENCES</span>
                          {student.primaryParentContact === 'emergency' && (
                            <span className="text-[9px] font-black uppercase text-red-700 bg-red-100 border border-red-200 px-2 py-0.2 rounded">📞 Contact Prioritaire</span>
                          )}
                        </div>
                        <p className="font-extrabold text-sm text-red-900">
                          Contact d'urgence direct : <span className="font-black underline">{student.emergencyName || '---'}</span> ({student.emergencyRelation || 'Tuteur'})
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-red-800 text-lg bg-red-100/80 px-4 py-1.5 rounded-xl border border-red-200/50">
                          📱 {student.emergencyPhone || '---'}
                        </span>
                        <button 
                          onClick={() => {
                            if (student.emergencyPhone) {
                              sendNotification('absence'); 
                            } else {
                              toast.error("Aucun numéro de contact d'urgence défini.");
                            }
                          }}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black uppercase text-[9px] tracking-widest rounded-xl transition-all shadow-md flex items-center gap-1.5 border border-red-500"
                        >
                          <Zap className="w-3.5 h-3.5 text-white fill-current" />
                          <span>ALERTER SMS</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4 : Relevé de Notes & Devoirs de Classe */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-gray-100">
                    <h3 className="font-black text-sm uppercase tracking-wider text-indigo-900 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-indigo-600" /> IV. RÉSULTATS ACADÉMIQUES & NOTES DIRECTES
                    </h3>
                    <button 
                      onClick={() => setActiveSubTab('grades')}
                      className="text-xs font-black uppercase tracking-wider text-indigo-600 hover:underline"
                    >
                      Éditer les notes &rarr;
                    </button>
                  </div>

                  {grades.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-xs">
                      Aucune note ni devoir d'évaluation n'a de saisie pour cet apprenant.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-3xl border border-slate-100">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                            <th className="px-5 py-3">Matière d'évaluation</th>
                            <th className="px-5 py-3 text-center">Devoir 1</th>
                            <th className="px-5 py-3 text-center">Devoir 2</th>
                            <th className="px-5 py-3 text-center text-indigo-600">Composition</th>
                            <th className="px-5 py-3 text-center bg-slate-100 text-slate-800 font-black">Moyenne trimestrielle</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {grades.map((g: any) => (
                            <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-3.5 font-bold text-gray-900">{g.subjectId}</td>
                              <td className="px-5 py-3.5 text-center font-mono text-gray-600">{g.devoir1 || '-'}</td>
                              <td className="px-5 py-3.5 text-center font-mono text-gray-600">{g.devoir2 || '-'}</td>
                              <td className="px-5 py-3.5 text-center font-mono font-bold text-indigo-600">{g.compo || '-'}</td>
                              <td className="px-5 py-3.5 text-center font-mono font-black bg-slate-50 text-slate-900">{calculateAverage(g)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section 5 : Assiduité & Registre de Présence */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-gray-100">
                    <h3 className="font-black text-sm uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-emerald-600" /> V. ASSIDUITÉ, RETARDS & FEUILLES D'APPELS
                    </h3>
                    <button 
                      onClick={() => setActiveSubTab('attendance')}
                      className="text-xs font-black uppercase tracking-wider text-emerald-600 hover:underline"
                    >
                      Éditer les absences &rarr;
                    </button>
                  </div>

                  {attendances.length === 0 ? (
                    <div className="text-center py-8 text-emerald-600 text-xs font-bold leading-relaxed">
                      Aucune absence ou retard signalé. Présence et assiduité estimées à 100%.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-2 scrollbar-none border border-slate-50 rounded-2xl p-1 bg-slate-50/30">
                      {attendances.map((a: any) => (
                        <div key={a.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="font-bold text-xs text-gray-900">{format(new Date(a.date), 'dd MMMM yyyy')}</p>
                              <p className="text-[9px] text-gray-400 font-bold">Classe concernée : {a.classId || student.grade}</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full border ${
                            a.status === 'absent' ? 'bg-red-50 text-red-600 border-red-100' :
                            a.status === 'late' ? 'bg-yellow-55 text-yellow-600 border-yellow-105 bg-yellow-50 text-yellow-600 border-yellow-105' :
                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                            {a.status === 'absent' ? 'ABSENT' : a.status === 'late' ? 'RETARD' : 'PRÉSENT'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 6 : Scolarité & Comptabilité Financière */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-indigo-50">
                    <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-indigo-600" /> VI. FACTURATION DE SCOLARITÉ & VERSEMENTS RECUS
                    </h3>
                    <button 
                      onClick={() => setActiveSubTab('finance')}
                      className="text-xs font-black uppercase tracking-wider text-indigo-600 hover:underline"
                    >
                      Enregistrer un règlement &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-indigo-50/50 p-4 border border-indigo-100 rounded-2xl">
                      <span className="text-[10px] text-indigo-700 font-black uppercase tracking-widest block mb-0.5">Bourse Requis / Objectif</span>
                      <strong className="text-lg font-mono font-black text-indigo-950">{schoolingTarget.toLocaleString()} FCFA</strong>
                    </div>
                    <div className="bg-emerald-50/50 p-4 border border-emerald-100 rounded-2xl">
                      <span className="text-[10px] text-emerald-700 font-black uppercase tracking-widest block mb-0.5">Total déjà encaissé</span>
                      <strong className="text-lg font-mono font-black text-emerald-950">+{totalPaid.toLocaleString()} FCFA</strong>
                    </div>
                    <div className="bg-rose-50/50 p-4 border border-rose-100 rounded-2xl">
                      <span className="text-[10px] text-rose-700 font-black uppercase tracking-widest block mb-0.5">Solde Échéance Restante</span>
                      <strong className="text-lg font-mono font-black text-rose-950">{Math.max(0, schoolingTarget - totalPaid).toLocaleString()} FCFA</strong>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${Math.min(100, Math.round((totalPaid / schoolingTarget) * 100))}%` }}></div>
                  </div>

                  <h4 className="font-extrabold text-[11px] text-indigo-900 uppercase tracking-widest pt-2 flex items-center gap-1.5">
                    REÇUS DE SCOLARITÉ ENREGISTRÉS ({studentPayments.length})
                  </h4>

                  {studentPayments.length === 0 ? (
                    <div className="text-center py-6 text-gray-550 text-xs">
                      Aucun reçu d'écolage ou facture n'a d'encaissement sur cet exercice.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-2 scrollbar-none border border-slate-50 rounded-2xl p-1 bg-slate-50/20">
                      {studentPayments.map((p: any) => (
                        <div key={p.id} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex justify-between items-center flex-wrap gap-2 text-xs">
                          <div>
                            <p className="font-black text-slate-900">{p.items?.[0]?.name || 'Frais de Scolarité'}</p>
                            <p className="text-[9px] text-gray-400 font-mono mt-0.5">REF: {p.id?.substring(0,8)} • {p.createdAt ? safeFormatDate(p.createdAt, 'dd/MM/yyyy HH:mm') : 'date inconnue'}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-black text-emerald-600">+{p.paidAmount?.toLocaleString()} FCFA</span>
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">{p.paymentMethod}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 7 : Documents de dossier d'inscription requis */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                  <h3 className="font-black text-sm uppercase tracking-wider text-indigo-900 pb-3 border-b border-gray-100 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-indigo-600" /> VII. PIÈCES ADMINISTRATIVES DU DOSSIER D'INSCRIPTION
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-semibold">
                    {[
                      { key: 'docBirthCert', label: 'Extrait d\'acte de naissance' },
                      { key: 'docSchoolCert', label: 'Certificat de scolarité de cours' },
                      { key: 'docPrevReport', label: 'Bulletins scolaires antérieurs' },
                      { key: 'docIdentityPhotos', label: 'Photos d\'identité réglementaires' },
                      { key: 'docMedicalCert', label: 'Certificat d\'aptitude médicale' },
                      { key: 'docIdentityCard', label: 'Copie conforme d’identité' },
                      { key: 'docReceipt', label: 'Quittance frais d\'inscription' }
                    ].map(d => {
                      const present = !!student[d.key];
                      return (
                        <div key={d.key} className={`p-3.5 rounded-2xl border flex justify-between items-center ${
                          present ? 'bg-emerald-50/40 border-emerald-100 text-emerald-950' : 'bg-rose-50/40 border-rose-100 text-rose-950'
                        }`}>
                          <span className="text-gray-700">{d.label}</span>
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                            present ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {present ? 'REÇU' : 'MANQUANT'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 8 : Synthèse d'Appréciation Générale IA (Gemini) */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-purple-100 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-purple-50">
                    <h3 className="font-black text-sm uppercase tracking-wider text-purple-950 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" /> VIII. SYNTHÈSE D'APPRÉCIATION PAR L'INTELLIGENCE ARTIFICIELLE
                    </h3>
                    <button 
                      onClick={() => setActiveSubTab('ai')}
                      className="text-xs font-black uppercase tracking-wider text-purple-700 hover:underline"
                    >
                      Configurer l'assistant IA &rarr;
                    </button>
                  </div>

                  {aiInsights.length === 0 ? (
                    <div className="bg-purple-50/40 p-5 rounded-2xl border border-purple-100 text-center space-y-3">
                      <p className="text-purple-900 text-xs font-semibold">
                        Aucun bulletin d'appréciation synthétique de l'élève n'a été rédigé par Gemini.
                      </p>
                      <button 
                        onClick={generateAiReport}
                        disabled={isAiGenerating}
                        className="mx-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 active:scale-97 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isAiGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
                        <span>{isAiGenerating ? "Consolidation..." : "GÉNÉRER L'APPRÉCIATION PAR L'IA"}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100 space-y-2">
                      <p className="text-purple-950 text-xs font-medium whitespace-pre-wrap leading-relaxed">
                        {aiInsights[0].content}
                      </p>
                      <p className="text-[9px] font-mono text-purple-400 text-right pt-2 border-t border-purple-100/30">
                        Consolidé par l'assistant pédagogique autonome • Gemini 3.5 Flash le {safeFormatDate(aiInsights[0].date, 'dd MMMM yyyy à HH:mm')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Section 9 : Signatures & Cachet Académique de l'Établissement */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                  <h3 className="font-black text-sm uppercase tracking-wider text-slate-800 pb-3 border-b border-gray-100 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" /> IX. VALIDATION ADMINISTRATIVE ET AUTORISATIONS DES PARENTS
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center text-xs">
                    <div className="space-y-3">
                      <strong className="text-gray-500 block uppercase tracking-widest text-[10px]">SIGNATURE ET ACCORD DU PARENT</strong>
                      <p className="text-[10px] text-gray-400 font-bold">Signé par {student.parentSignName || student.fatherName || 'Représentant Légal'} le {student.parentSignDate || safeFormatDate(new Date(), 'dd/MM/yyyy')}</p>
                      <div className="border border-dashed border-gray-200 h-28 flex items-center justify-center rounded-2xl bg-gray-50/50 p-3 max-w-sm mx-auto overflow-hidden">
                        {student.parentSignature ? (
                          <img src={student.parentSignature} alt="Signature Parent" className="max-h-24 max-w-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Fiche validée par accord parental</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <strong className="text-gray-500 block uppercase tracking-widest text-[10px]">VISA & CACHET TECHNIQUE DE L'ADMINISTRATION</strong>
                      <p className="text-[10px] text-gray-400 font-bold">Validé et enregistré par {student.adminSignName || 'Secréteriat de l\'Établissement'}</p>
                      <div className="border border-dashed border-gray-200 h-28 flex items-center justify-center rounded-2xl bg-gray-50/50 p-3 max-w-sm mx-auto overflow-hidden">
                        {student.adminSignature ? (
                          <img src={student.adminSignature} alt="Signature Administrateur" className="max-h-24 max-w-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="text-gray-400 font-bold border-2 border-gray-300 px-4 py-1.5 rounded-lg transform -rotate-6 font-mono tracking-widest text-[11px] uppercase">
                            TAMPON ERP ECOLE
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Watermark */}
                <div className="text-center text-[10px] font-mono text-gray-400 tracking-widest uppercase py-6 border-t border-gray-100">
                  ACOM ERP • LOGICIEL DE SECRÉTARIAT ACADÉMIQUE PROFESSIONNEL
                </div>

              </motion.div>
            )}

            {/* Tab Grades */}
            {activeSubTab === 'grades' && (
              <motion.div key="grades" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <PenTool className="w-5 h-5 text-indigo-500" /> Notes sur les Devoirs & Compositions
                    </h3>
                    <div className="px-3 py-1.5 bg-gray-100 font-mono text-xs rounded-lg text-gray-600 font-bold">
                      Moyenne générale actuelle: <span className="text-primary font-black text-sm">{overallAvg}</span>/20
                    </div>
                  </div>

                  {grades.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      Aucune matière n'a encore été notée pour cet élève.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left bg-gray-50/20 rounded-2xl overflow-hidden">
                        <thead>
                          <tr className="bg-indigo-50/50 text-[10px] font-mono font-black text-indigo-400 uppercase tracking-[0.2em] border-b border-indigo-100/50">
                            <th className="px-6 py-4">Matières évaluées</th>
                            <th className="px-6 py-4 text-center">Devoir 1</th>
                            <th className="px-6 py-4 text-center">Devoir 1</th>
                            <th className="px-6 py-4 text-center">Composition</th>
                            <th className="px-6 py-4 text-center bg-indigo-50">Moyenne trimestrielle</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {grades.map(g => (
                            <tr key={g.id} className="hover:bg-white transition-colors">
                              <td className="px-6 py-4 font-bold text-gray-900">{g.subjectId}</td>
                              <td className="px-6 py-4 text-center font-mono text-gray-600">{g.devoir1 || '-'}</td>
                              <td className="px-6 py-4 text-center font-mono text-gray-600">{g.devoir2 || '-'}</td>
                              <td className="px-6 py-4 text-center font-mono font-bold text-indigo-600">{g.compo || '-'}</td>
                              <td className="px-6 py-4 text-center font-mono font-black bg-indigo-50/30 text-indigo-900 border-x border-indigo-50">{calculateAverage(g)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Tab Attendance */}
            {activeSubTab === 'attendance' && (
              <motion.div key="attendance" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Suivi Des Feuillets d'appel</h3>
                    <div className="flex gap-4">
                      <span className="text-xs font-bold text-gray-500 mt-0.5">Absences: <strong className="text-red-500 font-mono font-black">{totalAbsences}</strong></span>
                      <span className="text-xs font-bold text-gray-500 mt-0.5">Retards: <strong className="text-yellow-600 font-mono font-black">{totalLates}</strong></span>
                    </div>
                  </div>

                  {attendances.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      Aucune absence signalée. Taux de présence optimal (100%).
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {attendances.map(a => (
                        <div key={a.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="font-bold text-sm text-gray-900">{format(new Date(a.date), 'dd MMMM yyyy')}</p>
                              <p className="text-[10px] text-gray-500 font-medium">Classe: {a.classId}</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${
                            a.status === 'absent' ? 'bg-red-50 text-red-600 border-red-100' :
                            a.status === 'late' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                            {a.status === 'absent' ? 'ABSENT' : a.status === 'late' ? 'RETARD' : 'PRÉSENT'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Tab Finance */}
            {activeSubTab === 'finance' && (
              <motion.div key="finance" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-6">
                
                {/* School fee progress card */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Écolage & Finances de Scolarité</h3>
                      <p className="text-xs text-gray-500 mt-1">Synchronisé avec le module de comptabilité & POS</p>
                    </div>

                    <div className="w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500">Objectif Annuel:</span>
                        <input 
                          type="number" 
                          value={schoolingTarget}
                          onChange={(e) => handleUpdateTarget(e.target.value)}
                          className="w-32 h-9 p-2 text-sm font-mono font-bold bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        />
                      </div>
                      <button onClick={() => setIsPayModalOpen(true)} className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg hover:scale-102 transition-transform text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                        <Plus className="w-3.5 h-3.5" /> Enregistrer un Versement
                      </button>
                    </div>
                  </div>

                  {/* Financial calculation widgets */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <div className="bg-emerald-50/50 p-4 border border-emerald-100 rounded-2xl">
                      <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block mb-1">Montant versé</span>
                      <span className="text-xl font-mono font-black text-emerald-900">{totalPaid.toLocaleString()} FCFA</span>
                    </div>
                    <div className="bg-rose-50/50 p-4 border border-rose-100 rounded-2xl">
                      <span className="text-[10px] font-black text-rose-800 uppercase tracking-widest block mb-1">Solde restant dû</span>
                      <span className="text-xl font-mono font-black text-rose-900">{Math.max(0, schoolingTarget - totalPaid).toLocaleString()} FCFA</span>
                    </div>
                    <div className="bg-indigo-50/50 p-4 border border-indigo-100 rounded-2xl">
                      <span className="text-[10px] font-black text-indigo-800 uppercase tracking-widest block mb-1">Taux de couverture</span>
                      <span className="text-xl font-mono font-black text-indigo-900">{Math.round((totalPaid / schoolingTarget) * 100)}%</span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(100, Math.round((totalPaid / schoolingTarget) * 100))}%` }}></div>
                  </div>

                  <h4 className="font-bold text-sm text-gray-900 mb-4 uppercase tracking-widest">Historique de comptabilité scolaire ({studentPayments.length} versements) </h4>
                  
                  {studentPayments.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 font-medium">
                      Aucun versement de scolarité n'a été enregistré pour le moment.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {studentPayments.map((p: any) => (
                        <div key={p.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm hover:scale-101 transition-all">
                          <div>
                            <p className="font-black text-gray-900">{p.items?.[0]?.name || 'Frais de Scolarité'}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-1">REF: {p.id?.substring(0,8)} • {p.createdAt ? format(new Date(p.createdAt), 'dd/MM/yyyy à HH:mm') : 'date inconnue'}</p>
                          </div>
                          
                          <div className="flex sm:flex-col items-end gap-3 mt-3 sm:mt-0 justify-between w-full sm:w-auto">
                            <span className="font-mono font-black text-emerald-600 text-base">+{p.paidAmount?.toLocaleString()} FCFA</span>
                            <span className="px-2.5 py-0.5 bg-gray-200 text-gray-500 text-[9px] font-mono font-bold rounded-lg uppercase tracking-wider">{p.paymentMethod}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sub-Modal Payment versement */}
                {isPayModalOpen && (
                  <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                        <h4 className="font-black text-gray-900">Enregistrer un versement</h4>
                        <button onClick={() => setIsPayModalOpen(false)} className="text-gray-400 hover:text-gray-900 border border-gray-100 rounded-lg p-1.5"><X className="w-5 h-5" /></button>
                      </div>

                      <form onSubmit={handleRecordPayment} className="space-y-4">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Catégorie de Frais</label>
                          <select 
                            value={payForm.category}
                            onChange={(e) => setPayForm(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white outline-none text-sm"
                          >
                            <option value="Droit d'Inscription">Droit d'Inscription</option>
                            <option value="Mensualité">Mensualité Scolaire</option>
                            <option value="Uniformes">Uniformes & Vêtements</option>
                            <option value="Fournitures">Fournitures & manuels</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Mois d'affectation</label>
                          <select 
                            value={payForm.month}
                            onChange={(e) => setPayForm(prev => ({ ...prev, month: e.target.value }))}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white outline-none text-sm"
                          >
                            {['Octobre', 'Novembre', 'Décembre', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin'].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Montant Versement (FCFA)</label>
                          <input 
                            type="number"
                            required
                            placeholder="Ex: 30000"
                            value={payForm.amount}
                            onChange={(e) => setPayForm(prev => ({ ...prev, amount: e.target.value }))}
                            className="w-full p-2.5 font-mono font-bold bg-gray-50 border border-gray-200 rounded-lg focus:bg-white inset-0 outline-none text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Mode de règlement</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'cash', label: 'Espèces' },
                              { id: 'mobile_money', label: 'Wave / OM' },
                              { id: 'card', label: 'Carte' }
                            ].map(m => (
                              <button 
                                key={m.id}
                                type="button"
                                onClick={() => setPayForm(prev => ({ ...prev, method: m.id }))}
                                className={`p-2.5 font-bold text-xs rounded-xl border text-center transition-all ${
                                  payForm.method === m.id ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {m.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button type="submit" className="w-full py-3 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg hover:shadow-primary/20 transition-all leading-tight">valider le versement de scolarité</button>
                      </form>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab Parent & communications */}
            {activeSubTab === 'parent' && (
              <motion.div key="parent" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-6">
                
                {/* Parent declaration cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                      <h4 className="font-bold text-base text-gray-900 mb-4">Informations Tuteur</h4>
                      
                      {studentParent ? (
                        <div className="space-y-4">
                          <div className="bg-indigo-50/30 p-4 border border-indigo-50 rounded-2xl">
                            <p className="font-black text-indigo-950 text-base">{studentParent.firstName} {studentParent.lastName}</p>
                            <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest mt-1">{studentParent.relation || 'Tuteur'}</p>
                            <div className="mt-4 space-y-2 text-sm text-gray-700">
                              <p className="flex items-center gap-2"><Phone className="w-4 h-4 opacity-40 text-primary" /> {studentParent.phone}</p>
                              <p className="flex items-center gap-2"><Mail className="w-4 h-4 opacity-40" /> {studentParent.email || 'Aucun e-mail'}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 text-center">
                          <p className="text-xs text-gray-500 font-medium">Aucun tuteur officiel n'est enregistré pour l'élève.</p>
                          {!isAddingParent && (
                            <button onClick={() => setIsAddingParent(true)} className="w-full py-2.5 bg-gray-50 border border-dashed border-gray-200 hover:border-indigo-400 hover:bg-white text-xs font-black uppercase tracking-widest rounded-xl transition-all">Associer un tuteur</button>
                          )}
                        </div>
                      )}

                      {isAddingParent && (
                        <form onSubmit={handleCreateParent} className="space-y-3 mt-4 border-t border-gray-100 pt-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-gray-400 block">Prénom</label>
                              <input 
                                type="text"
                                required
                                value={parentForm.firstName}
                                onChange={(e) => setParentForm(prev => ({ ...prev, firstName: e.target.value }))}
                                className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-gray-400 block">Nom</label>
                              <input 
                                type="text"
                                required
                                value={parentForm.lastName}
                                onChange={(e) => setParentForm(prev => ({ ...prev, lastName: e.target.value }))}
                                className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-gray-400 block">Téléphone mobile direct</label>
                            <input 
                              type="tel"
                              required
                              value={parentForm.phone}
                              onChange={(e) => setParentForm(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-gray-400 block">Email</label>
                            <input 
                              type="email"
                              value={parentForm.email}
                              onChange={(e) => setParentForm(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none"
                            />
                          </div>

                          <div className="flex gap-2 justify-end pt-2">
                            <button type="button" onClick={() => setIsAddingParent(false)} className="px-2.5 py-1.5 text-xs font-bold text-gray-400">Annuler</button>
                            <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">Valider</button>
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Direct Notification Box */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                      <div className="space-y-1">
                        <h4 className="font-bold text-base text-gray-900">Notifications Instantanées</h4>
                        <p className="text-xs text-gray-500">Transmettre les alertes de l'élève aux parents en temps réel :</p>
                      </div>
                      
                      <div className="space-y-2 pt-2">
                        <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest block">
                          ⚡ ALERTES RAPIDES EN 1 CLIC
                        </span>
                        <div className="grid grid-cols-1 gap-1.5 animate-fade-in">
                          <button onClick={() => sendNotification('absence')} className="w-full py-2 bg-red-50 hover:bg-red-100 border border-transparent rounded-xl text-xs font-bold text-red-700 text-left px-4 flex items-center justify-between cursor-pointer">
                            <span>Signaler Absence</span>
                            <span className="text-[10px] font-mono leading-none">&rarr;</span>
                          </button>
                          <button onClick={() => sendNotification('grade_report')} className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 border border-transparent rounded-xl text-xs font-bold text-indigo-700 text-left px-4 flex items-center justify-between cursor-pointer">
                            <span>Alerte Résultats Notes</span>
                            <span className="text-[10px] font-mono leading-none">&rarr;</span>
                          </button>
                          <button onClick={() => sendNotification('payment_reminder')} className="w-full py-2 bg-yellow-50 hover:bg-yellow-105 border border-transparent rounded-xl text-xs font-bold text-yellow-800 text-left px-4 flex items-center justify-between cursor-pointer">
                            <span>Rappel Versement Dû</span>
                            <span className="text-[10px] font-mono leading-none">&rarr;</span>
                          </button>
                        </div>
                      </div>

                      <hr className="border-gray-100/70" />

                      {/* Message Libre Option */}
                      <div className="space-y-3 pt-1">
                        <span className="text-[9px] font-mono font-black text-indigo-600 uppercase tracking-widest block">
                          📝 MESSAGE LIBRE / TEXTE PERSO TOUT TYPE
                        </span>
                        
                        <div className="space-y-3 bg-slate-50 p-4 rounded-2.5xl border border-gray-200/60 shadow-inner">
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 block mb-1">
                              Objet du message libre (ex: Retard, Discipline, Absence spécifique, Notes)
                            </label>
                            <input
                              type="text"
                              value={customMsgTitle}
                              onChange={(e) => setCustomMsgTitle(e.target.value)}
                              placeholder="ex: Retard répété en cours..."
                              className="w-full px-3 py-2 bg-white border border-gray-200 text-xs rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-500 block mb-1">
                              Contenu du message personnalisé
                            </label>
                            <textarea
                              rows={3}
                              value={customMsgContent}
                              onChange={(e) => setCustomMsgContent(e.target.value)}
                              placeholder="Rédigez ici votre message libre pour le parent..."
                              className="w-full px-3 py-2 bg-white border border-gray-200 text-xs rounded-xl font-semibold outline-none resize-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </div>

                          <button
                            type="button"
                            disabled={!customMsgContent.trim() || !customMsgTitle.trim()}
                            onClick={() => {
                              sendNotification('custom', customMsgTitle, customMsgContent);
                              setCustomMsgContent('');
                              toast.success("Message libre prêt à être expédié aux tuteurs !");
                            }}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-slate-950 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-97 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Rocket className="w-3.5 h-3.5" />
                            <span>Envoyer Message Libre</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column Correspondence Ledger */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h4 className="font-bold text-base text-gray-900 mb-4 uppercase tracking-widest">Registre d'envois & Correspondances ({studentComms.length})</h4>
                    
                    {studentComms.length === 0 ? (
                      <div className="text-center py-12 text-gray-400 font-medium text-sm">
                        Aucun message expédié à ce parent pour le moment.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {studentComms.map((c: any) => (
                          <div key={c.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:scale-101 transition-transform">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-black text-gray-900 text-sm leading-none flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" /> {c.title}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">{format(new Date(c.date), "dd/MM/yyyy • HH:mm")}</span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">{c.content}</p>
                            <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-gray-400">
                              <span>Canal de transmission: SMS direct</span>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase rounded">DISTRIBUÉ</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab AI Reports */}
            {activeSubTab === 'ai' && (
              <motion.div key="ai" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-6">
                
                {/* AI Advice Center */}
                <div className="bg-white p-6 rounded-[2rem] border border-purple-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-44 h-44 bg-purple-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10 border-b border-purple-50 pb-4 mb-6">
                    <div>
                      <h3 className="text-xl font-black text-purple-950 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-purple-600" /> Synthèse d'Appréciation par l'IA (Gemini)
                      </h3>
                      <p className="text-xs text-purple-600 mt-1 font-medium">Consolide globalement Notes + Présence + Finances dans son dossier d'élève</p>
                    </div>

                    <button 
                      onClick={generateAiReport}
                      disabled={isAiGenerating}
                      className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isAiGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                      <span>{isAiGenerating ? "Calculs IA..." : "Syllabler la Synthèse IA"}</span>
                    </button>
                  </div>

                  {aiInsights.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 relative z-10 bg-gray-50 rounded-2xl border border-dashed border-gray-100">
                      <Zap className="w-10 h-10 text-purple-200 mx-auto mb-3" />
                      <p className="text-sm font-bold text-gray-800">Aucune évaluation synthétique IA générée.</p>
                      <p className="text-xs text-gray-400 mt-1">Cliquez sur le bouton ci-dessus pour que Gemini formule un avis d'appréciation global et mémorable.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 relative z-10">
                      {aiInsights.map((ai: any) => (
                        <div key={ai.id} className="p-5 bg-gradient-to-br from-purple-50/50 to-indigo-50/30 border border-purple-100 rounded-2xl">
                          <div className="flex justify-between items-center mb-4 pb-2 border-b border-purple-100/50">
                            <span className="text-xs font-black text-purple-950 flex items-center gap-1.5 uppercase tracking-widest leading-none">
                              <CheckCircle className="w-4 h-4 text-purple-600" /> Appréciation Générale Synthétisée
                            </span>
                            <span className="text-[10px] text-purple-400 font-mono font-bold">{format(new Date(ai.date), "dd MMMM yyyy à HH:mm")}</span>
                          </div>
                          
                          <p className="text-xs text-purple-950 font-medium whitespace-pre-wrap leading-relaxed">{ai.content}</p>
                          
                          <div className="mt-4 flex items-center justify-between text-[9px] font-mono text-purple-400 border-t border-purple-100/30 pt-3">
                            <span>Modèle d'évaluation: Gemini 3.5 Flash</span>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[8px] font-black uppercase rounded">Vérifié & Validé</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Popup d'Envoi Réel / Dispatching pour l'Administration */}
          {activeAdminDispatch && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[999] flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2rem] border border-indigo-100 shadow-2xl max-w-lg w-full overflow-hidden p-6 space-y-5 lg:z-[1000]"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">📡 Canal de Transmission Direct</span>
                    <h3 className="font-black text-lg text-slate-900">Transmettre la notification ?</h3>
                  </div>
                  <button 
                    onClick={() => setActiveAdminDispatch(null)}
                    className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-xs font-bold"
                  >
                    Fermer
                  </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <p className="text-xs text-slate-500 flex justify-between">
                    <span>Élève : <strong>{activeAdminDispatch.studentName}</strong></span>
                    <span>Destinataire : <strong>{activeAdminDispatch.phone}</strong></span>
                  </p>
                  <p className="text-xs font-semibold text-slate-900 bg-white p-3 rounded-xl border border-slate-100 italic">
                    "{activeAdminDispatch.message}"
                  </p>
                </div>

                <p className="text-[11px] text-slate-500 font-medium">
                  Le message de type <strong>{activeAdminDispatch.title}</strong> est enregistré localement. Pour qu'il soit réellement reçu par le parent, cliquez sur l'un des canaux réels ci-dessous :
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      const cleanPhone = activeAdminDispatch.phone.replace(/[^0-9+]/g, '');
                      const target = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(activeAdminDispatch.message)}`;
                      window.open(target, '_blank');
                      setActiveAdminDispatch(null);
                      toast.success("WhatsApp ouvert pour envoi !");
                    }}
                    className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-97 text-white font-black uppercase text-[10px] tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-emerald-600 fill-white" />
                    <span>WhatsApp Direct</span>
                  </button>
                  <button
                    onClick={() => {
                      const cleanPhone = activeAdminDispatch.phone.replace(/[^0-9+]/g, '');
                      const target = `sms:${cleanPhone}?body=${encodeURIComponent(activeAdminDispatch.message)}`;
                      window.open(target, '_blank');
                      setActiveAdminDispatch(null);
                      toast.success("SMS initialisé pour envoi !");
                    }}
                    className="flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 active:scale-97 text-white font-black uppercase text-[10px] tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-white" />
                    <span>SMS Téléphone</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export const DEFAULT_STUDENT_DATA = {
  firstName: '',
  lastName: '',
  gender: 'M',
  status: 'active',
  grade: '',
  parentContact: '',
  primaryParentContact: 'father',
  email: '',
  phone: '',
  address: '',
  birthDate: '',
  birthPlace: '',
  nationality: 'Sénégalaise',
  maritalStatus: 'célibataire',
  nationalId: '',
  photoData: '',
  // établissement
  schoolYear: '2025-2026',
  registrationDate: new Date().toISOString().split('T')[0],
  matricule: '',
  // adresse
  city: '',
  neighborhood: '',
  region: '',
  country: 'Sénégal',
  zipCode: '',
  whatsApp: '',
  // parents
  fatherName: '',
  fatherProfession: '',
  fatherPhone: '',
  fatherWhatsApp: '',
  fatherEmail: '',
  fatherAddress: '',
  motherName: '',
  motherProfession: '',
  motherPhone: '',
  motherWhatsApp: '',
  motherEmail: '',
  motherAddress: '',
  guardianName: '',
  guardianRelation: '',
  guardianProfession: '',
  guardianPhone: '',
  guardianEmail: '',
  guardianAddress: '',
  // emergency
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelation: '',
  emergencyAddress: '',
  // medical
  bloodType: 'O+',
  allergies: '',
  hasDisability: 'non',
  disabilityDetails: '',
  medicalTreatment: '',
  doctorName: '',
  doctorPhone: '',
  // academic requested
  requestedLevel: 'Secondaire',
  regime: 'externe',
  primaryLanguage: 'Français',
  chosenOptions: '',
  // previous school
  prevSchoolName: '',
  prevSchoolCity: '',
  prevSchoolGrade: '',
  prevSchoolResult: 'admis',
  prevSchoolAverage: '',
  // docs checklist
  docBirthCert: false,
  docSchoolCert: false,
  docPrevReport: false,
  docIdentityPhotos: false,
  docMedicalCert: false,
  docIdentityCard: false,
  docReceipt: false,
  // financial
  registrationFee: '25000',
  paymentMethod: 'cash',
  hasDiscount: 'non',
  discountAmount: '0',
  stripePaid: false,
  paymentRef: '',
  // extra services
  serviceTransport: false,
  serviceCantine: false,
  serviceInternat: false,
  // digital access
  parentAccountEmail: '',
  parentAccountPhone: '',
  notifSms: true,
  notifWhatsApp: false,
  notifEmail: true,
  notifMobileApp: false,
  // auths
  authMedia: true,
  authExcursion: true,
  authRulesAccepted: true,
  // signatures
  parentSignName: '',
  parentSignDate: new Date().toISOString().split('T')[0],
  parentSignature: '',
  adminSignName: '',
  adminSignRole: 'Secretariat Général',
  adminSignature: '',
  // workflow validation
  workflowStatus: 'draft',
};
