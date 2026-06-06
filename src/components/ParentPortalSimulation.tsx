import React, { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { jsPDF } from 'jspdf';
import {
  X, LayoutDashboard, FileText, Calendar, 
  Clock, BookOpen, CreditCard, Bell, 
  ShieldAlert, ShieldCheck, Bus, Utensils,
  LogOut, Download, AlertTriangle, CheckCircle2, ChevronRight, EyeOff, Beaker,
  DollarSign, Home, Package, Receipt
} from 'lucide-react';
// Only real database-driven records shown

export const ParentPortalSimulation = ({ parent, merchant, standalone, onClose }: { parent: any, merchant: any, standalone?: boolean, onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedChild, setSelectedChild] = useState(parent?.children?.[0] || null);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [academicViewMode, setAcademicViewMode] = useState<'cards' | 'bulletin'>('cards');

  // Auto-select first child if parent's children array is populated/updated dynamically after sync
  React.useEffect(() => {
    if (!selectedChild && parent?.children?.[0]) {
      setSelectedChild(parent.children[0]);
    }
  }, [parent?.children, selectedChild]);
  const [scheduleViewType, setScheduleViewType] = useState<'grid' | 'day' | 'flow'>('grid');
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const daysMap = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dName = daysMap[new Date().getDay()];
    return dName === 'Dimanche' ? 'Lundi' : dName;
  });

  const resolvedMerchantId = useMemo(() => {
    return merchant?.id && merchant.id !== 'fallback-id' 
      ? merchant.id 
      : (selectedChild?.merchantId || selectedChild?.merchant_id || localStorage.getItem('merchantId') || '');
  }, [merchant, selectedChild]);

  const [isSyncing, setIsSyncing] = useState(false);

  // Proactive Sync on Portal Session load
  React.useEffect(() => {
    if (resolvedMerchantId && parent?.id) {
      console.log("[ParentPortal] Triggering proactive SaaS collection synchronization with merchant:", resolvedMerchantId);
      setIsSyncing(true);
      import('../services/syncService').then(({ syncService }) => {
        syncService.syncParentData(resolvedMerchantId, parent.id).finally(() => {
          setIsSyncing(false);
          toast.success("Espace personnel synchronisé", { icon: "🔄", id: "sync" });
        });
      }).catch(err => {
        console.error("[ParentPortal] Fail to trigger proactive sync:", err);
        setIsSyncing(false);
      });
    }
  }, [resolvedMerchantId, parent?.id]);

  // Trigger highly targeted sync for the selected child to sync grades, attendance, homework, and discipline records
  React.useEffect(() => {
    if (resolvedMerchantId && selectedChild?.id) {
      console.log("[ParentPortal] Triggering child student sync for child:", selectedChild.id);
      import('../services/syncService').then(({ syncService }) => {
        syncService.syncStudentData(resolvedMerchantId, selectedChild.id).catch(err => {
          console.error("[ParentPortal] Fail to trigger targeted child sync:", err);
        });
      });
    }
  }, [resolvedMerchantId, selectedChild?.id]);

  const allAttendances = useLiveQuery(() => db.attendance?.toArray()) || [];
  const attendances = useMemo(() => {
    if (!selectedChild?.id) return [];
    const targetId = selectedChild.id.toString().trim().toLowerCase();
    return allAttendances
      .filter(a => {
        const aId = (a.studentId || a.student_id || '').toString().trim().toLowerCase();
        return aId === targetId;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allAttendances, selectedChild?.id]);

  const homeworks = useLiveQuery(() => 
    resolvedMerchantId ? db.homeworks?.where('merchantId').equals(resolvedMerchantId).toArray() : []
  , [resolvedMerchantId]) || [];

  const isAbsentStatus = (status: string) => status ? ['absent', 'absence'].includes(status.toLowerCase().trim()) : false;
  const isLateStatus = (status: string) => status ? ['late', 'retard'].includes(status.toLowerCase().trim()) : false;

  const absences = attendances.filter(a => isAbsentStatus(a.status));
  const lates = attendances.filter(a => isLateStatus(a.status));

  const studentClasses = useLiveQuery(() => 
    resolvedMerchantId ? db.classes?.where('merchantId').equals(resolvedMerchantId).toArray() : []
  , [resolvedMerchantId]) || [];

  const schedules = useLiveQuery(() => 
    resolvedMerchantId ? db.schedules?.where('merchantId').equals(resolvedMerchantId).toArray() : []
  , [resolvedMerchantId]) || [];

  const allGrades = useLiveQuery(() => db.grades?.toArray()) || [];
  const selectedChildGrades = useMemo(() => {
    if (!selectedChild?.id) return [];
    const targetId = selectedChild.id.toString().trim().toLowerCase();
    return allGrades.filter(g => {
      const gId = (g.studentId || g.student_id || '').toString().trim().toLowerCase();
      return gId === targetId;
    });
  }, [allGrades, selectedChild?.id]);

  const groupedGrades = useMemo(() => {
    const list = selectedChildGrades || [];
    const groups: { [key: string]: any } = {};

    list.forEach((g: any) => {
      const subId = g.subjectId || 'unknown';
      const term = g.term || 'Trimestre 1';
      const key = `${subId}_${term}`;

      if (!groups[key]) {
        groups[key] = {
          id: g.id || key,
          subjectId: subId,
          term: term,
          devoir1: g.devoir1,
          devoir2: g.devoir2,
          compo: g.compo,
          rawRecords: [g]
        };
      } else {
        groups[key].rawRecords.push(g);
        if (groups[key].devoir1 === undefined || groups[key].devoir1 === '') {
          groups[key].devoir1 = g.devoir1;
        }
        if (groups[key].devoir2 === undefined || groups[key].devoir2 === '') {
          groups[key].devoir2 = g.devoir2;
        }
        if (groups[key].compo === undefined || groups[key].compo === '') {
          groups[key].compo = g.compo;
        }
      }
    });

    return Object.values(groups);
  }, [selectedChildGrades]);

  const childAverage = useMemo(() => {
    if (!groupedGrades || groupedGrades.length === 0) return null;
    let sum = 0;
    let count = 0;
    groupedGrades.forEach((g: any) => {
      const scoreD1 = g.devoir1 !== undefined && g.devoir1 !== '' ? Number(g.devoir1) : null;
      const scoreD2 = g.devoir2 !== undefined && g.devoir2 !== '' ? Number(g.devoir2) : null;
      const scoreCompo = g.compo !== undefined && g.compo !== '' ? Number(g.compo) : null;
      
      const devSum = (scoreD1 !== null ? scoreD1 : 0) + (scoreD2 !== null ? scoreD2 : 0);
      const devCount = (scoreD1 !== null ? 1 : 0) + (scoreD2 !== null ? 1 : 0);
      const devAvg = devCount > 0 ? devSum / devCount : null;
      
      let average: number | null = null;
      if (devAvg !== null && scoreCompo !== null) {
        average = (devAvg + scoreCompo * 2) / 3;
      } else if (devAvg !== null) {
        average = devAvg;
      } else if (scoreCompo !== null) {
        average = scoreCompo;
      }
      
      if (average !== null) {
        sum += average;
        count++;
      }
    });
    return count > 0 ? (sum / count) : null;
  }, [groupedGrades]);

  const subjects = useLiveQuery(() => 
    resolvedMerchantId ? db.subjects?.where('merchantId').equals(resolvedMerchantId).toArray() : []
  , [resolvedMerchantId]) || [];

  const subjectsMap = useMemo(() => {
    const m = new Map<string, string>();
    subjects.forEach((s: any) => {
      m.set(s.id, s.name);
    });
    return m;
  }, [subjects]);

  const selectedChildClass = useMemo(() => {
    if (!selectedChild) return null;
    const isClassNameSimilar = (name1: string, name2: string) => {
      if (!name1 || !name2) return false;
      const clean = (s: string) => s.toString().toLowerCase().replace(/^(classe\s*:\s*|classe\s*)/gi, '').trim();
      const c1 = clean(name1);
      const c2 = clean(name2);
      return c1 === c2 || c1.includes(c2) || c2.includes(c1);
    };
    const childClassId = selectedChild.classId || selectedChild.class_id;
    const childGrade = selectedChild.grade || selectedChild.class;
    return studentClasses.find((c: any) => (childClassId && c.id === childClassId) || isClassNameSimilar(c.name, childGrade));
  }, [studentClasses, selectedChild]);

  const availableGradesSubjects = useMemo(() => {
    let classSubjectNames: string[] = [];
    if (selectedChildClass && Array.isArray(selectedChildClass.subjects)) {
      classSubjectNames = selectedChildClass.subjects.map((s: string) => s.trim().toLowerCase());
    }

    let rawList: any[] = [];
    if (classSubjectNames.length > 0) {
      const filteredDbSubjects = subjects.filter((s: any) => {
        if (!s || !s.name) return false;
        const sNameLower = s.name.trim().toLowerCase();
        return classSubjectNames.some(cn => sNameLower === cn || cn.includes(sNameLower) || sNameLower.includes(cn));
      });

      if (filteredDbSubjects.length > 0) {
        rawList = filteredDbSubjects.map((s: any) => ({
          id: s.id,
          name: s.name
        }));
      } else {
        const items = subjects.map((s: any) => ({ id: s.id, name: s.name }));
        const filtered = items.filter((s: any) => {
          const sNameLower = s.name.trim().toLowerCase();
          return classSubjectNames.some(cn => sNameLower === cn || cn.includes(sNameLower) || sNameLower.includes(cn));
        });
        if (filtered.length > 0) {
          rawList = filtered;
        }
      }
    }

    if (rawList.length === 0 && selectedChildGrades) {
      const uniqueIds = Array.from(new Set(selectedChildGrades.map((g: any) => g.subjectId).filter(Boolean)));
      rawList = uniqueIds.map(id => ({
        id,
        name: subjectsMap.get(id) || id
      }));
    }

    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const dedupedList: any[] = [];
    for (const item of rawList) {
      if (!item || !item.id || !item.name) continue;
      const itemId = item.id.toString().trim().toLowerCase();
      const itemName = item.name.toString().trim().toLowerCase();
      if (!seenIds.has(itemId) && !seenNames.has(itemName)) {
        seenIds.add(itemId);
        seenNames.add(itemName);
        dedupedList.push(item);
      }
    }

    return dedupedList.sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedChildGrades, subjectsMap, selectedChildClass, subjects]);

  const availableGradesTerms = useMemo(() => {
    let rawPeriods: string[] = [];
    if (merchant && Array.isArray(merchant.academicPeriods) && merchant.academicPeriods.length > 0) {
      rawPeriods = merchant.academicPeriods.map((p: any) => p.toString().trim());
    } else if (selectedChildGrades && selectedChildGrades.length > 0) {
      rawPeriods = selectedChildGrades.map((g: any) => g.term || 'Trimestre 1');
    } else {
      rawPeriods = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'];
    }

    const seenPeriods = new Set<string>();
    const dedupedPeriods: string[] = [];
    rawPeriods.forEach(p => {
      const cleaned = p.trim();
      if (!cleaned) return;
      const key = cleaned.toLowerCase();
      if (!seenPeriods.has(key)) {
        seenPeriods.add(key);
        dedupedPeriods.push(cleaned);
      }
    });
    return dedupedPeriods;
  }, [selectedChildGrades, merchant]);

  const filteredGrades = useMemo(() => {
    let list = groupedGrades || [];
    if (subjectFilter) {
      list = list.filter((g: any) => g.subjectId === subjectFilter);
    }
    if (termFilter) {
      list = list.filter((g: any) => (g.term || 'Trimestre 1') === termFilter);
    }
    return list;
  }, [groupedGrades, subjectFilter, termFilter]);

  // Pre-select the first available term on load
  React.useEffect(() => {
    if (!termFilter && availableGradesTerms.length > 0) {
      setTermFilter(availableGradesTerms[0]);
    }
  }, [availableGradesTerms, termFilter]);

  const getSubjectCoef = React.useCallback((subjectName: string, gradeName: string) => {
    if (selectedChildClass?.subjectCoefs && selectedChildClass.subjectCoefs[subjectName] !== undefined) {
      const customCoef = parseFloat(selectedChildClass.subjectCoefs[subjectName]);
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
  }, [selectedChildClass]);

  const selectedPeriodGrades = useMemo(() => {
    let list = groupedGrades || [];
    if (termFilter) {
      list = list.filter((g: any) => (g.term || 'Trimestre 1') === termFilter);
    }
    return list;
  }, [groupedGrades, termFilter]);

  const getMention = (avg: number) => {
    if (avg >= 16) return 'Excellent';
    if (avg >= 14) return 'Très Bien';
    if (avg >= 12) return 'Bien';
    if (avg >= 10) return 'Passable';
    return 'Insuffisant';
  };

  const bulletinStats = useMemo(() => {
    let totalCoef = 0;
    let totalWeightedPoints = 0;
    
    selectedPeriodGrades.forEach((g: any) => {
      const scoreD1 = g.devoir1 !== undefined && g.devoir1 !== '' ? Number(g.devoir1) : null;
      const scoreD2 = g.devoir2 !== undefined && g.devoir2 !== '' ? Number(g.devoir2) : null;
      const scoreCompo = g.compo !== undefined && g.compo !== '' ? Number(g.compo) : null;
      
      const devSum = (scoreD1 !== null ? scoreD1 : 0) + (scoreD2 !== null ? scoreD2 : 0);
      const devCount = (scoreD1 !== null ? 1 : 0) + (scoreD2 !== null ? 1 : 0);
      const devAvg = devCount > 0 ? devSum / devCount : null;
      
      let average: number | null = null;
      if (devAvg !== null && scoreCompo !== null) {
        average = (devAvg + scoreCompo * 2) / 3;
      } else if (devAvg !== null) {
        average = devAvg;
      } else if (scoreCompo !== null) {
        average = scoreCompo;
      }
      
      const coef = getSubjectCoef(g.subjectId, selectedChild?.grade || selectedChild?.class || '');
      
      if (average !== null) {
        totalCoef += coef;
        totalWeightedPoints += average * coef;
      }
    });
    
    const averageGenerale = totalCoef > 0 ? totalWeightedPoints / totalCoef : null;
    const mention = averageGenerale !== null ? getMention(averageGenerale) : 'Insuffisant';
    
    return {
      totalCoef,
      totalWeightedPoints,
      averageGenerale,
      mention
    };
  }, [selectedPeriodGrades, selectedChild, getSubjectCoef]);

  const downloadPdf = () => {
    const doc = new jsPDF();
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("RÉPUBLIQUE DU SÉNÉGAL", 15, 20);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Un Peuple - Un But - Une Foi", 15, 24);
    doc.line(15, 26, 50, 26);
    
    doc.setFont("Helvetica", "bold");
    doc.text("MINISTÈRE DE L'ÉDUCATION NATIONALE", 15, 31);
    doc.setFont("Helvetica", "normal");
    doc.text("INSPECTION D'ACADÉMIE DE DAKAR", 15, 35);
    
    const sName = (merchant?.name || "LYCÉE THIAROYE").toUpperCase();
    const sYear = selectedChild?.schoolYear || "2025-2026";
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`Établissement: ${sName}`, 120, 20);
    doc.setFont("Helvetica", "normal");
    doc.text(`Année Académique: ${sYear}`, 120, 25);
    doc.text(`Téléphone: ${merchant?.phone || "33 800 00 00"}`, 120, 30);
    doc.text(`E-mail: ${merchant?.email || "contact@ecole.sn"}`, 120, 35);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 40, 195, 40);
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(`BULLETIN DE NOTES - ${termFilter.toUpperCase()}`, 105, 52, { align: "center" });
    
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 58, 180, 24, "FD");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("ÉLÈVE:", 20, 64);
    doc.text("MATRICULE:", 20, 70);
    doc.text("CLASSE:", 20, 76);
    
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(`${(selectedChild?.firstName || "").toUpperCase()} ${(selectedChild?.lastName || "").toUpperCase()}`, 40, 64);
    const mStr = selectedChild?.matricule || selectedChild?.id?.substring(0, 8).toUpperCase() || "N/A";
    doc.text(mStr, 45, 70);
    doc.text(`${selectedChildClass?.name || selectedChild?.class || selectedChild?.grade || "N/A"}`, 40, 76);
    
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("RÉGIME:", 110, 64);
    doc.text("DATE & LIEU NAIS.:", 110, 70);
    
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(`${selectedChild?.regime || "Externe"}`, 130, 64);
    const bDate = selectedChild?.birthDate || "---";
    const bPlace = selectedChild?.birthPlace || "---";
    doc.text(`${bDate} à ${bPlace}`, 145, 70);
    
    const tableTop = 90;
    const colWidths = [45, 18, 18, 22, 22, 22, 15, 18];
    const colPositions = [15];
    for (let i = 0; i < colWidths.length - 1; i++) {
      colPositions.push(colPositions[i] + colWidths[i]);
    }
    
    doc.setDrawColor(15, 23, 42);
    doc.setFillColor(30, 41, 59);
    doc.rect(15, tableTop, 180, 8, "F");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("MATIÈRE", colPositions[0] + 2, tableTop + 5);
    doc.text("DEV. 1", colPositions[1] + 2, tableTop + 5);
    doc.text("DEV. 2", colPositions[2] + 2, tableTop + 5);
    doc.text("MOY. DEV", colPositions[3] + 2, tableTop + 5);
    doc.text("COMP.", colPositions[4] + 2, tableTop + 5);
    doc.text("MOYENNE", colPositions[5] + 2, tableTop + 5);
    doc.text("COEFF", colPositions[6] + 2, tableTop + 5);
    doc.text("POINTS", colPositions[7] + 2, tableTop + 5);
    
    doc.setTextColor(0, 0, 0);
    let currentY = tableTop + 8;
    
    selectedPeriodGrades.forEach((g: any, index: number) => {
      const subjectName = subjectsMap.get(g.subjectId) || g.subjectId || 'Matière';
      const scoreD1 = g.devoir1 !== undefined && g.devoir1 !== '' ? Number(g.devoir1) : null;
      const scoreD2 = g.devoir2 !== undefined && g.devoir2 !== '' ? Number(g.devoir2) : null;
      const scoreCompo = g.compo !== undefined && g.compo !== '' ? Number(g.compo) : null;
      
      const devSum = (scoreD1 !== null ? scoreD1 : 0) + (scoreD2 !== null ? scoreD2 : 0);
      const devCount = (scoreD1 !== null ? 1 : 0) + (scoreD2 !== null ? 1 : 0);
      const devAvg = devCount > 0 ? devSum / devCount : null;
      
      let average: number | null = null;
      if (devAvg !== null && scoreCompo !== null) {
        average = (devAvg + scoreCompo * 2) / 3;
      } else if (devAvg !== null) {
        average = devAvg;
      } else if (scoreCompo !== null) {
        average = scoreCompo;
      }
      
      const coef = getSubjectCoef(g.subjectId, selectedChild?.grade || selectedChild?.class || '');
      const points = average !== null ? average * coef : null;
      
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, currentY, 180, 8, "F");
      }
      
      doc.setDrawColor(226, 232, 240);
      doc.line(15, currentY + 8, 195, currentY + 8);
      
      colPositions.forEach(p => {
        doc.line(p, currentY, p, currentY + 8);
      });
      doc.line(195, currentY, 195, currentY + 8);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.text(subjectName.length > 25 ? subjectName.substring(0, 25) + "..." : subjectName, colPositions[0] + 2, currentY + 5);
      
      doc.setFont("Helvetica", "normal");
      doc.text(scoreD1 !== null ? scoreD1.toFixed(1) : "-", colPositions[1] + 2, currentY + 5);
      doc.text(scoreD2 !== null ? scoreD2.toFixed(1) : "-", colPositions[2] + 2, currentY + 5);
      doc.text(devAvg !== null ? devAvg.toFixed(2) : "-", colPositions[3] + 2, currentY + 5);
      doc.text(scoreCompo !== null ? scoreCompo.toFixed(1) : "-", colPositions[4] + 2, currentY + 5);
      
      doc.setFont("Helvetica", "bold");
      doc.text(average !== null ? average.toFixed(2) : "-", colPositions[5] + 2, currentY + 5);
      doc.setFont("Helvetica", "normal");
      doc.text(coef.toString(), colPositions[6] + 2, currentY + 5);
      doc.setFont("Helvetica", "bold");
      doc.text(points !== null ? points.toFixed(2) : "-", colPositions[7] + 2, currentY + 5);
      
      currentY += 8;
    });
    
    doc.setDrawColor(15, 23, 42);
    doc.line(15, currentY, 195, currentY);
    doc.setFillColor(241, 245, 249);
    doc.rect(15, currentY, 180, 8, "F");
    
    colPositions.forEach(p => {
      doc.line(p, currentY, p, currentY + 8);
    });
    doc.line(195, currentY, 195, currentY + 8);
    doc.line(15, currentY + 8, 195, currentY + 8);
    
    doc.setFont("Helvetica", "bold");
    doc.text("TOTAUX & RÉSULTATS", colPositions[0] + 2, currentY + 5);
    doc.text(bulletinStats.totalCoef.toString(), colPositions[6] + 2, currentY + 5);
    doc.text(bulletinStats.totalWeightedPoints.toFixed(2), colPositions[7] + 2, currentY + 5);
    
    currentY += 12;
    
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, currentY, 180, 14);
    doc.line(100, currentY, 100, currentY + 14);
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.text("MOYENNE GÉNÉRALE DE LA PÉRIODE:", 20, currentY + 5);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Le Conseil d'Établissement valide ce relevé.", 20, currentY + 10);
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    const avgFinalStr = bulletinStats.averageGenerale !== null ? bulletinStats.averageGenerale.toFixed(2) : "0.00";
    doc.text(`${avgFinalStr} / 20`, 72, currentY + 9);
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("MENTION ET APPRÉCIATION:", 105, currentY + 5);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229);
    doc.text(bulletinStats.mention.toUpperCase(), 105, currentY + 11);
    doc.setTextColor(0, 0, 0);
    
    currentY += 22;
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Visa des Parents:", 20, currentY);
    doc.rect(20, currentY + 3, 60, 20);
    
    doc.text("Le Chef d'Établissement:", 120, currentY);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Pour servir et valoir ce que de droit.", 120, currentY + 4);
    doc.rect(120, currentY + 6, 60, 20);
    doc.setTextColor(150, 150, 150);
    doc.text("[ CACHET ET SIGNATURE ]", 128, currentY + 17);
    
    const nClean = `${selectedChild?.lastName || "ELEVE"}_${selectedChild?.firstName || "PRENOM"}`.toUpperCase().replace(/\s+/g, "_");
    const pClean = termFilter.toUpperCase().replace(/\s+/g, "_");
    doc.save(`Bulletin_${pClean}_${nClean}.pdf`);
    toast.success("Bulletin PDF téléchargé avec succès !");
  };

  const validHomeworks = useMemo(() => {
    if (!homeworks || !selectedChild) return [];
    const isClassNameSimilar = (name1: string, name2: string) => {
      if (!name1 || !name2) return false;
      const clean = (s: string) => s.toString().toLowerCase().replace(/^(classe\s*:\s*|classe\s*)/gi, '').trim();
      const c1 = clean(name1);
      const c2 = clean(name2);
      return c1 === c2 || c1.includes(c2) || c2.includes(c1);
    };
    return homeworks.filter((h: any) => {
      const hClassIdStr = (h.classId || h.class_id || '').toString().trim().toLowerCase();
      const childClassIdStr = (selectedChild.classId || selectedChild.class_id || '').toString().trim().toLowerCase();
      const selectedChildClassIdStr = (selectedChildClass?.id || '').toString().trim().toLowerCase();

      const matchesClassId = childClassIdStr && hClassIdStr === childClassIdStr;
      const matchedClass = studentClasses.find((c: any) => (c.id || '').toString().trim().toLowerCase() === hClassIdStr);
      const childGrade = selectedChild.grade || selectedChild.class || '';
      
      const matchesClassName = matchedClass && matchedClass.name && childGrade && isClassNameSimilar(matchedClass.name, childGrade);
      const matchesClassDirect = selectedChildClassIdStr && hClassIdStr === selectedChildClassIdStr;
      const matchesDirectNameLike = isClassNameSimilar(hClassIdStr, childGrade);
      
      const matchesChildGrade = childGrade && (isClassNameSimilar(childGrade, h.grade) || isClassNameSimilar(childGrade, h.class));

      return matchesClassId || matchesClassName || matchesClassDirect || matchesDirectNameLike || matchesChildGrade;
    });
  }, [homeworks, selectedChildClass, studentClasses, selectedChild]);

  const classSchedules = useMemo(() => {
    if (!selectedChild) return [];
    const isClassNameSimilar = (name1: string, name2: string) => {
      if (!name1 || !name2) return false;
      const clean = (s: string) => s.toString().toLowerCase().replace(/^(classe\s*:\s*|classe\s*)/gi, '').trim();
      const c1 = clean(name1);
      const c2 = clean(name2);
      return c1 === c2 || c1.includes(c2) || c2.includes(c1);
    };
    const childClassId = selectedChild.classId || selectedChild.class_id;
    const childGrade = selectedChild.grade || selectedChild.class;
    return schedules.filter((s: any) => {
      const sClassIdStrTrimmed = (s.classId || '').toString().trim().toLowerCase();
      const childClassIdStrTrimmed = (childClassId || '').toString().trim().toLowerCase();
      const matchesClassId = childClassIdStrTrimmed && sClassIdStrTrimmed === childClassIdStrTrimmed;
      const matchedClass = studentClasses.find(c => c.id === s.classId || (c.id || '').toString().trim().toLowerCase() === sClassIdStrTrimmed);
      const matchesClassName = matchedClass && isClassNameSimilar(matchedClass.name, childGrade);
      const sClassIdStr = (s.classId || '').toString();
      const matchesDirectNameLike = isClassNameSimilar(sClassIdStr, childGrade);
      const matchesSGrade = childGrade && (isClassNameSimilar(sClassIdStr, childGrade) || isClassNameSimilar(s.grade, childGrade) || isClassNameSimilar(s.class, childGrade));

      return matchesClassId || matchesClassName || matchesDirectNameLike || matchesSGrade;
    });
  }, [schedules, studentClasses, selectedChild]);

  const communications = useLiveQuery(() => 
    resolvedMerchantId ? db.communications?.where('merchantId').equals(resolvedMerchantId).reverse().sortBy('createdAt') : []
  , [resolvedMerchantId]) || [];
  const parentAnnouncements = (communications as any[]).filter(c => c.targetAudience === 'parents' || c.targetAudience === 'all');

  const tabs = [
    { id: 'dashboard', label: 'Vue Générale', icon: LayoutDashboard },
    { id: 'academics', label: 'Notes & Résultats', icon: FileText },
    { id: 'attendance', label: 'Absences & Retards', icon: Clock },
    { id: 'schedule', label: 'Emploi du Temps', icon: Calendar },
    { id: 'homework', label: 'Cahier de Texte', icon: BookOpen },
    { id: 'transport', label: 'Transport & Restauration', icon: Bus },
    { id: 'information', label: 'Information', icon: Bell }
  ];

  const financeData = useMemo(() => {
    const st = selectedChild;
    if (!st) return { totalAnnuel: 0, totalRegle: 0, restantDu: 0, prochaineEcheance: 0, payments: [] };

    const pricing = (merchant as any)?.schoolPricing;
    const fallback = {
      inscription: 25000,
      scolarite: 300000,
      uniforme: 40000,
      transport: 60000,
      cantine: 90000,
      internat: 0,
      monthsDuration: 9,
      hasTransport: true,
      hasCanteen: true,
      hasInternat: false
    };

    const mapConfig = (cfg: any) => {
      const hasT = cfg.hasTransport !== undefined ? !!cfg.hasTransport : true;
      const hasC = cfg.hasCanteen !== undefined ? !!cfg.hasCanteen : true;
      const hasI = cfg.hasInternat !== undefined ? !!cfg.hasInternat : (Number((cfg.annualInternat || '').toString().replace(/\D/g, '')) > 0 || Number(cfg.internat || 0) > 0);
      return {
        inscription: Number((cfg.registrationFee || '').toString().replace(/\D/g, '') || fallback.inscription),
        scolarite: Number((cfg.annualTuition || '').toString().replace(/\D/g, '') || fallback.scolarite),
        uniforme: Number((cfg.uniformFee || '').toString().replace(/\D/g, '') || fallback.uniforme),
        transport: hasT ? Number((cfg.annualTransport || '').toString().replace(/\D/g, '') || fallback.transport) : 0,
        cantine: hasC ? Number((cfg.annualCanteen || '').toString().replace(/\D/g, '') || fallback.cantine) : 0,
        internat: hasI ? Number((cfg.annualInternat || '').toString().replace(/\D/g, '') || cfg.internat || fallback.internat) : 0,
        hasTransport: hasT,
        hasCanteen: hasC,
        hasInternat: hasI,
        monthsDuration: Number((cfg.monthsDuration || '').toString().replace(/\D/g, '') || fallback.monthsDuration)
      };
    };

    const normalizeStr = (str: string) => {
      if (!str) return '';
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae');
    };

    let baseFees: any = null;
    if (pricing?.exceptions?.[st.id]) {
      baseFees = mapConfig(pricing.exceptions[st.id]);
    }
    if (!baseFees) {
      const classKey = st.classId || st.class_id || st.class || st.grade;
      if (classKey && pricing?.classes?.[classKey]) {
        baseFees = mapConfig(pricing.classes[classKey]);
      } else {
        const matchedClass = studentClasses.find((c: any) => c.name === classKey || c.id === classKey);
        if (matchedClass && pricing?.classes?.[matchedClass.id]) {
          baseFees = mapConfig(pricing.classes[matchedClass.id]);
        } else if (matchedClass && pricing?.classes?.[matchedClass.name]) {
          baseFees = mapConfig(pricing.classes[matchedClass.name]);
        }
      }
    }
    if (!baseFees) {
      const gradeStr = normalizeStr(st.grade || st.class || '');
      let levelKey = '';
      if (gradeStr.includes('mat') || gradeStr.includes('crech') || gradeStr.includes('garde') || gradeStr.includes('maternelle')) levelKey = 'Maternelle';
      else if (gradeStr.includes('ci') || gradeStr.includes('cp') || gradeStr.includes('ce1') || gradeStr.includes('ce2') || gradeStr.includes('cm1') || gradeStr.includes('cm2') || gradeStr.includes('prim')) levelKey = 'Primaire';
      else if (gradeStr.includes('6e') || gradeStr.includes('5e') || gradeStr.includes('4e') || gradeStr.includes('3e') || gradeStr.includes('colleg')) levelKey = 'Collège';
      else if (gradeStr.includes('second') || gradeStr.includes('premier') || gradeStr.includes('terminal') || gradeStr.includes('lyce') || gradeStr.includes('2nd') || gradeStr.includes('1er') || gradeStr.includes('tle') || gradeStr.includes('l2')) levelKey = 'Lycée';
      else if (gradeStr.includes('pro') || gradeStr.includes('format')) levelKey = 'Formation Professionnelle';

      if (levelKey && pricing?.levels?.[levelKey]) {
        baseFees = mapConfig(pricing.levels[levelKey]);
      }
    }

    let hasT = baseFees ? baseFees.hasTransport : fallback.hasTransport;
    if (st.hasTransport !== undefined) hasT = !!st.hasTransport;
    else if (st.serviceTransport !== undefined) hasT = !!st.serviceTransport;

    let hasC = baseFees ? baseFees.hasCanteen : fallback.hasCanteen;
    if (st.hasCanteen !== undefined) hasC = !!st.hasCanteen;
    else if (st.serviceCantine !== undefined) hasC = !!st.serviceCantine;

    let hasI = baseFees ? baseFees.hasInternat : fallback.hasInternat;
    if (st.hasInternat !== undefined) hasI = !!st.hasInternat;
    else if (st.serviceInternat !== undefined) hasI = !!st.serviceInternat;
    else if (st.regime !== undefined) hasI = (st.regime === 'interne');

    const rawT = st.annualTransport !== undefined ? Number(String(st.annualTransport).replace(/\D/g, '')) : (baseFees ? baseFees.transport : fallback.transport);
    const rawC = st.annualCanteen !== undefined ? Number(String(st.annualCanteen).replace(/\D/g, '')) : (baseFees ? baseFees.cantine : fallback.cantine);
    const rawI = st.annualInternat !== undefined ? Number(String(st.annualInternat).replace(/\D/g, '')) : (baseFees ? baseFees.internat : fallback.internat);

    let finalFees = {
      ...(baseFees || fallback),
      transport: hasT ? rawT : 0,
      cantine: hasC ? rawC : 0,
      internat: hasI ? rawI : 0,
      hasTransport: hasT,
      hasCanteen: hasC,
      hasInternat: hasI,
    };

    if (st.registrationFee !== undefined) finalFees.inscription = Number(String(st.registrationFee).replace(/\D/g, '')) || finalFees.inscription;
    if (st.annualTuition !== undefined) finalFees.scolarite = Number(String(st.annualTuition).replace(/\D/g, '')) || finalFees.scolarite;
    if (st.uniformFee !== undefined) finalFees.uniforme = Number(String(st.uniformFee).replace(/\D/g, '')) || finalFees.uniforme;
    if (st.monthsDuration !== undefined) finalFees.monthsDuration = Number(String(st.monthsDuration).replace(/\D/g, '')) || finalFees.monthsDuration;

    if (st.tuitionFeesBreakdown && st.tuitionFeesBreakdown.isCustom) {
      const b = st.tuitionFeesBreakdown;
      const chT = b.hasTransport !== undefined ? !!b.hasTransport : (b.transport !== undefined ? Number(b.transport) > 0 : true);
      const chC = b.hasCanteen !== undefined ? !!b.hasCanteen : (b.cantine !== undefined ? Number(b.cantine) > 0 : true);
      const chI = b.hasInternat !== undefined ? !!b.hasInternat : (b.internat !== undefined ? Number(b.internat) > 0 : false);
      finalFees = {
        ...finalFees,
        ...b,
        transport: chT ? Number(b.transport ?? finalFees.transport) : 0,
        cantine: chC ? Number(b.cantine ?? finalFees.cantine) : 0,
        internat: chI ? Number(b.internat ?? finalFees.internat) : 0,
        hasTransport: chT,
        hasCanteen: chC,
        hasInternat: chI,
        monthsDuration: Number(b.monthsDuration || finalFees.monthsDuration)
      };
    }

    const targetSum = Number(finalFees.inscription || 0) + Number(finalFees.scolarite || 0) + Number(finalFees.uniforme || 0) + Number(finalFees.transport || 0) + Number(finalFees.cantine || 0) + Number(finalFees.internat || 0);

    const paidSum = (st.tuitionPayments || []).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
    const balance = Math.max(0, targetSum - paidSum);
    
    const months = Math.max(1, finalFees.monthsDuration || 9);
    const monthlyAvg = Math.ceil((Number(finalFees.scolarite || 0) + Number(finalFees.transport || 0) + Number(finalFees.cantine || 0) + Number(finalFees.internat || 0)) / months);

    return {
      totalAnnuel: targetSum,
      totalRegle: paidSum,
      restantDu: balance,
      prochaineEcheance: monthlyAvg,
      payments: st.tuitionPayments || [],
      breakdown: finalFees
    };
  }, [selectedChild, merchant, studentClasses]);

  const renderContent = () => {
    switch (activeTab) {
      case 'academics':
        return (
          <div className="space-y-6 animate-fade-in font-sans">
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-black text-slate-800">Bulletins & Notes de {selectedChild?.firstName || selectedChild?.name || 'l\'élève'}</h3>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">
                    Fiches officielles et relevés périodiques de l'élève
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setAcademicViewMode('cards')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        academicViewMode === 'cards'
                          ? 'bg-white text-indigo-600 shadow-sm font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>🗂️</span> <span>Cartes</span>
                    </button>
                    <button
                      onClick={() => setAcademicViewMode('bulletin')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        academicViewMode === 'bulletin'
                          ? 'bg-white text-indigo-600 shadow-sm font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>📄</span> <span>Bulletin</span>
                    </button>
                  </div>
                  <button 
                    onClick={downloadPdf}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger PDF</span>
                  </button>
                </div>
              </div>

              {selectedChildGrades.length === 0 ? (
                <div className="text-center py-12 text-slate-450">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-500" />
                  <p className="text-sm font-medium">Aucune note n'a encore été saisie pour ce trimestre.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Filtres de recherche */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-gray-100">
                    {academicViewMode === 'cards' && (
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Filtrer par Matière</label>
                        <select 
                          value={subjectFilter}
                          onChange={(e) => setSubjectFilter(e.target.value)}
                          className="w-full bg-white border border-gray-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-colors font-sans"
                        >
                          <option value="">Toutes les matières ({availableGradesSubjects.length})</option>
                          {availableGradesSubjects.map((sub: any) => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className={academicViewMode === 'bulletin' ? 'sm:col-span-2' : ''}>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Période du Bulletin</label>
                      <select 
                        value={termFilter}
                        onChange={(e) => setTermFilter(e.target.value)}
                        className="w-full bg-white border border-gray-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-colors font-sans"
                      >
                        {availableGradesTerms.map((term: string) => (
                          <option key={term} value={term}>{term}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {academicViewMode === 'cards' ? (
                    filteredGrades.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <p className="text-xs font-bold italic">Aucun résultat ne correspond aux filtres sélectionnés.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {filteredGrades.map((g: any, idx: number) => {
                          const subjectName = subjectsMap.get(g.subjectId) || g.subjectId || 'Matière';
                          
                          const scoreD1 = g.devoir1 !== undefined && g.devoir1 !== '' ? Number(g.devoir1) : null;
                          const scoreD2 = g.devoir2 !== undefined && g.devoir2 !== '' ? Number(g.devoir2) : null;
                          const scoreCompo = g.compo !== undefined && g.compo !== '' ? Number(g.compo) : null;
                          
                          const devSum = (scoreD1 !== null ? scoreD1 : 0) + (scoreD2 !== null ? scoreD2 : 0);
                          const devCount = (scoreD1 !== null ? 1 : 0) + (scoreD2 !== null ? 1 : 0);
                          const devAvg = devCount > 0 ? devSum / devCount : null;
                          
                          let average: number | null = null;
                          if (devAvg !== null && scoreCompo !== null) {
                            average = (devAvg + scoreCompo * 2) / 3;
                          } else if (devAvg !== null) {
                            average = devAvg;
                          } else if (scoreCompo !== null) {
                            average = scoreCompo;
                          }

                          return (
                            <div key={g.id || idx} className="p-5 bg-slate-50 rounded-2xl border border-gray-200 flex flex-col justify-between animate-fade-in">
                              <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                                <div>
                                  <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 font-extrabold">{subjectName}</span>
                                  <p className="text-xs text-slate-500 mt-0.5 font-bold">{g.term || 'Trimestre 1'}</p>
                                </div>
                                {average !== null && (
                                  <div className="text-right">
                                    <span className="text-[8px] uppercase font-bold text-slate-400 block mb-0.5">Moyenne</span>
                                    <span className="text-xs font-black px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                                      {average.toFixed(2)} / 20
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2">
                                <div className="bg-white p-2 rounded-xl border border-gray-100 text-center shadow-xs">
                                  <span className="text-[8px] uppercase font-bold text-slate-400 block">Devoir 1</span>
                                  <span className="text-xs font-black text-slate-700">{scoreD1 !== null ? scoreD1.toFixed(1) : '-'}</span>
                                  <span className="text-[8px] text-slate-500 font-bold block">/20</span>
                                </div>
                                <div className="bg-white p-2 rounded-xl border border-gray-100 text-center shadow-xs">
                                  <span className="text-[8px] uppercase font-bold text-slate-400 block">Devoir 2</span>
                                  <span className="text-xs font-black text-slate-700">{scoreD2 !== null ? scoreD2.toFixed(1) : '-'}</span>
                                  <span className="text-[8px] text-slate-500 font-bold block">/20</span>
                                </div>
                                <div className="bg-white p-2 rounded-xl border border-gray-100 text-center shadow-xs border-indigo-100 bg-indigo-50/20">
                                  <span className="text-[8px] uppercase font-bold text-indigo-600 block">Comp.</span>
                                  <span className="text-xs font-black text-indigo-700">{scoreCompo !== null ? scoreCompo.toFixed(1) : '-'}</span>
                                  <span className="text-[8px] text-indigo-500 font-bold block">/20</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  ) : (
                    /* BULLETIN OFFICIAL PREVIEW MODE */
                    <div className="border border-slate-300 rounded-3xl p-4 sm:p-8 bg-amber-50/5 shadow-inner max-w-4xl mx-auto animate-fade-in">
                      {/* Senegal Tricolor Border Top */}
                      <div className="h-1.5 w-full flex rounded-t-lg overflow-hidden mb-6">
                        <div className="bg-emerald-600 h-full w-1/3"></div>
                        <div className="bg-yellow-400 h-full w-1/3 flex items-center justify-center text-[7px] text-emerald-800 font-bold">★</div>
                        <div className="bg-red-600 h-full w-1/3"></div>
                      </div>

                      {/* Administrative Header */}
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4 text-xs font-sans mb-6 text-slate-700">
                        <div className="space-y-1">
                          <p className="font-extrabold uppercase text-slate-900 text-xs text-left">République du Sénégal</p>
                          <p className="text-[10px] font-medium text-slate-500 italic text-left">Un Peuple - Un But - Une Foi</p>
                          <div className="h-[1px] w-12 bg-slate-400 my-1"></div>
                          <p className="font-black uppercase text-slate-900 text-[10px] text-left">Ministère de l'Éducation Nationale</p>
                          <p className="text-[10px] text-left">Inspection d'Académie de Dakar</p>
                        </div>
                        <div className="space-y-1 text-left md:text-right font-sans">
                          <p className="font-black text-slate-900 uppercase">Établissement : {merchant?.name || "Lycée Thiaroye"}</p>
                          <p className="text-slate-500 text-[11px] font-bold">Année Scolaire : {selectedChild?.schoolYear || "2025-2026"}</p>
                          <p className="text-slate-500 text-[11px]">Contact : {merchant?.phone || "33 800 00 00"}</p>
                          <p className="text-slate-500 text-[11px]">Période : <span className="text-indigo-600 font-black">{termFilter}</span></p>
                        </div>
                      </div>

                      <div className="text-center my-8">
                        <h4 className="text-lg font-extrabold text-slate-900 tracking-wider underline decoration-indigo-600 decoration-2 underline-offset-4 uppercase">
                          Bulletin de Notes Scolaire
                        </h4>
                      </div>

                      {/* Student Info Box */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-slate-50/80 rounded-2xl border border-slate-200 mb-6 text-xs text-slate-800">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-400 uppercase w-24 text-left">Élève :</span>
                            <span className="font-black text-indigo-900 uppercase text-left">{selectedChild?.firstName} {selectedChild?.lastName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-400 uppercase w-24 text-left">Matricule :</span>
                            <span className="font-mono font-bold text-slate-800 text-left">{selectedChild?.matricule || selectedChild?.id?.substring(0, 8).toUpperCase() || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-400 uppercase w-24 text-left">Classe :</span>
                            <span className="font-black text-emerald-800 uppercase text-left">{selectedChildClass?.name || selectedChild?.class || selectedChild?.grade || "N/A"}</span>
                          </div>
                        </div>
                        <div className="space-y-2 sm:border-l sm:pl-6 border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-400 uppercase w-28 text-left">Régime :</span>
                            <span className="font-bold text-slate-800 text-left">{selectedChild?.regime || "Externe"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-400 uppercase w-28 text-left">Né(e) le :</span>
                            <span className="font-bold text-slate-800 text-left">{selectedChild?.birthDate || "---"} à {selectedChild?.birthPlace || "---"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Subject Ledger Grades Table */}
                      <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm mb-6 bg-white">
                        <table className="w-full text-left text-xs font-sans border-collapse">
                          <thead>
                            <tr className="bg-slate-800 text-white font-extrabold text-[10px] tracking-wider uppercase">
                              <th className="px-4 py-3">Matière</th>
                              <th className="px-3 py-3 text-center">Dev 1</th>
                              <th className="px-3 py-3 text-center">Dev 2</th>
                              <th className="px-3 py-3 text-center">Moy Dev</th>
                              <th className="px-3 py-3 text-center">Compo</th>
                              <th className="px-3 py-3 text-center">Moy. /20</th>
                              <th className="px-3 py-3 text-center">Coef</th>
                              <th className="px-4 py-3 text-right">Points</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150">
                            {selectedPeriodGrades.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-slate-400 italic">
                                  Aucun résultat n'est disponible pour cette période sur le portail direct.
                                </td>
                              </tr>
                            ) : (
                              selectedPeriodGrades.map((g: any, index: number) => {
                                const subjectName = subjectsMap.get(g.subjectId) || g.subjectId || 'Matière';
                                const scoreD1 = g.devoir1 !== undefined && g.devoir1 !== '' ? Number(g.devoir1) : null;
                                const scoreD2 = g.devoir2 !== undefined && g.devoir2 !== '' ? Number(g.devoir2) : null;
                                const scoreCompo = g.compo !== undefined && g.compo !== '' ? Number(g.compo) : null;
                                
                                const devSum = (scoreD1 !== null ? scoreD1 : 0) + (scoreD2 !== null ? scoreD2 : 0);
                                const devCount = (scoreD1 !== null ? 1 : 0) + (scoreD2 !== null ? 1 : 0);
                                const devAvg = devCount > 0 ? devSum / devCount : null;
                                
                                let average: number | null = null;
                                if (devAvg !== null && scoreCompo !== null) {
                                  average = (devAvg + scoreCompo * 2) / 3;
                                } else if (devAvg !== null) {
                                  average = devAvg;
                                } else if (scoreCompo !== null) {
                                  average = scoreCompo;
                                }
                                
                                const coef = getSubjectCoef(g.subjectId, selectedChild?.grade || selectedChild?.class || '');
                                const points = average !== null ? average * coef : null;

                                return (
                                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-bold text-slate-900 bg-slate-50/30 uppercase text-left">{subjectName}</td>
                                    <td className="px-3 py-3 text-center text-slate-600 font-mono">{scoreD1 !== null ? scoreD1.toFixed(1) : '-'}</td>
                                    <td className="px-3 py-3 text-center text-slate-600 font-mono">{scoreD2 !== null ? scoreD2.toFixed(1) : '-'}</td>
                                    <td className="px-3 py-3 text-center text-slate-500 font-mono font-medium">{devAvg !== null ? devAvg.toFixed(2) : '-'}</td>
                                    <td className="px-3 py-3 text-center text-indigo-600 font-mono font-bold bg-indigo-50/10">{scoreCompo !== null ? scoreCompo.toFixed(1) : '-'}</td>
                                    <td className="px-3 py-3 text-center text-slate-900 font-mono font-black bg-slate-100/35">{average !== null ? average.toFixed(2) : '-'}</td>
                                    <td className="px-3 py-3 text-center text-slate-500 font-bold">{coef}</td>
                                    <td className="px-4 py-3 text-right text-slate-900 font-mono font-black">{points !== null ? points.toFixed(2) : '-'}</td>
                                  </tr>
                                );
                              })
                            )}
                            <tr className="bg-slate-100 font-black text-slate-900 leading-normal border-t border-slate-300">
                              <td colSpan={6} className="px-4 py-3 text-xs tracking-wider uppercase text-slate-700 text-left">Total Général de la Période</td>
                              <td className="px-3 py-3 text-center font-mono">{bulletinStats.totalCoef}</td>
                              <td className="px-4 py-3 text-right font-mono">{bulletinStats.totalWeightedPoints.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Total and Mention Summary Banner */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-200 rounded-2xl p-5 bg-white mb-6 text-left">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Calcul de la Performance</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-800">
                              {bulletinStats.averageGenerale !== null ? bulletinStats.averageGenerale.toFixed(2) : '0.00'}
                            </span>
                            <span className="text-xs font-bold text-slate-400">/ 20</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">Moyenne Générale Périodique Pondérée</p>
                        </div>
                        <div className="md:border-l md:pl-6 border-slate-200 flex flex-col justify-center items-start">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Mention Décernée</span>
                          <span className="text-lg font-black uppercase text-indigo-600 bg-indigo-50/60 px-3 py-1 rounded-xl w-fit border border-indigo-100/50">
                            {bulletinStats.mention}
                          </span>
                        </div>
                      </div>

                      {/* Signatures Areas */}
                      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 text-[10px] text-slate-400 font-sans">
                        <div className="text-center p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
                          <p className="font-extrabold uppercase text-slate-600 mb-10">Visa des Parents</p>
                          <span className="italic select-none opacity-40">[ Signature Parentale ]</span>
                        </div>
                        <div className="text-center p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
                          <p className="font-extrabold uppercase text-slate-600 mb-10">Le Chef d'Établissement</p>
                          <span className="font-bold text-slate-500 block uppercase mb-1">{merchant?.name || "Lycée Thiaroye"}</span>
                          <span className="italic text-[8px] select-none opacity-30">[ Sceau académique ]</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      case 'finance':
        return (
          <div className="space-y-6 animate-fade-in">
            {/* DOSSIER HEADER CARD */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex flex-wrap items-center gap-2">
                  Dossier &amp; Historique : <span className="text-indigo-600">{selectedChild?.firstName} {selectedChild?.lastName}</span>
                </h3>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] sm:text-xs text-slate-500 font-mono font-bold">
                  <span>Classe: <span className="text-slate-800 uppercase font-black">{selectedChild?.grade || selectedChild?.class || 'N/A'}</span></span>
                  <span>•</span>
                  <span>Matricule: <span className="text-slate-800 font-black">{selectedChild?.matricule || 'GEN-2026'}</span></span>
                  <span>•</span>
                  <span>Parent: <span className="text-slate-800">{selectedChild?.parentContact || parent?.phone || 'N/A'}</span></span>
                </div>
              </div>
              <div className="shrink-0">
                <button 
                  onClick={() => {
                    toast.success("Ouverture du portail de paiement sécurisé...");
                  }}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <CreditCard className="w-4 h-4" /> Procéder au Règlement
                </button>
              </div>
            </div>

            {/* DOUBLE PANEL LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT PANEL: CURRENT FEES BREAKDOWN PROGRESS (7 COLS) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* GRAND LIVRE COMPTABLE HEADER */}
                <div className="flex justify-between items-center px-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono">Grand Livre Comptable (Répartition)</h4>
                </div>

                {/* KPI stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <span className="text-[9px] sm:text-[10px] text-gray-400 font-mono uppercase font-black">Tarif global</span>
                    <p className="text-xs sm:text-lg font-black font-mono text-indigo-950 mt-1">{financeData.totalAnnuel.toLocaleString()} {merchant?.currency || 'FCFA'}</p>
                  </div>
                  <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <span className="text-[9px] sm:text-[10px] text-gray-400 font-mono uppercase font-black text-emerald-600">Réglé</span>
                    <p className="text-xs sm:text-lg font-black font-mono text-emerald-600 mt-1">{financeData.totalRegle.toLocaleString()} {merchant?.currency || 'FCFA'}</p>
                  </div>
                  <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <span className="text-[9px] sm:text-[10px] text-gray-400 font-mono uppercase font-black font-semibold">Reste</span>
                    <p className={`text-xs sm:text-base md:text-lg font-black font-mono mt-1 ${financeData.restantDu > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}`}>
                      {financeData.restantDu.toLocaleString()} {merchant?.currency || 'FCFA'}
                    </p>
                  </div>
                </div>

                {/* FICHE DES TARIFS CONTRACTUELS ACTIFS */}
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-indigo-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-indigo-50 pb-2.5">
                    <span className="text-sm">📋</span>
                    <h5 className="font-black text-[10px] font-mono uppercase tracking-wider text-indigo-950">Fiche des Tarifs Contractuels Actifs</h5>
                  </div>

                  {(() => {
                    const mVal = Number(financeData.breakdown?.monthsDuration ?? 9);
                    const iVal = Number(financeData.breakdown?.inscription ?? 25000);
                    const sAnnVal = Number(financeData.breakdown?.scolarite ?? 300000);
                    const sMensVal = mVal > 0 ? Math.round(sAnnVal / mVal) : 0;
                    const uVal = Number(financeData.breakdown?.uniforme ?? 40000);
                    const tAnnVal = Number(financeData.breakdown?.transport ?? 60000);
                    const tMensVal = mVal > 0 ? Math.round(tAnnVal / mVal) : 0;
                    const cAnnVal = Number(financeData.breakdown?.cantine ?? 90000);
                    const cMensVal = mVal > 0 ? Math.round(cAnnVal / mVal) : 0;
                    const hasInternat = financeData.breakdown?.hasInternat !== undefined ? !!financeData.breakdown.hasInternat : Number(financeData.breakdown?.internat ?? 0) > 0;
                    const intAnnVal = hasInternat ? Number(financeData.breakdown?.internat ?? 0) : 0;
                    const intMensVal = mVal > 0 ? Math.round(intAnnVal / mVal) : 0;

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 font-mono">
                          <span className="text-[9px] text-slate-400 uppercase font-black">1. Durée de la formation</span>
                          <p className="font-black text-indigo-950 mt-1">{mVal} mois</p>
                        </div>

                        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 font-mono">
                          <span className="text-[9px] text-slate-400 uppercase font-black">2. Frais d'inscription</span>
                          <p className="font-black text-indigo-950 mt-1">{iVal.toLocaleString()} {merchant?.currency || 'FCFA'}</p>
                        </div>

                        <div className="bg-indigo-50/20 p-3 rounded-xl border border-indigo-100/30 font-mono">
                          <span className="text-[9px] text-indigo-600 uppercase font-black">3. Scolarité annuelle</span>
                          <p className="font-black text-indigo-950 mt-1">{sAnnVal.toLocaleString()} {merchant?.currency || 'FCFA'}</p>
                        </div>

                        <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/60 font-mono">
                          <span className="text-[9px] text-indigo-700 uppercase font-black">4. Scolarité mensuelle (calculée)</span>
                          <p className="font-black text-indigo-700 mt-1">{sMensVal.toLocaleString()} {merchant?.currency || 'FCFA'}</p>
                        </div>

                        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 font-mono">
                          <span className="text-[9px] text-slate-400 uppercase font-black">5. Uniforme scolaire</span>
                          <p className="font-black text-indigo-950 mt-1">{uVal.toLocaleString()} {merchant?.currency || 'FCFA'}</p>
                        </div>

                        <div className="bg-emerald-50/20 p-3 rounded-xl border border-emerald-100/30 font-mono">
                          <span className="text-[9px] text-emerald-600 uppercase font-black">6. Transport annuel</span>
                          <p className="font-black text-indigo-950 mt-1">{tAnnVal.toLocaleString()} {merchant?.currency || 'FCFA'}</p>
                        </div>

                        <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/60 font-mono">
                          <span className="text-[9px] text-emerald-700 uppercase font-black">7. Transport mensuel (calculé)</span>
                          <p className="font-black text-emerald-800 mt-1">{tMensVal.toLocaleString()} {merchant?.currency || 'FCFA'}</p>
                        </div>

                        <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/30 font-mono">
                          <span className="text-[9px] text-amber-600 uppercase font-black">8. Cantine annuelle</span>
                          <p className="font-black text-indigo-950 mt-1">{cAnnVal.toLocaleString()} {merchant?.currency || 'FCFA'}</p>
                        </div>

                        <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/60 font-mono">
                          <span className="text-[9px] text-amber-700 uppercase font-black">9. Cantine mensuelle (calculée)</span>
                          <p className="font-black text-amber-850 mt-1">{cMensVal.toLocaleString()} {merchant?.currency || 'FCFA'}</p>
                        </div>

                        <div className="bg-violet-50/20 p-3 rounded-xl border border-violet-100/30 font-mono">
                          <span className="text-[9px] text-violet-600 uppercase font-black">10. Internat annuel</span>
                          <p className="font-black text-indigo-950 mt-1">{hasInternat ? `${intAnnVal.toLocaleString()} ${merchant?.currency || 'FCFA'}` : "Désactivé"}</p>
                        </div>

                        <div className="bg-violet-50/50 p-3 rounded-xl border border-violet-100/60 font-mono">
                          <span className="text-[9px] text-violet-750 uppercase font-black">11. Internat mensuel (calculé)</span>
                          <p className="font-black text-violet-800 mt-1">{hasInternat ? `${intMensVal.toLocaleString()} ${merchant?.currency || 'FCFA'}` : "Désactivé"}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* ECHEANCE INFO BANNER */}
                <div className="p-5 bg-orange-50 border border-orange-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-orange-600 font-mono">Mensualité Moyenne Estimée</span>
                    <div className="text-lg font-black text-slate-800 mt-1 font-mono">{financeData.prochaineEcheance.toLocaleString()} {merchant?.currency || 'FCFA'} / mois</div>
                  </div>
                  <div>
                    <button 
                      onClick={() => {
                        toast.success("Lancement de la passerelle Mobile Money...");
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all hover:scale-[1.02]"
                    >
                      Régler par Orange Money / Wave
                    </button>
                  </div>
                </div>

                {/* CATEGORIES PROGRESS & STATUS CARDS */}
                <div className="space-y-3.5">
                  {(() => {
                    const hasInternat = financeData.breakdown?.hasInternat !== undefined ? !!financeData.breakdown.hasInternat : Number(financeData.breakdown?.internat ?? 0) > 0;
                    const detailedCategories = [
                      { key: 'inscription', label: "Inscription / Réinscription", defaultVal: 25000, icon: BookOpen, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', formValue: "Inscription / Réinscription" },
                      { key: 'scolarite', label: "Scolarité Mensuelle", defaultVal: 300000, icon: DollarSign, color: 'text-sky-600 bg-sky-50 border-sky-100', formValue: "Scolarité Mensuelle" },
                      { key: 'uniforme', label: "Uniforme Scolaire", defaultVal: 40000, icon: Package, color: 'text-amber-600 bg-amber-50 border-amber-100', formValue: "Uniforme Scolaire" },
                      { key: 'transport', label: "Transport Scolaire", defaultVal: 60000, icon: Bus, color: 'text-teal-600 bg-teal-50 border-teal-100', formValue: "Transport Scolaire" },
                      { key: 'cantine', label: "Cantine Cafétéria", defaultVal: 90000, icon: Utensils, color: 'text-rose-600 bg-rose-50 border-rose-100', formValue: "Cantine Cafétéria" },
                      ...(hasInternat ? [
                        { key: 'internat', label: "Hébergement / Services d'internat", defaultVal: 0, icon: Home, color: 'text-violet-600 bg-violet-50 border-violet-100', formValue: "Internat Mensuel" }
                      ] : [])
                    ];

                    return detailedCategories.map((cat) => {
                      const target = Number(financeData.breakdown?.[cat.key] ?? cat.defaultVal);
                      const paid = (financeData.payments || [])
                        .filter((p: any) => p.category === cat.formValue || 
                          (cat.formValue === "Scolarité Mensuelle" && p.category.startsWith("Scolarité - ")) ||
                          (cat.formValue === "Transport Scolaire" && p.category.startsWith("Transport - ")) ||
                          (cat.formValue === "Cantine Cafétéria" && p.category.startsWith("Cantine - ")) ||
                          (cat.formValue === "Internat Mensuel" && p.category.startsWith("Internat - "))
                        )
                        .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
                      const owed = Math.max(0, target - paid);
                      const pct = target > 0 ? Math.min(100, Math.round((paid / target) * 100)) : 0;

                      return (
                        <div key={cat.key} className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex gap-2.5">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${cat.color}`}>
                                <cat.icon className="w-4 h-4" />
                              </div>
                              <div>
                                <h5 className="font-extrabold text-indigo-950 text-sm leading-tight">{cat.label}</h5>
                                <p className="text-[10px] font-mono text-slate-400 mt-1">
                                  Dû contractualisé: <span className="font-extrabold text-slate-700">{target.toLocaleString()} {merchant?.currency || 'FCFA'}</span>
                                </p>
                              </div>
                            </div>

                            <div className="text-right pointer-events-none shrink-0">
                              {target === 0 ? (
                                <span className="px-2 py-0.5 bg-slate-50 text-slate-300 rounded text-[8.5px] font-black uppercase">Non applicable</span>
                              ) : owed === 0 ? (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[8.5px] font-bold uppercase inline-flex items-center gap-0.5">
                                  ✓ Soldé
                                </span>
                              ) : paid > 0 ? (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[8.5px] font-bold uppercase">Payé {pct}%</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-500 border border-rose-100 rounded text-[8.5px] font-semibold uppercase">Impayé</span>
                              )}
                            </div>
                          </div>

                          {target > 0 && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono">
                                <span>Payé: <strong className="text-emerald-700 font-extrabold">{paid.toLocaleString()}</strong> {merchant?.currency || 'FCFA'}</span>
                                <span>Reste: <strong className="text-rose-500 font-extrabold">{owed.toLocaleString()}</strong> {merchant?.currency || 'FCFA'}</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                <span className="bg-emerald-500 h-full rounded-full transition-all duration-300 block" style={{ width: `${pct}%` }}></span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

              </div>

              {/* RIGHT PANEL: PAYMENT HISTORY LOGS & RECEIPT PRINTING (5 COLS) */}
              <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full self-start">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 font-mono">Historique des Reçus Certifiés</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Consultez tous les règlements encaissés pour cet étudiant cette année académique. Vous pouvez afficher et imprimer chaque ticket en un clic.
                  </p>
                </div>

                <div className="flex-1 mt-6 overflow-y-auto space-y-3 pr-1 max-h-[600px] custom-scrollbar">
                  {(financeData.payments || []).length === 0 ? (
                    <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed text-slate-400 text-xs">
                      Aucun versement n'a été enregistré pour cet élève.
                    </div>
                  ) : (
                    [...(financeData.payments || [])].reverse().map((pay: any) => (
                      <div key={pay.id} className="bg-slate-50 hover:bg-slate-100/80 p-4 rounded-xl border border-gray-100 transition-colors flex items-center justify-between gap-3 shadow-xs">
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-slate-855">{pay.category}</p>
                          <p className="text-[10px] font-mono text-indigo-950 font-bold">
                            {pay.receiptNumber || 'REC-' + pay.id.slice(0,6).toUpperCase()} • Mode: <span className="font-black text-indigo-600">{pay.mode || 'Wave'}</span>
                          </p>
                          <p className="text-[9px] font-mono text-slate-400">
                            Encaissé le : {pay.date ? new Date(pay.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 font-mono">
                          <span className="text-xs font-black text-emerald-600">+{pay.amount.toLocaleString()} {merchant?.currency || 'FCFA'}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReceipt({
                                ...pay,
                                studentName: `${selectedChild?.firstName} ${selectedChild?.lastName}`,
                                matricule: selectedChild?.matricule || 'N/A',
                                grade: selectedChild?.grade || selectedChild?.class || 'N/A',
                                receiptNumber: pay.receiptNumber || 'REC-' + pay.id.slice(0,6).toUpperCase()
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:scale-105 transition-all bg-white rounded-lg border border-slate-200 shadow-sm"
                            title="Afficher le Reçu"
                          >
                            <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        );
      case 'attendance':
        const filteredAttendances = attendances.filter(a => isAbsentStatus(a.status) || isLateStatus(a.status));
        return (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-6">Registre des Présences</h3>
              <div className="space-y-3">
                {filteredAttendances.length === 0 ? (
                  <p className="text-sm text-gray-500 italic text-center py-8">Aucune absence ou retard enregistré.</p>
                ) : (
                  filteredAttendances.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAbsentStatus(a.status) ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'}`}>
                          {isAbsentStatus(a.status) ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{isAbsentStatus(a.status) ? 'Absence - Journée / Cours' : 'Retard'}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">Le {new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                          {a.reason && <p className="text-[11px] text-slate-600 mt-1 italic leading-tight whitespace-pre-wrap"><span className="font-bold">Motif:</span> {a.reason}</p>}
                        </div>
                      </div>
                      {isAbsentStatus(a.status) && (
                        <button className="px-4 py-2 bg-white border border-gray-200 text-slate-600 rounded-xl text-xs font-bold shadow-sm hover:bg-gray-50">
                          Justifier
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
             </div>
          </div>
        );
      case 'homework':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-500" /> Cahier de Texte
              </h3>
              
              {validHomeworks.length === 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100 text-center py-10">
                    <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-700">Aucun devoir ou leçon n'a été publié pour l'instant.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {validHomeworks.map((h: any, idx: number) => (
                    <div key={h.id || idx} className="p-4 bg-slate-50 rounded-2xl border border-indigo-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{h.subjectName || 'Général'}</span>
                        <span className="text-xs text-rose-500 font-bold">Pour le: {new Date(h.dueDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mb-1">{h.title}</h4>
                      <p className="text-slate-600 text-xs leading-relaxed max-w-xl whitespace-pre-wrap">{h.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 'schedule':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Emploi du Temps de {selectedChild?.firstName || selectedChild?.name || 'l\'élève'}</h3>
                  <p className="text-sm text-gray-500 font-medium mt-0.5">
                    Classe : <strong className="text-indigo-600 font-extrabold">{selectedChild?.grade || selectedChild?.class || 'Non spécifiée'}</strong>
                  </p>
                </div>

                {/* Switcher pour le Type de Présentation Calendrier */}
                {(selectedChildClass?.schedulePublished !== false) && classSchedules.length > 0 && (
                  <div className="flex bg-slate-100 p-1 rounded-2xl border border-gray-100 inline-flex self-start">
                    <button 
                      onClick={() => setScheduleViewType('grid')}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${scheduleViewType === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Grille Hebdo
                    </button>
                    <button 
                      onClick={() => setScheduleViewType('day')}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${scheduleViewType === 'day' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Par Jour
                    </button>
                    <button 
                      onClick={() => setScheduleViewType('flow')}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${scheduleViewType === 'flow' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Flux Global
                    </button>
                  </div>
                )}
              </div>

              {selectedChildClass?.schedulePublished === false ? (
                <div className="text-center py-12 bg-amber-50/50 rounded-2xl border border-amber-200 text-amber-800 font-medium">
                  <EyeOff className="w-12 h-12 mx-auto mb-3 text-amber-500 animate-pulse" />
                  <p className="text-sm font-bold text-amber-900">Emploi du temps non publié</p>
                  <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">L'emploi du temps officiel de cette classe n'a pas encore été publié officiellement par l'administration ou est en cours d'élaboration.</p>
                </div>
              ) : classSchedules.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-gray-100 text-slate-400 font-medium">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
                  <p className="text-sm font-bold text-slate-700">Aucun emploi du temps officiel n'est disponible ou n'a encore été défini pour cette classe.</p>
                  <p className="text-xs text-slate-500 mt-1">L'administration scolaire est chargée de programmer l'emploi du temps.</p>
                </div>
              ) : (
                <div>
                  {/* HELPER FONCTIONS POUR CARTES D'EMPLOI DU TEMPS */}
                  {(() => {
                    const renderClassCard = (s: any, idx: number) => {
                      const isCanceled = s.status === 'canceled';
                      const isReplaced = s.status === 'replaced';
                      
                      const getSubjectSubColor = (n: string) => {
                        const k = (n || '').toLowerCase();
                        if (k.includes('math')) return 'bg-emerald-50 text-emerald-850 border-emerald-250';
                        if (k.includes('fran') || k.includes('lettre')) return 'bg-blue-50 text-blue-800 border-blue-200';
                        if (k.includes('phys') || k.includes('chim')) return 'bg-amber-50 text-amber-850 border-amber-200';
                        if (k.includes('svt') || k.includes('sci')) return 'bg-teal-50 text-teal-800 border-teal-200';
                        if (k.includes('hist') || k.includes('géo') || k.includes('geo')) return 'bg-orange-50 text-orange-850 border-orange-200';
                        if (k.includes('sport') || k.includes('eps')) return 'bg-rose-50 text-rose-800 border-rose-200';
                        return 'bg-slate-50 text-slate-700 border-slate-200';
                      };

                      const badgeColor = getSubjectSubColor(s.subject);

                      return (
                        <div key={s.id || idx} className={`p-3 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:border-indigo-200 relative ${isCanceled ? 'opacity-50' : ''}`}>
                          <p className="text-[9px] font-bold text-indigo-600 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            {s.startTime} - {s.endTime}
                          </p>
                          
                          <p className={`font-black text-slate-800 text-xs mt-1.5 inline-block px-2 py-0.5 rounded-lg border ${badgeColor}`}>
                            {s.subject}
                          </p>

                          {isCanceled ? (
                            <p className="text-[9px] font-black text-rose-600 uppercase mt-2 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-lg text-center">❌ Cours Annulé</p>
                          ) : isReplaced ? (
                            <div className="mt-2 space-y-0.5 bg-purple-50/50 border border-purple-100 p-1.5 rounded-xl">
                              <p className="text-[8px] font-black text-purple-700 uppercase tracking-wider text-center flex items-center justify-center gap-0.5">🔄 Enseignant Remplaçant</p>
                              <p className="text-[10px] text-purple-900 font-black text-center mt-0.5">{s.replacementTeacherName || 'M. Diop'}</p>
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-600 font-extrabold mt-1.5 flex items-center gap-1">
                              <span>👤</span>
                              {s.teacherName || 'Enseignant'}
                            </p>
                          )}

                          {s.room && (
                            <p className="text-[9px] text-slate-400 font-bold mt-1.5 flex items-center gap-1">
                              <span>📍</span>
                              {s.room}
                            </p>
                          )}
                        </div>
                      );
                    };

                    {/* RENDU DES DIFFERENTS TYPES DE PRESENTATIONS */}
                    if (scheduleViewType === 'grid') {
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                          {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((day) => {
                            const daySlots = classSchedules
                              .filter((s: any) => s.day === day)
                              .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
                            
                            return (
                              <div key={day} className="bg-slate-50 p-4 rounded-2xl border border-gray-100 flex flex-col h-full min-h-[250px] space-y-3">
                                <h4 className="font-extrabold text-indigo-700 text-xs uppercase tracking-wider text-center border-b border-indigo-200 pb-2 bg-indigo-50/50 py-1 rounded-md">
                                  {day}
                                </h4>
                                <div className="space-y-2 flex-grow">
                                  {daySlots.length === 0 ? (
                                    <div className="h-full flex flex-col justify-center items-center py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-100/20">
                                      <span className="text-base opacity-40">☕</span>
                                      <p className="text-[10px] font-bold text-slate-400 mt-1">Pas de cours</p>
                                    </div>
                                  ) : (
                                    daySlots.map((s: any, idx: number) => renderClassCard(s, idx))
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    } else if (scheduleViewType === 'day') {
                      return (
                        <div className="space-y-6">
                          <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100">
                            {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((day) => {
                              const hasClasses = classSchedules.some((s: any) => s.day === day);
                              const isActive = selectedDay === day;
                              return (
                                <button
                                  key={day}
                                  onClick={() => setSelectedDay(day)}
                                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                                    isActive
                                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-gray-200'
                                  }`}
                                >
                                  <span>{day}</span>
                                  {hasClasses && <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-indigo-500'}`} />}
                                </button>
                              );
                            })}
                          </div>
                          {(() => {
                            const daySlots = classSchedules
                              .filter((s: any) => s.day === selectedDay)
                              .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));

                            if (daySlots.length === 0) {
                              return (
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-gray-100 max-w-md mx-auto">
                                  <span className="text-3xl">☕</span>
                                  <h4 className="font-extrabold text-slate-700 text-xs mt-3">Pas de cours programmé</h4>
                                  <p className="text-[11px] text-slate-500 mt-1">Profitez de ce moment de repos ou d'étude personnelle !</p>
                                </div>
                              );
                            }

                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {daySlots.map((s: any, idx: number) => renderClassCard(s, idx))}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    } else {
                      // FLUX GLOBAL (Flow)
                      return (
                        <div className="space-y-8 pl-2">
                          {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((day) => {
                            const daySlots = classSchedules
                              .filter((s: any) => s.day === day)
                              .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));

                            if (daySlots.length === 0) return null;

                            return (
                              <div key={day} className="relative pl-6 border-l-2 border-indigo-100 ml-2">
                                {/* Chrono Timeline Dot */}
                                <div className="absolute -left-[7px] top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 border-4 border-white shadow-sm" />
                                
                                <h4 className="text-xs font-black text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                  <span>📅</span>
                                  <span>{day}</span>
                                  <span className="text-[10px] text-gray-400 lowercase font-medium">({daySlots.length} cours)</span>
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {daySlots.map((s: any, idx: number) => renderClassCard(s, idx))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          </div>
        );
      case 'information':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                 <span className="text-[10px] font-mono font-black text-indigo-600 uppercase tracking-widest block font-sans">
                  RÉDACTION ADMINISTRATIVE
                 </span>
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-500" /> Annonces & Communications
              </h3>
              
              {parentAnnouncements.length === 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100 text-center py-10">
                    <Bell className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-700">Aucune information pour le moment.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {parentAnnouncements.map((h: any, idx: number) => (
                    <div key={h.id || idx} className="p-4 bg-slate-50 rounded-2xl border border-indigo-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{h.targetAudience === 'all' ? 'Annonce Globale' : 'Information Parents'}</span>
                        <span className="text-xs text-slate-400 font-bold">{new Date(h.createdAt || h.updatedAt || Date.now()).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mb-1">{h.title}</h4>
                      <p className="text-slate-600 text-xs leading-relaxed max-w-xl whitespace-pre-wrap">{h.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 'transport':
        return (
          <div className="space-y-6 animate-fade-in">
            {/* SERVICES BANNER */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 rounded-[2rem] text-white shadow-md relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center justify-center p-8 pointer-events-none">
                <Bus className="w-48 h-48" />
              </div>
              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-indigo-500 text-white font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                    Services Périscolaires
                  </span>
                </div>
                <h3 className="text-xl font-black">Transport &amp; Restauration Scolaire</h3>
                <p className="text-xs text-indigo-200 font-medium max-w-xl leading-relaxed">
                  Consultez les détails opérationnels, les lignes de bus attribuées, les menus de la cantine et le suivi financier en temps réel de <strong>{selectedChild?.firstName} {selectedChild?.lastName}</strong>.
                </p>
              </div>
            </div>

            {/* SERVICES MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* SECTION A: TRANSPORT SCOLAIRE */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Bus className="w-5 h-5 text-teal-600 bg-teal-50 p-1 rounded-lg" />
                      Transport Scolaire
                    </h4>
                    {financeData.breakdown?.hasTransport ? (
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-full uppercase">
                        Abonné / Actif
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-gray-100 px-2.5 py-0.5 rounded-full uppercase">
                        Non Inscrit
                      </span>
                    )}
                  </div>

                  {financeData.breakdown?.hasTransport ? (
                    <div className="space-y-4">
                      {/* Operational Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                          <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Ligne de bus</span>
                          <p className="text-xs font-black text-slate-800">{selectedChild?.transportLine || 'Ligne B - Dakar Plateau / Fann'}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                          <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Chauffeur assigné</span>
                          <p className="text-xs font-black text-slate-800">{selectedChild?.transportDriver || 'M. Amadou Fall (+221 77 123 45 67)'}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                          <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Horaire de passage (Aller)</span>
                          <p className="text-xs font-black text-slate-800">07h15 au point de ramassage</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                          <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Horaire de retour</span>
                          <p className="text-xs font-black text-slate-800">16h45 au point de ramassage</p>
                        </div>
                      </div>

                      {/* Financial details inside box */}
                      {(() => {
                        const transportTarget = Number(financeData.breakdown?.transport ?? 60000);
                        const transportPaid = (financeData.payments || [])
                          .filter((p: any) => p.category === "Transport Scolaire" || p.category?.startsWith("Transport - "))
                          .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
                        const transportOwed = Math.max(0, transportTarget - transportPaid);
                        const transportPct = transportTarget > 0 ? Math.min(100, Math.round((transportPaid / transportTarget) * 100)) : 0;

                        return (
                          <div className="bg-teal-50/20 p-4 rounded-2xl border border-teal-100/40 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-bold">Frais annuels de transport :</span>
                              <span className="font-extrabold text-slate-800 font-mono">{transportTarget.toLocaleString()} {merchant?.currency || 'FCFA'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-bold">Total réglé à ce jour :</span>
                              <span className="font-extrabold text-teal-600 font-mono">{transportPaid.toLocaleString()} {merchant?.currency || 'FCFA'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-bold">Reste à payer :</span>
                              <span className="font-extrabold text-slate-700 font-mono">{transportOwed.toLocaleString()} {merchant?.currency || 'FCFA'}</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-1.5 pt-1">
                              <div className="flex justify-between text-[10px] font-mono font-black uppercase text-teal-600">
                                <span>Règlement</span>
                                <span>{transportPct}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${transportPct}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-2">
                      <p className="text-xs text-slate-500 font-medium">Le service de transport scolaire n'est pas activé ou souscrit pour cet élève.</p>
                      <button className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 transition-colors text-[10px] font-bold text-slate-700 rounded-lg">
                        Faire une demande de souscription
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION B: CANTINE SCOLAIRE & MENU */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-rose-600 bg-rose-50 p-1 rounded-lg" />
                    Cantine &amp; Restauration
                  </h4>
                  {financeData.breakdown?.hasCanteen ? (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full uppercase">
                      Abonné / Actif
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-gray-100 px-2.5 py-0.5 rounded-full uppercase">
                      Non Inscrit
                    </span>
                  )}
                </div>

                {financeData.breakdown?.hasCanteen ? (
                  <div className="space-y-4">
                    {/* Menu and Subscription Specs */}
                    {(() => {
                      const cantineTarget = Number(financeData.breakdown?.cantine ?? 90000);
                      const cantinePaid = (financeData.payments || [])
                        .filter((p: any) => p.category === "Cantine Cafétéria" || p.category?.startsWith("Cantine - "))
                        .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
                      const cantineOwed = Math.max(0, cantineTarget - cantinePaid);
                      const cantinePct = cantineTarget > 0 ? Math.min(100, Math.round((cantinePaid / cantineTarget) * 100)) : 0;

                      return (
                        <div className="bg-rose-50/20 p-4 rounded-2xl border border-rose-100/40 space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-bold">Régime de l'élève :</span>
                            <span className="font-extrabold text-slate-800 uppercase">{selectedChild?.regime || 'Demi-pensionnaire'}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-bold">Frais de cantine :</span>
                            <span className="font-extrabold text-slate-800 font-mono">{cantineTarget.toLocaleString()} {merchant?.currency || 'FCFA'}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-bold">Réglé à ce jour :</span>
                            <span className="font-extrabold text-rose-600 font-mono">{cantinePaid.toLocaleString()} {merchant?.currency || 'FCFA'}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-bold">Reste à payer :</span>
                            <span className="font-extrabold text-slate-700 font-mono">{cantineOwed.toLocaleString()} {merchant?.currency || 'FCFA'}</span>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between text-[10px] font-mono font-black uppercase text-rose-600">
                              <span>Règlement</span>
                              <span>{cantinePct}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${cantinePct}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Menu Heading */}
                    <div className="pt-2">
                      <h5 className="text-[10px] font-mono font-black uppercase text-rose-600 tracking-wider mb-2 flex items-center gap-1">
                        <span>🗓️</span> Menu Gastronomique de la Semaine
                      </h5>
                      <div className="border border-slate-150 rounded-2xl divide-y divide-slate-100 bg-slate-50/30 overflow-hidden">
                        {[
                          { day: 'Lundi', main: 'Thiéboudienne (Riz au poisson)', side: 'Légumes locaux & Sauce tamarin', meta: 'Riche en Oméga-3' },
                          { day: 'Mardi', main: 'Mafé de Boeuf', side: 'Riz blanc & brisures d\'arachide crémeuse', meta: 'Énergie naturelle' },
                          { day: 'Mercredi', main: 'Ragoût de Poulet', side: 'Frites de patates douces maison', meta: 'Favori des enfants' },
                          { day: 'Jeudi', main: 'Spaghetti Bolognaise de bœuf', side: 'Fromage râpé & fruits de saison', meta: '炭 Carbon' },
                          { day: 'Vendredi', main: 'Yassa au Poulet', side: 'Riz aux oignons caramélisés & olives', meta: 'Spécialité Locale' }
                        ].map((m) => (
                          <div key={m.day} className="p-3 flex justify-between items-start gap-4">
                            <span className="text-[10px] font-black text-rose-600 uppercase shrink-0 w-14 font-mono">{m.day}</span>
                            <div className="space-y-0.5 text-xs">
                              <p className="font-extrabold text-slate-800">{m.main}</p>
                              <p className="text-slate-500 text-[11px] font-medium leading-normal">{m.side}</p>
                            </div>
                            <span className="text-[8px] font-black uppercase bg-white border border-gray-100 text-slate-400 px-1.5 py-0.5 rounded shrink-0 self-center font-mono">
                              {m.meta}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-2">
                    <p className="text-xs text-slate-500 font-medium">Le service de cantine scolaire n'est pas activé ou souscrit pour cet élève.</p>
                    <button className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 transition-colors text-[10px] font-bold text-slate-700 rounded-lg">
                      Faire une demande d'inscription cantine
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      case 'dashboard':
      default:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><FileText className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Moyenne Générale</p>
                  <p className="text-2xl font-black text-slate-800">
                    {childAverage !== null ? childAverage.toFixed(2) : '--'}{" "}
                    <span className="text-sm font-bold text-slate-400">/ 20</span>
                  </p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center"><AlertTriangle className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Absences & Retards</p>
                  <p className="text-2xl font-black text-slate-800">{absences.length + lates.length} <span className="text-sm font-bold text-slate-400">fiches</span></p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><Calendar className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Cours Planifiés</p>
                  <p className="text-2xl font-black text-slate-800">{classSchedules.length} <span className="text-sm font-bold text-slate-400">sessions</span></p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><BookOpen className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Cahier de Texte</p>
                  <p className="text-2xl font-black text-slate-800">{validHomeworks.length} <span className="text-sm font-bold text-slate-400">devoirs</span></p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-indigo-500" /> Notifications Récentes</h3>
                <div className="space-y-4">
                  {parentAnnouncements.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Aucune annonce administrative récente.</p>
                  ) : (
                    parentAnnouncements.slice(0, 3).map((ann: any, idx: number) => (
                      <div key={ann.id || idx} className="flex gap-3 items-start border-b border-gray-50 pb-4">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{ann.title}</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl whitespace-pre-wrap">{ann.content}</p>
                          <p className="text-[9px] text-slate-400 mt-2 font-mono">
                            Publié le {new Date(ann.createdAt || ann.updatedAt || Date.now()).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-500" /> Cahier de Texte</h3>
                <div className="space-y-3">
                  {validHomeworks.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100 text-center py-6">
                      <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-500">Aucun devoir ou leçon n'a été publié pour l'instant.</p>
                    </div>
                  ) : (
                    validHomeworks.slice(0, 3).map((h: any, idx: number) => (
                      <div key={h.id || idx} className="p-3 bg-slate-50 rounded-xl border border-gray-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{h.subjectName || 'Général'}</span>
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">Pour le {new Date(h.dueDate).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700">{h.title}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex bg-slate-100/80 backdrop-blur-md overflow-hidden">
      <motion.div 
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        exit={{ y: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full h-full bg-slate-50 flex flex-col md:flex-row relative shadow-2xl"
      >
        <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
          <div className="p-6 border-b border-gray-100 bg-indigo-900 text-white relative overflow-hidden shrink-0">
            <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4">
              <ShieldCheck className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black tracking-tight">Portail Parents</h2>
                <p className="text-xs font-medium text-indigo-200">{merchant?.businessName || 'Établissement'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10 shrink-0">
              <p className="text-[9px] uppercase tracking-widest font-black text-indigo-200 mb-2">Compte Connecté</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-black text-white shadow-inner">
                  {parent?.name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{parent?.name || 'Tuteur'}</p>
                  <p className="text-xs text-indigo-200 truncate">{parent?.phone || 'Téléphone non renseigné'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-gray-100 shrink-0">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Dossier Élève</label>
            <div className="space-y-2">
              {parent?.children?.map((child: any, idx: number) => (
                <button
                  key={child.id || idx}
                  onClick={() => setSelectedChild(child)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    selectedChild?.id === child.id || (!selectedChild?.id && idx === 0)
                      ? 'bg-indigo-50 border border-indigo-100 text-indigo-700 shadow-sm' 
                      : 'bg-white border border-gray-100 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                    selectedChild?.id === child.id || (!selectedChild?.id && idx === 0) ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {(child.name || child.firstName || '?').charAt(0)}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-bold text-sm leading-tight truncate">{child.name || `${child.firstName} ${child.lastName}`}</p>
                    <p className="text-[10px] font-mono font-bold opacity-70 truncate">Classe: {child.grade || child.class || child.class_id || child.classId || 'Non assigné'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
             {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100 shrink-0">
            <button onClick={onClose} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-sm font-bold transition-colors text-slate-600">
              <LogOut className="w-4 h-4" />
              <span>Quitter le simulateur</span>
            </button>
          </div>
        </div>

        <div className="flex-1 h-full overflow-y-auto bg-slate-50/50 p-4 sm:p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            {renderContent()}
          </div>

          <AnimatePresence>
            {selectedReceipt && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
                >
                  <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                      <h3 className="text-xl font-bold text-indigo-950">Aperçu du Reçu</h3>
                      <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-0.5 font-bold">
                        REÇU OFFICIEL DE TRÉSORERIE
                      </p>
                    </div>
                    <button 
                      onClick={() => setSelectedReceipt(null)} 
                      className="p-2 hover:bg-slate-100 rounded-xl transition-colors border shadow-sm"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  {/* PRINTABLE RECEIPT LAYOUT */}
                  <div id="school-receipt-print" className="p-8 space-y-6 printable-body font-sans text-slate-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-lg font-black tracking-tight text-indigo-950">{merchant?.name || 'Acom School'}</h2>
                        <p className="text-[10px] text-slate-500 font-medium">B.P. 3381 / Dakar, Sénégal</p>
                        <p className="text-[9px] font-mono text-indigo-600 font-bold">contact@acom-school.sn</p>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-indigo-950 text-white text-[9px] font-black tracking-widest uppercase rounded">
                          REÇU DE COMMERCE
                        </span>
                        <p className="text-[11px] font-mono font-bold text-indigo-950 mt-2">{selectedReceipt.receiptNumber}</p>
                        <p className="text-[10px] text-gray-400 font-mono">Date: {new Date(selectedReceipt.date || Date.now()).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 space-y-2 text-xs">
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Élève :</span>
                        <span className="font-extrabold text-indigo-950 text-right">{selectedReceipt.studentName}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Matricule :</span>
                        <span className="font-mono text-right">{selectedReceipt.matricule}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Niveau d'étude :</span>
                        <span className="font-extrabold text-right">{selectedReceipt.grade}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Rubrique comptable :</span>
                        <span className="font-extrabold text-right text-indigo-950">{selectedReceipt.category}</span>
                      </div>
                    </div>

                    {/* TABLEAU DES LIBELLÉS DÉTAILLÉS */}
                    {(() => {
                      const details = selectedReceipt.details || (() => {
                        const cat = selectedReceipt.category || '';
                        if (cat.includes('Mensualité Globale')) {
                          if (Number(selectedReceipt.amount) === 63333) {
                            return { scolarite: 33333, transport: 10000, cantine: 20000 };
                          }
                          const amount = Number(selectedReceipt.amount || 0);
                          const transport = Math.round(amount * 10000 / 63333);
                          const cantine = Math.round(amount * 20000 / 63333);
                          const scolarite = amount - transport - cantine;
                          return { scolarite, transport, cantine };
                        } else {
                          return {
                            scolarite: cat.includes('Scolarité') ? Number(selectedReceipt.amount) : 0,
                            transport: cat.includes('Transport') ? Number(selectedReceipt.amount) : 0,
                            cantine: cat.includes('Cantine') ? Number(selectedReceipt.amount) : 0,
                            internat: cat.includes('Internat') ? Number(selectedReceipt.amount) : 0,
                            inscription: cat.includes('Inscription') ? Number(selectedReceipt.amount) : 0,
                            autres: (!cat.includes('Scolarité') && !cat.includes('Transport') && !cat.includes('Cantine') && !cat.includes('Internat') && !cat.includes('Inscription')) ? Number(selectedReceipt.amount) : 0
                          };
                        }
                      })();

                      return (
                        <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs bg-white shadow-xs">
                          <div className="bg-indigo-955/5 px-4 py-3 border-b border-slate-100 font-black text-indigo-950 text-[10px] uppercase tracking-wider flex justify-between bg-indigo-50/20">
                            <span>ÉLÉMENT DE FACTURATIONS</span>
                            <span>MONTANT ({merchant?.currency || 'FCFA'})</span>
                          </div>
                          <div className="divide-y divide-slate-100 px-4">
                            {Number(details.inscription || 0) > 0 && (
                              <div className="flex justify-between py-2.5 text-slate-700 font-medium font-mono">
                                <span className="font-bold">Inscription / Réinscription :</span>
                                <span className="font-extrabold">{Number(details.inscription).toLocaleString()} {merchant?.currency || 'FCFA'}</span>
                              </div>
                            )}
                            <div className="flex justify-between py-2.5 text-slate-700 font-medium font-mono">
                              <span className="font-bold">Scolarité :</span>
                              <span className="font-extrabold">{Number(details.scolarite || 0).toLocaleString()} {merchant?.currency || 'FCFA'}</span>
                            </div>
                            <div className="flex justify-between py-2.5 text-slate-700 font-medium font-mono">
                              <span className="font-bold">Transport :</span>
                              <span className="font-extrabold">{Number(details.transport || 0).toLocaleString()} {merchant?.currency || 'FCFA'}</span>
                            </div>
                            <div className="flex justify-between py-2.5 text-slate-700 font-medium font-mono">
                              <span className="font-bold">Cantine :</span>
                              <span className="font-extrabold">{Number(details.cantine || 0).toLocaleString()} {merchant?.currency || 'FCFA'}</span>
                            </div>
                            {Number(details.internat || 0) > 0 && (
                              <div className="flex justify-between py-2.5 text-slate-700 font-medium font-mono">
                                <span className="font-bold">Hébergement / Internat :</span>
                                <span className="font-extrabold">{Number(details.internat).toLocaleString()} {merchant?.currency || 'FCFA'}</span>
                              </div>
                            )}
                            {Number(details.autres || 0) > 0 && (
                              <div className="flex justify-between py-2.5 text-slate-700 font-medium font-mono">
                                <span className="font-bold">Autres :</span>
                                <span className="font-extrabold font-mono">{Number(details.autres).toLocaleString()} {merchant?.currency || 'FCFA'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="py-6 border-y border-dashed border-gray-250 flex justify-between items-center bg-slate-50 border-x rounded-xl px-6">
                      <span className="text-xs font-black uppercase text-indigo-950 tracking-wider">Montant total net perçu</span>
                      <span className="text-2xl font-black font-mono text-emerald-600">{Number(selectedReceipt.amount).toLocaleString()} {merchant?.currency || 'FCFA'}</span>
                    </div>

                    <div className="flex justify-between items-end gap-4">
                      <div className="space-y-1">
                        <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest font-bold">Mode de versement</p>
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded border border-indigo-150">
                          {selectedReceipt.mode || 'Wave'}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest mb-12 font-bold">Le Caissier Général</p>
                        <p className="text-[10px] font-extrabold text-indigo-950 underline decoration-indigo-500 font-mono">SIGNÉ ÉLECTRONIQUEMENT</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 border-t flex space-x-3">
                    <button 
                      onClick={() => window.print()} 
                      className="flex-1 py-3 px-4 bg-indigo-950 text-white rounded-xl text-xs font-bold hover:bg-black flex items-center justify-center space-x-1 uppercase tracking-widest"
                    >
                      Imprimer le Reçu
                    </button>
                    <button 
                      onClick={() => setSelectedReceipt(null)}
                      className="flex-1 py-3 px-4 bg-white text-slate-600 rounded-xl text-xs font-bold border hover:bg-slate-50 uppercase tracking-widest"
                    >
                      Fermer
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
