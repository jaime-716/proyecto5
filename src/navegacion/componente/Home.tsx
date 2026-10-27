
import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";

import Menu from "./Menu";
import { colores } from "../../tema/colores";

export default function Home({ navigation, route }: any) {
  const usuarioId = route?.params?.usuarioId;
  const correo = route?.params?.correo;

  return (
    <View style={styles.container}>
      <Menu
        navigation={navigation}
        tipo="CLIENTE"
        usuarioId={usuarioId}
        correo={correo}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContenido}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tarjeta}>
            <Text style={styles.icono}>🍽️</Text>

            <Text style={styles.titulo}>
              ¡Bienvenido!
            </Text>

            <Text style={styles.subtitulo}>
              Disfruta de nuestro restaurante
            </Text>

            <View style={styles.separador} />

            <Text style={styles.mensaje}>
              Desde el menú superior puedes consultar
              tu perfil, realizar pedidos y reservar
              una mesa para disfrutar de nuestros
              mejores platos.
            </Text>
          </View>
        </ScrollView>
      </Menu>
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
  flexGrow: 1,
  justifyContent: "flex-start",
  paddingTop: 50,
  paddingBottom: 10,
},

  tarjeta: {
    backgroundColor: colores.blanco,
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colores.secundario,
    elevation: 3,
  },

  icono: {
    fontSize: 55,
    marginBottom: 15,
  },

  titulo: {
    color: colores.primario,
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitulo: {
    color: colores.texto,
    fontSize: 19,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },

  separador: {
    height: 3,
    width: 70,
    backgroundColor: colores.secundario,
    borderRadius: 10,
    marginBottom: 20,
  },

  mensaje: {
    color: colores.textoSecundario,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 25,
  },
});
