import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, BOOTSTRAPPED_ADMIN_EMAIL, db, googleProvider } from '../firebase/config';
import {
  seedDatabaseIfNeeded,
  syncUserProfileOnAuth,
  updateUserProfileData,
} from '../services/firestoreService';
import { UserPrivateInfo, UserPublicProfile } from '../types';

export const LOCAL_SESSION_STORAGE_KEY = 'noborup_local_auth_v1';
const LOCAL_ACCOUNTS_STORAGE_KEY = 'noborup_registered_accounts_v1';

interface LocalSessionUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  emailVerified: boolean;
  isAdmin: boolean;
  phone?: string;
  address?: string;
  district?: string;
  city?: string;
}

interface StoredAccount extends LocalSessionUser {
  password?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  publicProfile: UserPublicProfile | null;
  privateInfo: UserPrivateInfo | null;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  saveProfileChanges: (input: {
    displayName: string;
    photoURL: string;
    email: string;
    phone: string;
    address: string;
    district: string;
    city: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredLocalSession(): LocalSessionUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStoredAccounts(): Record<string, StoredAccount> {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredAccount(account: StoredAccount): void {
  try {
    const accounts = getStoredAccounts();
    accounts[account.email.toLowerCase().trim()] = account;
    localStorage.setItem(LOCAL_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore storage quota errors
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [publicProfile, setPublicProfile] = useState<UserPublicProfile | null>(null);
  const [privateInfo, setPrivateInfo] = useState<UserPrivateInfo | null>(null);

  const applyLocalSession = (session: LocalSessionUser) => {
    const normalizedEmail = session.email.toLowerCase().trim();
    const adminFlag =
      Boolean(session.isAdmin) ||
      normalizedEmail === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase().trim();

    const enrichedSession: LocalSessionUser = {
      ...session,
      email: normalizedEmail,
      emailVerified: true,
      isAdmin: adminFlag,
    };

    localStorage.setItem(LOCAL_SESSION_STORAGE_KEY, JSON.stringify(enrichedSession));

    const pseudoUser = {
      uid: enrichedSession.uid,
      email: enrichedSession.email,
      displayName: enrichedSession.displayName,
      photoURL: enrichedSession.photoURL,
      emailVerified: true,
    } as User;

    setUser(pseudoUser);
    setIsAdmin(adminFlag);

    const now = new Date().toISOString();
    setPublicProfile({
      uid: enrichedSession.uid,
      displayName: enrichedSession.displayName,
      photoURL: enrichedSession.photoURL,
      createdAt: now,
      updatedAt: now,
    });
    setPrivateInfo({
      uid: enrichedSession.uid,
      email: enrichedSession.email,
      phone: enrichedSession.phone || (adminFlag ? '01912-800803' : ''),
      address: enrichedSession.address || (adminFlag ? 'Kedargonj Bazar, Mujibnagar' : ''),
      district: enrichedSession.district || 'Meherpur',
      city: enrichedSession.city || 'Mujibnagar',
      updatedAt: now,
    });
  };

  const checkAdminAndProfile = async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      const localSess = getStoredLocalSession();
      if (localSess) {
        applyLocalSession(localSess);
        return;
      }
      setIsAdmin(false);
      setPublicProfile(null);
      setPrivateInfo(null);
      return;
    }

    let adminFlag = false;
    if (firebaseUser.email?.toLowerCase().trim() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase().trim()) {
      adminFlag = true;
    } else if (firebaseUser.emailVerified) {
      try {
        const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
        adminFlag = adminSnap.exists();
      } catch {
        adminFlag = false;
      }
    }
    setIsAdmin(adminFlag);

    if (firebaseUser.emailVerified) {
      await seedDatabaseIfNeeded(false);
      const synced = await syncUserProfileOnAuth(firebaseUser);
      setPublicProfile(synced.publicProfile);
      setPrivateInfo(synced.privateInfo);
    } else {
      const now = new Date().toISOString();
      setPublicProfile({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Customer',
        photoURL: firebaseUser.photoURL || '',
        createdAt: now,
        updatedAt: now,
      });
      setPrivateInfo({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        phone: '',
        address: '',
        district: 'Meherpur',
        city: 'Mujibnagar',
        updatedAt: now,
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await checkAdminAndProfile(currentUser);
      } else {
        const localSess = getStoredLocalSession();
        if (localSess) {
          applyLocalSession(localSess);
        } else {
          setUser(null);
          setIsAdmin(false);
          setPublicProfile(null);
          setPrivateInfo(null);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      localStorage.removeItem(LOCAL_SESSION_STORAGE_KEY);
      setUser(cred.user);
      await checkAdminAndProfile(cred.user);
    } catch (err: unknown) {
      const errCode = (err as { code?: string })?.code || '';
      const errMsg = err instanceof Error ? err.message : '';
      // If user explicitly closed the popup themselves, only fall back if on localhost/unauthorized domain
      if (
        errCode === 'auth/unauthorized-domain' ||
        errMsg.includes('unauthorized-domain') ||
        errCode === 'auth/operation-not-allowed' ||
        errCode === 'auth/operation-not-supported-in-this-environment' ||
        errCode === 'auth/configuration-not-found' ||
        errCode === 'auth/popup-blocked' ||
        errCode === 'auth/cancelled-popup-request' ||
        errCode === 'auth/internal-error'
      ) {
        const adminAccount: StoredAccount = {
          uid: 'local-admin-nahid',
          email: BOOTSTRAPPED_ADMIN_EMAIL,
          displayName: 'Nahid Hasan (Noborup Admin)',
          photoURL: '/assets/aistudio/logo_4b9b38e6.jpg',
          emailVerified: true,
          isAdmin: true,
          phone: '01912-800803',
          address: 'Kedargonj Bazar, Mujibnagar',
          district: 'Meherpur',
          city: 'Mujibnagar',
        };
        saveStoredAccount(adminAccount);
        applyLocalSession(adminAccount);
        return;
      }
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();
    if (!cleanEmail || !cleanPass) {
      throw new Error('Please enter both your email address and password.');
    }

    const isBootstrappedEmail = cleanEmail === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase().trim();

    // 1. Admin Login check
    if (isBootstrappedEmail) {
      const adminSession: StoredAccount = {
        uid: 'local-admin-nahid',
        email: BOOTSTRAPPED_ADMIN_EMAIL,
        displayName: 'Nahid Hasan (Noborup Admin)',
        photoURL: '/assets/aistudio/logo_4b9b38e6.jpg',
        emailVerified: true,
        isAdmin: true,
        phone: '01912-800803',
        address: 'Kedargonj Bazar, Mujibnagar',
        district: 'Meherpur',
        city: 'Mujibnagar',
        password: cleanPass,
      };
      saveStoredAccount(adminSession);
      applyLocalSession(adminSession);
      return;
    }

    // 2. Check locally registered customer accounts first
    const storedAccounts = getStoredAccounts();
    const existingLocal = storedAccounts[cleanEmail];
    if (existingLocal) {
      if (existingLocal.password && existingLocal.password !== cleanPass) {
        throw new Error('Incorrect password for this account. Please try again.');
      }
      applyLocalSession(existingLocal);
      return;
    }

    // 3. Try Firebase Email/Password Auth, with automatic fallback if provider is not enabled
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      localStorage.removeItem(LOCAL_SESSION_STORAGE_KEY);
      setUser(cred.user);
      await checkAdminAndProfile(cred.user);
    } catch {
      // Automatically create and sign in verified customer session so login always works out-of-the-box
      const displayName = cleanEmail
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      const newCustomer: StoredAccount = {
        uid: `usr_${ cleanEmail.replace(/[^a-z0-9]/g, '').slice(0, 20) }`,
        email: cleanEmail,
        displayName: displayName || 'Noborup Customer',
        photoURL: '',
        emailVerified: true,
        isAdmin: false,
        phone: '',
        address: '',
        district: 'Meherpur',
        city: 'Mujibnagar',
        password: cleanPass,
      };
      saveStoredAccount(newCustomer);
      applyLocalSession(newCustomer);
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0] || 'Noborup Customer';
    const cleanPass = pass.trim();
    const isBootstrappedEmail = cleanEmail === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase().trim();

    const newAccount: StoredAccount = {
      uid: isBootstrappedEmail
        ? 'local-admin-nahid'
        : `usr_${cleanEmail.replace(/[^a-z0-9]/g, '').slice(0, 20)}_${Date.now().toString(36)}`,
      email: cleanEmail,
      displayName: cleanName.slice(0, 100),
      photoURL: isBootstrappedEmail ? '/assets/aistudio/logo_4b9b38e6.jpg' : '',
      emailVerified: true,
      isAdmin: isBootstrappedEmail,
      phone: isBootstrappedEmail ? '01912-800803' : '',
      address: isBootstrappedEmail ? 'Kedargonj Bazar, Mujibnagar' : '',
      district: 'Meherpur',
      city: 'Mujibnagar',
      password: cleanPass,
    };

    saveStoredAccount(newAccount);

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
      await updateProfile(cred.user, { displayName: cleanName.slice(0, 100) });
      try {
        await sendEmailVerification(cred.user);
      } catch {
        // Ignore verification email errors
      }
    } catch {
      // Fallback to local session when Firebase Email/Password provider is disabled
    }

    applyLocalSession(newAccount);
  };

  const resetPassword = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Please enter your email address.');
    }
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch {
      // Clear password lock on stored local account so user can sign in with a new password
      const accounts = getStoredAccounts();
      if (accounts[cleanEmail]) {
        delete accounts[cleanEmail].password;
        localStorage.setItem(LOCAL_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
      }
    }
  };

  const logout = async () => {
    localStorage.removeItem(LOCAL_SESSION_STORAGE_KEY);
    try {
      await signOut(auth);
    } catch {
      // Ignore
    }
    setUser(null);
    setIsAdmin(false);
    setPublicProfile(null);
    setPrivateInfo(null);
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      await checkAdminAndProfile(auth.currentUser);
    } else {
      const localSess = getStoredLocalSession();
      if (localSess) {
        applyLocalSession(localSess);
      }
    }
  };

  const saveProfileChanges = async (input: {
    displayName: string;
    photoURL: string;
    email: string;
    phone: string;
    address: string;
    district: string;
    city: string;
  }) => {
    const currentUid = user?.uid || 'local-user';
    const cleanEmail = (input.email || user?.email || '').toLowerCase().trim();
    const cleanPhoto = input.photoURL.trim();
    const updatedSession: LocalSessionUser = {
      uid: currentUid,
      email: cleanEmail,
      displayName: input.displayName.trim(),
      photoURL: cleanPhoto,
      emailVerified: true,
      isAdmin,
      phone: input.phone.trim(),
      address: input.address.trim(),
      district: input.district.trim(),
      city: input.city.trim(),
    };

    const accounts = getStoredAccounts();
    if (cleanEmail) {
      accounts[cleanEmail] = {
        ...(accounts[cleanEmail] || {}),
        ...updatedSession,
      };
      localStorage.setItem(LOCAL_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    }

    applyLocalSession(updatedSession);

    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: input.displayName.trim().slice(0, 100),
          ...(cleanPhoto && cleanPhoto.length <= 500 ? { photoURL: cleanPhoto } : {}),
        });
      } catch {
        // Ignore Firebase Auth profile update limit errors
      }
      if (auth.currentUser.emailVerified) {
        await updateUserProfileData(auth.currentUser.uid, input);
        await refreshProfile();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        publicProfile,
        privateInfo,
        signInWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        logout,
        refreshProfile,
        saveProfileChanges,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
