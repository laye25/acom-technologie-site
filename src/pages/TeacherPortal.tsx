import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useNavigate } from 'react-router-dom';
import { TeacherDashboardWrapper } from '../modules/scolaire/components/TeacherDashboardWrapper';

const TeacherPortal = () => {
  const navigate = useNavigate();
  const activeTeacherId = localStorage.getItem('activeTeacherId');
  const merchantId = localStorage.getItem('merchantId');

  useEffect(() => {
    if (!activeTeacherId) {
      navigate('/login');
    }
  }, [activeTeacherId, navigate]);

  const teacher = useLiveQuery(async () => {
    if (!activeTeacherId) return null;
    return await db.teachers?.where('id').equals(activeTeacherId).first();
  }, [activeTeacherId]);

  const merchant = useLiveQuery(async () => {
    const searchId = merchantId || teacher?.merchantId || teacher?.merchant_id;
    if (!searchId) return null;
    return await db.merchants?.filter(m => m.id === searchId).first();
  }, [merchantId, teacher]);

  if (!activeTeacherId) return null;
  if (!teacher || !merchant) return <div className="h-screen w-full flex items-center justify-center font-bold text-slate-500">Chargement de votre espace enseignant...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <TeacherDashboardWrapper teacher={teacher} merchant={merchant} />
    </div>
  );
};

export default TeacherPortal;
