import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  DocumentData,
  QueryConstraint,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType, prepareForFirestore, restoreFromFirestore } from '../lib/firestore.utils';

export { OperationType };

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_internal', 'connection_test'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client appears to be offline.");
    }
  }
}
testConnection();

export const firestoreService = {
  async getById<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        return restoreFromFirestore(data) as T;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${collectionName}/${id}`);
      return null;
    }
  },

  async getAll<T>(collectionName: string, constraints: QueryConstraint[] = []): Promise<T[]> {
    try {
      const colRef = collection(db, collectionName);
      const q = query(colRef, ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        return restoreFromFirestore(data) as T;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, collectionName);
      return [];
    }
  },

  async save<T extends { id?: string }>(collectionName: string, data: T): Promise<string> {
    try {
      const id = data.id || crypto.randomUUID();
      const docRef = doc(db, collectionName, id);
      const dataToSave = prepareForFirestore({ 
        ...data, 
        id, 
        updated_at: serverTimestamp() 
      });
      await setDoc(docRef, dataToSave, { merge: true });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, collectionName);
      return '';
    }
  },

  async add<T>(collectionName: string, data: T): Promise<string> {
    try {
      const colRef = collection(db, collectionName);
      const dataToSave = prepareForFirestore({
        ...data,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      const docRef = await addDoc(colRef, dataToSave);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, collectionName);
      return '';
    }
  },

  async update(collectionName: string, id: string, data: Partial<DocumentData>): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      const dataToUpdate = prepareForFirestore({
        ...data,
        updated_at: serverTimestamp()
      });
      // Use setDoc with merge: true to avoid "No document to update" errors
      await setDoc(docRef, dataToUpdate, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
    }
  },

  async upsert(collectionName: string, id: string, data: Partial<DocumentData>): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      const dataToUpsert = prepareForFirestore({
        ...data,
        updated_at: serverTimestamp()
      });
      await setDoc(docRef, dataToUpsert, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
    }
  },

  async delete(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
    }
  },

  onSnapshot<T>(
    collectionName: string, 
    constraints: QueryConstraint[], 
    callback: (data: T[]) => void
  ) {
    const colRef = collection(db, collectionName);
    const q = query(colRef, ...constraints);
    
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const docData = { id: doc.id, ...doc.data() };
        return restoreFromFirestore(docData) as T;
      });
      callback(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionName);
    });
  },

  onDocSnapshot<T>(
    collectionName: string, 
    id: string, 
    callback: (data: T | null) => void
  ) {
    const docRef = doc(db, collectionName, id);
    
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        callback(restoreFromFirestore(data) as T);
      } else {
        callback(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `${collectionName}/${id}`);
    });
  }
};
