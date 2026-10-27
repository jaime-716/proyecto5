
import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../database/supabase";
import { colores } from "../../tema/colores";

type Pedido = {
  id: number;
  usuario_id: number;
  fecha: string;
  total: number;
  estado: string;
  Usuario?: {
    nombre: string | null;
    apellido: string | null;
    correo: string;
  } | null;
};

export default function PedidosAdmin({ navigation }: any) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarPedidos = async () => {
    try {
      setCargando(true);

      const { data, error } = await supabase
        .from("Pedido")
        .select(`
          id,
          usuario_id,
          fecha,
          total,
          estado,
          Usuario (
            nombre,
            apellido,
            correo
          )
        `)
        .order("id", { ascending: false });

      if (error) {
        console.log("ERROR CARGANDO PEDIDOS:", error);
        Alert.alert("Error", "No se pudieron cargar los pedidos");
        return;
      }

      setPedidos((data ?? []) as unknown as Pedido[]);
    } catch (error) {
      console.log("ERROR PEDIDOS:", error);
      Alert.alert("Error", "No se pudieron cargar los pedidos");
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarPedidos();
    }, [])
  );

  const formatoPrecio = (valor: number) => {
    return Number(valor).toLocaleString("es-CO");
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.contenido}
        ListHeaderComponent={
          <Text style={styles.titulo}>Pedidos realizados</Text>
        }
        ListEmptyComponent={
          cargando ? (
            <ActivityIndicator
              size="large"
              color={colores.primario}
              style={styles.cargando}
            />
          ) : (
            <Text style={styles.sinPedidos}>
              No hay pedidos registrados.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.tarjeta}>
            <Text style={styles.numeroPedido}>
              Pedido #{item.id}
            </Text>

            <Text style={styles.texto}>
              Cliente: {item.Usuario?.nombre || "Sin nombre"}{" "}
              {item.Usuario?.apellido || ""}
            </Text>

            <Text style={styles.texto}>
              Correo: {item.Usuario?.correo || "Sin correo"}
            </Text>

            <Text style={styles.texto}>
              Fecha:{" "}
              {item.fecha
                ? new Date(item.fecha).toLocaleString("es-CO")
                : "Sin fecha"}
            </Text>

            <Text style={styles.estado}>
              Estado: {item.estado}
            </Text>

            <Text style={styles.total}>
              Total: ${formatoPrecio(item.total)}
            </Text>

            <TouchableOpacity
              style={styles.boton}
              onPress={() =>
                navigation.navigate("DetallesAdmin", {
                  pedidoId: item.id,
                })
              }
            >
              <Text style={styles.textoBoton}>
                VER DETALLES
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colores.fondo,
  },

  contenido: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },

  titulo: {
    color: colores.primario,
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
    marginTop: 10,
  },

  tarjeta: {
    backgroundColor: colores.fondoTarjeta,
    padding: 18,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colores.borde,
    marginBottom: 16,
  },

  numeroPedido: {
    color: colores.primario,
    fontSize: 21,
    fontWeight: "bold",
    marginBottom: 12,
  },

  texto: {
    color: colores.texto,
    fontSize: 15,
    marginBottom: 7,
  },

  estado: {
    color: colores.primario,
    fontWeight: "bold",
    fontSize: 15,
    marginTop: 4,
  },

  total: {
    color: colores.primario,
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 12,
  },

  boton: {
    backgroundColor: colores.boton,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 18,
  },

  textoBoton: {
    color: colores.blanco,
    fontSize: 15,
    fontWeight: "bold",
  },

  sinPedidos: {
    color: colores.textoSecundario,
    textAlign: "center",
    fontSize: 16,
    marginTop: 40,
  },

  cargando: {
    marginTop: 40,
  },
});
