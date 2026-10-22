import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isSigningOut: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Siapkan listener status autentikasi TERLEBIH DAHULU
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // Invalidasi cache peran pengguna saat login/pendaftaran agar data diambil ulang
        if (event === 'SIGNED_IN' && session?.user?.id) {
          queryClient.invalidateQueries({ queryKey: ['user-role', session.user.id] });
        }
        
        // Bersihkan cache saat logout
        if (event === 'SIGNED_OUT') {
          queryClient.removeQueries({ queryKey: ['user-role'] });
        }
      }
    );

    // KEMUDIAN periksa sesi yang sudah ada
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return { error: error as Error };
    }
    
    // Periksa apakah pengguna diblokir
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('blocked')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        console.error('Kesalahan saat memeriksa status pemblokiran:', profileError);
      }
      
      if (profile?.blocked) {
        // Keluar langsung dari pengguna
        await supabase.auth.signOut({ scope: 'local' });
        return { error: new Error('Akun Anda telah diblokir. Silakan hubungi administrator.') };
      }
    }
    
    return { error: null };
  };

  const signOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('Kesalahan saat keluar:', error);
    } finally {
      // Bersihkan status lokal apa pun hasil respons server
      setSession(null);
      setUser(null);
      queryClient.clear();
      setIsSigningOut(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isSigningOut, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return context;
}
