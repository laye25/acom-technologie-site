import { supabase } from './supabase';
import { TableName } from '../hooks/useSupabase';

/**
 * Ajoute un nouveau document dans une table Supabase.
 * Si aucun ID n'est fourni, un UUID sera généré automatiquement pour correspondre au format Firebase.
 */
export const addSupabaseDocument = async <T>(tableName: TableName, data: any, id?: string): Promise<T> => {
  // On génère un ID si non fourni, car nos tables utilisent des ID de type TEXT (héritage Firebase)
  const insertData = { 
    ...data, 
    id: id || crypto.randomUUID(),
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString()
  };
  
  const { data: result, error } = await supabase
    .from(tableName)
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error(`Erreur lors de l'ajout dans ${tableName}:`, error);
    throw error;
  }

  return result as T;
};

/**
 * Met à jour un document existant dans une table Supabase.
 */
export const updateSupabaseDocument = async <T>(tableName: TableName, id: string, data: any): Promise<T> => {
  // On met à jour le timestamp
  const updateData = { 
    ...data, 
    updated_at: new Date().toISOString() 
  };

  const { data: result, error } = await supabase
    .from(tableName)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Erreur lors de la mise à jour dans ${tableName} (id: ${id}):`, error);
    throw error;
  }

  return result as T;
};

/**
 * Supprime un document d'une table Supabase.
 */
export const deleteSupabaseDocument = async (tableName: TableName, id: string): Promise<void> => {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Erreur lors de la suppression dans ${tableName} (id: ${id}):`, error);
    throw error;
  }
};
