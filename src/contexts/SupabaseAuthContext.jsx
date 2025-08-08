import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

const ADMIN_EMAILS = ['admin@example.com', 'defacto.admin@example.com']; // Yönetici e-postalarını buraya ekleyin

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password) => {
    const role = ADMIN_EMAILS.includes(email) ? 'admin' : 'user';
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role,
        }
      }
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Kayıt Başarısız",
        description: error.message || "Bir şeyler ters gitti",
      });
    } else if (data.user && data.user.identities && data.user.identities.length === 0) {
       toast({
        variant: "destructive",
        title: "Kayıt Başarısız",
        description: "Bu e-posta adresi zaten kullanımda.",
      });
      return { error: { message: "User already exists" } };
    }

    return { data, error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    console.log("Supabase signIn çağrıldı.");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase signIn hatası:", error);
      toast({
        variant: "destructive",
        title: "Giriş Başarısız",
        description: error.message || "Bir şeyler ters gitti",
      });
    } else if (data.user) {
      console.log("Supabase signIn başarılı, kullanıcı:", data.user);
      // Başarılı giriş sonrası state'i hemen güncelle
      handleSession(data.session);
    }

    return { data, error };
  }, [toast, handleSession]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        variant: "destructive",
        title: "Çıkış Başarısız",
        description: error.message || "Bir şeyler ters gitti",
      });
    }

    return { error };
  }, [toast]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }), [user, session, loading, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};