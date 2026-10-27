
import React from "react";
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
} from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../context/AuthContext";
import { colores } from "../tema/colores";

import Bienvenida from "./componente/Bienvenida";
import Catalogo from "./componente/Catalogo";
import Home from "./componente/Home";
import Login from "./componente/Login";
import Registro from "./componente/Registro";
import PanelAdmin from "./componente/PanelAdmin";
import UsuariosAdmin from "./componente/UsuariosAdmin";
import Perfil from "./componente/Perfil";
import ProductosAdmin from "./componente/ProductosAdmin";
import Pedido from "./componente/Pedido";
import PedidosAdmin from "./componente/PedidosAdmin";
import DetallesAdmin from "./componente/DetallesAdmin";
import Reserva from "./componente/Reserva";
import ReservasAdmin from "./componente/ReservasAdmin";

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  const {
    usuario,
    cargando,
  } = useAuth();

  // Esperar a que Supabase verifique la sesión.
  if (cargando) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator
          size="large"
          color={colores.primario}
        />
        <Text style={styles.textoCarga}>
          Verificando sesión...
        </Text>
      </View>
    );
  }

  const esAdmin = usuario?.rol === "ADMIN";
  const esCliente = usuario?.rol === "CLIENTE";

  const perfilIncompleto =
    esCliente &&
    (!usuario?.nombre?.trim() ||
      !usuario?.apellido?.trim());

  const parametrosUsuario = usuario
    ? {
        usuarioId: usuario.id,
        correo: usuario.correo,
      }
    : undefined;

  const rutaInicial = esAdmin
    ? "PanelAdmin"
    : esCliente
      ? perfilIncompleto
        ? "Perfil"
        : "Home"
      : "Bienvenida";

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={
          esAdmin
            ? "ADMIN"
            : esCliente
              ? "CLIENTE"
              : "PUBLICO"
        }
        initialRouteName={rutaInicial}
        screenOptions={{
          headerStyle: {
            backgroundColor: colores.primario,
          },
          headerTintColor: colores.blanco,
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 18,
          },
          headerTitleAlign: "center",
          contentStyle: {
            backgroundColor: colores.fondo,
          },
        }}
      >
        {/* VISITANTE */}

        {!usuario && (
          <>
            <Stack.Screen
              name="Bienvenida"
              component={Bienvenida}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="Catalogo"
              component={Catalogo}
              options={{ title: "EXPLORAR MENÚ" }}
            />

            <Stack.Screen
              name="Login"
              component={Login}
              options={{ title: "INICIAR SESIÓN" }}
            />

            <Stack.Screen
              name="Registro"
              component={Registro}
              options={{ title: "REGISTRO" }}
            />
          </>
        )}

        {/* CLIENTE */}

        {esCliente && (
          <>
            <Stack.Screen
              name="Home"
              component={Home}
              initialParams={parametrosUsuario}
              options={{ title: "INICIO" }}
            />

            <Stack.Screen
              name="Perfil"
              component={Perfil}
              initialParams={{
                ...parametrosUsuario,
                primerIngreso: !!perfilIncompleto,
              }}
              options={{ title: "MI PERFIL" }}
            />

            <Stack.Screen
              name="Pedido"
              component={Pedido}
              initialParams={parametrosUsuario}
              options={{ title: "PEDIDO" }}
            />

            <Stack.Screen
              name="Reserva"
              component={Reserva}
              initialParams={parametrosUsuario}
              options={{ title: "RESERVAS" }}
            />

            <Stack.Screen
              name="Catalogo"
              component={Catalogo}
              options={{ title: "EXPLORAR MENÚ" }}
            />
          </>
        )}

        {/* ADMINISTRADOR */}

        {esAdmin && (
          <>
            <Stack.Screen
              name="PanelAdmin"
              component={PanelAdmin}
              initialParams={parametrosUsuario}
              options={{ title: "ADMINISTRADOR" }}
            />

            <Stack.Screen
              name="UsuariosAdmin"
              component={UsuariosAdmin}
              initialParams={parametrosUsuario}
              options={{ title: "USUARIOS" }}
            />

            <Stack.Screen
              name="ProductosAdmin"
              component={ProductosAdmin}
              initialParams={parametrosUsuario}
              options={{ title: "PRODUCTOS" }}
            />

            <Stack.Screen
              name="PedidosAdmin"
              component={PedidosAdmin}
              initialParams={parametrosUsuario}
              options={{ title: "PEDIDOS" }}
            />

            <Stack.Screen
              name="ReservasAdmin"
              component={ReservasAdmin}
              initialParams={parametrosUsuario}
              options={{ title: "GESTIÓN DE RESERVAS" }}
            />

            <Stack.Screen
              name="DetallesAdmin"
              component={DetallesAdmin}
              initialParams={parametrosUsuario}
              options={{ title: "DETALLES DEL PEDIDO" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  cargando: {
    flex: 1,
    backgroundColor: colores.fondo,
    alignItems: "center",
    justifyContent: "center",
  },

  textoCarga: {
    color: colores.primario,
    fontSize: 16,
    marginTop: 15,
    fontWeight: "600",
  },
});
