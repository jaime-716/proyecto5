
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

import { colores } from "../../tema/colores";

export default function Bienvenida({ navigation }: any) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contenido}
    >
      <Text style={styles.icono}>🍽️</Text>

      <Text style={styles.titulo}>
        ¡Bienvenido a nuestro restaurante!
      </Text>

      <Text style={styles.subtitulo}>
        Descubre nuestros sabores y disfruta
        de una experiencia gastronómica especial.
      </Text>

      <View style={styles.tarjeta}>
        <Text style={styles.tituloTarjeta}>
          Nuestro menú
        </Text>

        <Text style={styles.descripcion}>
          Explora nuestros platos y descubre
          todo lo que tenemos para ti.
        </Text>

        <TouchableOpacity
          style={styles.botonPrincipal}
          onPress={() => navigation.navigate("Catalogo")}
        >
          <Text style={styles.textoBlanco}>
            Explorar menú
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.pregunta}>
        ¿Ya tienes una cuenta?
      </Text>

      <TouchableOpacity
        style={styles.botonLogin}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.textoBlanco}>
          Iniciar sesión
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botonRegistro}
        onPress={() => navigation.navigate("Registro")}
      >
        <Text style={styles.textoRegistro}>
          Crear una cuenta
        </Text>
      </TouchableOpacity>

      <Text style={styles.pie}>
        Puedes explorar sin iniciar sesión.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  contenido: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  icono: {
    fontSize: 65,
    marginBottom: 20,
  },
  titulo: {
    fontSize: 29,
    fontWeight: "bold",
    color: colores.primario,
    textAlign: "center",
    marginBottom: 15,
  },
  subtitulo: {
    fontSize: 16,
    color: colores.textoSecundario,
    textAlign: "center",
    lineHeight: 25,
    marginBottom: 30,
  },
  tarjeta: {
    backgroundColor: colores.blanco,
    width: "100%",
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
    marginBottom: 30,
    elevation: 3,
  },
  tituloTarjeta: {
    color: colores.primario,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  descripcion: {
    color: colores.textoSecundario,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 25,
  },
  botonPrincipal: {
    backgroundColor: colores.boton,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  textoBlanco: {
    color: colores.blanco,
    fontWeight: "bold",
    fontSize: 16,
  },
  pregunta: {
    fontSize: 17,
    color: colores.texto,
    marginBottom: 15,
  },
  botonLogin: {
    backgroundColor: colores.primario,
    width: "100%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  botonRegistro: {
    padding: 14,
  },
  textoRegistro: {
    color: colores.primario,
    fontSize: 16,
    fontWeight: "bold",
  },
  pie: {
    color: colores.textoSecundario,
    fontSize: 13,
    textAlign: "center",
    marginTop: 20,
  },
});
