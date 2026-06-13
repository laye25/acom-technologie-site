import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  QueryConstraint,
  DocumentData,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import { subscriptionEngine } from '../services/subscription.engine';
import { handleFirestoreError, OperationType, prepareForFirestore, restoreFromFirestore } from '../../lib/firestore.utils';

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
        const data = { id: docSnap.id, ...docSnap.data() };
        return restoreFromFirestore(data) as T;
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
      
      return querySnapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        return restoreFromFirestore(data) as T;
      });
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
      const dataToSave = prepareForFirestore({
        ...data,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      const docRef = await addDoc(colRef, dataToSave);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, this.collectionName);
      throw error;
    }
  }

  /**
   * Update an existing document (using set with merge to avoid "No document to update" error)
   */
  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const dataToUpdate = prepareForFirestore({
        ...data,
        updated_at: serverTimestamp()
      });
      await setDoc(docRef, dataToUpdate, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${this.collectionName}/${id}`);
      throw error;
    }
  }

  /**
   * Set (upsert) a document
   */
  async set(id: string, data: any): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const dataToSave = prepareForFirestore({
        ...data,
        updated_at: serverTimestamp()
      });
      await setDoc(docRef, dataToSave, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${this.collectionName}/${id}`);
      throw error;
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
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(key: string, constraints: QueryConstraint[], callback: (data: T[]) => void): () => void {
    const colRef = collection(db, this.collectionName);
    const q = query(colRef, ...constraints);

    return subscriptionEngine.subscribe(key, q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const docData = { id: doc.id, ...doc.data() };
        return restoreFromFirestore(docData) as T;
      });
      callback(data);
    });
  }
}
