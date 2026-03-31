
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, AuthState } from '../types';
import { auth, db, testFirestoreConnection } from '../src/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onIdTokenChanged, 
  signOut,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  loginWithUsername: (username: string, pass: string) => Promise<void>;
  registerUser: (userData: User, pass: string) => Promise<void>;
  changePassword: (newPass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    console.log('🔐 AuthProvider: Initializing auth listener...');

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('🔐 Auth state changed:', firebaseUser ? `User: ${firebaseUser.email}` : 'No user');
      
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('token', token);
          
          console.log('📡 Firestore: START - getDoc(doc(db, "users", uid))');
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          console.log('📡 Firestore: SUCCESS - getDoc completed.');
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as any;
            console.log('✅ User profile found:', userData.role);
            
            // Normalize roles for internal use
            let normalizedRole = userData.role;
            if (typeof normalizedRole === 'string') {
              normalizedRole = normalizedRole.toUpperCase();
            }
            
            if (normalizedRole === Role.PROFESOR || normalizedRole === Role.DOCENTE) {
              normalizedRole = Role.TEACHER;
            } else if (normalizedRole === Role.ESTUDIANTE) {
              normalizedRole = Role.STUDENT;
            }
            
            const user: User = { ...userData, role: normalizedRole as Role };
            setState({ user, token, loading: false });
          } else {
            console.log('🆕 User profile not found, creating new profile...');
            // New user, create profile with default role
            const newUser: User = {
              uid: firebaseUser.uid,
              id: firebaseUser.uid as any,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Usuario Nuevo',
              role: firebaseUser.email === 'jrodriguezncs@gmail.com' ? Role.ADMIN : Role.STUDENT,
              avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.email}`,
              createdAt: serverTimestamp() as any,
            };
            
            console.log('📡 Firestore: START - setDoc(doc(db, "users", uid), newUser)');
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            console.log('📡 Firestore: SUCCESS - setDoc completed.');
            setState({ user: newUser, token, loading: false });
          }
        } catch (error: any) {
          console.error('📡 Firestore: FAIL - Code:', error.code, 'Message:', error.message);
          localStorage.removeItem('token');
          setState({ user: null, token: null, loading: false });
        }
      } else {
        localStorage.removeItem('token');
        setState({ user: null, token: null, loading: false });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginWithUsername = async (username: string, pass: string) => {
    // Synthetic email for users without real email
    const email = username.includes('@') ? username : `${username}@campus48.local`;
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const registerUser = async (userData: User, pass: string) => {
    // Synthetic email for users without real email
    const email = userData.email.includes('@') ? userData.email : `${userData.email}@campus48.local`;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const newUser = { 
        ...userData, 
        email, // Use the synthetic email
        uid: userCredential.user.uid, 
        id: userCredential.user.uid 
      };
      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const changePassword = async (newPass: string) => {
    if (auth.currentUser) {
      try {
        await updatePassword(auth.currentUser, newPass);
      } catch (error) {
        console.error('Change password error:', error);
        throw error;
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithUsername, registerUser, changePassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
