import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";

import Menu from "./Menu";
import { supabase } from "../../database/supabase";
import { colores } from "../../tema/colores";
import { useAuth } from "../../context/AuthContext";

export default function Perfil({ route, navigation }: any) {
  const { usuarioId, correo, primerIngreso = false } = route.params || {};

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correoUsuario, setCorreoUsuario] = useState(correo || "");
  const { usuario, actualizarSesion } = useAuth();

  // Cargar perfil desde la tabla Usuario

  const cargarPerfil = async () => {
    if (!usuario?.auth_id) {
      console.log("No se encontró el usuario autenticado");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("Usuario")
        .select("id, nombre, apellido, correo")
        .eq("auth_id", usuario.auth_id)
        .single();

      if (error) {
        console.log("ERROR CARGANDO PERFIL:", error);

        Alert.alert("Error", "No se pudo cargar la información del perfil");
        return;
      }

      if (data) {
        setNombre(data.nombre || "");
        setApellido(data.apellido || "");
        setCorreoUsuario(data.correo || "");
      }
    } catch (error) {
      console.log("ERROR PERFIL:", error);
    }
  };

  useEffect(() => {
    if (usuario?.auth_id) {
      void cargarPerfil();
    }
  }, [usuario?.auth_id]);

  const guardarPerfil = async () => {
    const nombreLimpio = nombre.trim();
    const apellidoLimpio = apellido.trim();

    if (nombreLimpio === "" || apellidoLimpio === "") {
      Alert.alert("Error", "Debes completar nombre y apellido");
      return;
    }

    if (!usuarioId) {
      Alert.alert("Error", "No se encontró el usuario");
      return;
    }

    try {
      console.log("ID USUARIO A ACTUALIZAR:", usuarioId);
      console.log("NOMBRE:", nombreLimpio);
      console.log("APELLIDO:", apellidoLimpio);

      if (!usuario?.auth_id) {
        Alert.alert("Error", "No se encontró una sesión de usuario válida.");
        return;
      }

      const { data, error } = await supabase
        .from("Usuario")
        .update({
          nombre: nombreLimpio,
          apellido: apellidoLimpio,
        })
        .eq("auth_id", usuario.auth_id)
        .select("id, nombre, apellido, correo")
        .single();

      if (error) {
        console.log("ERROR ACTUALIZANDO PERFIL:", error);

        Alert.alert("Error", "No se pudieron actualizar los datos");
        return;
      }

      console.log("USUARIO ACTUALIZADO:", data);

      if (!data) {
        Alert.alert("Error", "El usuario no fue actualizado");
        return;
      }

      await actualizarSesion();

      Alert.alert("Éxito", "Perfil actualizado correctamente.");

      navigation.navigate("Home", {
        usuarioId: data.id,
        correo: data.correo,
      });
    } catch (error: any) {
      console.log("ERROR PERFIL:", error);

      Alert.alert(
        "Error",
        error?.message || "No se pudieron guardar los datos",
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cuadro}>
        <Text style={styles.titulo}>Mi Perfil</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre"
          placeholderTextColor={colores.textoSecundario}
          value={nombre}
          onChangeText={setNombre}
        />

        <TextInput
          style={styles.input}
          placeholder="Apellido"
          placeholderTextColor={colores.textoSecundario}
          value={apellido}
          onChangeText={setApellido}
        />

        <TextInput
          style={[styles.input, styles.inputDeshabilitado]}
          placeholder="Correo"
          placeholderTextColor={colores.textoSecundario}
          value={correoUsuario}
          editable={false}
        />

        <TouchableOpacity style={styles.boton} onPress={guardarPerfil}>
          <Text style={styles.textoBoton}>Actualizar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colores.fondo,
    padding: 25,
  },

  cuadro: {
    backgroundColor: colores.blanco,
    padding: 25,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colores.secundario,
  },

  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: colores.texto,
    textAlign: "center",
    marginBottom: 25,
  },

  input: {
    height: 50,
    backgroundColor: colores.blanco,
    color: colores.texto,
    borderWidth: 1,
    borderColor: colores.secundario,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
  },

  inputDeshabilitado: {
    backgroundColor: colores.fondo,
    color: colores.textoSecundario,
  },

  boton: {
    height: 50,
    backgroundColor: colores.primario,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  textoBoton: {
    color: colores.blanco,
    fontSize: 16,
    fontWeight: "bold",
  },
});
