# Aplicación de gestión de restaurante

Aplicación móvil desarrollada con **React Native, Expo SDK 54 y TypeScript**, conectada a **Supabase** para autenticación y base de datos PostgreSQL.

## Funcionalidades

### Visitantes
- Pantalla de bienvenida.
- Consulta del catálogo de productos.
- Registro e inicio de sesión.

### Clientes
- Inicio y consulta/actualización de perfil.
- Consulta de productos disponibles.
- Creación de pedidos con productos y cantidades.
- Registro de reservas con fecha, hora y número de personas.
- Cierre de sesión.

### Administradores
- Panel administrativo y consulta de usuarios.
- Gestión de productos: creación, edición, disponibilidad y eliminación.
- Consulta de pedidos y detalles; actualización de estados.
- Consulta de reservas y confirmación o cancelación.

## Tecnologías
- Expo SDK 54, React Native 0.81, React 19 y TypeScript.
- React Navigation.
- Supabase Auth, PostgreSQL y Row Level Security (RLS).
- AsyncStorage para persistencia de sesión en dispositivos móviles.

## Instalación y ejecución

1. Instalar Node.js y las dependencias del proyecto:

   ```bash
   npm install
   ```

2. Crear un archivo `.env` en la raíz del proyecto con las variables públicas de Supabase:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICABLE
   ```

   No colocar claves `service_role`, secretos privados ni contraseñas en el repositorio.

3. Iniciar Expo:

   ```bash
   npx expo start
   ```

4. Abrir la aplicación con Expo Go o un emulador compatible.

## Estructura principal

```text
miAppTS/
├── App.tsx
├── index.ts
├── package.json
├── .env                    # Configuración local, no publicar
├── README.md
└── src/
    ├── context/
    │   └── AuthContext.tsx
    ├── database/
    │   └── supabase.ts
    ├── navegacion/
    │   ├── StackNavigator.tsx
    │   └── componente/
    │       ├── Login.tsx
    │       ├── Registro.tsx
    │       ├── Home.tsx
    │       ├── Perfil.tsx
    │       ├── Pedido.tsx
    │       ├── PedidosAdmin.tsx
    │       ├── DetallesAdmin.tsx
    │       ├── Reserva.tsx
    │       ├── ReservasAdmin.tsx
    │       ├── ProductosAdmin.tsx
    │       └── otros componentes
    └── tema/
        └── colores.ts
```

## Base de datos

La base de datos utiliza cinco tablas relacionadas:

| Tabla | Función |
|---|---|
| `Usuario` | Perfil, rol, estado e identidad de autenticación. |
| `Producto` | Nombre, descripción, precio, categoría y disponibilidad. |
| `Pedido` | Encabezado de pedido, cliente, fecha, total y estado. |
| `DetallePedido` | Productos, cantidades y precios asociados a cada pedido. |
| `Reserva` | Cliente, fecha, hora, número de personas y estado. |

Relaciones: `Pedido.usuario_id` y `Reserva.usuario_id` referencian a `Usuario`; `DetallePedido.pedido_id` referencia a `Pedido` y `DetallePedido.producto_id` a `Producto`.

**Nota:** La instalación de dependencias no crea automáticamente la base de datos. Para reproducir el sistema desde cero se requiere configurar en Supabase las tablas, relaciones, restricciones, políticas RLS y funciones SQL utilizadas por la aplicación, incluidas las operaciones seguras de creación de pedidos.

## Autenticación y seguridad

- Supabase Auth gestiona la sesión.
- `AuthContext` recupera la sesión y consulta el perfil usando `auth_id`.
- La navegación registra pantallas según el rol `CLIENTE` o `ADMIN`.
- Las cinco tablas tienen RLS activado, con 13 políticas en total según la verificación del proyecto.
- Se realizaron pruebas para confirmar que un cliente no puede actualizar estados administrativos de pedidos o reservas y que no puede consultar el perfil del administrador.

Las rutas de la aplicación complementan, pero no reemplazan, las restricciones de la base de datos.

## Verificaciones realizadas

- Pruebas funcionales de autenticación, navegación, pedidos y reservas: aprobadas durante el desarrollo.
- `npx tsc --noEmit`: finalizó sin errores.
- `expo-font` 14.0.12: instalación deduplicada y compatible con Expo SDK 54.
- `expo-doctor`: verificación integral pendiente por fallo de conexión TLS con la API de Expo.
- Pendiente: comprobar aislamiento de pedidos y reservas entre dos clientes diferentes.

## Comandos útiles

```bash
npm start
npm run android
npm run web
npx tsc --noEmit
npx expo-doctor
```

## Alcance

Proyecto académico de gestión de restaurante. La configuración del servidor Supabase debe mantenerse separada de las credenciales privadas y revisarse antes de un despliegue público.
