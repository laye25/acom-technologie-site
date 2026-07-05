import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Loader2, Mail, Phone, Edit2, X, Calendar, DollarSign, FileText, 
  Check, AlertCircle, Printer, Clock, Settings, CreditCard, TrendingUp, 
  Briefcase, UserX, CheckCircle, CalendarRange, UserCheck, Trash2, 
  Info, Eye, Landmark, ArrowUpRight
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { dbService } from '../../../services/dbService';
import toast from 'react-hot-toast';
import { Merchant } from '../../../types';

type HRTab = 'employees' | 'attendance' | 'leaves' | 'payroll' | 'journal';

const HRManager = ({ merchant }: { merchant: Merchant }) => {
  // Tabs & Navigation
  const [activeTab, setActiveTab] = useState<HRTab>('employees');
  
  // Roster states
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [employeeLimit, setEmployeeLimit] = useState(10);

  // Attendance states
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceNotes, setAttendanceNotes] = useState<Record<string, string>>({});

  // Leave states
  const [isEditingLeave, setIsEditingLeave] = useState(false);
  const [currentLeave, setCurrentLeave] = useState<any>(null);
  const [savingLeave, setSavingLeave] = useState(false);

  // Payroll states
  const [payrollPeriod, setPayrollPeriod] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [isEditingPayslip, setIsEditingPayslip] = useState(false);
  const [currentPayslip, setCurrentPayslip] = useState<any>(null);
  const [savingPayslip, setSavingPayslip] = useState(false);
  const [viewingPayslipPrint, setViewingPayslipPrint] = useState<any>(null);

  // Settlement states
  const [isPayingPayslip, setIsPayingPayslip] = useState(false);
  const [settlementPayslip, setSettlementPayslip] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wave' | 'orange_money' | 'transfer'>('cash');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [savingPayment, setSavingPayment] = useState(false);

  // --- QUERY LOCAL DB VIA DEXIE ---
  const employees = useLiveQuery(() => 
    db.employees.where('merchantId').equals(merchant.id).reverse().sortBy('updatedAt')
  , [merchant.id]) || [];

  const leaves = useLiveQuery(() =>
    db.employee_leaves.where('merchantId').equals(merchant.id).reverse().sortBy('updatedAt')
  , [merchant.id]) || [];

  const attendanceRecords = useLiveQuery(() =>
    db.employee_attendance.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const payslips = useLiveQuery(() =>
    db.payslips.where('merchantId').equals(merchant.id).reverse().sortBy('updatedAt')
  , [merchant.id]) || [];

  // --- PROGRESSIVE INCOME TAX ESTIMATION (SENEGAL GENERAL TAX BRACKETS) ---
  const calculateEstimatedTax = (taxable: number) => {
    if (taxable <= 100000) return 0;
    if (taxable <= 200000) return Math.round((taxable - 100000) * 0.05);
    if (taxable <= 500000) return Math.round(5000 + (taxable - 200000) * 0.12);
    return Math.round(41000 + (taxable - 500000) * 0.20);
  };

  // Helper: Month period formatter (e.g., 2026-07 -> Juillet 2026)
  const formatPeriodText = (period: string) => {
    if (!period) return '';
    const [year, month] = period.split('-');
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const monthName = months[parseInt(month, 10) - 1] || month;
    return `${monthName} ${year}`;
  };

  // Helper: Payment Method labels
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'cash': return 'Espèces';
      case 'wave': return 'Wave';
      case 'orange_money': return 'Orange Money';
      case 'transfer': return 'Virement';
      default: return method;
    }
  };

  // --- BUSINESS LOGIC HANDLERS ---

  // Employees
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEmployee(true);
    try {
      await dbService.employees.save({
        ...currentEmployee,
        merchantId: merchant.id
      });
      toast.success('Employé enregistré');
      setIsEditingEmployee(false);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSavingEmployee(false);
    }
  };

  // Attendance Pointage
  const handleMarkAllPresent = async () => {
    try {
      const activeEmployees = employees.filter(e => e.status === 'active');
      if (activeEmployees.length === 0) {
        toast.error('Aucun employé actif à pointer.');
        return;
      }
      
      const promises = activeEmployees.map(emp => {
        const existing = attendanceRecords.find(a => a.employeeId === emp.id && a.date === attendanceDate);
        return db.employee_attendance.put({
          id: existing?.id || crypto.randomUUID(),
          merchantId: merchant.id,
          employeeId: emp.id,
          date: attendanceDate,
          status: 'present',
          notes: attendanceNotes[emp.id] || '',
          updatedAt: new Date()
        });
      });
      
      await Promise.all(promises);
      toast.success('Tous les employés ont été pointés Présent');
    } catch (err) {
      toast.error('Erreur lors du pointage collectif');
    }
  };

  const handleSaveAttendance = async (empId: string, status: 'present' | 'absent' | 'late' | 'half_day') => {
    try {
      const existing = attendanceRecords.find(a => a.employeeId === empId && a.date === attendanceDate);
      await db.employee_attendance.put({
        id: existing?.id || crypto.randomUUID(),
        merchantId: merchant.id,
        employeeId: empId,
        date: attendanceDate,
        status: status,
        notes: attendanceNotes[empId] || '',
        updatedAt: new Date()
      });
      toast.success('Présence mise à jour');
    } catch (err) {
      toast.error('Erreur lors de la mise à jour de présence');
    }
  };

  // Leaves
  const handleSaveLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLeave.employeeId) {
      toast.error('Veuillez sélectionner un employé');
      return;
    }
    setSavingLeave(true);
    try {
      await db.employee_leaves.put({
        id: currentLeave.id || crypto.randomUUID(),
        merchantId: merchant.id,
        employeeId: currentLeave.employeeId,
        startDate: currentLeave.startDate,
        endDate: currentLeave.endDate,
        type: currentLeave.type,
        status: currentLeave.status,
        reason: currentLeave.reason || '',
        updatedAt: new Date()
      });
      
      // If leave is approved, check if we need to update employee status
      if (currentLeave.status === 'approved') {
        const today = new Date().toISOString().split('T')[0];
        if (today >= currentLeave.startDate && today <= currentLeave.endDate) {
          const emp = employees.find(e => e.id === currentLeave.employeeId);
          if (emp && emp.status !== 'on_leave') {
            await dbService.employees.save({
              ...emp,
              status: 'on_leave'
            });
          }
        }
      }

      toast.success('Fiche de congé enregistrée');
      setIsEditingLeave(false);
    } catch (err) {
      toast.error('Erreur lors de la planification');
    } finally {
      setSavingLeave(false);
    }
  };

  const handleUpdateLeaveStatus = async (leaveId: string, status: 'approved' | 'rejected') => {
    try {
      const leave = leaves.find(l => l.id === leaveId);
      if (!leave) return;
      
      await db.employee_leaves.put({
        ...leave,
        status,
        updatedAt: new Date()
      });

      // Update employee status if live
      if (status === 'approved') {
        const today = new Date().toISOString().split('T')[0];
        if (today >= leave.startDate && today <= leave.endDate) {
          const emp = employees.find(e => e.id === leave.employeeId);
          if (emp) {
            await dbService.employees.save({
              ...emp,
              status: 'on_leave'
            });
          }
        }
      } else if (status === 'rejected' && leave.status === 'approved') {
        // revert employee to active if they were set on leave
        const emp = employees.find(e => e.id === leave.employeeId);
        if (emp && emp.status === 'on_leave') {
          await dbService.employees.save({
            ...emp,
            status: 'active'
          });
        }
      }

      toast.success(`Demande de congé ${status === 'approved' ? 'approuvée' : 'rejetée'}`);
    } catch (err) {
      toast.error('Erreur lors de la modification du statut');
    }
  };

  const handleDeleteLeave = async (leaveId: string) => {
    if (confirm('Voulez-vous supprimer ce congé ?')) {
      try {
        const leave = leaves.find(l => l.id === leaveId);
        await db.employee_leaves.delete(leaveId);
        
        // Restore employee status if they were on leave
        if (leave && leave.status === 'approved') {
          const emp = employees.find(e => e.id === leave.employeeId);
          if (emp && emp.status === 'on_leave') {
            await dbService.employees.save({
              ...emp,
              status: 'active'
            });
          }
        }
        toast.success('Congé supprimé');
      } catch (err) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  // Payroll / Payslips
  const handleOpenPayslipCalculator = (employee: any) => {
    const existing = payslips.find(p => p.employeeId === employee.id && p.period === payrollPeriod);
    
    // Calculate monthly statistics from attendance records
    const monthlyAttendance = attendanceRecords.filter(a => 
      a.employeeId === employee.id && a.date.startsWith(payrollPeriod)
    );
    const presentCount = monthlyAttendance.filter(a => a.status === 'present').length;
    const absentCount = monthlyAttendance.filter(a => a.status === 'absent').length;
    const lateCount = monthlyAttendance.filter(a => a.status === 'late').length;
    const halfDayCount = monthlyAttendance.filter(a => a.status === 'half_day').length;

    // Calculate suggested absence deduction (Senegal default: based on 26 working days)
    const suggestedAbsenceDeduction = absentCount > 0 
      ? Math.round((absentCount / 26) * employee.salary) 
      : 0;

    // Prefilled or computed local deductions (IPRES, IMR, VRS tax)
    const baseSalary = existing?.baseSalary ?? employee.salary;
    const transportAllowance = existing?.transportAllowance ?? 20000; // default standard allowance
    const performanceBonus = existing?.performanceBonus ?? 0;
    const otherAllowances = existing?.otherAllowances ?? 0;

    const grossSalary = baseSalary + transportAllowance + performanceBonus + otherAllowances;
    
    // IPRES retirement : 5.6% on salary capped at 360,000 FCFA
    const suggestedIpres = Math.round(Math.min(baseSalary, 360000) * 0.056);
    // Medical mutual IMR: default 3% of base
    const suggestedImr = Math.round(baseSalary * 0.03);
    // Estimated Income Tax
    const suggestedTax = calculateEstimatedTax(grossSalary);

    setCurrentPayslip({
      id: existing?.id || '',
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      employeePosition: employee.position,
      employeeDepartment: employee.department,
      period: payrollPeriod,
      baseSalary,
      transportAllowance,
      performanceBonus,
      otherAllowances,
      ipresDeduction: existing?.ipresDeduction ?? suggestedIpres,
      cssDeduction: existing?.cssDeduction ?? 0,
      taxDeduction: existing?.taxDeduction ?? suggestedTax,
      otherDeductions: existing?.otherDeductions ?? suggestedAbsenceDeduction,
      status: existing?.status || 'draft',
      stats: { presentCount, absentCount, lateCount, halfDayCount, suggestedAbsenceDeduction }
    });

    setIsEditingPayslip(true);
  };

  const handleSavePayslip = async (status: 'draft' | 'paid') => {
    setSavingPayslip(true);
    try {
      const gross = currentPayslip.baseSalary + currentPayslip.transportAllowance + currentPayslip.performanceBonus + currentPayslip.otherAllowances;
      const deductions = currentPayslip.ipresDeduction + currentPayslip.cssDeduction + currentPayslip.taxDeduction + currentPayslip.otherDeductions;
      const netPay = gross - deductions;

      const payslipId = currentPayslip.id || crypto.randomUUID();

      await db.payslips.put({
        id: payslipId,
        merchantId: merchant.id,
        employeeId: currentPayslip.employeeId,
        period: currentPayslip.period,
        baseSalary: currentPayslip.baseSalary,
        transportAllowance: currentPayslip.transportAllowance,
        performanceBonus: currentPayslip.performanceBonus,
        otherAllowances: currentPayslip.otherAllowances,
        ipresDeduction: currentPayslip.ipresDeduction,
        cssDeduction: currentPayslip.cssDeduction,
        taxDeduction: currentPayslip.taxDeduction,
        otherDeductions: currentPayslip.otherDeductions,
        netPay,
        status: status,
        updatedAt: new Date()
      });

      // If status is saved as 'paid', we trigger the automatic expense log!
      if (status === 'paid') {
        const emp = employees.find(e => e.id === currentPayslip.employeeId);
        const empName = emp ? `${emp.firstName} ${emp.lastName}` : 'Collaborateur';
        
        await dbService.merchantExpenses.save({
          merchantId: merchant.id,
          title: `Salaire de ${empName} - ${formatPeriodText(currentPayslip.period)}`,
          amount: netPay,
          category: 'Salaires',
          description: `Règlement de salaire. Réf Bulletin: PAY-${payslipId.slice(0,8).toUpperCase()}`,
          date: new Date().toISOString().split('T')[0],
        });
      }

      toast.success(status === 'paid' ? 'Bulletin généré & marqué Payé' : 'Bulletin enregistré en brouillon');
      setIsEditingPayslip(false);
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde du bulletin');
    } finally {
      setSavingPayslip(false);
    }
  };

  // Settle Payroll Payment & Integrate with Expense Books
  const handleOpenPaymentSettlement = (payslip: any, emp: any) => {
    setSettlementPayslip({
      ...payslip,
      employeeName: `${emp.firstName} ${emp.lastName}`
    });
    setPaymentMethod('cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setIsPayingPayslip(true);
  };

  const handleConfirmPaymentSettlement = async () => {
    setSavingPayment(true);
    try {
      // 1. Update Payslip status to 'paid' in Dexie and sync
      await db.payslips.put({
        ...settlementPayslip,
        status: 'paid',
        paymentMethod,
        paymentDate,
        updatedAt: new Date()
      });

      // 2. Automatically sync a ledger expense item
      await dbService.merchantExpenses.save({
        merchantId: merchant.id,
        title: `Salaire de ${settlementPayslip.employeeName} - ${formatPeriodText(settlementPayslip.period)}`,
        amount: settlementPayslip.netPay,
        category: 'Salaires',
        description: `Règlement de salaire par ${formatPaymentMethod(paymentMethod)}. Réf: PAY-${settlementPayslip.id.slice(0,8).toUpperCase()}`,
        date: paymentDate,
      });

      toast.success('Paiement enregistré ! Dépense ajoutée à la comptabilité.');
      setIsPayingPayslip(false);
    } catch (err) {
      toast.error('Erreur lors de l\'enregistrement du paiement');
    } finally {
      setSavingPayment(false);
    }
  };

  const triggerPrintPayslip = (payslip: any, emp: any) => {
    setViewingPayslipPrint({
      ...payslip,
      emp
    });
    // Triggers window.print() after rendering modal or directly
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // --- STATS COMPUTATIONS FOR OVERVIEW ---
  const activeEmployeesCount = employees.filter(e => e.status === 'active').length;
  const onLeaveEmployeesCount = employees.filter(e => e.status === 'on_leave').length;
  const totalSalariesSum = employees.reduce((acc, curr) => acc + (curr.salary || 0), 0);
  const presentTodayCount = attendanceRecords.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status === 'present').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Ressources Humaines</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">
            Gouvernance RH • Pointage & Paie Locale
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {activeTab === 'employees' && (
            <button 
              onClick={() => {
                setCurrentEmployee({ firstName: '', lastName: '', position: '', department: '', salary: 0, hireDate: new Date().toISOString().split('T')[0], status: 'active', email: '', phone: '' });
                setIsEditingEmployee(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Collaborateur</span>
            </button>
          )}
          {activeTab === 'leaves' && (
            <button 
              onClick={() => {
                setCurrentLeave({ employeeId: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], type: 'paid', status: 'pending', reason: '' });
                setIsEditingLeave(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4" />
              <span>Planifier un Congé</span>
            </button>
          )}
        </div>
      </div>

      {/* TABS NAVBAR */}
      <div className="bg-gray-100 p-1 rounded-2xl flex flex-wrap gap-1 border border-black/5 print:hidden">
        {[
          { id: 'employees', label: 'Collaborateurs', icon: Briefcase },
          { id: 'attendance', label: 'Pointage', icon: Clock },
          { id: 'leaves', label: 'Congés & Absences', icon: CalendarRange },
          { id: 'payroll', label: 'Bulletins & Calcul', icon: FileText },
          { id: 'journal', label: 'Livre des Règlements', icon: CreditCard }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as HRTab)}
              className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-gray-500 hover:bg-white/50 hover:text-ink'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- TAB CONTENT 1: EMPLOYEES ROSTER --- */}
      {activeTab === 'employees' && (
        <div className="space-y-6 print:hidden">
          {/* BENTO STATISTICS OVERVIEW */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-black/5 flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-wider">Effectif global</p>
                <p className="text-xl font-bold text-ink mt-0.5">{employees.length} collaborateurs</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-black/5 flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-wider">Actifs en Poste</p>
                <p className="text-xl font-bold text-ink mt-0.5">{activeEmployeesCount} actifs</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-black/5 flex items-center space-x-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-wider">En Congé</p>
                <p className="text-xl font-bold text-ink mt-0.5">{onLeaveEmployeesCount} absents</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-black/5 flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-wider">Masse Salariale Brut</p>
                <p className="text-xl font-bold text-ink mt-0.5">{totalSalariesSum.toLocaleString()} <span className="text-xs">{merchant.currency}</span></p>
              </div>
            </div>
          </div>

          {/* EMPLOYEES TABLE */}
          <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-ink">Registre du personnel</h3>
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Affiche {Math.min(employees.length, employeeLimit)} sur {employees.length}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                    <th className="px-8 py-5">Collaborateur</th>
                    <th className="px-8 py-5">Poste / Dept</th>
                    <th className="px-8 py-5">Contact</th>
                    <th className="px-8 py-5">Embauche</th>
                    <th className="px-8 py-5 text-right">Salaire de Base</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.slice(0, employeeLimit).map((emp: any) => (
                    <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center space-x-5">
                          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-xs border border-primary/10 group-hover:scale-105 transition-all">
                            {emp.firstName[0]}{emp.lastName[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-ink text-sm leading-tight">{emp.firstName} {emp.lastName}</span>
                            <span className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1.5 px-2 py-0.5 rounded-full w-max ${
                              emp.status === 'active' 
                                ? 'bg-emerald-500/10 text-emerald-600' 
                                : emp.status === 'on_leave' 
                                ? 'bg-amber-500/10 text-amber-600' 
                                : 'bg-red-500/10 text-red-600'
                            }`}>
                              {emp.status === 'active' ? 'EN POSTE' : emp.status === 'on_leave' ? 'EN CONGÉ' : 'SORTI'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-ink leading-tight">{emp.position}</span>
                          <span className="text-[9px] text-gray-400 font-mono font-black uppercase tracking-[0.2em] mt-1">{emp.department}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col space-y-1">
                          <span className="flex items-center text-[10px] font-bold text-gray-500"><Mail className="w-3 h-3 mr-2 opacity-50" /> {emp.email || '---'}</span>
                          <span className="flex items-center text-[10px] font-bold text-gray-500"><Phone className="w-3 h-3 mr-2 opacity-50" /> {emp.phone || '---'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-[10px] font-mono font-bold text-gray-400">{emp.hireDate}</p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <p className="font-mono font-bold text-ink text-xs">
                          {emp.salary.toLocaleString()} <span className="text-[10px] opacity-60">{merchant.currency}</span>
                        </p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button onClick={() => { setCurrentEmployee(emp); setIsEditingEmployee(true); }} className="p-2 hover:bg-primary/10 text-primary rounded-xl border border-transparent hover:border-primary/20 transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-10 text-center text-sm text-gray-400 font-medium">
                        Aucun collaborateur enregistré pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {employees.length > employeeLimit && (
                <div className="p-4 flex justify-center border-t border-gray-100">
                  <button 
                    onClick={() => setEmployeeLimit(prev => prev + 10)}
                    className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                  >
                    Voir plus
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 2: ATTENDANCE TRACKING (POINTAGE) --- */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 print:hidden">
          {/* CONTROL BAR */}
          <div className="bg-white p-6 rounded-[2rem] border border-black/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4 w-full md:w-auto">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">Date de Pointage</label>
                <input 
                  type="date" 
                  value={attendanceDate} 
                  onChange={e => setAttendanceDate(e.target.value)} 
                  className="mt-1 outline-none font-bold text-sm bg-gray-50 px-3 py-1 rounded-lg border border-gray-100 focus:border-primary text-ink"
                />
              </div>
            </div>

            <div className="flex w-full md:w-auto justify-end gap-2">
              <button 
                onClick={handleMarkAllPresent}
                className="w-full md:w-auto flex items-center justify-center space-x-2 px-5 py-3 bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/10 hover:bg-emerald-600 transition-all"
              >
                <UserCheck className="w-4 h-4" />
                <span>Marquer tous Présents</span>
              </button>
            </div>
          </div>

          {/* ATTENDANCE TABLE */}
          <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-ink">Présence Quotidienne</h3>
              <p className="text-[10px] text-gray-400 font-mono uppercase mt-1">Registre de présence du {attendanceDate}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                    <th className="px-8 py-5">Collaborateur</th>
                    <th className="px-8 py-5">Poste / Fonction</th>
                    <th className="px-8 py-5">Statut de présence</th>
                    <th className="px-8 py-5">Note / Justificatif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.filter(e => e.status !== 'terminated').map((emp: any) => {
                    const record = attendanceRecords.find(a => a.employeeId === emp.id && a.date === attendanceDate);
                    const currentStatus = record?.status;

                    return (
                      <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-xs">
                              {emp.firstName[0]}{emp.lastName[0]}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-ink text-sm">{emp.firstName} {emp.lastName}</span>
                              <span className="text-[9px] text-gray-400 font-mono mt-0.5">{emp.department}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs text-ink font-bold">{emp.position}</p>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-max border border-gray-200">
                            {[
                              { id: 'present', label: 'Présent', color: 'bg-emerald-500 text-white' },
                              { id: 'absent', label: 'Absent', color: 'bg-red-500 text-white' },
                              { id: 'late', label: 'Retard', color: 'bg-amber-500 text-white' },
                              { id: 'half_day', label: '1/2 Jour', color: 'bg-indigo-500 text-white' }
                            ].map(btn => (
                              <button
                                key={btn.id}
                                onClick={() => handleSaveAttendance(emp.id, btn.id as any)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
                                  currentStatus === btn.id 
                                    ? btn.color + ' shadow-sm scale-105' 
                                    : 'text-gray-500 hover:bg-white/70'
                                }`}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <input 
                            type="text"
                            placeholder="Ex: Justifié maladie, Retard 15 min..."
                            value={attendanceNotes[emp.id] ?? record?.notes ?? ''}
                            onChange={e => {
                              const val = e.target.value;
                              setAttendanceNotes(prev => ({ ...prev, [emp.id]: val }));
                            }}
                            onBlur={async () => {
                              if (currentStatus) {
                                try {
                                  await db.employee_attendance.put({
                                    id: record?.id || crypto.randomUUID(),
                                    merchantId: merchant.id,
                                    employeeId: emp.id,
                                    date: attendanceDate,
                                    status: currentStatus,
                                    notes: attendanceNotes[emp.id] || '',
                                    updatedAt: new Date()
                                  });
                                } catch (e) {
                                  console.error('Notes autosave failed:', e);
                                }
                              }
                            }}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-100 outline-none focus:border-primary/40 bg-gray-50/50"
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-10 text-center text-sm text-gray-400 font-medium">
                        Aucun collaborateur actif disponible pour le pointage.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 3: LEAVE REGISTRY (CONGÉS) --- */}
      {activeTab === 'leaves' && (
        <div className="space-y-6 print:hidden">
          {/* LEAVE RECORDS LIST */}
          <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-ink">Fiches de Congés & Planifications</h3>
              <p className="text-[10px] text-gray-400 font-mono uppercase mt-1">Registre de planification des absences et congés</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                    <th className="px-8 py-5">Collaborateur</th>
                    <th className="px-8 py-5">Type de congé</th>
                    <th className="px-8 py-5">Période (Du au)</th>
                    <th className="px-8 py-5">Raison / Notes</th>
                    <th className="px-8 py-5">Statut</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaves.map((leave: any) => {
                    const emp = employees.find(e => e.id === leave.employeeId);
                    if (!emp) return null;

                    return (
                      <tr key={leave.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center space-x-4">
                            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-xs">
                              {emp.firstName[0]}{emp.lastName[0]}
                            </div>
                            <div>
                              <p className="font-bold text-ink text-xs">{emp.firstName} {emp.lastName}</p>
                              <p className="text-[9px] text-gray-400 font-mono mt-0.5">{emp.position}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            leave.type === 'paid' 
                              ? 'bg-emerald-500/10 text-emerald-600' 
                              : leave.type === 'sick' 
                              ? 'bg-red-500/10 text-red-600' 
                              : leave.type === 'unpaid' 
                              ? 'bg-gray-500/10 text-gray-600' 
                              : 'bg-indigo-500/10 text-indigo-600'
                          }`}>
                            {leave.type === 'paid' ? 'Payé' : leave.type === 'sick' ? 'Maladie' : leave.type === 'unpaid' ? 'Sans solde' : leave.type === 'maternity' ? 'Maternité' : 'Autre'}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col font-mono text-[10px] text-gray-600 font-bold">
                            <span>Du {leave.startDate}</span>
                            <span>Au {leave.endDate}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs text-gray-600 max-w-xs truncate">{leave.reason || '---'}</p>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            leave.status === 'approved' 
                              ? 'bg-emerald-500/10 text-emerald-600' 
                              : leave.status === 'rejected' 
                              ? 'bg-red-500/10 text-red-600' 
                              : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {leave.status === 'approved' ? 'Approuvé' : leave.status === 'rejected' ? 'Refusé' : 'En attente'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {leave.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => handleUpdateLeaveStatus(leave.id, 'approved')}
                                  title="Approuver"
                                  className="p-1.5 hover:bg-emerald-50 text-emerald-500 rounded-lg border border-transparent hover:border-emerald-200 transition-colors"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleUpdateLeaveStatus(leave.id, 'rejected')}
                                  title="Refuser"
                                  className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg border border-transparent hover:border-red-200 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => handleDeleteLeave(leave.id)}
                              title="Supprimer"
                              className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg border border-transparent transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {leaves.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-10 text-center text-sm text-gray-400 font-medium">
                        Aucun congé programmé pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 4: PAYROLL CALCULATOR (BULLETINS) --- */}
      {activeTab === 'payroll' && (
        <div className="space-y-6 print:hidden">
          {/* PERIOD SELECTOR */}
          <div className="bg-white p-6 rounded-[2rem] border border-black/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">Période de Paie</label>
                <input 
                  type="month" 
                  value={payrollPeriod} 
                  onChange={e => setPayrollPeriod(e.target.value)} 
                  className="mt-1 outline-none font-bold text-sm bg-gray-50 px-3 py-1 rounded-lg border border-gray-100 focus:border-primary text-ink"
                />
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest block">Masse salariale calculée</span>
              <span className="text-lg font-bold text-ink">
                {payslips.filter(p => p.period === payrollPeriod).reduce((acc, curr) => acc + (curr.netPay || 0), 0).toLocaleString()} <span className="text-xs">{merchant.currency}</span>
              </span>
            </div>
          </div>

          {/* CALCULATOR TABLE */}
          <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-ink">Calculateur des Bulletins de Paie</h3>
              <p className="text-[10px] text-gray-400 font-mono uppercase mt-1">Calculez les fiches de paie pour {formatPeriodText(payrollPeriod)}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                    <th className="px-8 py-5">Collaborateur</th>
                    <th className="px-8 py-5">Salaire de Base</th>
                    <th className="px-8 py-5">Activités / Retards / Absences</th>
                    <th className="px-8 py-5 text-right">Net Calculé</th>
                    <th className="px-8 py-5">Statut</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.filter(e => e.status !== 'terminated').map((emp: any) => {
                    const payslip = payslips.find(p => p.employeeId === emp.id && p.period === payrollPeriod);
                    
                    // Count attendance for stats
                    const monthlyAtt = attendanceRecords.filter(a => 
                      a.employeeId === emp.id && a.date.startsWith(payrollPeriod)
                    );
                    const presents = monthlyAtt.filter(a => a.status === 'present').length;
                    const absents = monthlyAtt.filter(a => a.status === 'absent').length;
                    const lates = monthlyAtt.filter(a => a.status === 'late').length;

                    return (
                      <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-xs">
                              {emp.firstName[0]}{emp.lastName[0]}
                            </div>
                            <div>
                              <p className="font-bold text-ink text-xs">{emp.firstName} {emp.lastName}</p>
                              <p className="text-[9px] text-gray-400 font-mono mt-0.5">{emp.position}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs text-gray-600 font-mono font-bold">{emp.salary.toLocaleString()} <span className="text-[9px]">{merchant.currency}</span></p>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[9px] font-bold">{presents} Présents</span>
                            {lates > 0 && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded text-[9px] font-bold">{lates} Retards</span>}
                            {absents > 0 && <span className="px-2 py-0.5 bg-red-500/10 text-red-600 rounded text-[9px] font-bold">{absents} Absences</span>}
                            {monthlyAtt.length === 0 && <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-[9px]">Pas de pointage</span>}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          {payslip ? (
                            <p className="font-mono text-ink text-xs font-bold">{(payslip.netPay || 0).toLocaleString()} <span className="text-[10px]">{merchant.currency}</span></p>
                          ) : (
                            <p className="text-xs text-gray-400 font-bold italic">Non calculé</p>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          {payslip ? (
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              payslip.status === 'paid' 
                                ? 'bg-emerald-500/10 text-emerald-600' 
                                : 'bg-amber-500/10 text-amber-600'
                            }`}>
                              {payslip.status === 'paid' ? 'PAYÉ' : 'BROUILLON'}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase bg-gray-100 text-gray-400 tracking-wider">
                              ---
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button 
                              onClick={() => handleOpenPayslipCalculator(emp)}
                              className="px-3 py-1.5 bg-gray-50 border border-gray-100 hover:border-gray-200 text-gray-700 text-[10px] font-bold uppercase rounded-xl transition-all"
                            >
                              {payslip ? 'Modifier' : 'Calculer'}
                            </button>
                            {payslip && (
                              <button 
                                onClick={() => triggerPrintPayslip(payslip, emp)}
                                className="p-2 bg-gray-50 hover:bg-primary/10 hover:text-primary rounded-xl border border-transparent hover:border-primary/20 transition-all text-gray-500"
                                title="Imprimer Bulletin PDF"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 5: PAYROLL SETTLEMENTS (LIVRE DES RÈGLEMENTS) --- */}
      {activeTab === 'journal' && (
        <div className="space-y-6 print:hidden">
          {/* STATS AREA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-black/5">
              <p className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-wider">Salaires à régler</p>
              <p className="text-xl font-bold text-ink mt-1">
                {payslips.filter(p => p.period === payrollPeriod && p.status === 'draft').reduce((acc, curr) => acc + (curr.netPay || 0), 0).toLocaleString()} <span className="text-xs">{merchant.currency}</span>
              </p>
              <span className="text-[9px] text-amber-500 font-bold block mt-1.5">• {payslips.filter(p => p.period === payrollPeriod && p.status === 'draft').length} bulletins en attente</span>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-black/5">
              <p className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-wider">Salaires réglés (Ce mois)</p>
              <p className="text-xl font-bold text-emerald-500 mt-1">
                {payslips.filter(p => p.period === payrollPeriod && p.status === 'paid').reduce((acc, curr) => acc + (curr.netPay || 0), 0).toLocaleString()} <span className="text-xs">{merchant.currency}</span>
              </p>
              <span className="text-[9px] text-emerald-500 font-bold block mt-1.5">• {payslips.filter(p => p.period === payrollPeriod && p.status === 'paid').length} collaborateurs réglés</span>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-black/5">
              <p className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-wider">Lien comptabilité globale</p>
              <p className="text-sm font-bold text-ink mt-1.5">Synchronisé en temps réel avec le journal des dépenses.</p>
              <p className="text-[9px] text-gray-400 font-mono uppercase tracking-wider block mt-2">Catégorie de dépense : 'Salaires'</p>
            </div>
          </div>

          {/* SETTLEMENTS LIST */}
          <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-ink">Livre des Règlements Mensuels</h3>
                <p className="text-[10px] text-gray-400 font-mono uppercase mt-1">Émettez les paiements et comptabilisez-les automatiquement</p>
              </div>
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{formatPeriodText(payrollPeriod)}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                    <th className="px-8 py-5">Collaborateur</th>
                    <th className="px-8 py-5 text-right">Salaire Net</th>
                    <th className="px-8 py-5">Mode de Règlement</th>
                    <th className="px-8 py-5">Date de paiement</th>
                    <th className="px-8 py-5">Compta Dépense</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payslips.filter(p => p.period === payrollPeriod).map((slip: any) => {
                    const emp = employees.find(e => e.id === slip.employeeId);
                    if (!emp) return null;

                    return (
                      <tr key={slip.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center space-x-4">
                            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-xs">
                              {emp.firstName[0]}{emp.lastName[0]}
                            </div>
                            <div>
                              <p className="font-bold text-ink text-xs">{emp.firstName} {emp.lastName}</p>
                              <p className="text-[9px] text-gray-400 font-mono mt-0.5">{emp.position}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className="font-mono text-ink text-xs font-bold">{slip.netPay.toLocaleString()} <span className="text-[9px]">{merchant.currency}</span></p>
                        </td>
                        <td className="px-8 py-5">
                          {slip.status === 'paid' ? (
                            <span className="text-xs text-ink font-bold flex items-center">
                              <Landmark className="w-3.5 h-3.5 mr-1.5 opacity-60 text-primary" />
                              {formatPaymentMethod(slip.paymentMethod || 'cash')}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Non payé</span>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          {slip.status === 'paid' ? (
                            <p className="text-xs text-gray-600 font-mono font-bold">{slip.paymentDate || slip.updatedAt?.toISOString().split('T')[0] || '---'}</p>
                          ) : (
                            <p className="text-xs text-gray-400 italic">---</p>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          {slip.status === 'paid' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded text-[9px] font-black uppercase tracking-wider">
                              <CheckCircle className="w-3 h-3 mr-1" /> Intégré
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gray-100 text-gray-400 rounded text-[9px] font-black uppercase tracking-wider">
                              Non lié
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right">
                          {slip.status === 'draft' ? (
                            <button 
                              onClick={() => handleOpenPaymentSettlement(slip, emp)}
                              className="px-4 py-2 bg-primary text-white text-[10px] font-bold uppercase rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover hover:scale-105 transition-all"
                            >
                              Saisir Règlement
                            </button>
                          ) : (
                            <div className="flex items-center justify-end space-x-1">
                              <span className="text-emerald-500 text-xs font-bold mr-2">Réglé</span>
                              <button 
                                onClick={() => triggerPrintPayslip(slip, emp)}
                                className="p-2 hover:bg-primary/10 text-primary rounded-xl"
                                title="Re-imprimer le bulletin"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {payslips.filter(p => p.period === payrollPeriod).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-10 text-center text-sm text-gray-400 font-medium">
                        Aucun bulletin calculé pour ce mois. Rendez-vous dans l'onglet 'Bulletins & Calcul'.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DIALOGS --- */}

      {/* 1. EMPLOYEE FORM MODAL */}
      <AnimatePresence>
        {isEditingEmployee && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-ink">Fiche Collaborateur</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Gestion des ressources humaines</p>
                </div>
                <button onClick={() => setIsEditingEmployee(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSaveEmployee} className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Prénom</label>
                    <input type="text" required value={currentEmployee.firstName} onChange={e => setCurrentEmployee({...currentEmployee, firstName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom</label>
                    <input type="text" required value={currentEmployee.lastName} onChange={e => setCurrentEmployee({...currentEmployee, lastName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Email Professionnel</label>
                    <input type="email" value={currentEmployee.email} onChange={e => setCurrentEmployee({...currentEmployee, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30" placeholder="email@entreprise.com" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Téléphone</label>
                    <input type="text" value={currentEmployee.phone} onChange={e => setCurrentEmployee({...currentEmployee, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30" placeholder="+221 ..." />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Poste / Fonction</label>
                    <input type="text" required value={currentEmployee.position} onChange={e => setCurrentEmployee({...currentEmployee, position: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Département</label>
                    <select value={currentEmployee.department} onChange={e => setCurrentEmployee({...currentEmployee, department: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                      <option value="">Sélectionner...</option>
                      <option value="Direction">Direction</option>
                      <option value="Ventes">Ventes</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Technique">Technique</option>
                      <option value="RH">RH</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Salaire de Base</label>
                    <div className="relative">
                      <input type="number" required value={currentEmployee.salary} onChange={e => setCurrentEmployee({...currentEmployee, salary: Number(e.target.value)})} className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">{merchant.currency}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Date d'embauche</label>
                    <input type="date" required value={currentEmployee.hireDate} onChange={e => setCurrentEmployee({...currentEmployee, hireDate: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Statut</label>
                  <div className="flex gap-4">
                    {['active', 'on_leave', 'terminated'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setCurrentEmployee({...currentEmployee, status})}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                          currentEmployee.status === status 
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                            : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {status === 'active' ? 'Actif' : status === 'on_leave' ? 'Congé' : 'Sorti'}
                      </button>
                    ))}
                  </div>
                </div>
              </form>

              <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
                <button type="button" onClick={() => setIsEditingEmployee(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
                <button onClick={handleSaveEmployee} disabled={savingEmployee} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                  {savingEmployee ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le collaborateur'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. LEAVE SCHEDULE MODAL */}
      <AnimatePresence>
        {isEditingLeave && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-ink">Planifier un Congé</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Formulaire de demande d'absence</p>
                </div>
                <button onClick={() => setIsEditingLeave(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSaveLeave} className="flex-1 overflow-y-auto p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Collaborateur</label>
                  <select 
                    required 
                    value={currentLeave.employeeId} 
                    onChange={e => setCurrentLeave({...currentLeave, employeeId: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold"
                  >
                    <option value="">Sélectionner un collaborateur...</option>
                    {employees.filter(e => e.status !== 'terminated').map(e => (
                      <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.position})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Date de début</label>
                    <input type="date" required value={currentLeave.startDate} onChange={e => setCurrentLeave({...currentLeave, startDate: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Date de fin</label>
                    <input type="date" required value={currentLeave.endDate} onChange={e => setCurrentLeave({...currentLeave, endDate: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Type de congé</label>
                    <select value={currentLeave.type} onChange={e => setCurrentLeave({...currentLeave, type: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                      <option value="paid">Payé</option>
                      <option value="sick">Maladie</option>
                      <option value="unpaid">Sans Solde (Absence)</option>
                      <option value="maternity">Maternité</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Statut initial</label>
                    <select value={currentLeave.status} onChange={e => setCurrentLeave({...currentLeave, status: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                      <option value="pending">En attente</option>
                      <option value="approved">Approuvé d'office</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Motif / Commentaire</label>
                  <textarea rows={3} value={currentLeave.reason} onChange={e => setCurrentLeave({...currentLeave, reason: e.target.value})} placeholder="Détails complémentaires sur l'absence..." className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30" />
                </div>
              </form>

              <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
                <button type="button" onClick={() => setIsEditingLeave(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
                <button onClick={handleSaveLeave} disabled={savingLeave} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                  {savingLeave ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le congé'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. INTERACTIVE PAYSLIP CALCULATOR MODAL */}
      <AnimatePresence>
        {isEditingPayslip && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-ink">Calculateur de Bulletin • {currentPayslip.employeeName}</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Période : {formatPeriodText(currentPayslip.period)}</p>
                </div>
                <button onClick={() => setIsEditingPayslip(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {/* ATTENDANCE SUMMARY WARNING */}
                <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl flex items-start space-x-4">
                  <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <p className="text-xs text-ink font-bold leading-tight">Activités constatées ce mois :</p>
                    <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded font-black">{currentPayslip.stats.presentCount} Présences</span>
                      <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded font-black">{currentPayslip.stats.lateCount} Retards</span>
                      <span className="px-2 py-1 bg-red-50 text-red-600 rounded font-black">{currentPayslip.stats.absentCount} Absences</span>
                    </div>
                    {currentPayslip.stats.absentCount > 0 && (
                      <div className="pt-2 flex justify-between items-center border-t border-dashed border-gray-200">
                        <p className="text-[10px] text-red-500 font-bold">
                          Déduction suggérée pour {currentPayslip.stats.absentCount} jours d'absence : -{currentPayslip.stats.suggestedAbsenceDeduction.toLocaleString()} FCFA
                        </p>
                        <button 
                          type="button"
                          onClick={() => setCurrentPayslip({ ...currentPayslip, otherDeductions: currentPayslip.stats.suggestedAbsenceDeduction })}
                          className="px-2.5 py-1 bg-red-100 text-red-600 font-bold rounded hover:bg-red-200 text-[9px] uppercase tracking-wide transition-colors"
                        >
                          Appliquer la déduction
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* GAINS (EARNINGS) */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black font-mono text-gray-400 uppercase tracking-widest border-b border-dashed border-gray-100 pb-2">Gains & Primes</h4>
                    
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase mb-1">Salaire de Base (FCFA)</label>
                      <input 
                        type="number" 
                        value={currentPayslip.baseSalary} 
                        onChange={e => setCurrentPayslip({...currentPayslip, baseSalary: Number(e.target.value)})}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/10 bg-gray-50/50 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase mb-1">Indemnité de Transport (FCFA)</label>
                      <input 
                        type="number" 
                        value={currentPayslip.transportAllowance} 
                        onChange={e => setCurrentPayslip({...currentPayslip, transportAllowance: Number(e.target.value)})}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/10 bg-gray-50/50 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase mb-1">Prime de Rendement (FCFA)</label>
                      <input 
                        type="number" 
                        value={currentPayslip.performanceBonus} 
                        onChange={e => setCurrentPayslip({...currentPayslip, performanceBonus: Number(e.target.value)})}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/10 bg-gray-50/50 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase mb-1">Autres Indemnités / Logement (FCFA)</label>
                      <input 
                        type="number" 
                        value={currentPayslip.otherAllowances} 
                        onChange={e => setCurrentPayslip({...currentPayslip, otherAllowances: Number(e.target.value)})}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/10 bg-gray-50/50 font-bold"
                      />
                    </div>
                  </div>

                  {/* DEDUCTIONS (RETENUES) */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black font-mono text-gray-400 uppercase tracking-widest border-b border-dashed border-gray-100 pb-2">Retenues & Cotisations Locales (Sénégal)</h4>
                    
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase mb-1">Retraite IPRES (5.6% - Salarié)</label>
                      <input 
                        type="number" 
                        value={currentPayslip.ipresDeduction} 
                        onChange={e => setCurrentPayslip({...currentPayslip, ipresDeduction: Number(e.target.value)})}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/10 bg-gray-50/50 font-bold font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase mb-1">Sécurité Sociale (CSS - FCFA)</label>
                      <input 
                        type="number" 
                        value={currentPayslip.cssDeduction} 
                        onChange={e => setCurrentPayslip({...currentPayslip, cssDeduction: Number(e.target.value)})}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/10 bg-gray-50/50 font-bold font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase mb-1">Impôt Revenu / VRS Estimé</label>
                      <input 
                        type="number" 
                        value={currentPayslip.taxDeduction} 
                        onChange={e => setCurrentPayslip({...currentPayslip, taxDeduction: Number(e.target.value)})}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/10 bg-gray-50/50 font-bold font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase mb-1">Autres Déductions / Avances / Absences</label>
                      <input 
                        type="number" 
                        value={currentPayslip.otherDeductions} 
                        onChange={e => setCurrentPayslip({...currentPayslip, otherDeductions: Number(e.target.value)})}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/10 bg-gray-50/50 font-bold font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* COMPUTATION BOX */}
                <div className="bg-gray-100 p-6 rounded-2xl grid grid-cols-3 gap-4 border border-gray-200">
                  <div className="text-center">
                    <span className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-wider block">Salaire Brut Total</span>
                    <span className="text-sm font-bold text-ink">
                      {(currentPayslip.baseSalary + currentPayslip.transportAllowance + currentPayslip.performanceBonus + currentPayslip.otherAllowances).toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="text-center border-x border-gray-200">
                    <span className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-wider block">Total Retenues</span>
                    <span className="text-sm font-bold text-red-500">
                      {(currentPayslip.ipresDeduction + currentPayslip.cssDeduction + currentPayslip.taxDeduction + currentPayslip.otherDeductions).toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-wider block">Net à payer</span>
                    <span className="text-base font-black text-emerald-600">
                      {((currentPayslip.baseSalary + currentPayslip.transportAllowance + currentPayslip.performanceBonus + currentPayslip.otherAllowances) - (currentPayslip.ipresDeduction + currentPayslip.cssDeduction + currentPayslip.taxDeduction + currentPayslip.otherDeductions)).toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex flex-wrap gap-4">
                <button type="button" onClick={() => setIsEditingPayslip(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
                {currentPayslip.status !== 'paid' && (
                  <button 
                    onClick={() => handleSavePayslip('draft')} 
                    disabled={savingPayslip} 
                    className="flex-1 py-4 border border-primary text-primary hover:bg-primary/5 rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    Enregistrer Brouillon
                  </button>
                )}
                <button 
                  onClick={() => handleSavePayslip(currentPayslip.status === 'paid' ? 'paid' : 'paid')} 
                  disabled={savingPayslip} 
                  className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center"
                >
                  {savingPayslip ? <Loader2 className="w-5 h-5 animate-spin" /> : currentPayslip.status === 'paid' ? 'Sauvegarder les modifications' : 'Générer & Confirmer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. SETTLEMENT PAYMENT DIALOG (SAISIR RÈGLEMENT) */}
      <AnimatePresence>
        {isPayingPayslip && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-ink">Règlement de salaire</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Saisie de décaissement de paie</p>
                </div>
                <button onClick={() => setIsPayingPayslip(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="text-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-wider block">Salaire Net à verser</span>
                  <span className="text-2xl font-black text-emerald-600">
                    {settlementPayslip.netPay.toLocaleString()} <span className="text-base font-bold">{merchant.currency}</span>
                  </span>
                  <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-wider">{settlementPayslip.employeeName}</p>
                  <p className="text-[9px] text-gray-400 font-mono mt-1">Bulletin de {formatPeriodText(settlementPayslip.period)}</p>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Mode de Règlement</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'cash', label: 'Espèces' },
                      { id: 'wave', label: 'Wave' },
                      { id: 'orange_money', label: 'Orange Money' },
                      { id: 'transfer', label: 'Virement' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`py-3 rounded-xl text-xs font-bold uppercase transition-all border ${
                          paymentMethod === m.id 
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/15' 
                            : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Date du règlement</label>
                  <input type="date" required value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono" />
                </div>
              </div>

              <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
                <button type="button" onClick={() => setIsPayingPayslip(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
                <button onClick={handleConfirmPaymentSettlement} disabled={savingPayment} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                  {savingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmer le versement'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PRINT AREA FOR BULLETIN DE PAIE (WEST AFRICAN FORMAT) --- */}
      {viewingPayslipPrint && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:static print:inset-auto print:bg-white print:p-0 print:backdrop-blur-none print:shadow-none">
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-2xl w-full print:p-0 print:shadow-none print:rounded-none">
            
            {/* PRINT BUTTON CONTROLS IN WINDOW (HIDDEN ON PRINT) */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 print:hidden">
              <span className="text-sm font-bold text-ink">Aperçu du Bulletin de paie</span>
              <div className="flex space-x-2">
                <button onClick={() => window.print()} className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors">
                  <Printer className="w-4 h-4" />
                  <span>Lancer l'impression</span>
                </button>
                <button onClick={() => setViewingPayslipPrint(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* THE PAYSLIP CARD (WILL MATCH PAGE ASPECT RATIO ON PRINT) */}
            <div className="border border-gray-200 p-8 rounded-2xl bg-white text-black font-sans shadow-inner flex flex-col justify-between print:border-none print:p-0" id="payslip-print-area">
              
              {/* HEADER INFORMATION */}
              <div className="flex justify-between items-start pb-6 border-b border-gray-200">
                <div className="space-y-1.5">
                  <h1 className="text-lg font-black tracking-tight text-gray-900 uppercase">{merchant.name}</h1>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">{merchant.type || 'SOCIÉTÉ COMMERCIALE'}</p>
                  <p className="text-[10px] text-gray-500">{merchant.address || 'Dakar, Sénégal'}</p>
                  <p className="text-[10px] text-gray-500">Tél: {merchant.phone || '---'}</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="px-3 py-1 bg-gray-100 text-[9px] font-black uppercase tracking-wider rounded">BULLETIN DE PAIE</span>
                  <p className="text-[10px] text-gray-500 font-mono mt-1">Réf: PAY-{viewingPayslipPrint.id.slice(0,8).toUpperCase()}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Période : {formatPeriodText(viewingPayslipPrint.period)}</p>
                </div>
              </div>

              {/* COOPERATIVE INFO GRID */}
              <div className="grid grid-cols-2 gap-6 py-6 border-b border-gray-200 text-xs">
                <div className="space-y-1.5">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Employé</p>
                  <p className="font-black text-gray-900 text-sm">{viewingPayslipPrint.emp.firstName} {viewingPayslipPrint.emp.lastName}</p>
                  <p className="font-medium text-gray-700">ID Salarié : <span className="font-mono">{viewingPayslipPrint.emp.id.slice(0,8).toUpperCase()}</span></p>
                  <p className="font-medium text-gray-700">Date d'embauche : {viewingPayslipPrint.emp.hireDate}</p>
                </div>
                <div className="space-y-1.5 text-right">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Affectation</p>
                  <p className="font-black text-gray-900 text-sm">{viewingPayslipPrint.emp.position}</p>
                  <p className="font-medium text-gray-700">Département : {viewingPayslipPrint.emp.department}</p>
                  <p className="font-medium text-gray-700">Statut : En Poste</p>
                </div>
              </div>

              {/* DETAIL OF DEDUCTIONS & EARNINGS TABLE */}
              <div className="py-6 min-h-[300px]">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-gray-200 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      <th className="pb-3">Désignation de la Rubrique</th>
                      <th className="pb-3 text-right">Base / Taux</th>
                      <th className="pb-3 text-right">Gains (+)</th>
                      <th className="pb-3 text-right">Retenues (-)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-3 font-medium text-gray-900">Salaire de Base</td>
                      <td className="py-3 text-right text-gray-600">---</td>
                      <td className="py-3 text-right text-gray-900 font-bold">{(viewingPayslipPrint.baseSalary || 0).toLocaleString()}</td>
                      <td className="py-3 text-right text-gray-500">---</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-medium text-gray-900">Indemnité de Transport</td>
                      <td className="py-3 text-right text-gray-600">---</td>
                      <td className="py-3 text-right text-gray-900 font-bold">{(viewingPayslipPrint.transportAllowance || 0).toLocaleString()}</td>
                      <td className="py-3 text-right text-gray-500">---</td>
                    </tr>
                    {viewingPayslipPrint.performanceBonus > 0 && (
                      <tr>
                        <td className="py-3 font-medium text-gray-900">Prime de Rendement</td>
                        <td className="py-3 text-right text-gray-600">---</td>
                        <td className="py-3 text-right text-gray-900 font-bold">{viewingPayslipPrint.performanceBonus.toLocaleString()}</td>
                        <td className="py-3 text-right text-gray-500">---</td>
                      </tr>
                    )}
                    {viewingPayslipPrint.otherAllowances > 0 && (
                      <tr>
                        <td className="py-3 font-medium text-gray-900">Autres Primes & Indemnités</td>
                        <td className="py-3 text-right text-gray-600">---</td>
                        <td className="py-3 text-right text-gray-900 font-bold">{viewingPayslipPrint.otherAllowances.toLocaleString()}</td>
                        <td className="py-3 text-right text-gray-500">---</td>
                      </tr>
                    )}
                    
                    {/* Retenues */}
                    <tr>
                      <td className="py-3 font-medium text-gray-900">Retraite IPRES (Part Salariale)</td>
                      <td className="py-3 text-right text-gray-600">5.6%</td>
                      <td className="py-3 text-right text-gray-500">---</td>
                      <td className="py-3 text-right text-red-600 font-bold">{(viewingPayslipPrint.ipresDeduction || 0).toLocaleString()}</td>
                    </tr>
                    {viewingPayslipPrint.cssDeduction > 0 && (
                      <tr>
                        <td className="py-3 font-medium text-gray-900">Sécurité Sociale (CSS)</td>
                        <td className="py-3 text-right text-gray-600">---</td>
                        <td className="py-3 text-right text-gray-500">---</td>
                        <td className="py-3 text-right text-red-600 font-bold">{viewingPayslipPrint.cssDeduction.toLocaleString()}</td>
                      </tr>
                    )}
                    {viewingPayslipPrint.taxDeduction > 0 && (
                      <tr>
                        <td className="py-3 font-medium text-gray-900">Retenue à la source (Impôt IR / VRS)</td>
                        <td className="py-3 text-right text-gray-600">Barème</td>
                        <td className="py-3 text-right text-gray-500">---</td>
                        <td className="py-3 text-right text-red-600 font-bold">{viewingPayslipPrint.taxDeduction.toLocaleString()}</td>
                      </tr>
                    )}
                    {viewingPayslipPrint.otherDeductions > 0 && (
                      <tr>
                        <td className="py-3 font-medium text-gray-900">Autres Déductions / Absences</td>
                        <td className="py-3 text-right text-gray-600">Prélèvement</td>
                        <td className="py-3 text-right text-gray-500">---</td>
                        <td className="py-3 text-right text-red-600 font-bold">{viewingPayslipPrint.otherDeductions.toLocaleString()}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* TOTAL BOXES */}
              <div className="border-t border-gray-200 pt-4 flex justify-between items-center text-xs font-bold text-gray-900 uppercase">
                <div>
                  <p>Total Gains Brut : {(viewingPayslipPrint.baseSalary + viewingPayslipPrint.transportAllowance + viewingPayslipPrint.performanceBonus + viewingPayslipPrint.otherAllowances).toLocaleString()} FCFA</p>
                  <p className="mt-1 text-red-600">Total Retenues : {(viewingPayslipPrint.ipresDeduction + viewingPayslipPrint.cssDeduction + viewingPayslipPrint.taxDeduction + viewingPayslipPrint.otherDeductions).toLocaleString()} FCFA</p>
                </div>
                <div className="border-2 border-gray-900 px-6 py-4 rounded-xl text-center bg-gray-50">
                  <span className="text-[9px] text-gray-500 block uppercase font-mono tracking-widest font-black">Net à Payer</span>
                  <span className="text-lg font-black text-gray-900">{viewingPayslipPrint.netPay.toLocaleString()} <span className="text-xs">FCFA</span></span>
                </div>
              </div>

              {/* PAYMENT REGISTRATION METHOD */}
              {viewingPayslipPrint.status === 'paid' && (
                <div className="mt-6 bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-bold">
                  <span>Payé le : {viewingPayslipPrint.paymentDate || viewingPayslipPrint.updatedAt?.toISOString().split('T')[0]}</span>
                  <span>Règlement : {formatPaymentMethod(viewingPayslipPrint.paymentMethod || 'cash')}</span>
                </div>
              )}

              {/* SIGNATURES AREA */}
              <div className="grid grid-cols-2 gap-8 pt-10 mt-10 border-t border-dashed border-gray-200 text-[10px] uppercase font-bold text-gray-400">
                <div className="h-32 flex flex-col justify-between">
                  <span>Signature du salarié <br /><span className="text-[8px] font-medium lowercase italic text-gray-400">(Précédée de la mention manuscrite 'Lu et approuvé')</span></span>
                  <div className="border-b border-dashed border-gray-200 w-44"></div>
                </div>
                <div className="h-32 flex flex-col justify-between text-right">
                  <span>Pour l'Employeur <br /><span className="text-[8px] font-medium lowercase italic text-gray-400">(Cachet & Signature autorisée)</span></span>
                  <div className="border-b border-dashed border-gray-200 w-44 ml-auto"></div>
                </div>
              </div>

              <div className="pt-8 text-center text-[9px] text-gray-400 font-mono tracking-widest font-bold">
                Acom Zone • Écosystème de Gouvernance Logistique & Financière
              </div>

            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default HRManager;
