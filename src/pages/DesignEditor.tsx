import React from 'react';
import { CardEditor } from '../components/design/CardEditor';
import { motion } from 'motion/react';
import { Palette, Info, ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DesignEditor = () => {
  const { isAdmin, isManager } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Try to get from state first (navigation), then fallback to URL params
  const initialDesign = location.state?.design || location.state?.svgContent;
  const templateId = location.state?.templateId || searchParams.get('template_id');
  const autoOpenSelector = searchParams.get('select') === 'true';

  return (
    <div className="h-screen bg-white overflow-hidden">
      <CardEditor 
        initialTemplate={initialDesign} 
        templateId={templateId || undefined} 
        autoOpenSelector={autoOpenSelector}
      />
    </div>
  );
};

export default DesignEditor;
