// Conexão com o Firebase.
// Essas chaves não são senha: quem protege os dados são as regras do Firestore
// (https://firebase.google.com/docs/projects/api-keys).
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Valores do app Web do projeto "escritorio-arquitetura" (enviados pelo usuário em 15/11/2026).
// As variáveis VITE_FIREBASE_* podem substituí-los, por exemplo para um projeto de testes.
const env = import.meta.env;
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyBSZHFJ8buAprAQCwldguUBfvl_F2BSz-o',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'escritorio-arquitetura-cc55d.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'escritorio-arquitetura-cc55d',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'escritorio-arquitetura-cc55d.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '942513893175',
  appId: env.VITE_FIREBASE_APP_ID || '1:942513893175:web:a74a75315ec3adb442b4b2',
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
