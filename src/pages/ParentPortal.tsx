import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useNavigate } from 'react-router-dom';
import { ParentPortalSimulation } from '../components/ParentPortalSimulation';
import { toast } from 'react-hot-toast';

const ParentPortal = () => {
  const navigate = useNavigate();
  const activeParentId = localStorage.getItem('activeParentId');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!activeParentId) navigate('/login');
  }, [activeParentId, navigate]);

  const parentData = useLiveQuery(async () => {
    if (!activeParentId) return null;
    let p = await db.parents?.where('phone').equals(activeParentId).first();
    if (!p) p = await db.parents?.where('username').equals(activeParentId).first();
    if (!p) p = await db.parents?.where('id').equals(activeParentId).first();
    return p;
  }, [activeParentId]);

  const children = useLiveQuery(async () => {
    if (!activeParentId) return [];
    const allStudents = await db.students?.toArray() || [];
    const cleanActiveParent = activeParentId.replace(/[^0-9]/g, '');
    return allStudents.filter(s => {
      const phones = [s.fatherPhone, s.motherPhone, s.guardianPhone, s.parentContact, s.parentAccountPhone]
        .map(p => p?.replace(/[^0-9]/g, '')).filter(Boolean);
      return phones.includes(cleanActiveParent) || s.parentId === activeParentId;
    });
  }, [activeParentId]) || [];

  const resolvedMerchantId = parentData?.merchantId || parentData?.merchant_id || (children.length > 0 ? (children[0].merchantId || children[0].merchant_id) : localStorage.getItem('merchantId'));

  const merchant = useLiveQuery(async () => {
    if (!resolvedMerchantId) return null;
    return await db.merchants?.filter(m => m.id === resolvedMerchantId).first();
  }, [resolvedMerchantId]);

  useEffect(() => {
    if (resolvedMerchantId && activeParentId) {
      setIsSyncing(true);
      import('../services/syncService').then(({ syncService }) => {
        syncService.syncParentData(resolvedMerchantId, activeParentId).finally(() => {
          setIsSyncing(false);
        });
      });
    }
  }, [resolvedMerchantId, activeParentId]);

  const handleLogout = () => {
    localStorage.removeItem('activeParentId');
    localStorage.removeItem('merchantId');
    navigate('/login');
  };

  if (!activeParentId) return null;

  // We construct a comprehensive parent profile using both the registered parent record and the detected children
  const loggedParentProfile = {
      ...parentData,
      id: parentData?.id || activeParentId,
      phone: parentData?.phone || activeParentId,
      name: parentData?.name || parentData?.fatherName || parentData?.motherName || "Parent",
      children: children,
      username: parentData?.username || activeParentId
  };

  if (!merchant || children.length === 0 && !parentData) {
      return (
          <div className="h-screen w-full flex items-center justify-center font-bold text-slate-500">
              Recherche de vos données parent...
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50">
        <ParentPortalSimulation 
            parent={loggedParentProfile} 
            merchant={merchant} 
            standalone={true}
            onClose={handleLogout} 
        />
    </div>
  );
};

export default ParentPortal;

