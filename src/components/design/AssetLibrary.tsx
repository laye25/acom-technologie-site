import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { storageService } from '../../services/storageService';
import { dbService } from '../../services/dbService';
import { syncService } from '../../services/syncService';
import { useAuth } from '../../context/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Asset } from '../../types';

interface AssetLibraryProps {
  onInsert: (url: string) => void;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({ onInsert }) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  
  // Read from Dexie (Offline-first)
  const assets = useLiveQuery(
    () => user ? db.assets.where('userId').equals(user.uid).reverse().sortBy('createdAt') : [],
    [user?.uid]
  ) || [];

  useEffect(() => {
    if (user?.uid) {
      syncService.syncAssets(user.uid);
    }
  }, [user?.uid]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    const loadingToast = toast.loading("Téléversement en cours...");

    try {
      const path = `assets/${user.uid}/${Date.now()}_${file.name}`;
      const url = await storageService.uploadFile('assets', path, file);
      
      const newAsset: Omit<Asset, 'id'> = {
        userId: user.uid,
        name: file.name,
        url,
        type: file.type.startsWith('image/svg') ? 'icon' : 'image',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await dbService.assets.save(newAsset);

      toast.success("Asset ajouté !", { id: loadingToast });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors du téléversement.", { id: loadingToast });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (asset: Asset) => {
    try {
      // Extract path from storage URL
      const path = asset.url.includes('assets%2F') 
        ? asset.url.split('assets%2F')[1].split('?')[0].replace(/%2F/g, '/')
        : `assets/${user?.uid}/${asset.name}`;

      await storageService.deleteFile('assets', path);
      
      await dbService.assets.delete(asset.id);
      
      toast.success("Asset supprimé.");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Ma Bibliothèque</h3>
        <label className="cursor-pointer bg-primary text-white p-2 rounded-lg hover:bg-primary/90">
          <Upload className="w-5 h-5" />
          <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {assets?.map(asset => (
          <div key={asset.id} className="relative group aspect-square border rounded-lg overflow-hidden">
            <img 
              src={asset.url} 
              alt={asset.name} 
              className="w-full h-full object-contain cursor-pointer hover:opacity-80"
              onClick={() => onInsert(asset.url)}
              referrerPolicy="no-referrer"
            />
            <button 
              onClick={() => handleDelete(asset)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
