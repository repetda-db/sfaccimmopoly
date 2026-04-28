/* SFACCIMMOPOLY — CONFIGURATION */

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAdI9kmt8AxAyVaVnK2ZxEarDeYyHCbOiM",
  authDomain: "sfaccimmopoly.firebaseapp.com",
  databaseURL: "https://sfaccimmopoly-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sfaccimmopoly",
  storageBucket: "sfaccimmopoly.firebasestorage.app",
  messagingSenderId: "511263186472",
  appId: "1:511263186472:web:2a509440152ed2e2059f1d"
};

const PASSWORD_HASH = "52685880d2dbb4c341c930300fe500b5e279e3dfbab60a9b5dd9310d00d40f34";

const GAME_CONFIG = {
  defaultLanguage: 'it',
  startingMoney: 1500,
  goSalary: 200,
  maxPlayers: 6,
  minPlayers: 2,
  syncInterval: 1000,
  sessionKey: 'sfaccimmopoly_auth',
  playerKey: 'sfaccimmopoly_player'
};

window.firebaseConfig = firebaseConfig;
window.PASSWORD_HASH  = PASSWORD_HASH;
window.GAME_CONFIG    = GAME_CONFIG;
firebase.initializeApp(firebaseConfig);
window.db = firebase.database();
