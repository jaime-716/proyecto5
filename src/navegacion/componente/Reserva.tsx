import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from "react-native";

import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";

import Ionicons from "@expo/vector-icons/Ionicons";
import { supabase } from "../../database/supabase";
import { colores } from "../../tema/colores";

export default function Reserva({ route, navigation }: any) {
  const usuarioId = route?.params?.usuarioId;
  const correo = route?.params?.correo;

  const [fecha, setFecha] = useState("");
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [mostrarCalendario, setMostrarCalendario] = useState(false);

  const [hora, setHora] = useState("");
  const [cantidadPersonas, setCantidadPersonas] = useState("");

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

  const guardarReserva = async () => {
    if (
      fecha.trim() === "" ||
      hora.trim() === "" ||
      cantidadPersonas.trim() === ""
    ) {
      Alert.alert("Error", "Debes completar todos los campos");
      return;
    }

    // VALIDACIÓN DE LA HORA
    const horaLimpia = hora.trim();

    const formatoHora = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (!formatoHora.test(horaLimpia)) {
      Alert.alert("Hora inválida", "Ingresa una hora válida. Ejemplo: 19:30.");
      return;
    }

    const fechaHoraReserva = new Date(`${fecha}T${horaLimpia}:00`);

    if (
      !Number.isFinite(fechaHoraReserva.getTime()) ||
      fechaHoraReserva <= new Date()
    ) {
      Alert.alert(
        "Fecha u hora inválida",
        "Selecciona una fecha y hora futuras.",
      );
      return;
    }

    // AQUÍ CONTINÚA TU CÓDIGO ORIGINAL
    const cantidad = Number(cantidadPersonas);

    if (isNaN(cantidad) || cantidad <= 0 || !Number.isInteger(cantidad)) {
      Alert.alert(
        "Error",
        "La cantidad de personas debe ser un número entero mayor a cero",
      );
      return;
    }

    if (!usuarioId) {
      Alert.alert("Error", "No se pudo identificar el usuario");
      return;
    }

    try {
      const { error } = await supabase.from("Reserva").insert({
        usuario_id: usuarioId,
        fecha: fecha,
        hora: hora,
        cantidad_personas: cantidad,
        estado: "PENDIENTE",
      });

      if (error) {
        console.log("ERROR RESERVA:", error);

        Alert.alert("Error", "No se pudo registrar la reserva");
        return;
      }

      Alert.alert(
        "Reserva registrada",
        "Tu reserva fue registrada correctamente.",
      );

      setFecha("");
      setHora("");
      setCantidadPersonas("");
      setFechaSeleccionada(new Date());
      setMostrarCalendario(false);
    } catch (error: any) {
      console.log("ERROR GUARDANDO RESERVA:", error);

      Alert.alert("Error", error?.message || "No se pudo registrar la reserva");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContenido}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.tarjeta}>
          <Text style={styles.titulo}>Reserva tu mesa</Text>

          <Text style={styles.subtitulo}>
            Selecciona la fecha y completa los datos de tu reserva.
          </Text>

          <Text style={styles.etiqueta}>Fecha de reserva</Text>

          <TouchableOpacity style={styles.campoFecha} onPress={abrirCalendario}>
            <Text style={[styles.fechaTexto, !fecha && styles.placeholder]}>
              {fecha || "Seleccionar fecha"}
            </Text>

            <Ionicons
              name="calendar-outline"
              size={23}
              color={colores.primario}
            />
          </TouchableOpacity>

          {Platform.OS === "ios" && mostrarCalendario && (
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
                onPress={() => setMostrarCalendario(false)}
              >
                <Text style={styles.textoConfirmar}>Listo</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.etiqueta}>Hora de la reserva</Text>

          <TextInput
            style={styles.input}
            placeholder="Ejemplo: 19:30"
            placeholderTextColor={colores.textoSecundario}
            value={hora}
            onChangeText={setHora}
          />

          <Text style={styles.etiqueta}>Cantidad de personas</Text>

          <TextInput
            style={styles.input}
            placeholder="Ejemplo: 2"
            placeholderTextColor={colores.textoSecundario}
            keyboardType="number-pad"
            value={cantidadPersonas}
            onChangeText={setCantidadPersonas}
          />

          <TouchableOpacity
            style={styles.botonGuardar}
            onPress={guardarReserva}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={21}
              color={colores.blanco}
            />

            <Text style={styles.textoBoton}>Guardar reserva</Text>
          </TouchableOpacity>
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

  textoBoton: {
    color: colores.blanco,
    fontSize: 16,
    fontWeight: "bold",
  },
});
