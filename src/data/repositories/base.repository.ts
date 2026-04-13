import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  QueryConstraint,
  DocumentData,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import { subscriptionEngine } from '../services/subscription.engine';
import { handleFirestoreError, OperationType } from '../../lib/firestore.utils';

export abstract class BaseRepository<T extends { id?: string }> {
  protected abstract collectionName: string;

  /**
   * Get a single document by ID
   */
  async getById(id: string): Promise<T | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${this.collectionName}/${id}`);
      return null;
    }
  }

  /**
   * Get all documents in the collection (with optional constraints)
   */
  async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    try {
      const colRef = collection(db, this.collectionName);
      const q = query(colRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, this.collectionName);
      return [];
    }
  }

  /**
   * Create a new document
   */
  async create(data: Omit<T, 'id'>): Promise<string> {
    try {
      const colRef = collection(db, this.collectionName);
      const docRef = await addDoc(colRef, {
        ...data,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, this.collectionName);
      return '';
    }
  }

  /**
   * Update an existing document
   */
  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${this.collectionName}/${id}`);
    }
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${this.collectionName}/${id}`);
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(key: string, constraints: QueryConstraint[], callback: (data: T[]) => void): () => void {
    const colRef = collection(db, this.collectionName);
    const q = query(colRef, ...constraints);

    return subscriptionEngine.subscribe(key, q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      callback(data);
    });
  }
}
