import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';


const firebaseConfig = {
    apiKey: "AIzaSyBHkMu11EZbHiGlUFJ1hpjaRKddkDpgX5I",
    authDomain: "tictacmasterxo.firebaseapp.com",
    projectId: "tictacmasterxo",
    storageBucket: "tictacmasterxo.firebasestorage.app",
    messagingSenderId: "810778838310",
    appId: "1:810778838310:web:3ace8a41b7353bf3636de7",
    measurementId: "G-P6WGXQHT1Z",
    databaseURL: "https://tictacmasterxo-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);

export default app;
