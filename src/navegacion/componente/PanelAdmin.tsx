
import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { supabase } from "../../database/supabase";
import { colores } from "../../tema/colores";

type Usuario = {
  id: number;
  correo: string;
  estado: string;
  rol: string | null;
};

const opciones = [
  {
    titulo: "Usuarios",
    icono: "people-outline",
    pantalla: "UsuariosAdmin",
  },
  {
    titulo: "Productos",
    icono: "restaurant-outline",
    pantalla: "ProductosAdmin",
  },
  {
    titulo: "Pedidos",
    icono: "receipt-outline",
    pantalla: "PedidosAdmin",
  },
  {
    titulo: "Reservas",
    icono: "calendar-outline",
    pantalla: "ReservasAdmin",
  },
] as const;

export default function PanelAdmin({ navigation }: any) {
  const [usuariosPendientes, setUsuariosPendientes] =
    useState<Usuario[]>([]);

  const [pedidosPendientes, setPedidosPendientes] =
    useState<number | null>(null);

  const [cargando, setCargando] = useState(false);

  const [cargandoPedidos, setCargandoPedidos] =
    useState(false);

  const [cerrandoSesion, setCerrandoSesion] =
    useState(false);

  // CONSULTAR USUARIOS PENDIENTES
  const cargarUsuariosPendientes = useCallback(async () => {
    setCargando(true);

    try {
      const { data, error } = await supabase
        .from("Usuario")
        .select("id, correo, estado, rol")
        .eq("estado", "PENDIENTE")
        .order("id", { ascending: false });

      if (error) {
        console.log("Error cargando usuarios:", error);

        Alert.alert(
          "Error",
          "No se pudieron cargar los usuarios pendientes"
        );

        return;
      }

      setUsuariosPendientes(data || []);
    } catch (error) {
      console.log("Error cargando usuarios:", error);

      Alert.alert(
        "Error",
        "No se pudieron cargar los usuarios pendientes"
      );
    } finally {
      setCargando(false);
    }
  }, []);

  // CONTAR PEDIDOS PENDIENTES
  const cargarPedidosPendientes = useCallback(async () => {
    setCargandoPedidos(true);

    try {
      const { count, error } = await supabase
        .from("Pedido")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("estado", "PENDIENTE");

      if (error) {
        console.log(
          "ERROR CONTANDO PEDIDOS PENDIENTES:",
          error
        );

        setPedidosPendientes(null);
        return;
      }

      setPedidosPendientes(count ?? 0);
    } catch (error) {
      console.log(
        "ERROR CARGANDO PEDIDOS PENDIENTES:",
        error
      );

      setPedidosPendientes(null);
    } finally {
      setCargandoPedidos(false);
    }
  }, []);

  // ACTUALIZAR LOS DATOS DEL PANEL
  const actualizarPanel = useCallback(async () => {
    await Promise.all([
      cargarUsuariosPendientes(),
      cargarPedidosPendientes(),
    ]);
  }, [
    cargarUsuariosPendientes,
    cargarPedidosPendientes,
  ]);

  // CONSULTAR CUANDO SE ABRE EL PANEL
  useFocusEffect(
    useCallback(() => {
      void actualizarPanel();
    }, [actualizarPanel])
  );

  // ACTIVAR USUARIO PENDIENTE
  const activarUsuario = async (
    id: number,
    rol: "ADMIN" | "CLIENTE"
  ) => {
    try {
      const { error } = await supabase.rpc(
        "activar_usuario_pendiente",
        {
          p_usuario_id: id,
          p_rol: rol,
        }
      );

      if (error) {
        console.log("Error activando usuario:", error);

        Alert.alert(
          "Error",
          "No se pudo activar el usuario"
        );

        return;
      }

      Alert.alert(
        "Usuario activado",
        `La cuenta fue activada con el rol ${rol}`
      );

      await cargarUsuariosPendientes();
    } catch (error) {
      console.log("Error activando usuario:", error);

      Alert.alert(
        "Error",
        "No se pudo activar el usuario"
      );
    }
  };

  // CONFIRMAR ACTIVACIÓN
  const confirmarActivacion = (
    usuario: Usuario,
    rol: "ADMIN" | "CLIENTE"
  ) => {
    Alert.alert(
      "Confirmar activación",
      `¿Deseas activar a ${usuario.correo} como ${rol}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Activar",
          onPress: () =>
            void activarUsuario(usuario.id, rol),
        },
      ]
    );
  };

  // CERRAR SESIÓN
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
      // StackNavigator redirige automáticamente
      // a la pantalla Bienvenida.
    } catch (error) {
      console.error("Error cerrando sesión:", error);

      Alert.alert(
        "Error",
        "No se pudo cerrar la sesión."
      );
    } finally {
      setCerrandoSesion(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["bottom"]}
    >
      <FlatList
        style={styles.lista}
        contentContainerStyle={styles.listaContenido}
        showsVerticalScrollIndicator={false}
        refreshing={cargando || cargandoPedidos}
        onRefresh={() => void actualizarPanel()}
        data={usuariosPendientes}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <>
            <View style={styles.tarjetaPrincipal}>
              <Ionicons
                name="shield-checkmark-outline"
                size={44}
                color={colores.primario}
              />

              <Text style={styles.titulo}>
                Panel Administrador
              </Text>

              <Text style={styles.subtitulo}>
                Gestiona tu restaurante desde un solo lugar.
              </Text>

              <View style={styles.separador} />

              {/* CONTADOR REAL DE PEDIDOS */}
              <View style={styles.resumen}>
                {cargandoPedidos ? (
                  <ActivityIndicator
                    size="large"
                    color={colores.primario}
                  />
                ) : (
                  <Text style={styles.numero}>
                    {pedidosPendientes === null
                      ? "—"
                      : pedidosPendientes}
                  </Text>
                )}

                <Text style={styles.resumenTexto}>
                  Pedidos pendientes
                </Text>

                {!cargandoPedidos &&
                  pedidosPendientes === null && (
                    <Text style={styles.textoError}>
                      No se pudo consultar el total.
                    </Text>
                  )}
              </View>

              {/* ACCESOS RÁPIDOS */}
              <Text style={styles.seccionTitulo}>
                Accesos rápidos
              </Text>

              <View style={styles.contenedorOpciones}>
                {opciones.map((opcion) => (
                  <TouchableOpacity
                    key={opcion.pantalla}
                    style={styles.botonPrincipal}
                    onPress={() =>
                      navigation.navigate(opcion.pantalla)
                    }
                    accessibilityRole="button"
                    accessibilityLabel={opcion.titulo}
                  >
                    <Ionicons
                      name={opcion.icono}
                      size={25}
                      color={colores.blanco}
                    />

                    <Text style={styles.textoBotonPrincipal}>
                      {opcion.titulo}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={styles.tituloPendientes}>
              Solicitudes pendientes
            </Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.vacio}>
            {cargando ? (
              <ActivityIndicator
                color={colores.boton}
              />
            ) : (
              <Ionicons
                name="checkmark-circle-outline"
                size={32}
                color={colores.boton}
              />
            )}

            <Text style={styles.textoVacio}>
              {cargando
                ? "Cargando usuarios..."
                : "No hay usuarios pendientes"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.tarjetaUsuario}>
            <Text style={styles.correo}>
              {item.correo}
            </Text>

            <Text style={styles.estado}>
              Estado: {item.estado}
            </Text>

            <Text style={styles.textoRol}>
              Activar usuario como:
            </Text>

            <View style={styles.contenedorBotones}>
              <TouchableOpacity
                style={styles.botonCliente}
                onPress={() =>
                  confirmarActivacion(item, "CLIENTE")
                }
              >
                <Text style={styles.textoCliente}>
                  Cliente
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botonAdmin}
                onPress={() =>
                  confirmarActivacion(item, "ADMIN")
                }
              >
                <Text style={styles.textoAdmin}>
                  Administrador
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* BOTÓN CERRAR SESIÓN */}
      <TouchableOpacity
        style={styles.botonSalir}
        onPress={cerrarSesion}
        disabled={cerrandoSesion}
        accessibilityRole="button"
      >
        <Ionicons
          name="log-out-outline"
          size={21}
          color={colores.blanco}
        />

        <Text style={styles.textoSalir}>
          {cerrandoSesion
            ? "Cerrando sesión..."
            : "Cerrar sesión"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colores.fondo,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },

  lista: {
    flex: 1,
  },

  listaContenido: {
    paddingVertical: 12,
    paddingBottom: 25,
  },

  tarjetaPrincipal: {
    backgroundColor: colores.blanco,
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colores.secundario,
    elevation: 3,
  },

  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: colores.primario,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 8,
  },

  subtitulo: {
    fontSize: 15,
    color: colores.textoSecundario,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },

  separador: {
    height: 3,
    width: 70,
    borderRadius: 10,
    backgroundColor: colores.secundario,
    marginBottom: 18,
  },

  resumen: {
    width: "100%",
    backgroundColor: colores.fondo,
    borderRadius: 12,
    padding: 17,
    alignItems: "center",
    marginBottom: 22,
    minHeight: 88,
    justifyContent: "center",
  },

  numero: {
    fontSize: 35,
    fontWeight: "bold",
    color: colores.primario,
  },

  resumenTexto: {
    fontSize: 14,
    color: colores.textoSecundario,
    textAlign: "center",
  },

  textoError: {
    fontSize: 12,
    color: colores.error,
    marginTop: 5,
    textAlign: "center",
  },

  seccionTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: colores.primario,
    marginBottom: 14,
    alignSelf: "flex-start",
  },

  contenedorOpciones: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },

  botonPrincipal: {
    width: "48%",
    minHeight: 85,
    backgroundColor: colores.boton,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    gap: 7,
  },

  textoBotonPrincipal: {
    color: colores.blanco,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },

  tituloPendientes: {
    fontSize: 20,
    fontWeight: "bold",
    color: colores.primario,
    marginTop: 24,
    marginBottom: 14,
  },

  tarjetaUsuario: {
    backgroundColor: colores.blanco,
    padding: 18,
    borderRadius: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colores.secundario,
    elevation: 2,
  },

  correo: {
    fontSize: 16,
    fontWeight: "bold",
    color: colores.texto,
    marginBottom: 8,
  },

  estado: {
    color: colores.textoSecundario,
    fontSize: 14,
    marginBottom: 14,
  },

  textoRol: {
    color: colores.primario,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },

  contenedorBotones: {
    flexDirection: "row",
    gap: 10,
  },

  botonCliente: {
    flex: 1,
    paddingVertical: 13,
    backgroundColor: colores.secundario,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  textoCliente: {
    color: colores.texto,
    fontWeight: "bold",
  },

  botonAdmin: {
    flex: 1,
    paddingVertical: 13,
    backgroundColor: colores.boton,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  textoAdmin: {
    color: colores.blanco,
    fontWeight: "bold",
    fontSize: 13,
  },

  vacio: {
    backgroundColor: colores.blanco,
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colores.secundario,
  },

  textoVacio: {
    color: colores.textoSecundario,
    textAlign: "center",
    fontSize: 15,
  },

  botonSalir: {
    backgroundColor: colores.primario,
    minHeight: 52,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    marginTop: 10,
  },

  textoSalir: {
    color: colores.blanco,
    fontSize: 16,
    fontWeight: "bold",
  },
});
