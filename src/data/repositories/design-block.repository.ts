import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../../firebase';
import { DesignBlock } from '../../types';
import { subscriptionEngine } from '../services/subscription.engine';
import { handleFirestoreError, OperationType } from '../../lib/firestore.utils';

export class DesignBlockRepository {
  private getCollectionRef(designId: string) {
    return collection(db, 'designs', designId, 'blocks');
  }

  async getAll(designId: string, constraints: QueryConstraint[] = []): Promise<DesignBlock[]> {
    try {
      const colRef = this.getCollectionRef(designId);
      const q = query(colRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DesignBlock));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `designs/${designId}/blocks`);
      return [];
    }
  }

  async create(designId: string, data: Omit<DesignBlock, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const colRef = this.getCollectionRef(designId);
      const docRef = await addDoc(colRef, {
        ...data,
        designId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `designs/${designId}/blocks`);
      return '';
    }
  }

  async update(designId: string, blockId: string, data: Partial<DesignBlock>): Promise<void> {
    try {
      const docRef = doc(db, 'designs', designId, 'blocks', blockId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `designs/${designId}/blocks/${blockId}`);
    }
  }

  async delete(designId: string, blockId: string): Promise<void> {
    try {
      const docRef = doc(db, 'designs', designId, 'blocks', blockId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `designs/${designId}/blocks/${blockId}`);
    }
  }

  subscribe(designId: string, constraints: QueryConstraint[], callback: (data: DesignBlock[]) => void): () => void {
    const colRef = this.getCollectionRef(designId);
    const q = query(colRef, ...constraints);
    const key = `designs/${designId}/blocks/${JSON.stringify(constraints)}`;

    return subscriptionEngine.subscribe(key, q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DesignBlock));
      callback(data);
    });
  }
}

export const designBlockRepository = new DesignBlockRepository();
