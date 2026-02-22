import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendEmailVerification, UserCredential } from 'firebase/auth';
import { auth } from '../firebaseConfig';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, pass: string) => Promise<UserCredential>;
    signUp: (email: string, pass: string) => Promise<UserCredential>;
    signInWithGoogle: () => Promise<UserCredential>;
    logout: () => Promise<void>;
    sendVerificationEmail: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Helper hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const signIn = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
    const signUp = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
    const signInWithGoogle = () => {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    };
    const logout = () => signOut(auth);
    const sendVerification = (user: User) => sendEmailVerification(user);

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, logout, sendVerificationEmail: sendVerification }}>
            {children}
        </AuthContext.Provider>
    );
};
