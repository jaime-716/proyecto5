
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

type Reserva = {
  id: number;
  usuario_id: number;
  fecha: string;
  hora: string;
  cantidad_personas: number;
  estado: string;
  Usuario?: {
    nombre: string | null;
    apellido: string | null;
    correo: string;
  } | null;
};

export default function ReservasAdmin({ navigation }: any) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizandoId, setActualizandoId] =
    useState<number | null>(null);

  const cargarReservas = async () => {
    try {
      setCargando(true);

      const { data, error } = await supabase
        .from("Reserva")
        .select(`
          id,
          usuario_id,
          fecha,
          hora,
          cantidad_personas,
          estado,
          Usuario (
            nombre,
            apellido,
            correo
          )
        `)
        .order("fecha", { ascending: true });

      if (error) {
        console.log("ERROR CARGANDO RESERVAS:", error);
        Alert.alert(
          "Error",
          "No se pudieron cargar las reservas"
        );
        return;
      }

      setReservas((data ?? []) as unknown as Reserva[]);
    } catch (error) {
      console.log("ERROR RESERVAS:", error);
      Alert.alert(
        "Error",
        "No se pudieron cargar las reservas"
      );
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarReservas();
    }, [])
  );

  const cambiarEstado = (
    id: number,
    nuevoEstado: "CONFIRMADA" | "CANCELADA"
  ) => {
    if (actualizandoId !== null) return;

    Alert.alert(
      "Confirmar cambio",
      `¿Deseas marcar esta reserva como ${nuevoEstado}?`,
      [
        {
          text: "Volver",
          style: "cancel",
        },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              setActualizandoId(id);

              const { data, error } = await supabase
                .from("Reserva")
                .update({ estado: nuevoEstado })
                .eq("id", id)
                .eq("estado", "PENDIENTE")
                .select("id, estado")
                .maybeSingle();

              if (error) {
                console.log(
                  "ERROR ACTUALIZANDO RESERVA:",
                  error
                );
                Alert.alert(
                  "Error",
                  "No se pudo actualizar: " + error.message
                );
                return;
              }

              if (!data) {
                Alert.alert(
                  "No actualizada",
                  "La reserva ya cambió o no tienes permiso."
                );
                return;
              }

              Alert.alert(
                "Reserva actualizada",
                `La reserva fue marcada como ${nuevoEstado}`
              );
            } catch (error: any) {
              console.log("ERROR CAMBIANDO ESTADO:", error);
              Alert.alert(
                "Error",
                error?.message ||
                  "No se pudo actualizar la reserva"
              );
            } finally {
              setActualizandoId(null);
              await cargarReservas();
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={reservas}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.contenido}
        refreshing={cargando && reservas.length > 0}
        onRefresh={cargarReservas}
        ListHeaderComponent={
          <Text style={styles.titulo}>
            Reservas del restaurante
          </Text>
        }
        ListEmptyComponent={
          cargando ? (
            <ActivityIndicator
              size="large"
              color={colores.primario}
              style={styles.cargando}
            />
          ) : (
            <Text style={styles.sinReservas}>
              No hay reservas registradas.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.tarjeta}>
            <Text style={styles.numeroReserva}>
              Reserva #{item.id}
            </Text>

            <Text style={styles.texto}>
              Cliente: {item.Usuario?.nombre || "Sin nombre"}{" "}
              {item.Usuario?.apellido || ""}
            </Text>

            <Text style={styles.texto}>
              Correo:{" "}
              {item.Usuario?.correo || "Sin correo"}
            </Text>

            <Text style={styles.texto}>
              Fecha: {item.fecha}
            </Text>

            <Text style={styles.texto}>
              Hora: {item.hora}
            </Text>

            <Text style={styles.texto}>
              Personas: {item.cantidad_personas}
            </Text>

            <Text style={styles.estado}>
              Estado: {item.estado}
            </Text>

            {item.estado === "PENDIENTE" && (
              <View style={styles.contenedorBotones}>
                <TouchableOpacity
                  style={[
                    styles.boton,
                    styles.botonConfirmar,
                    actualizandoId !== null &&
                      styles.deshabilitado,
                  ]}
                  disabled={actualizandoId !== null}
                  onPress={() =>
                    cambiarEstado(item.id, "CONFIRMADA")
                  }
                >
                  <Text style={styles.textoBoton}>
                    CONFIRMAR
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.boton,
                    styles.botonCancelar,
                    actualizandoId !== null &&
                      styles.deshabilitado,
                  ]}
                  disabled={actualizandoId !== null}
                  onPress={() =>
                    cambiarEstado(item.id, "CANCELADA")
                  }
                >
                  <Text style={styles.textoBoton}>
                    CANCELAR
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
    paddingBottom: 45,
    flexGrow: 1,
  },

  titulo: {
    color: colores.primario,
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 24,
  },

  tarjeta: {
    backgroundColor: colores.fondoTarjeta,
    padding: 18,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colores.borde,
    marginBottom: 16,
  },

  numeroReserva: {
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
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },

  contenedorBotones: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },

  boton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
  },

  botonConfirmar: {
    backgroundColor: colores.boton,
  },

  botonCancelar: {
    backgroundColor: colores.error,
  },

  textoBoton: {
    color: colores.blanco,
    fontWeight: "bold",
    fontSize: 14,
  },

  deshabilitado: {
    opacity: 0.5,
  },

  sinReservas: {
    color: colores.textoSecundario,
    textAlign: "center",
    fontSize: 16,
    marginTop: 40,
  },

  cargando: {
    marginTop: 40,
  },
});
