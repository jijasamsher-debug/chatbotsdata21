import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, UserRole } from '../types';
import { recordAffiliateSignup } from '../utils/affiliateTracking';

interface AuthContextType {
  user: User | null;
  userData: any;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (uid: string) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid,
        email: data.email,
        name: data.name,
        role: data.role as UserRole,
        plan: data.subscription?.plan || data.plan || 'free',
        createdAt: data.createdAt?.toDate(),
        trialActive: data.trialActive,
        trialEndsAt: data.trialEndsAt?.toDate(),
        freeLeadVisibleUntil: data.freeLeadVisibleUntil?.toDate(),
        totalLeadsCount: typeof data.totalLeadsCount === 'number' ? data.totalLeadsCount : 0,
        geminiApiKey: data.geminiApiKey,
        subscription: data.subscription,
        botLimit: data.botLimit,
        aiBotLimit: data.aiBotLimit
      } as User;
    }
    return null;
  };

  const createUserDocument = async (firebaseUser: FirebaseUser, name: string) => {
    const settingsDoc = await getDoc(doc(db, 'adminSettings', 'global'));
    const trialDurationDays = settingsDoc.exists() ? settingsDoc.data().trialDurationDays || 14 : 14;

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDurationDays);

    const userData = {
      email: firebaseUser.email,
      name: name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      role: 'user',
      plan: 'free',
      createdAt: Timestamp.now(),
      trialActive: true,
      trialEndsAt: Timestamp.fromDate(trialEndsAt),
      totalLeadsCount: 0,
      subscription: {
        plan: 'free',
        status: 'trial'
      }
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);

    return {
      uid: firebaseUser.uid,
      ...userData,
      createdAt: new Date(),
      trialEndsAt
    } as User;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        try {
          setFirebaseUser(firebaseUser);

          if (firebaseUser) {
            let userData = await fetchUserData(firebaseUser.uid);

            if (!userData) {
              userData = await createUserDocument(firebaseUser, firebaseUser.displayName || '');
            }

            setUser(userData);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          setFirebaseUser(null);
          setUser(null);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Auth state listener error:', error);
        setFirebaseUser(null);
        setUser(null);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const signedInUser = userCredential.user;

    let userData = await fetchUserData(signedInUser.uid);
    if (!userData) {
      userData = await createUserDocument(signedInUser, signedInUser.displayName || '');
    }

    setFirebaseUser(signedInUser);
    setUser(userData);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userData = await createUserDocument(userCredential.user, name);

    setUser(userData);

    await recordAffiliateSignup(email, userCredential.user.uid);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const value = {
    user,
    userData: user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
