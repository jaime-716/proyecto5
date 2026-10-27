import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { supabase } from "../../database/supabase";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colores } from "../../tema/colores";
import { useAuth } from "../../context/AuthContext";

export default function Login({ navigation }: any) {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const { actualizarSesion } = useAuth();

  const iniciarSesion = async () => {
    if (cargando) return;

    const correoLimpio = correo.trim().toLowerCase();
    const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // 1. Validaciones del formulario
    if (!correoLimpio || !password) {
      Alert.alert("Campos obligatorios", "Completa todos los campos.");
      return;
    }

    if (!formatoCorreo.test(correoLimpio)) {
      Alert.alert("Correo inválido", "Ingresa un correo electrónico válido.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Contraseña inválida",
        "La contraseña debe tener al menos 6 caracteres.",
      );
      return;
    }

    setCargando(true);

    try {
      // 2. Autenticación con Supabase
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: correoLimpio,
          password,
        });

      if (authError || !authData.user) {
        console.log("ERROR AUTH SUPABASE:", {
          mensaje: authError?.message,
          codigo: authError?.code,
          estado: authError?.status,
          usuarioRecibido: !!authData.user,
        });

        Alert.alert(
          "Error de autenticación",
          authError?.message || "No se pudo obtener el usuario.",
        );
        return;
      }

      // 3. Consultar datos del usuario
      const { data: usuario, error: usuarioError } = await supabase
        .from("Usuario")
        .select("id, correo, nombre, apellido, rol, estado")
        .eq("correo", correoLimpio)
        .single();

      if (usuarioError || !usuario) {
        await supabase.auth.signOut();

        Alert.alert(
          "Error",
          "No se encontró tu perfil. Contacta al administrador.",
        );
        return;
      }

      // 4. Comprobar estado de la cuenta
      if (usuario.estado !== "ACTIVO") {
        await supabase.auth.signOut();

        if (usuario.estado === "PENDIENTE") {
          Alert.alert(
            "Cuenta pendiente",
            "Tu cuenta está pendiente de aprobación.",
          );
        } else if (usuario.estado === "INACTIVO") {
          Alert.alert("Cuenta inactiva", "Tu cuenta se encuentra inactiva.");
        } else {
          Alert.alert(
            "Acceso denegado",
            "El estado de tu cuenta no es válido.",
          );
        }
        return;
      }

      // 5. Validar rol antes de navegar
      if (usuario.rol !== "ADMIN" && usuario.rol !== "CLIENTE") {
        await supabase.auth.signOut();

        Alert.alert("Acceso denegado", "Tu cuenta no tiene un rol válido.");
        return;
      }
      // Limpiar los campos
      setCorreo("");
      setPassword("");

      await actualizarSesion();

      setCorreo("");
      setPassword("");

      // 7. Navegación de administrador
     
      // 7. Validar el rol del usuario
      if (
        usuario.rol !== "ADMIN" &&
        usuario.rol !== "CLIENTE"
      ) {
        await supabase.auth.signOut();

        Alert.alert(
          "Acceso denegado",
          "Tu cuenta no tiene un rol válido."
        );
        return;
      }

      // 8. Limpiar los campos
      setCorreo("");
      setPassword("");

      // 9. Actualizar la sesión global
      // AuthContext verificará el usuario.
      // StackNavigator mostrará automáticamente
      // Home, Perfil o PanelAdmin.
      await actualizarSesion();

    } catch (error: any) {
      console.error("ERROR LOGIN:", error);

      Alert.alert(
        "Error de conexión",
        "No se pudo iniciar sesión. Verifica tu conexión e inténtalo de nuevo.",
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.encabezado}>
          <View style={styles.iconoPrincipal}>
            <Ionicons
              name="restaurant-outline"
              size={36}
              color={colores.secundario}
            />
          </View>

          <Text style={styles.titulo}>Iniciar sesión</Text>
          <Text style={styles.subtitulo}>Bienvenido a nuestro restaurante</Text>
        </View>

        <View style={styles.cuadro}>
          <Text style={styles.label}>Correo electrónico</Text>

          <View style={styles.campo}>
            <Ionicons name="mail-outline" size={21} color={colores.primario} />

            <TextInput
              style={styles.input}
              placeholder="ejemplo@correo.com"
              placeholderTextColor={colores.textoSecundario}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              value={correo}
              onChangeText={setCorreo}
              editable={!cargando}
            />
          </View>

          <Text style={styles.label}>Contraseña</Text>

          <View style={styles.campo}>
            <Ionicons
              name="lock-closed-outline"
              size={21}
              color={colores.primario}
            />

            <TextInput
              style={styles.input}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor={colores.textoSecundario}
              secureTextEntry={!mostrarPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              editable={!cargando}
              onSubmitEditing={iniciarSesion}
            />

            <TouchableOpacity
              onPress={() => setMostrarPassword(!mostrarPassword)}
              style={styles.botonOjo}
              accessibilityLabel={
                mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              <Ionicons
                name={mostrarPassword ? "eye-off-outline" : "eye-outline"}
                size={23}
                color={colores.textoSecundario}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.botonIngresar,
              cargando && styles.botonDeshabilitado,
            ]}
            onPress={iniciarSesion}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color={colores.blanco} />
            ) : (
              <Text style={styles.textoBoton}>INGRESAR</Text>
            )}
          </TouchableOpacity>

          <View style={styles.separador}>
            <View style={styles.linea} />
            <Text style={styles.textoSeparador}>O</Text>
            <View style={styles.linea} />
          </View>

          <TouchableOpacity
            style={styles.botonRegistro}
            onPress={() => navigation.navigate("Registro")}
            disabled={cargando}
          >
            <Text style={styles.textoRegistro}>REGÍSTRATE</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colores.fondo,
  },

  contenido: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 35,
  },

  encabezado: {
    alignItems: "center",
    marginBottom: 25,
  },

  iconoPrincipal: {
    width: 76,
    height: 76,
    backgroundColor: colores.primario,
    borderRadius: 38,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  titulo: {
    fontSize: 30,
    fontWeight: "bold",
    color: colores.primario,
    textAlign: "center",
  },

  subtitulo: {
    fontSize: 15,
    color: colores.textoSecundario,
    marginTop: 8,
    textAlign: "center",
  },

  cuadro: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colores.blanco,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colores.borde,
    elevation: 3,
    shadowColor: colores.primario,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: colores.texto,
    marginBottom: 8,
  },

  campo: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 52,
    backgroundColor: colores.fondoInput,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: colores.texto,
    paddingHorizontal: 10,
    height: "100%",
    minWidth: 0,
  },

  botonOjo: {
    padding: 5,
  },

  botonIngresar: {
    width: "100%",
    height: 52,
    backgroundColor: colores.boton,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },

  botonDeshabilitado: {
    opacity: 0.6,
  },

  textoBoton: {
    color: colores.blanco,
    fontSize: 16,
    fontWeight: "bold",
  },

  separador: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },

  linea: {
    flex: 1,
    height: 1,
    backgroundColor: colores.borde,
  },

  textoSeparador: {
    marginHorizontal: 15,
    color: colores.textoSecundario,
  },

  botonRegistro: {
    width: "100%",
    height: 52,
    borderWidth: 1.5,
    borderColor: colores.primario,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colores.blanco,
  },

  textoRegistro: {
    color: colores.primario,
    fontSize: 15,
    fontWeight: "bold",
  },
});
