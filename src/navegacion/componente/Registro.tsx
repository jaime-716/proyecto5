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

import Ionicons from "@expo/vector-icons/Ionicons";
import { colores } from "../../tema/colores";
import { supabase } from "../../database/supabase";
import { useAuth } from "../../context/AuthContext";

export default function Registro({ navigation }: any) {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const { actualizarSesion } = useAuth();

  const registrarse = async () => {
    if (cargando) return;

    const correoLimpio = correo.trim().toLowerCase();
    const expresionCorreo = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const expresionPassword = /^(?=.*[A-Za-z])(?=.*\d)[^\s]{6,}$/;

    // Validar campos obligatorios
    if (!correoLimpio || !password || !confirmarPassword) {
      Alert.alert("Campos obligatorios", "Debes completar todos los campos.");
      return;
    }

    // Validar formato del correo
    if (!expresionCorreo.test(correoLimpio)) {
      Alert.alert("Correo inválido", "Ingresa un correo electrónico válido.");
      return;
    }

    // Validar contraseña
    if (!expresionPassword.test(password)) {
      Alert.alert(
        "Contraseña inválida",
        "La contraseña debe tener mínimo 6 caracteres e incluir letras, números y no espacios.",
      );
      return;
    }

    if (password !== confirmarPassword) {
      Alert.alert(
        "Las contraseñas no coinciden",
        "Verifica la confirmación de tu contraseña.",
      );
      return;
    }

    setCargando(true);

    try {
      // 1. Registrar en Supabase Authentication
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: correoLimpio,
        password,
      });

      if (authError) {
        console.error("ERROR AUTH:", authError.message);

        Alert.alert(
          "Error de registro",
          "No fue posible crear la cuenta. Verifica los datos o intenta con otro correo.",
        );
        return;
      }

      if (!authData.user) {
        Alert.alert("Error", "No fue posible completar el registro.");
        return;
      }

      // Supabase puede requerir confirmación por correo.
      // Sin sesión, no intentamos escribir en Usuario
      // desde una cuenta no autenticada.
      if (!authData.session) {
        Alert.alert(
          "Revisa tu correo",
          "Si el registro se completó, recibirás un enlace de confirmación. Confirma tu correo antes de iniciar sesión.",
          [
            {
              text: "Ir al inicio de sesión",
              onPress: () => navigation.replace("Login"),
            },
          ],
        );
        return;
      }

      // 2. Crear perfil en la tabla Usuario
      
const { data: usuarioNuevo, error: usuarioError } =
  await supabase
    .from("Usuario")
    .insert({
      correo: correoLimpio,
      auth_id: authData.user.id,
      rol: "CLIENTE",
      estado: "ACTIVO",
    })
    .select()
    .single();


      if (usuarioError || !usuarioNuevo) {
        console.error("ERROR USUARIO:", usuarioError);

        // Evitar que quede abierta una sesión
        // sin el perfil requerido por la aplicación.
        await supabase.auth.signOut();

        Alert.alert(
          "Registro incompleto",
          "Se creó la cuenta de autenticación, pero no se pudo guardar el perfil. Contacta al administrador antes de intentar registrarte nuevamente.",
          [
            {
              text: "Aceptar",
              onPress: () => navigation.replace("Login"),
            },
          ],
        );
        return;
      }

      // 3. Limpiar formulario
      setCorreo("");
      setPassword("");
      setConfirmarPassword("");

      // 4. Continuar al perfil
     
Alert.alert(
  "Registro exitoso",
  "Tu cuenta fue creada correctamente. Completa tus datos personales para continuar."
);

await actualizarSesion();

    } catch (error: any) {
      console.error("ERROR REGISTRO:", error);

      Alert.alert(
        "Error de conexión",
        "Ocurrió un problema al registrar la cuenta. Verifica tu conexión e inténtalo nuevamente.",
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
              name="person-add-outline"
              size={34}
              color={colores.secundario}
            />
          </View>

          <Text style={styles.titulo}>Crear cuenta</Text>
          <Text style={styles.subtitulo}>
            Regístrate para disfrutar de nuestro restaurante
          </Text>
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
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={colores.textoSecundario}
              secureTextEntry={!mostrarPassword}
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
              editable={!cargando}
            />

            <TouchableOpacity
              style={styles.botonOjo}
              onPress={() => setMostrarPassword(!mostrarPassword)}
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

          <Text style={styles.label}>Confirmar contraseña</Text>

          <View style={styles.campo}>
            <Ionicons
              name="shield-checkmark-outline"
              size={21}
              color={colores.primario}
            />

            <TextInput
              style={styles.input}
              placeholder="Repite tu contraseña"
              placeholderTextColor={colores.textoSecundario}
              secureTextEntry={!mostrarPassword}
              autoCapitalize="none"
              autoCorrect={false}
              value={confirmarPassword}
              onChangeText={setConfirmarPassword}
              editable={!cargando}
            />
          </View>

          <Text style={styles.ayuda}>
            Utiliza al menos 6 caracteres, incluyendo letras, numero y sin espacios.
          </Text>

          <TouchableOpacity
            style={[styles.boton, cargando && styles.botonDeshabilitado]}
            onPress={registrarse}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color={colores.blanco} />
            ) : (
              <Text style={styles.textoBoton}>REGISTRARSE</Text>
            )}
          </TouchableOpacity>

          <View style={styles.separador}>
            <View style={styles.linea} />
            <Text style={styles.textoSeparador}>O</Text>
            <View style={styles.linea} />
          </View>

          <TouchableOpacity
            style={styles.botonVolver}
            disabled={cargando}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.textoVolver}>YA TENGO UNA CUENTA</Text>
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
    paddingVertical: 30,
  },

  encabezado: {
    alignItems: "center",
    marginBottom: 24,
  },

  iconoPrincipal: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colores.primario,
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
    textAlign: "center",
    marginTop: 8,
  },

  cuadro: {
    width: "100%",
    maxWidth: 400,
    padding: 24,
    backgroundColor: colores.blanco,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colores.borde,
    elevation: 3,
    shadowColor: colores.primario,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },

  label: {
    color: colores.texto,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },

  campo: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    width: "100%",
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 10,
    backgroundColor: colores.fondoInput,
    paddingHorizontal: 12,
    marginBottom: 18,
  },

  input: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    paddingHorizontal: 10,
    fontSize: 16,
    color: colores.texto,
  },

  botonOjo: {
    padding: 5,
  },

  ayuda: {
    fontSize: 12,
    color: colores.textoSecundario,
    marginBottom: 20,
    lineHeight: 18,
  },

  boton: {
    height: 52,
    width: "100%",
    backgroundColor: colores.boton,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
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
    height: 1,
    flex: 1,
    backgroundColor: colores.borde,
  },

  textoSeparador: {
    color: colores.textoSecundario,
    marginHorizontal: 15,
  },

  botonVolver: {
    height: 52,
    width: "100%",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colores.primario,
    backgroundColor: colores.blanco,
    justifyContent: "center",
    alignItems: "center",
  },

  textoVolver: {
    color: colores.primario,
    fontWeight: "bold",
    fontSize: 15,
  },
});
