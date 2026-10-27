
import React from "react";
import { View, StyleSheet } from "react-native";
import { colores } from "../../tema/colores";

export default function Catalogo() {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
});
