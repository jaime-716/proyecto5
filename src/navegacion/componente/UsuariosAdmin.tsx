
import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";

import Menu from "./Menu";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../database/supabase";
import { colores } from "../../tema/colores";

type Usuario = {
  id: number;
  nombre: string | null;
  apellido: string | null;
  correo: string;
  rol: string | null;
  estado: string;
};

export default function UsuariosAdmin({ navigation }: any) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);

    try {
      const { data, error } = await supabase
        .from("Usuario")
        .select(
          "id, nombre, apellido, correo, rol, estado"
        )
        .order("nombre", {
          ascending: true,
          nullsFirst: false,
        });

      if (error) {
        throw error;
      }

      setUsuarios(data || []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);

      Alert.alert(
        "Error",
        "No se pudo cargar el listado de usuarios."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargarUsuarios();
    }, [cargarUsuarios])
  );

  return (
    <View style={styles.container}>
      <Menu
        navigation={navigation}
        tipo="ADMIN"
      />

      <Text style={styles.titulo}>
        Usuarios registrados
      </Text>

      {cargando ? (
        <View style={styles.cargando}>
          <ActivityIndicator
            size="large"
            color={colores.primario}
          />
          <Text style={styles.textoCarga}>
            Cargando usuarios...
          </Text>
        </View>
      ) : usuarios.length === 0 ? (
        <View style={styles.vacio}>
          <Text style={styles.sinUsuarios}>
            No hay usuarios registrados.
          </Text>
        </View>
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <View style={styles.tarjeta}>
              <Text style={styles.nombre}>
                {item.nombre || "Sin nombre"}{" "}
                {item.apellido || ""}
              </Text>

              <Text style={styles.texto}>
                Correo: {item.correo}
              </Text>

              <Text style={styles.texto}>
                ID Usuario: {item.id}
              </Text>

              <Text style={styles.texto}>
                Rol: {item.rol || "Sin rol"}
              </Text>

              <Text style={styles.texto}>
                Estado: {item.estado}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colores.fondo,
    padding: 16,
  },

  titulo: {
    color: colores.primario,
    fontSize: 27,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
  },

  lista: {
    paddingBottom: 20,
  },

  tarjeta: {
    backgroundColor: colores.blanco,
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colores.secundario,
    elevation: 2,
  },

  nombre: {
    color: colores.primario,
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 8,
  },

  texto: {
    color: colores.texto,
    fontSize: 15,
    marginBottom: 5,
  },

  cargando: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  textoCarga: {
    color: colores.textoSecundario,
    marginTop: 12,
    fontSize: 15,
  },

  vacio: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },

  sinUsuarios: {
    color: colores.textoSecundario,
    textAlign: "center",
    fontSize: 16,
  },
});
