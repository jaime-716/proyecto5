
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from "react-native";

import { supabase } from "../../database/supabase";
import { colores } from "../../tema/colores";

type Props = {
  navigation: any;
  tipo: "ADMIN" | "CLIENTE";
  usuarioId?: number;
  correo?: string;
  children?: React.ReactNode;
};

export default function Menu({
  navigation,
  tipo,
  usuarioId,
  correo,
  children,
}: Props) {
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  // Cerrar sesión mediante Supabase
  const cerrarSesion = async () => {
    if (cerrandoSesion) return;

    setCerrandoSesion(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        Alert.alert(
          "Error",
          "No se pudo cerrar la sesión."
        );
        return;
      }

      // AuthContext detecta SIGNED_OUT.
      // StackNavigator muestra Bienvenida
      // automáticamente.
    } catch (error) {
      console.error("ERROR CERRAR SESIÓN:", error);

      Alert.alert(
        "Error",
        "Ocurrió un problema al cerrar la sesión."
      );
    } finally {
      setCerrandoSesion(false);
    }
  };

  // Opciones según el rol
  const opciones =
    tipo === "CLIENTE"
      ? [
          { titulo: "Perfil", ruta: "Perfil" },
          { titulo: "Pedido", ruta: "Pedido" },
          { titulo: "Reserva", ruta: "Reserva" },
        ]
      : [
          { titulo: "Inicio", ruta: "PanelAdmin" },
          { titulo: "Usuarios", ruta: "UsuariosAdmin" },
          { titulo: "Productos", ruta: "ProductosAdmin" },
          { titulo: "Pedidos", ruta: "PedidosAdmin" },
          { titulo: "Reservas", ruta: "ReservasAdmin" },
        ];

  const irA = (ruta: string) => {
    if (cerrandoSesion) return;

    navigation.navigate(ruta, {
      usuarioId,
      correo,
      ...(ruta === "Perfil"
        ? { primerIngreso: false }
        : {}),
    });
  };

  return (
    <View
      style={[
        styles.contenedor,
        children != null && styles.contenedorCompleto,
      ]}
    >
      <View style={styles.menu}>
        {opciones.map((opcion) => (
          <TouchableOpacity
            key={opcion.ruta}
            style={styles.boton}
            onPress={() => irA(opcion.ruta)}
            disabled={cerrandoSesion}
          >
            <Text style={styles.texto}>
              {opcion.titulo}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {children != null && (
        <View style={styles.contenido}>
          {children}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.botonSalir,
          cerrandoSesion && styles.botonDeshabilitado,
        ]}
        onPress={cerrarSesion}
        disabled={cerrandoSesion}
      >
        {cerrandoSesion ? (
          <ActivityIndicator color={colores.blanco} />
        ) : (
          <Text style={styles.textoSalir}>
            Cerrar sesión
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    width: "100%",
  },

  contenedorCompleto: {
    flex: 1,
  },

  menu: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    marginBottom: 10,
  },

  boton: {
    width: "48%",
    backgroundColor: colores.blanco,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.secundario,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },

  texto: {
    color: colores.primario,
    fontWeight: "bold",
    fontSize: 15,
  },

  contenido: {
    flex: 1,
  },

  botonSalir: {
    backgroundColor: colores.primario,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 8,
  },

  botonDeshabilitado: {
    opacity: 0.6,
  },

  textoSalir: {
    color: colores.blanco,
    fontWeight: "bold",
    fontSize: 16,
  },
});
