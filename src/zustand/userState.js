import { create } from 'zustand';
import { auth } from '../firebase/firebase.js';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const useUserStore = create((set) => ({
  user: null,
  loading: true,

  // 🔄 Initialize Firebase Auth listener
  init: () => {
    onAuthStateChanged(auth, (user) => {
      set({
        user: user ?? null,
        loading: false
      });
    });
  },

  // 🔐 Sign up (Firebase)
  signUp: async (email, password) => {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      set({ user: userCred.user });
      return userCred.user;
    } catch (error) {
      throw error;
    }
  },

  // 🔑 Login (Firebase)
  signIn: async (email, password) => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      set({ user: userCred.user });
      return userCred.user;
    } catch (error) {
      throw error;
    }
  },

  // 🚪 Logout (Firebase)
  signOut: async () => {
    try {
      await signOut(auth);
      set({ user: null });
    } catch (error) {
      console.error("Logout failed", error);
    }
  }
}));

export default useUserStore;