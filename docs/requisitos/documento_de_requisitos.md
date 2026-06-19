# Documento de Requisitos de Software (SRS)

# Sistema Web de Catálogo y Gestión de Pedidos para Stylos Variedades

**Versión:** 1.0
**Fecha:** Agosto 2026

---

# 1. Introducción

## 1.1 Propósito

El presente documento tiene como finalidad definir los requisitos funcionales y no funcionales para el desarrollo de una aplicación web destinada al negocio **Stylos Variedades**, la cual permitirá la visualización de productos mediante catálogos digitales, la generación de pedidos y la administración de productos y pedidos a través de un panel de administración.

El sistema estará orientado tanto a clientes minoristas como mayoristas, proporcionando diferentes esquemas de precios según el tipo de usuario.

---

## 1.2 Alcance

La aplicación estará compuesta por tres módulos principales:

1. Catálogo para clientes minoristas (Precios al detal).
2. Catálogo para clientes mayoristas (Precios al por mayor).
3. Dashboard administrativo para la gestión de productos y pedidos.

Los dos catálogos compartirán la misma base de datos y mostrarán la misma información de los productos, diferenciándose únicamente por el precio mostrado al usuario.

El sistema permitirá la creación de pedidos mediante un carrito de compras y la comunicación con el negocio a través de WhatsApp. Asimismo, proporcionará herramientas administrativas para la gestión de productos, revisión y modificación de pedidos, y generación de documentos de confirmación.

---

# 2. Objetivos del Sistema

## Objetivo General

Desarrollar una plataforma web que permita a Stylos Variedades exhibir su catálogo de productos, gestionar pedidos de clientes minoristas y mayoristas y administrar la información del negocio de manera centralizada.

## Objetivos Específicos

- Ofrecer dos catálogos con diferentes esquemas de precios.
- Permitir la creación de pedidos desde la página web.
- Facilitar la comunicación entre clientes y el negocio mediante WhatsApp.
- Proporcionar herramientas administrativas para la gestión de productos y pedidos.
- Permitir la generación de documentos de confirmación de pedidos.
- Mantener la integridad de los precios según el tipo de catálogo desde el que se originó cada pedido.

---

# 3. Usuarios del Sistema

## Cliente Minorista

Usuario que consulta el catálogo con precios al detal y realiza compras individuales.

## Cliente Mayorista

Usuario que consulta el catálogo con precios al por mayor y realiza compras de múltiples productos para su posterior comercialización.

## Administrador

Usuario autorizado que accede al dashboard administrativo mediante credenciales de autenticación para gestionar productos y pedidos.

---

# 4. Requisitos Funcionales

## RF-01. Catálogo de Productos

El sistema deberá mostrar un catálogo de productos que incluya:

- Nombre del producto.
- Imagen principal del producto.
- Precio correspondiente al tipo de catálogo.
- Botón de agregado rápido al carrito.

---

## RF-02. Dos Frontends de Catálogo

El sistema deberá disponer de dos interfaces de catálogo:

### Catálogo Minorista

- Mostrará los productos con precios al detal.

### Catálogo Mayorista

- Mostrará los productos con precios al por mayor.

Ambos catálogos:

- Compartirán la misma base de datos.
- Mostrarán la misma información de productos.
- Utilizarán las mismas imágenes y descripciones.
- Se diferenciarán únicamente por el precio mostrado.

---

## RF-03. Página de Detalle del Producto

Cada producto deberá contar con una página de detalle que incluya:

- Nombre del producto.
- Precio correspondiente al catálogo consultado.
- Descripción del producto.
- Galería de imágenes del producto (si existen varias imágenes).
- Selector de cantidad.
- Botón para agregar el producto al carrito con la cantidad especificada.

---

## RF-04. Carrito de Compras

El sistema deberá permitir:

- Agregar productos al carrito.
- Modificar las cantidades de los productos agregados.
- Eliminar productos del carrito.
- Visualizar el listado de productos seleccionados.
- Visualizar el total acumulado del pedido.

---

## RF-05. Creación de Pedido

Al presionar el botón **Finalizar Compra**, el sistema deberá:

1. Crear un pedido en la base de datos.
2. Almacenar:
   - Productos seleccionados.
   - Cantidades.
   - Precio unitario de cada producto.
   - Total del pedido.
   - Fecha de creación.
   - Tipo de pedido.

3. Redireccionar al usuario al chat de WhatsApp de Stylos Variedades.
4. Generar automáticamente un mensaje que contenga:
   - Notificación de creación del pedido.
   - Identificador del pedido.
   - Productos solicitados.
   - Cantidades.
   - Total del pedido.

A partir de este momento, la atención continuará directamente entre el cliente y Stylos Variedades mediante WhatsApp.

---

## RF-06. Identificación del Origen del Pedido

El sistema deberá almacenar el tipo de catálogo desde el cual fue generado cada pedido.

Los posibles valores serán:

