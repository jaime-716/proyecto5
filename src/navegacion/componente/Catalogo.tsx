import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../database/supabase";
import { colores } from "../../tema/colores";

type Producto = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string;
  disponible: boolean;
};

export default function Catalogo() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  console.log("CATALOGO NUEVO CARGADO");

  const cargarProductos = async () => {
    try {
      setCargando(true);
      setError(null);

      const { data, error: errorConsulta } = await supabase
        .from("Producto")
        .select("id, nombre, descripcion, precio, categoria, disponible")
        .eq("disponible", true)
        .order("nombre", { ascending: true });

      if (errorConsulta) {
        console.log("ERROR CATALOGO:", {
          codigo: errorConsulta.code,
          mensaje: errorConsulta.message,
          detalles: errorConsulta.details,
          sugerencia: errorConsulta.hint,
        });

        setError("Error de Supabase: " + errorConsulta.message);

        setProductos([]);
        return;
      }

      setProductos((data ?? []) as Producto[]);
    } catch (e) {
      console.log("ERROR CARGANDO CATALOGO:", e);
      setError("Ocurrió un problema al consultar el menú.");
      setProductos([]);
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarProductos();
    }, []),
  );

  const formatearPrecio = (precio: number) =>
    Number(precio).toLocaleString("es-CO");

  return (
    <View style={styles.container}>
      <FlatList
        data={productos}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.contenido}
        ListHeaderComponent={
          <View>
            <Text style={styles.titulo}>Menú del restaurante</Text>
            <Text style={styles.subtitulo}>
              Explora nuestros productos disponibles.
            </Text>
          </View>
        }
        ListEmptyComponent={
          cargando ? (
            <ActivityIndicator size="large" color={colores.primario} />
          ) : error ? (
            <View style={styles.mensajeContenedor}>
              <Text style={styles.mensajeError}>{error}</Text>
              <TouchableOpacity style={styles.boton} onPress={cargarProductos}>
                <Text style={styles.textoBoton}>REINTENTAR</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.mensaje}>
              No hay productos disponibles por el momento.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.tarjeta}>
            <Text style={styles.nombre}>{item.nombre}</Text>

            {item.descripcion ? (
              <Text style={styles.descripcion}>{item.descripcion}</Text>
            ) : null}

            <Text style={styles.categoria}>Categoría: {item.categoria}</Text>

            <Text style={styles.precio}>${formatearPrecio(item.precio)}</Text>

            <Text style={styles.disponible}>Disponible</Text>
          </View>
        )}
        refreshing={cargando && productos.length > 0}
        onRefresh={cargarProductos}
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
    padding: 18,
    paddingBottom: 40,
    flexGrow: 1,
  },

  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: colores.primario,
    textAlign: "center",
    marginTop: 15,
    marginBottom: 8,
  },

  subtitulo: {
    fontSize: 15,
    color: colores.textoSecundario,
    textAlign: "center",
    marginBottom: 25,
  },

  tarjeta: {
    backgroundColor: colores.fondoTarjeta,
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colores.borde,
  },

  nombre: {
    fontSize: 20,
    fontWeight: "bold",
    color: colores.primario,
    marginBottom: 8,
  },

  descripcion: {
    fontSize: 15,
    color: colores.texto,
    marginBottom: 10,
  },

  categoria: {
    fontSize: 14,
    color: colores.textoSecundario,
    marginBottom: 8,
  },

  precio: {
    fontSize: 20,
    fontWeight: "bold",
    color: colores.primario,
    marginBottom: 8,
  },

  disponible: {
    fontSize: 14,
    fontWeight: "bold",
    color: colores.boton,
  },

  mensajeContenedor: {
    alignItems: "center",
    padding: 16,
  },

  mensaje: {
    color: colores.textoSecundario,
    textAlign: "center",
    marginTop: 20,
  },

  mensajeError: {
    color: colores.error,
    textAlign: "center",
    marginBottom: 15,
  },

  boton: {
    backgroundColor: colores.boton,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },

  textoBoton: {
    color: colores.blanco,
    fontWeight: "bold",
  },
});
