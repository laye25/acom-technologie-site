import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { StudentPortalSimulation } from '../components/StudentPortalSimulation';

const StudentPortal = () => {
  const navigate = useNavigate();
  const activeStudentId = localStorage.getItem('activeStudentId');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const studentData = useLiveQuery(async () => {
    if (!activeStudentId) return null;
    let s = await db.students?.where('id').equals(activeStudentId).first();
    if (!s) s = await db.students?.where('username').equals(activeStudentId).first();
    if (!s) s = await db.students?.where('studentUsername').equals(activeStudentId).first();
    return s;
  }, [activeStudentId]);

  const resolvedMerchantId = useMemo(() => {
    return studentData?.merchantId || studentData?.merchant_id || localStorage.getItem('merchantId') || '';
  }, [studentData]);

  const merchant = useLiveQuery(async () => {
    if (!resolvedMerchantId) return null;
    return await db.merchants?.filter(m => m.id === resolvedMerchantId).first();
  }, [resolvedMerchantId]);

  useEffect(() => {
    if (!activeStudentId) {
      navigate('/login');
    }
  }, [activeStudentId, navigate]);

  useEffect(() => {
    if (resolvedMerchantId && (studentData?.id || activeStudentId)) {
      console.log("[StudentPortal] Triggering targeted sync...");
      setIsSyncing(true);
      import('../services/syncService').then(({ syncService }) => {
        syncService.syncStudentData(resolvedMerchantId, studentData?.id || activeStudentId).finally(() => {
          setIsSyncing(false);
        });
      }).catch(err => {
        console.error("[StudentPortal] Sync failed:", err);
        setIsSyncing(false);
      });
    }
  }, [resolvedMerchantId, studentData?.id, activeStudentId]);

  const handleLogout = () => {
    localStorage.removeItem('activeStudentId');
    localStorage.removeItem('merchantId');
    navigate('/login');
  };

  if (!activeStudentId) return null;
  if (!merchant || !studentData) return (
      <div className="h-screen w-full flex items-center justify-center font-bold text-slate-500">
         Chargement de votre espace élève...
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
        <StudentPortalSimulation 
            student={studentData} 
            merchant={merchant} 
            onClose={handleLogout} 
        />
    </div>
  );
};

export default StudentPortal;