- Pedido al Detal.
- Pedido al por Mayor.

Esta información deberá permanecer asociada al pedido durante todo su ciclo de vida.

---

## RF-07. Autenticación Administrativa

El sistema deberá proporcionar un mecanismo de autenticación mediante:

- Usuario.
- Contraseña.

Solo los administradores autorizados podrán acceder al dashboard.

---

## RF-08. Gestión de Productos

Los administradores deberán poder:

### Crear productos

- Nombre.
- Descripción.
- Precio al detal.
- Precio al por mayor.
- Imágenes del producto.

### Editar productos

- Modificar toda la información de un producto.

### Eliminar productos

- Eliminar productos existentes del catálogo.

---

## RF-09. Gestión de Pedidos

El dashboard deberá mostrar todos los pedidos generados por los clientes.

Cada pedido deberá mostrar:

- Identificador del pedido.
- Fecha de creación.
- Tipo de pedido (Detal o Mayorista).
- Estado del pedido.
- Productos agregados.
- Cantidad de cada producto.
- Precio unitario.
- Total del pedido.

---

## RF-10. Modificación de Pedidos

Los administradores deberán poder realizar las siguientes acciones:

### Marcar un producto como no disponible

- El producto permanecerá registrado en el pedido.
- Su valor no será contabilizado en el total.

### Eliminar un producto del pedido

- El producto será removido completamente del pedido.

### Reemplazar un producto

- El producto podrá sustituirse por otro existente en el catálogo.

### Agregar nuevos productos al pedido

- El administrador podrá añadir productos adicionales al pedido.

Después de cualquier modificación, el sistema deberá recalcular automáticamente el total.

---

## RF-11. Conservación del Esquema de Precios

El sistema deberá conservar el tipo de precio correspondiente al origen del pedido.

Por tanto:

- Los pedidos al detal utilizarán únicamente precios al detal.
- Los pedidos al por mayor utilizarán únicamente precios al por mayor.

Esta regla deberá mantenerse incluso cuando:

- Se agreguen nuevos productos.
- Se reemplacen productos.
- Se recalculen los totales.

En ningún caso se permitirá la mezcla de precios al detal y precios al por mayor dentro de un mismo pedido.

---

## RF-12. Generación de Documento de Confirmación

Una vez revisado el pedido, el administrador deberá poder generar un documento de confirmación que contenga:

- Identificador del pedido.
- Fecha.
- Lista de productos.
- Cantidades.
- Productos no disponibles (si aplica).
- Total a pagar.

El documento podrá generarse en:

- Formato PDF.
- Formato Imagen.

El documento será utilizado para enviarlo al cliente y confirmar el pedido.

---

## RF-13. Gestión del Estado de los Pedidos

El administrador deberá poder:

### Marcar un pedido como completado

Indica que el pedido fue revisado y confirmado.

### Eliminar un pedido

Indica que el pedido fue cancelado y no continuará su proceso.

---

# 5. Requisitos No Funcionales

## RNF-01. Usabilidad

La interfaz deberá ser:

- Intuitiva.
- Fácil de utilizar.
- Compatible con dispositivos móviles y de escritorio.
- Responsiva.

---

## RNF-02. Rendimiento

Las operaciones de:

- Consulta de productos.
- Consulta de pedidos.
- Creación de pedidos.

Deberán responder en un tiempo inferior a 3 segundos bajo condiciones normales de operación.

---

## RNF-03. Seguridad

El sistema deberá:

- Almacenar las contraseñas de administradores de forma cifrada.
- Restringir el acceso al dashboard mediante autenticación.
- Proteger las rutas administrativas contra accesos no autorizados.
- Validar la información enviada desde los formularios.

---

## RNF-04. Disponibilidad

La aplicación deberá estar disponible las 24 horas del día, exceptuando periodos de mantenimiento programado.

---

## RNF-05. Compatibilidad

La aplicación deberá funcionar correctamente en:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Safari

---

## RNF-06. Escalabilidad

La arquitectura del sistema deberá permitir:

- Incrementar la cantidad de productos.
- Incrementar la cantidad de pedidos.
- Incorporar nuevos tipos de usuarios o funcionalidades futuras sin requerir una reestructuración completa del sistema.

---

# 6. Arquitectura General del Sistema

## Frontend 1

Catálogo para clientes minoristas con precios al detal.

## Frontend 2

Catálogo para clientes mayoristas con precios al por mayor.

## Backend

Servicio central encargado de:

- Gestión de productos.
- Gestión de pedidos.
- Gestión de autenticación.
- Generación de documentos.
- Integración con WhatsApp.
- Gestión de imágenes.

## Base de Datos

Base de datos única y centralizada utilizada por:

- Catálogo al detal.
- Catálogo al por mayor.
- Dashboard administrativo.

La base de datos almacenará toda la información de productos, pedidos y usuarios administrativos, garantizando la integridad de los precios según el origen de cada pedido.
