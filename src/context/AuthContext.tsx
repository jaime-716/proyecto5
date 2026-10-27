import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import type { Session } from "@supabase/supabase-js";
import { supabase } from "../database/supabase";

type Rol = "ADMIN" | "CLIENTE";

type UsuarioApp = {
  id: number;
  auth_id: string;
  correo: string;
  nombre: string | null;
  apellido: string | null;
  rol: Rol;
  estado: string;
};

type AuthContextType = {
  sesion: Session | null;
  usuario: UsuarioApp | null;
  cargando: boolean;
  errorSesion: string | null;
  actualizarSesion: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<UsuarioApp | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorSesion, setErrorSesion] = useState<string | null>(null);

  // Evita que respuestas antiguas sobrescriban
  // los resultados de una consulta más reciente.
  const consultaActual = useRef(0);
  const montado = useRef(true);

  const consultarUsuario = async (session: Session | null) => {
    const numeroConsulta = ++consultaActual.current;

    const sigueVigente = () =>
      montado.current && numeroConsulta === consultaActual.current;

    if (!session) {
      if (sigueVigente()) {
        setSesion(null);
        setUsuario(null);
        setErrorSesion(null);
        setCargando(false);
      }
      return;
    }

    if (sigueVigente()) {
      setCargando(true);
      setSesion(session);
      setUsuario(null);
      setErrorSesion(null);
    }

    try {
      const { data, error } = await supabase
        .from("Usuario")
        .select("id, auth_id, correo, nombre, apellido, rol, estado")
        .eq("auth_id", session.user.id)
        .maybeSingle();

      if (!sigueVigente()) return;

      if (error) {
        console.error("ERROR CONSULTANDO USUARIO:", error.message);

        setErrorSesion("No se pudo verificar la información del usuario.");
        return;
      }

      if (!data) {
        setErrorSesion("No se encontró el perfil del usuario.");
        return;
      }

      // Validar estado
      if (data.estado !== "ACTIVO") {
        setErrorSesion(
          data.estado === "PENDIENTE"
            ? "Tu cuenta está pendiente de aprobación."
            : "Tu cuenta no está activa.",
        );
        return;
      }

      // Validar rol
      if (data.rol !== "ADMIN" && data.rol !== "CLIENTE") {
        setErrorSesion("El usuario no tiene un rol válido.");
        return;
      }

      if (sigueVigente()) {
        setUsuario(data as UsuarioApp);
        setErrorSesion(null);
      }
    } catch (error) {
      console.error("ERROR DE SESIÓN:", error);

      if (sigueVigente()) {
        setErrorSesion("Ocurrió un error al verificar la sesión.");
      }
    } finally {
      if (sigueVigente()) {
        setCargando(false);
      }
    }
  };

  const actualizarSesion = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("ERROR RECUPERANDO SESIÓN:", error.message);

        setErrorSesion("No se pudo recuperar la sesión.");
        setCargando(false);
        return;
      }

      await consultarUsuario(data.session);
    } catch (error) {
      console.error("ERROR ACTUALIZANDO SESIÓN:", error);

      setErrorSesion("No fue posible actualizar la sesión.");
      setCargando(false);
    }
  };

  useEffect(() => {
    montado.current = true;

    // Recuperar sesión al iniciar la aplicación
    actualizarSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evento, nuevaSesion) => {
      if (!montado.current) return;

      // El cierre de sesión se procesa de inmediato.
      if (evento === "SIGNED_OUT") {
        consultarUsuario(null);
        return;
      }

      // Evitar consultas de perfil por cada renovación
      // automática del token.
      if (evento === "TOKEN_REFRESHED") {
        if (nuevaSesion) {
          setSesion(nuevaSesion);
        }
        return;
      }

      if (
        evento === "SIGNED_IN" ||
        evento === "INITIAL_SESSION" ||
        evento === "USER_UPDATED"
      ) {
        // Consultar fuera del callback de autenticación.
        setTimeout(() => {
          if (montado.current) {
            consultarUsuario(nuevaSesion);
          }
        }, 0);
      }
    });

    return () => {
      montado.current = false;
      consultaActual.current++;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        sesion,
        usuario,
        cargando,
        errorSesion,
        actualizarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  }

  return contexto;
}
