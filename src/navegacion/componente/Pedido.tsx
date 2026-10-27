import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
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

type ProductoCarrito = {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
};

export default function Pedido({ route }: any) {
  const usuarioId = route?.params?.usuarioId;

  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<ProductoCarrito[]>([]);
  const [procesando, setProcesando] = useState(false);

  // Consultar productos disponibles
  const cargarProductos = async () => {
    try {
      const { data, error } = await supabase
        .from("Producto")
        .select("*")
        .eq("disponible", true)
        .order("nombre", { ascending: true });

      if (error) {
        console.log("ERROR PRODUCTOS:", error);

        Alert.alert("Error", "No se pudieron cargar los productos");

        return;
      }

      setProductos(data || []);
    } catch (error) {
      console.log("ERROR CARGANDO PRODUCTOS:", error);
    }
  };

  // Agregar producto al carrito
  const agregarProducto = (producto: Producto) => {
    setCarrito((carritoActual) => {
      const existe = carritoActual.find((item) => item.id === producto.id);

      // Si ya está agregado, aumenta la cantidad
      if (existe) {
        return carritoActual.map((item) =>
          item.id === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
              }
            : item,
        );
      }

      // Si no existe, lo agrega al carrito
      return [
        ...carritoActual,
        {
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
        },
      ];
    });
  };

  // Aumentar cantidad
  const aumentarCantidad = (id: number) => {
    setCarrito((carritoActual) =>
      carritoActual.map((item) =>
        item.id === id
          ? {
              ...item,
              cantidad: item.cantidad + 1,
            }
          : item,
      ),
    );
  };

  // Disminuir cantidad
  const disminuirCantidad = (id: number) => {
    setCarrito((carritoActual) =>
      carritoActual.map((item) =>
        item.id === id && item.cantidad > 1
          ? {
              ...item,
              cantidad: item.cantidad - 1,
            }
          : item,
      ),
    );
  };

  // Eliminar producto completamente del carrito
  const eliminarProducto = (id: number) => {
    setCarrito((carritoActual) =>
      carritoActual.filter((item) => item.id !== id),
    );
  };

  // Calcular total
  const calcularTotal = () => {
    return carrito.reduce(
      (total, item) => total + item.precio * item.cantidad,
      0,
    );
  };

  // Confirmar y guardar pedido

  const confirmarPedido = async () => {
    if (carrito.length === 0) {
      Alert.alert("Pedido vacío", "Debes agregar al menos un producto.");
      return;
    }

    if (procesando) return;

    try {
      setProcesando(true);

      const productosPedido = carrito.map((item) => ({
        producto_id: item.id,
        cantidad: item.cantidad,
      }));

      const { data: pedidoId, error } = await supabase.rpc(
        "crear_pedido_seguro",
        {
          p_productos: productosPedido,
        },
      );

      if (error) {
        console.log("ERROR CREANDO PEDIDO:", error);

        Alert.alert("Error al registrar pedido", error.message);

        return;
      }

      if (pedidoId == null) {
        Alert.alert("Error", "No se recibió la confirmación del pedido.");
        return;
      }

      setCarrito([]);

      Alert.alert(
        "Pedido realizado",
        `Tu pedido #${pedidoId} fue registrado correctamente.`,
      );
    } catch (error: any) {
      console.log("ERROR CONFIRMANDO PEDIDO:", error);

      Alert.alert("Error", error?.message || "No se pudo realizar el pedido");
    } finally {
      setProcesando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contenido}
    >
      <Text style={styles.titulo}>Menú del restaurante</Text>

      {productos.length === 0 ? (
        <Text style={styles.mensaje}>No hay productos disponibles.</Text>
      ) : (
        productos.map((item) => (
          <View style={styles.tarjeta} key={item.id}>
            <Text style={styles.nombre}>{item.nombre}</Text>

            {item.descripcion && (
              <Text style={styles.texto}>{item.descripcion}</Text>
            )}

            <Text style={styles.texto}>Categoría: {item.categoria}</Text>

            <Text style={styles.texto}>Precio: ${item.precio}</Text>

            <TouchableOpacity
              style={styles.boton}
              onPress={() => agregarProducto(item)}
            >
              <Text style={styles.textoBoton}>AGREGAR</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <Text style={styles.titulo}>Mi pedido</Text>

      {carrito.length === 0 ? (
        <Text style={styles.mensaje}>No has agregado productos.</Text>
      ) : (
        carrito.map((item) => (
          <View style={styles.tarjeta} key={item.id}>
            <Text style={styles.nombre}>{item.nombre}</Text>

            <Text style={styles.texto}>Precio: ${item.precio}</Text>

            <View style={styles.cantidad}>
              <TouchableOpacity
                style={styles.botonCantidad}
                onPress={() => disminuirCantidad(item.id)}
              >
                <Text style={styles.textoBoton}>-</Text>
              </TouchableOpacity>

              <Text style={styles.textoCantidad}>
                Cantidad: {item.cantidad}
              </Text>

              <TouchableOpacity
                style={styles.botonCantidad}
                onPress={() => aumentarCantidad(item.id)}
              >
                <Text style={styles.textoBoton}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.texto}>
              Subtotal: ${item.precio * item.cantidad}
            </Text>

            <TouchableOpacity
              style={styles.botonEliminar}
              onPress={() => eliminarProducto(item.id)}
            >
              <Text style={styles.textoEliminar}>ELIMINAR</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {carrito.length > 0 && (
        <View style={styles.resumen}>
          <Text style={styles.total}>Total: ${calcularTotal()}</Text>

          <TouchableOpacity
            style={[
              styles.botonConfirmar,
              procesando && styles.botonDeshabilitado,
            ]}
            onPress={confirmarPedido}
            disabled={procesando}
          >
            <Text style={styles.textoBotonConfirmar}>
              {procesando ? "PROCESANDO..." : "CONFIRMAR PEDIDO"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  contenido: {
    padding: 20,
    paddingBottom: 60,
  },
  titulo: {
    color: colores.primario,
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  tarjeta: {
    backgroundColor: colores.fondoTarjeta,
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  nombre: {
    color: colores.primario,
    fontSize: 20,
    fontWeight: "bold",
  },
  texto: {
    color: colores.textoSecundario,
    marginTop: 7,
    fontSize: 15,
  },
  mensaje: {
    color: colores.textoSecundario,
    textAlign: "center",
    fontSize: 16,
    marginBottom: 20,
  },
  boton: {
    backgroundColor: colores.boton,
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
  },
  textoBoton: {
    color: colores.blanco,
    fontWeight: "bold",
    fontSize: 16,
  },
  cantidad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
  },
  botonCantidad: {
    backgroundColor: colores.boton,
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  textoCantidad: {
    color: colores.texto,
    fontSize: 16,
  },
  botonEliminar: {
    marginTop: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: colores.error,
    borderRadius: 10,
    alignItems: "center",
  },
  textoEliminar: {
    color: colores.error,
    fontWeight: "bold",
  },
  resumen: {
    backgroundColor: colores.fondoTarjeta,
    padding: 20,
    borderRadius: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colores.secundario,
  },
  total: {
    color: colores.primario,
    fontSize: 23,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  botonConfirmar: {
    backgroundColor: colores.boton,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  textoBotonConfirmar: {
    color: colores.blanco,
    fontSize: 16,
    fontWeight: "bold",
  },
});
