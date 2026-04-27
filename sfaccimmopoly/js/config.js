/* ============================================
   SFACCIMMOPOLY — CONFIGURATION
   Firebase setup + shared password (hashed)
   ============================================ */

/* ---------- Firebase Configuration ----------
   Paste here the config object you copied from
   the Firebase console (Project settings → General
   → Your apps → SDK setup and configuration).
   These values are SAFE to commit publicly:
   security is enforced by Firebase Realtime
   Database rules, NOT by hiding these keys.
-------------------------------------------- */

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firebaseConfig = {
  apiKey: "AIzaSyAdI9kmt8AxAyVaVnK2ZxEarDeYyHCbOiM",
  authDomain: "sfaccimmopoly.firebaseapp.com",
  databaseURL: "https://sfaccimmopoly-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sfaccimmopoly",
  storageBucket: "sfaccimmopoly.firebasestorage.app",
  messagingSenderId: "511263186472",
  appId: "1:511263186472:web:2a509440152ed2e2059f1d"
};

/* ---------- Shared Password (SHA-256 hash) ----------
   We never store the plain password in code.
   Instead we store its SHA-256 hash. The login
   page hashes the user input and compares.

   👉 To generate your hash, open the browser console
      on ANY page and run:

      crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode('YOUR_PASSWORD_HERE')
      ).then(buf =>
        console.log(
          Array.from(new Uint8Array(buf))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
        )
      );

   Copy the printed hex string and paste it below.
---------------------------------------------------- */
const PASSWORD_HASH = "52685880d2dbb4c341c930300fe500b5e279e3dfbab60a9b5dd9310d00d40f34";

/* ---------- Game Configuration ---------- */
const GAME_CONFIG = {
  // Default language: 'it' or 'en'
  defaultLanguage: 'it',

  // Starting cash for each player
  startingMoney: 1500,

  // Money received when passing GO
  goSalary: 200,

  // Maximum number of players per room
  maxPlayers: 6,

  // Minimum number of players to start
  minPlayers: 2,

  // Auto-save interval (ms) — sync to Firebase
  syncInterval: 1000,

  // Session storage key (so you don't re-enter password each refresh)
  sessionKey: 'sfaccimmopoly_authenticated',

  // Local storage key for player profile
  playerKey: 'sfaccimmopoly_player'
};

/* ---------- Expose globally ---------- */
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
window.PASSWORD_HASH   = PASSWORD_HASH;
window.GAME_CONFIG     = GAME_CONFIG;
