
import React, { useCallback, useState } from "react";//
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator, //
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";

import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";

import Ionicons from "@expo/vector-icons/Ionicons";
import { supabase } from "../../database/supabase";
import { colores } from "../../tema/colores";

type ReservaCliente = { //
  id: number;
  fecha: string;
  hora: string;
  cantidad_personas: number;
  estado: string;
};

export default function Reserva({ route }: any) {
  const usuarioId = route?.params?.usuarioId;

  const [fecha, setFecha] = useState("");
  const [fechaSeleccionada, setFechaSeleccionada] =
    useState(new Date());
  const [mostrarCalendario, setMostrarCalendario] =
    useState(false);

  const [hora, setHora] = useState("");
  const [cantidadPersonas, setCantidadPersonas] =
    useState("");

  const [guardando, setGuardando] = useState(false); //
  const [reservas, setReservas] = useState<ReservaCliente[]>([]);
  const [cargandoReservas, setCargandoReservas] =
    useState(false);
  const [errorReservas, setErrorReservas] =
    useState<string | null>(null);

  // Consultar las reservas del cliente
  const cargarReservas = useCallback(async () => {   //
    if (!usuarioId) {
      setReservas([]);
      setErrorReservas("No se pudo identificar al usuario.");
      return;
    }

    setCargandoReservas(true);
    setErrorReservas(null);

    try {
      const { data, error } = await supabase
        .from("Reserva")
        .select(
          "id, fecha, hora, cantidad_personas, estado"
        )
        .eq("usuario_id", usuarioId)
        .order("fecha", { ascending: false })
        .order("hora", { ascending: false });

      if (error) {
        console.log("ERROR CONSULTANDO RESERVAS:", error);
        setErrorReservas(
          "No se pudieron consultar tus reservas."
        );
        return;
      }

      setReservas((data ?? []) as ReservaCliente[]);
    } catch (error) {
      console.log("ERROR CARGANDO RESERVAS:", error);
      setErrorReservas(
        "Ocurrió un problema al consultar tus reservas."
      );
    } finally {
      setCargandoReservas(false);
    }
  }, [usuarioId]);

  // Actualizar al ingresar a esta pantalla
  useFocusEffect(
    useCallback(() => {
      cargarReservas();
    }, [cargarReservas])
  );

  const formatearFecha = (valor: Date) => {
    const anio = valor.getFullYear();
    const mes = String(valor.getMonth() + 1).padStart(2, "0");
    const dia = String(valor.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
  };

  const seleccionarFecha = (valor: Date) => {
    setFechaSeleccionada(valor);
    setFecha(formatearFecha(valor));
  };

  const abrirCalendario = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: fechaSeleccionada,
        mode: "date",
        minimumDate: new Date(),
        onChange: (evento, fechaElegida) => {
          if (evento.type === "set" && fechaElegida) {
            seleccionarFecha(fechaElegida);
          }
        },
      });
    } else {
      setMostrarCalendario(true);
    }
  };

  // Guardar una nueva reserva
  const guardarReserva = async () => {
    if (guardando) return;

    if (
      fecha.trim() === "" ||
      hora.trim() === "" ||
      cantidadPersonas.trim() === ""
    ) {
      Alert.alert("Error", "Debes completar todos los campos");
      return;
    }

    const horaLimpia = hora.trim();
    const formatoHora = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (!formatoHora.test(horaLimpia)) {
      Alert.alert(
        "Hora inválida",
        "Ingresa una hora válida. Ejemplo: 19:30."
      );
      return;
    }

    const fechaHoraReserva = new Date(
      `${fecha}T${horaLimpia}:00`
    );

    if (
      !Number.isFinite(fechaHoraReserva.getTime()) ||
      fechaHoraReserva <= new Date()
    ) {
      Alert.alert(
        "Fecha u hora inválida",
        "Selecciona una fecha y hora futuras."
      );
      return;
    }

    const cantidad = Number(cantidadPersonas);

    if (
      isNaN(cantidad) ||
      cantidad <= 0 ||
      !Number.isInteger(cantidad)
    ) {
      Alert.alert(
        "Error",
        "La cantidad de personas debe ser un número entero mayor a cero"
      );
      return;
    }

    if (!usuarioId) {
      Alert.alert("Error", "No se pudo identificar el usuario");
      return;
    }

    try {
      setGuardando(true);

      const { error } = await supabase
        .from("Reserva")
        .insert({
          usuario_id: usuarioId,
          fecha: fecha,
          hora: horaLimpia,
          cantidad_personas: cantidad,
          estado: "PENDIENTE",
        });

      if (error) {
        console.log("ERROR RESERVA:", error);
        Alert.alert(
          "Error",
          "No se pudo registrar la reserva"
        );
        return;
      }

      Alert.alert(
        "Reserva registrada",
        "Tu solicitud fue registrada correctamente. Está pendiente de confirmación por el restaurante."
      );

      setFecha("");
      setHora("");
      setCantidadPersonas("");
      setFechaSeleccionada(new Date());
      setMostrarCalendario(false);

      await cargarReservas();
    } catch (error: any) {
      console.log("ERROR GUARDANDO RESERVA:", error);

      Alert.alert(
        "Error",
        error?.message || "No se pudo realizar la operación"
      );
    } finally {
      setGuardando(false);
    }
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case "CONFIRMADA":
        return colores.boton;
      case "CANCELADA":
        return colores.error;
      default:
        return "#B7791F";
    }
  };

  const obtenerMensajeEstado = (estado: string) => {
    switch (estado) {
      case "CONFIRMADA":
        return "¡Tu reserva fue confirmada exitosamente! Te esperamos en la fecha y hora programadas.";

      case "CANCELADA":
        return "Esta reserva fue cancelada.";

      case "PENDIENTE":
        return "Tu solicitud está pendiente de confirmación por el restaurante.";

      default:
        return "Consulta el estado de tu reserva.";
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContenido}
        keyboardShouldPersistTaps="handled"
      >
        {/* FORMULARIO ORIGINAL */}
        <View style={styles.tarjeta}>
          <Text style={styles.titulo}>Reserva tu mesa</Text>

          <Text style={styles.subtitulo}>
            Selecciona la fecha y completa los datos
            de tu reserva.
          </Text>

          <Text style={styles.etiqueta}>
            Fecha de reserva
          </Text>

          <TouchableOpacity
            style={styles.campoFecha}
            onPress={abrirCalendario}
          >
            <Text
              style={[
                styles.fechaTexto,
                !fecha && styles.placeholder,
              ]}
            >
              {fecha || "Seleccionar fecha"}
            </Text>

            <Ionicons
              name="calendar-outline"
              size={23}
              color={colores.primario}
            />
          </TouchableOpacity>

          {Platform.OS === "ios" &&
            mostrarCalendario && (
              <View style={styles.calendario}>
                <DateTimePicker
                  value={fechaSeleccionada}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date()}
                  onChange={(_, valor) => {
                    if (valor) {
                      seleccionarFecha(valor);
                    }
                  }}
                />

                <TouchableOpacity
                  style={styles.confirmarFecha}
                  onPress={() =>
                    setMostrarCalendario(false)
                  }
                >
                  <Text style={styles.textoConfirmar}>
                    Listo
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          <Text style={styles.etiqueta}>
            Hora de la reserva
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ejemplo: 19:30"
            placeholderTextColor={
              colores.textoSecundario
            }
            value={hora}
            onChangeText={setHora}
          />

          <Text style={styles.etiqueta}>
            Cantidad de personas
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ejemplo: 2"
            placeholderTextColor={
              colores.textoSecundario
            }
            keyboardType="number-pad"
            value={cantidadPersonas}
            onChangeText={setCantidadPersonas}
          />

          <TouchableOpacity
            style={[
              styles.botonGuardar,
              guardando && styles.botonDeshabilitado,
            ]}
            onPress={guardarReserva}
            disabled={guardando}
          >
            {guardando ? (
              <ActivityIndicator
                color={colores.blanco}
              />
            ) : (
              <Ionicons
                name="checkmark-circle-outline"
                size={21}
                color={colores.blanco}
              />
            )}

            <Text style={styles.textoBoton}>
              {guardando
                ? "Guardando..."
                : "Guardar reserva"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* NUEVA SECCIÓN: MIS RESERVAS */}
        <View style={styles.seccionReservas}>
          <Text style={styles.titulo}>
            Mis reservas
          </Text>

          <TouchableOpacity
            style={[
              styles.botonActualizar,
              cargandoReservas &&
                styles.botonDeshabilitado,
            ]}
            onPress={cargarReservas}
            disabled={cargandoReservas}
          >
            <Ionicons
              name="refresh-outline"
              size={20}
              color={colores.blanco}
            />

            <Text style={styles.textoBoton}>
              Actualizar estados
            </Text>
          </TouchableOpacity>

          {cargandoReservas && (
            <ActivityIndicator
              size="large"
              color={colores.primario}
              style={styles.cargando}
            />
          )}

          {errorReservas && (
            <Text style={styles.mensajeError}>
              {errorReservas}
            </Text>
          )}

          {!cargandoReservas &&
            !errorReservas &&
            reservas.length === 0 && (
              <Text style={styles.mensajeVacio}>
                Todavía no tienes reservas registradas.
              </Text>
            )}

          {reservas.map((reserva) => (
            <View
              key={reserva.id}
              style={styles.tarjetaReserva}
            >
              <View style={styles.encabezadoReserva}>
                <Text style={styles.numeroReserva}>
                  Reserva #{reserva.id}
                </Text>

                <Text
                  style={[
                    styles.estadoReserva,
                    {
                      color: obtenerColorEstado(
                        reserva.estado
                      ),
                    },
                  ]}
                >
                  {reserva.estado}
                </Text>
              </View>

              <Text style={styles.detalleReserva}>
                Fecha: {reserva.fecha}
              </Text>

              <Text style={styles.detalleReserva}>
                Hora: {reserva.hora}
              </Text>

              <Text style={styles.detalleReserva}>
                Personas: {reserva.cantidad_personas}
              </Text>

              <View style={styles.mensajeEstado}>
                <Ionicons
                  name={
                    reserva.estado === "CONFIRMADA"
                      ? "checkmark-circle"
                      : reserva.estado === "CANCELADA"
                        ? "close-circle"
                        : "time-outline"
                  }
                  size={23}
                  color={obtenerColorEstado(
                    reserva.estado
                  )}
                />

                <Text
                  style={[
                    styles.textoEstado,
                    {
                      color: obtenerColorEstado(
                        reserva.estado
                      ),
                    },
                  ]}
                >
                  {obtenerMensajeEstado(
                    reserva.estado
                  )}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colores.fondo,
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 10,
  },

  scroll: {
    flex: 1,
  },

  scrollContenido: {
    paddingVertical: 12,
    paddingBottom: 25,
  },

  tarjeta: {
    backgroundColor: colores.blanco,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: colores.secundario,
    elevation: 3,
  },

  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: colores.primario,
    textAlign: "center",
    marginBottom: 10,
  },

  subtitulo: {
    fontSize: 15,
    color: colores.textoSecundario,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },

  etiqueta: {
    color: colores.primario,
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 8,
  },

  campoFecha: {
    minHeight: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colores.blanco,
    borderWidth: 1,
    borderColor: colores.secundario,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 18,
  },

  fechaTexto: {
    color: colores.texto,
    fontSize: 16,
  },

  placeholder: {
    color: colores.textoSecundario,
  },

  calendario: {
    marginBottom: 16,
  },

  confirmarFecha: {
    padding: 12,
    alignItems: "center",
    backgroundColor: colores.secundario,
    borderRadius: 10,
  },

  textoConfirmar: {
    color: colores.texto,
    fontWeight: "bold",
  },

  input: {
    height: 52,
    backgroundColor: colores.blanco,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.secundario,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colores.texto,
    marginBottom: 18,
  },

  botonGuardar: {
    backgroundColor: colores.boton,
    minHeight: 54,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    marginTop: 8,
  },

  botonDeshabilitado: {
    opacity: 0.5,
  },

  textoBoton: {
    color: colores.blanco,
    fontSize: 16,
    fontWeight: "bold",
  },

  seccionReservas: {
    marginTop: 28,
    paddingBottom: 25,
  },

  botonActualizar: {
    backgroundColor: colores.primario,
    minHeight: 48,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },

  cargando: {
    marginVertical: 20,
  },

  mensajeError: {
    color: colores.error,
    fontSize: 15,
    textAlign: "center",
    marginVertical: 15,
  },

  mensajeVacio: {
    color: colores.textoSecundario,
    fontSize: 15,
    textAlign: "center",
    marginVertical: 20,
  },

  tarjetaReserva: {
    backgroundColor: colores.blanco,
    borderRadius: 15,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colores.borde,
  },

  encabezadoReserva: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  numeroReserva: {
    color: colores.primario,
    fontSize: 18,
    fontWeight: "bold",
  },

  estadoReserva: {
    fontSize: 13,
    fontWeight: "bold",
  },

  detalleReserva: {
    color: colores.texto,
    fontSize: 15,
    marginBottom: 7,
  },

  mensajeEstado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
  },

  textoEstado: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
});
