// lib/session.tsx
import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Ctx = {
  session: Session | null;
  ready: boolean;
  signOut: () => Promise<void>;
};

const SessionCtx = createContext<Ctx>({
  session: null,
  ready: false,
  signOut: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    // hidratar al arrancar
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setReady(true);
    });

    // escuchar cambios
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, newSession) => {
      setSession(newSession ?? null);
      setReady(true);
    });

    return () => {
      sub.subscription.unsubscribe();
      mounted = false;
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut(); // no devolvemos el objeto { error }
  };

  return (
    <SessionCtx.Provider value={{ session, ready, signOut }}>
      {children}
    </SessionCtx.Provider>
  );
}

export const useSession = () => useContext(SessionCtx);
