// Conexão com o Firebase. Os valores vêm das variáveis de ambiente VITE_FIREBASE_*
// (arquivo .env.local no computador e "Environment Variables" na Vercel).
// Essas chaves não são senha: quem protege os dados são as regras do Firestore
// (https://firebase.google.com/docs/projects/api-keys).
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** true quando as variáveis obrigatórias foram cadastradas. */
export const firebaseConfigurado = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

let app: FirebaseApp | null = null;

function getApp(): FirebaseApp {
  if (!firebaseConfigurado) throw new Error('Firebase não configurado');
  if (!app) app = initializeApp(config);
  return app;
}

export function auth(): Auth {
  const a = getAuth(getApp());
  a.languageCode = 'pt-BR';
  return a;
}

export function db(): Firestore {
  return getFirestore(getApp());
}
