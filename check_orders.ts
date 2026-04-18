
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, limit, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkOrders() {
  try {
    const q = query(collection(db, 'orders'), limit(5));
    const snapshot = await getDocs(q);
    console.log('--- Orders Sample ---');
    snapshot.forEach(doc => {
      console.log(`ID: ${doc.id}`);
      console.log('Data:', JSON.stringify(doc.data(), null, 2));
    });
    console.log('--- End of Sample ---');
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
}

checkOrders();
