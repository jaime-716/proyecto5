
import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../database/supabase";
import { colores } from "../../tema/colores";

type Detalle = {
  id: number;
  producto_id: number;
  cantidad: number;
  precio: number;
  Producto?: {
    nombre: string;
    descripcion: string | null;
    precio: number;
  } | null;
};

const estados = [
  "PENDIENTE",
  "EN PREPARACIÓN",
  "LISTO",
  "ENTREGADO",
];

export default function DetallesAdmin({
  route,
  navigation,
}: any) {
  const pedidoId = route?.params?.pedidoId;

  const [detalles, setDetalles] = useState<Detalle[]>([]);
  const [estado, setEstado] = useState("PENDIENTE");
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  const cargarDatos = async () => {
    try {
      setCargando(true);

      const { data: pedido, error: errorPedido } =
        await supabase
          .from("Pedido")
          .select("id, estado")
          .eq("id", pedidoId)
          .single();

      if (errorPedido || !pedido) {
        console.log("ERROR PEDIDO:", errorPedido);
        Alert.alert("Error", "No se pudo consultar el pedido");
        return;
      }

      setEstado(pedido.estado);

      const { data, error } = await supabase
        .from("DetallePedido")
        .select(`
          id,
          producto_id,
          cantidad,
          precio,
          Producto (
            nombre,
            descripcion,
            precio
          )
        `)
        .eq("pedido_id", pedidoId)
        .order("id", { ascending: true });

      if (error) {
        console.log("ERROR DETALLES:", error);
        Alert.alert(
          "Error",
          "No se pudieron cargar los detalles"
        );
        return;
      }

      setDetalles((data ?? []) as unknown as Detalle[]);
    } catch (error) {
      console.log("ERROR CARGANDO DATOS:", error);
      Alert.alert("Error", "No se pudieron cargar los datos");
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [pedidoId])
  );

  const actualizarEstado = async (nuevoEstado: string) => {
    if (actualizando || nuevoEstado === estado) return;

    Alert.alert(
      "Confirmar cambio",
      `¿Cambiar el estado del pedido a ${nuevoEstado}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              setActualizando(true);

              const { data, error } = await supabase
                .from("Pedido")
                .update({ estado: nuevoEstado })
                .eq("id", pedidoId)
                .eq("estado", estado)
                .select("id, estado")
                .maybeSingle();

              if (error) {
                console.log("ERROR ACTUALIZANDO:", error);
                Alert.alert(
                  "Error",
                  "No se pudo actualizar el estado: " +
                    error.message
                );
                return;
              }

              if (!data) {
                Alert.alert(
                  "No actualizado",
                  "El pedido pudo haber cambiado. " +
                    "Se actualizarán sus datos."
                );
                await cargarDatos();
                return;
              }

              setEstado(data.estado);

              Alert.alert(
                "Éxito",
                "Estado actualizado correctamente"
              );
            } catch (error: any) {
              console.log("ERROR ESTADO:", error);
              Alert.alert(
                "Error",
                error?.message || "No se pudo actualizar"
              );
            } finally {
              setActualizando(false);
            }
          },
        },
      ]
    );
  };

  const avanzarEstado = () => {
    const posicion = estados.indexOf(estado);

    if (posicion >= 0 && posicion < estados.length - 1) {
      actualizarEstado(estados[posicion + 1]);
    }
  };

  const formatoPrecio = (valor: number) =>
    Number(valor).toLocaleString("es-CO");

  const totalDetalles = detalles.reduce(
    (total, item) => total + item.precio * item.cantidad,
    0
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={detalles}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.contenido}
        ListHeaderComponent={
          <View>
            <Text style={styles.titulo}>
              Detalle pedido #{pedidoId}
            </Text>

            <View style={styles.panelEstado}>
              <Text style={styles.subtitulo}>
                Estado del pedido
              </Text>

              <Text style={styles.estado}>
                {estado}
              </Text>

              {estado !== "ENTREGADO" &&
                !cargando &&
                estados.includes(estado) && (
                  <TouchableOpacity
                    style={[
                      styles.boton,
                      actualizando && styles.deshabilitado,
                    ]}
                    onPress={avanzarEstado}
                    disabled={actualizando}
                  >
                    <Text style={styles.textoBoton}>
                      {actualizando
                        ? "ACTUALIZANDO..."
                        : `CAMBIAR A ${
                            estados[
                              estados.indexOf(estado) + 1
                            ]
                          }`}
                    </Text>
                  </TouchableOpacity>
                )}
            </View>

            <Text style={styles.subtituloProductos}>
              Productos del pedido
            </Text>
          </View>
        }
        ListEmptyComponent={
          cargando ? (
            <ActivityIndicator
              color={colores.primario}
              size="large"
            />
          ) : (
            <Text style={styles.sinDetalles}>
              No hay detalles registrados.
            </Text>
          )
        }
        renderItem={({ item }) => {
          const subtotal = item.precio * item.cantidad;

          return (
            <View style={styles.tarjeta}>
              <Text style={styles.nombre}>
                {item.Producto?.nombre || "Producto"}
              </Text>

              <Text style={styles.texto}>
                Descripción:{" "}
                {item.Producto?.descripcion ||
                  "Sin descripción"}
              </Text>

              <Text style={styles.texto}>
                Precio unitario: $
                {formatoPrecio(item.precio)}
              </Text>

              <Text style={styles.texto}>
                Cantidad: {item.cantidad}
              </Text>

              <Text style={styles.subtotal}>
                Subtotal: ${formatoPrecio(subtotal)}
              </Text>
            </View>
          );
        }}
        ListFooterComponent={
          !cargando && detalles.length > 0 ? (
            <View style={styles.resumen}>
              <Text style={styles.total}>
                Total: ${formatoPrecio(totalDetalles)}
              </Text>
            </View>
          ) : null
        }
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
    paddingBottom: 45,
    flexGrow: 1,
  },

  titulo: {
    color: colores.primario,
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 22,
    marginTop: 10,
  },

  panelEstado: {
    backgroundColor: colores.fondoTarjeta,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: colores.borde,
    marginBottom: 25,
    alignItems: "center",
  },

  subtitulo: {
    color: colores.primario,
    fontSize: 19,
    fontWeight: "bold",
  },

  estado: {
    color: colores.primario,
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 15,
  },

  boton: {
    backgroundColor: colores.boton,
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },

  textoBoton: {
    color: colores.blanco,
    fontWeight: "bold",
    fontSize: 15,
    textAlign: "center",
  },

  deshabilitado: {
    opacity: 0.5,
  },

  subtituloProductos: {
    color: colores.primario,
    fontSize: 21,
    fontWeight: "bold",
    marginBottom: 15,
  },

  tarjeta: {
    backgroundColor: colores.fondoTarjeta,
    padding: 18,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colores.borde,
    marginBottom: 15,
  },

  nombre: {
    color: colores.primario,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },

  texto: {
    color: colores.texto,
    fontSize: 15,
    marginBottom: 6,
  },

  subtotal: {
    color: colores.primario,
    fontWeight: "bold",
    fontSize: 17,
    marginTop: 10,
  },

  resumen: {
    backgroundColor: colores.fondoTarjeta,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: colores.secundario,
    marginTop: 5,
  },

  total: {
    color: colores.primario,
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },

  sinDetalles: {
    color: colores.textoSecundario,
    textAlign: "center",
    fontSize: 16,
    marginTop: 30,
  },
});
