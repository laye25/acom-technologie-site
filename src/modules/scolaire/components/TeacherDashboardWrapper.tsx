import React, { useState, useEffect } from 'react';
import { GraduationCap, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSchoolLiveTeacherData } from '../hooks/useSchoolSaaS';
import { syncService } from '../../../services/syncService';
import { TeacherDashboardSpace } from './TeacherGradePortal';

export const TeacherDashboardWrapper = ({ teacher, merchant }: { teacher: any; merchant: any }) => {
  const [isSyncing, setIsSyncing] = useState(false);

  // Synchronize class and student data on load for the teacher
  useEffect(() => {
    if (merchant?.id && teacher?.id) {
      console.log("Teacher dashboard sync triggered for merchant ID:", merchant.id);
      setIsSyncing(true);
      syncService.syncTeacherData(merchant.id, teacher.id).finally(() => {
        setIsSyncing(false);
        toast.success("Espace enseignant synchronisé", { icon: "🔄", id: "sync" });
      });
    }
  }, [merchant?.id, teacher?.id]);

  const { classes: dbClasses, students: dbStudents, grades: storedGrades } = useSchoolLiveTeacherData(merchant?.id || '');

  const handleQuitTeacherPortal = () => {
    if (localStorage.getItem('activeTeacherId')) {
      localStorage.removeItem('activeTeacherId');
      localStorage.removeItem('merchantId');
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Portabilité Scolaire - Top Navbar de l'école */}
      <header className="bg-white border-b border-gray-100 shadow-sm fixed top-0 left-0 right-0 z-50 py-3.5 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo de l'établissement scolaire */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-inner overflow-hidden shrink-0">
              {merchant?.logo ? (
                <img src={merchant.logo} alt={merchant.name} className="w-full h-full object-contain p-1 rounded-xl" />
              ) : (
                <GraduationCap className="w-6 h-6 text-indigo-600" />
              )}
            </div>
            <div>
              <span className="text-[9px] font-mono font-black text-indigo-500 tracking-[0.2em] uppercase leading-none block mb-1">
                Portail Scolaire
              </span>
              <h2 className="text-base font-black text-gray-950 leading-tight tracking-tight">
                {merchant?.name || 'Grand Établissement'}
              </h2>
            </div>
          </div>

          {/* Profil Enseignant & Bouton Déconnexion */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-xs font-black text-gray-950 block leading-none">
                {teacher?.firstName} {teacher?.lastName}
              </span>
              <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-1">
                Profs • {teacher?.subject || 'Matière'}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-indigo-600">
              {teacher?.firstName?.[0] || '?'}{teacher?.lastName?.[0] || '?'}
            </div>
            <button 
              id="header-logout-teacher"
              onClick={handleQuitTeacherPortal}
              title="Quitter l'Espace Enseignant"
              className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all border border-red-100 flex items-center justify-center shadow-sm"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Content de l'espace Enseignant */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 pt-28 pb-16">
        <TeacherDashboardSpace
          teacher={teacher}
          merchant={merchant}
          classes={dbClasses}
          students={dbStudents}
          storedGrades={storedGrades}
          onClose={handleQuitTeacherPortal}
        />
      </main>
    </div>
  );
};
