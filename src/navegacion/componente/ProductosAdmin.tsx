import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";

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

export default function ProductosAdmin({ navigation }: any) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [categoria, setCategoria] = useState("");
  const [disponible, setDisponible] = useState(true);
  const [productoEditar, setProductoEditar] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const listaRef = useRef<FlatList<Producto>>(null);

  const cargarProductos = useCallback(async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from("Producto")
        .select("id, nombre, descripcion, precio, categoria, disponible")
        .order("nombre", { ascending: true });

      if (error) throw error;
      setProductos((data || []) as Producto[]);
    } catch (error) {
      console.error("ERROR CARGANDO PRODUCTOS:", error);
      Alert.alert("Error", "No se pudieron cargar los productos.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarProductos();
  }, [cargarProductos]);

  const limpiarFormulario = () => {
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setCategoria("");
    setDisponible(true);
    setProductoEditar(null);
  };

  const guardarProducto = async () => {
    if (guardando) return;

    const nombreLimpio = nombre.trim();
    const descripcionLimpia = descripcion.trim();
    const categoriaLimpia = categoria.trim();
    const precioNumero = Number(precio.trim().replace(",", "."));

    if (!nombreLimpio || !precio.trim() || !categoriaLimpia) {
      Alert.alert("Campos obligatorios", "Completa nombre, precio y categoría.");
      return;
    }
    if (!Number.isFinite(precioNumero) || precioNumero <= 0) {
      Alert.alert("Precio inválido", "El precio debe ser un número mayor a cero.");
      return;
    }

    setGuardando(true);
    try {
      const valores = {
        nombre: nombreLimpio,
        descripcion: descripcionLimpia,
        precio: precioNumero,
        categoria: categoriaLimpia,
        disponible,
      };

      if (productoEditar !== null) {
        const { data, error } = await supabase
          .from("Producto")
          .update(valores)
          .eq("id", productoEditar)
          .select("id");

        if (error) throw error;
        if (!data?.length) {
          Alert.alert("Sin cambios", "No se encontró el producto o no tienes permiso para actualizarlo.");
          return;
        }
        Alert.alert("Éxito", "Producto actualizado correctamente.");
      } else {
        const { data, error } = await supabase
          .from("Producto")
          .insert(valores)
          .select("id");

        if (error) throw error;
        if (!data?.length) {
          Alert.alert("Sin guardar", "No se pudo confirmar la creación del producto.");
          return;
        }
        Alert.alert("Éxito", "Producto creado correctamente.");
      }

      limpiarFormulario();
      await cargarProductos();
    } catch (error) {
      console.error("ERROR GUARDANDO PRODUCTO:", error);
      Alert.alert("Error", "No se pudo guardar el producto. Revisa los permisos y vuelve a intentarlo.");
    } finally {
      setGuardando(false);
    }
  };

  const seleccionarProducto = (producto: Producto) => {
    setProductoEditar(producto.id);
    setNombre(producto.nombre);
    setDescripcion(producto.descripcion || "");
    setPrecio(String(producto.precio));
    setCategoria(producto.categoria);
    setDisponible(producto.disponible);
    listaRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const cambiarDisponibilidad = async (producto: Producto) => {
    if (procesandoId !== null) return;
    setProcesandoId(producto.id);
    try {
      const { data, error } = await supabase
        .from("Producto")
        .update({ disponible: !producto.disponible })
        .eq("id", producto.id)
        .select("id");
      if (error) throw error;
      if (!data?.length) {
        Alert.alert("Sin cambios", "No se pudo actualizar la disponibilidad.");
        return;
      }
      if (productoEditar === producto.id) {
        setDisponible(!producto.disponible);
      }
      await cargarProductos();
    } catch (error) {
      console.error("ERROR DISPONIBILIDAD:", error);
      Alert.alert("Error", "No se pudo cambiar la disponibilidad.");
    } finally {
      setProcesandoId(null);
    }
  };

  const eliminarProducto = (producto: Producto) => {
    Alert.alert(
      "Eliminar producto",
      `¿Deseas eliminar «${producto.nombre}»? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            if (procesandoId !== null) return;
            setProcesandoId(producto.id);
            try {
              const { data, error } = await supabase
                .from("Producto")
                .delete()
                .eq("id", producto.id)
                .select("id");

              if (error) {
                if (error.code === "23503") {
                  Alert.alert(
                    "Producto con pedidos",
                    "No es posible eliminar este producto porque está asociado a pedidos. Puedes marcarlo como no disponible para conservar el historial."
                  );
                  return;
                }
                throw error;
              }
              if (!data?.length) {
                Alert.alert("Sin eliminar", "No se eliminó el producto. Comprueba tus permisos.");
                return;
              }
              if (productoEditar === producto.id) limpiarFormulario();
              Alert.alert("Éxito", "Producto eliminado correctamente.");
              await cargarProductos();
            } catch (error) {
              console.error("ERROR ELIMINANDO PRODUCTO:", error);
              Alert.alert("Error", "No se pudo eliminar el producto.");
            } finally {
              setProcesandoId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={listaRef}
        data={productos}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.contenidoLista}
        refreshing={cargando}
        onRefresh={cargarProductos}
        ListHeaderComponent={
          <View>
            <Text style={styles.titulo}>Gestión de Productos</Text>
            <View style={styles.formulario}>
              <TextInput
                style={styles.input}
                placeholder="Nombre del producto"
                placeholderTextColor={colores.textoSecundario}
                value={nombre}
                onChangeText={setNombre}
              />
              <TextInput
                style={styles.input}
                placeholder="Descripción"
                placeholderTextColor={colores.textoSecundario}
                value={descripcion}
                onChangeText={setDescripcion}
              />
              <TextInput
                style={styles.input}
                placeholder="Precio"
                placeholderTextColor={colores.textoSecundario}
                keyboardType="decimal-pad"
                value={precio}
                onChangeText={setPrecio}
              />
              <TextInput
                style={styles.input}
                placeholder="Categoría"
                placeholderTextColor={colores.textoSecundario}
                value={categoria}
                onChangeText={setCategoria}
              />
              <TouchableOpacity
                style={styles.botonDisponibilidad}
                onPress={() => setDisponible(!disponible)}
                disabled={guardando}
              >
                <Text style={styles.textoDisponibilidad}>
                  {disponible ? "DISPONIBLE: SÍ" : "DISPONIBLE: NO"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.botonPrincipal}
                onPress={guardarProducto}
                disabled={guardando}
              >
                {guardando ? (
                  <ActivityIndicator color={colores.blanco} />
                ) : (
                  <Text style={styles.textoPrincipal}>
                    {productoEditar !== null ? "ACTUALIZAR PRODUCTO" : "GUARDAR PRODUCTO"}
                  </Text>
                )}
              </TouchableOpacity>
              {productoEditar !== null && (
                <TouchableOpacity style={styles.botonCancelar} onPress={limpiarFormulario} disabled={guardando}>
                  <Text style={styles.textoCancelar}>CANCELAR EDICIÓN</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.subtituloLista}>Productos registrados ({productos.length})</Text>
          </View>
        }
        ListEmptyComponent={
          !cargando ? (
            <Text style={styles.vacio}>No hay productos registrados.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.tarjeta}>
            <Text style={styles.nombre}>{item.nombre}</Text>
            <Text style={styles.texto}>Descripción: {item.descripcion || "Sin descripción"}</Text>
            <Text style={styles.texto}>Precio: ${Number(item.precio).toLocaleString("es-CO")}</Text>
            <Text style={styles.texto}>Categoría: {item.categoria}</Text>
            <Text style={styles.texto}>Disponible: {item.disponible ? "Sí" : "No"}</Text>
            <View style={styles.filaAcciones}>
              <TouchableOpacity style={styles.botonEditar} onPress={() => seleccionarProducto(item)} disabled={procesandoId !== null}>
                <Text style={styles.textoAccionClaro}>EDITAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botonAlternar} onPress={() => cambiarDisponibilidad(item)} disabled={procesandoId !== null}>
                <Text style={styles.textoAccionOscuro}>{item.disponible ? "DESACTIVAR" : "ACTIVAR"}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.botonEliminar} onPress={() => eliminarProducto(item)} disabled={procesandoId !== null}>
              <Text style={styles.textoEliminar}>{procesandoId === item.id ? "PROCESANDO..." : "ELIMINAR PRODUCTO"}</Text>
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
  contenidoLista: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 36,
    flexGrow: 1,
  },
  titulo: {
    color: colores.primario,
    fontSize: 27,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
  },
  formulario: {
    backgroundColor: colores.blanco,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colores.secundario,
  },
  input: {
    height: 50,
    backgroundColor: colores.blanco,
    color: colores.texto,
    borderColor: colores.secundario,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 12,
    fontSize: 16,
  },
  botonDisponibilidad: {
    backgroundColor: colores.fondo,
    borderColor: colores.secundario,
    borderWidth: 1,
    minHeight: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  textoDisponibilidad: {
    color: colores.primario,
    fontWeight: "bold",
    fontSize: 15,
  },
  botonPrincipal: {
    backgroundColor: colores.boton,
    minHeight: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  textoPrincipal: {
    color: colores.blanco,
    fontWeight: "bold",
    fontSize: 16,
  },
  botonCancelar: {
    paddingVertical: 14,
    alignItems: "center",
  },
  textoCancelar: {
    color: colores.primario,
    fontWeight: "bold",
  },
  subtituloLista: {
    color: colores.primario,
    fontSize: 21,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 14,
  },
  tarjeta: {
    backgroundColor: colores.blanco,
    padding: 17,
    borderRadius: 15,
    marginBottom: 14,
    borderColor: colores.secundario,
    borderWidth: 1,
    elevation: 2,
  },
  nombre: {
    color: colores.primario,
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 7,
  },
  texto: {
    color: colores.texto,
    marginTop: 5,
    fontSize: 14,
  },
  filaAcciones: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  botonEditar: {
    flex: 1,
    backgroundColor: colores.primario,
    minHeight: 45,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  botonAlternar: {
    flex: 1,
    backgroundColor: colores.secundario,
    minHeight: 45,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  textoAccionClaro: {
    color: colores.blanco,
    fontWeight: "bold",
    fontSize: 13,
  },
  textoAccionOscuro: {
    color: colores.primario,
    fontWeight: "bold",
    fontSize: 13,
  },
  botonEliminar: {
    borderColor: colores.error,
    borderWidth: 1,
    backgroundColor: colores.blanco,
    minHeight: 43,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  textoEliminar: {
    color: colores.error,
    fontWeight: "bold",
    fontSize: 13,
  },
  vacio: {
    color: colores.textoSecundario,
    textAlign: "center",
    marginTop: 22,
    fontSize: 15,
  },
});
