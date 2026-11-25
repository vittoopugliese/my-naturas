# Colección de Perfumes: spec inicial

Frontend personal para mostrar mi colección de perfumes con modelos 3D.
v1 = solo los 12 Natura. El schema está pensado para sumar otras marcas después.

Datos: [`data/perfumes.json`](data/perfumes.json) (fuente única de verdad).

## 1. Qué es

Una estantería 3D que replica mi estante real. Al hacer click en un frasco, la cámara se acerca, el frasco gira y aparece la ficha (notas, familia, año, perfumista).

No tiene backend, login ni base de datos: es un sitio estático.

## 2. Vistas

| Vista | Contenido |
|---|---|
| **Estante** (home) | Los 12 frascos en fila sobre una repisa de madera, en el orden de la foto (`bottle.shelfOrder`). Hover = el frasco se levanta un poco y muestra un tooltip con el nombre. Órbita de cámara limitada. |
| **Detalle** | Click en un frasco: la cámara hace zoom, el frasco queda solo y rota lento (drag para girarlo). Panel lateral con nombre, línea, concentración, año, perfumistas, familia y una pirámide de notas (salida / corazón / fondo). |
| **Filtros** | Chips por línea (Homem / Essencial / Kaiak / Humor / Ekos) y por familia (amaderada, especiada, cítrica, marina, aromática). Los frascos que no coinciden se atenúan pero no se quitan, para que el estante mantenga su forma. |
| **Catálogo** | Segundo modo, que se elige arriba con "Mi estante / Catálogo". Muestra todas las líneas masculinas de Natura (89 perfumes de hombre o unisex en 11 líneas), con una estantería por línea apilada en vertical y los frascos ordenados por año. Mis frascos aparecen con su modelo exacto y una ★ en el borde del estante. ↑ ↓ o la lista lateral cambian de estante. Los filtros por familia también funcionan acá. |

**Carga:** hay un solo modo montado a la vez. Al cambiar de modo se desmonta el otro canvas y se libera su memoria de GPU. El catálogo (`src/modes/Catalog.tsx` y `data/catalogo.json`) es un chunk aparte que se baja solo al abrirlo. Dentro del catálogo solo se montan el estante en foco y sus dos vecinos (`MOUNT_RADIUS`).

**Datos del catálogo:** `data/catalogo.json` lo genera `scripts/catalogo/` a partir de thescentbase.com (468 perfumes de Natura; se filtran los de hombre y los unisex). Trae año, género, familia, notas (traducidas con `notes-es.js`) y perfumistas. No trae concentración. Excluye mis perfumes, que la app agrega desde `data/perfumes.json`. Los frascos son aproximados (`bottle.estimated`): la forma sale de la línea y el año (Homem desde 2016 usa `homem-rect`, Kaiak desde 2018 `kaiak-tall`, Humor `humor-pebble`, Ekos `ekos-round` y el resto `generic-rect`, proporcionado según la foto), y el color se toma de la foto del producto. Para regenerarlo:

```sh
cd scripts/catalogo && npm i --no-save jpeg-js@0.4.4
node scrape.js slugs.txt <carpeta-temporal>          # baja páginas y fotos
node colors.js <carpeta-temporal>/img <carpeta-temporal>/colors.json
node build-catalog.js <carpeta-temporal>/scraped.json <carpeta-temporal>/colors.json ../../data/perfumes.json ../../data/catalogo.json
```

`scrape.js` espera que existan las subcarpetas `pages/` e `img/` dentro de la carpeta temporal.

No están en el catálogo porque thescentbase solo tiene la versión femenina: Kaiak clásico, Biografia y Essencial Elixir. Homem Identidad, Homem Potence y Ekos Copaíba sí están, porque son míos.

Extras para v2: "qué me pongo hoy" (sugerencia por clima o ocasión), notas compartidas entre perfumes (grafo), contador de usos.

## 3. Modelos 3D

**Decisión: frascos procedurales, no GLB.** Cada frasco se genera por código a partir de `bottle.shape` + colores. Las formas y proporciones salen de los close-ups de cada frasco (2026-11-21). Motivos:
- No hay modelos 3D oficiales de Natura y modelar 12 en Blender lleva mucho tiempo.
- Los Homem actuales comparten forma (bloque casi cuadrado, tapa cilíndrica moleteada), así que un solo generador cubre 6 frascos.
- Más adelante, cualquier frasco se puede reemplazar por un `.glb` sin tocar el resto (campo opcional `bottle.model`).

Formas (`src/three/shapes/`, una por archivo; 1 unidad = 10 cm):

| `shape` | Frascos | Geometría |
|---|---|---|
| `essencial-faceted` | Essencial Exclusivo | El más grande. Bloque mate gris oscuro; el frente tiene la esquina superior izquierda y el borde izquierdo cortados en facetas (geometría propia, flat shading). Cuello plateado y tapa cuadrada mate. |
| `coragio-frame` | Homem Cor.agio | Cuerpo negro brillante con los costados moleteados (bump map). Al frente, una placa gris con marco plateado que sobresale por arriba; arriba, un bloque transparente con el accionador escalonado naranja. |
| `homem-rect` | Identidad, Homem, Essence, Potence, Tato, Elo | Bloque casi cuadrado con bordes redondeados. Tapa cilíndrica: banda lisa, ranura y grip moleteado. Etiqueta alineada a la izquierda (natura / HOMEM / nombre). Identidad tiene letras tornasoladas (`label: "iridescent"`). Tato y Elo pasan de color arriba a vidrio transparente abajo (`glassGradientTo`). |
| `kaiak-tall` | Kaiak Sonar | Alto, vidrio satinado azul arriba que pasa a transparente abajo. Tapa grande azul esmerilada sobre un aro blanco con presilla. |
| `humor-pebble` | Humor a Dois, Paz e Humor | Piedra aplanada (`LatheGeometry` escalada en z), más ancha abajo. Tapa metálica del color del frasco con un aro pastel. Etiqueta curvada. |
| `ekos-round` | Ekos Copaíba | Redondo, vidrio marrón ahumado, hombros redondeados, collar de vidrio y válvula negra estriada. "CO / PAÍ / BA" curvado sobre el frasco. |

Estante (`src/three/layout.ts`): cada frasco gira según `bottle.yaw` (grados; positivo muestra el costado derecho) y se apoya contra el fondo. Después se corre a la derecha solo hasta no chocar con sus vecinos (test de ejes separadores entre rectángulos rotados). Así los frascos girados quedan metidos uno detrás del otro, apilados como en el estante real.

Material del vidrio (`src/three/materials.tsx`): `MeshPhysicalMaterial`. Los frascos casi negros (Essencial, Cor.agio, Identidad) son laqueados opacos. Los de color usan `transmission` parcial (0.45) y un leve `emissive` de su color: con transmisión total se veían negros contra la pared oscura. El Homem transparente usa transmisión casi total. Los que pasan de color a transparente (Tato, Elo, Kaiak) usan una textura de gradiente en `map` y otra en `transmissionMap`. Essencial es mate. No hay mesh de líquido interior: three.js no muestra un objeto con transmisión dentro de otro, así que vidrio y líquido se resuelven como un solo volumen teñido. Etiquetas: `Text` de drei sobre la cara frontal.

## 4. Stack

| Capa | Elección | Por qué |
|---|---|---|
| Build | Vite + React + TypeScript | Simple y rápido, sin SSR. |
| 3D | `@react-three/fiber` + `@react-three/drei` | R3F declarativo; drei trae `RoundedBox`, `Environment`, `ContactShadows`, `CameraControls` y `MeshTransmissionMaterial`. |
| Animación | `@react-spring/three` o `maath/easing` | Zoom de cámara y hover. |
| UI | Tailwind | Panel de detalle y filtros. |
| Deploy | Vercel o GitHub Pages | Sitio estático. |

Versiones instaladas: react 19.3, three 0.187, @react-three/fiber 9.8, @react-three/drei 10.7, maath 0.10, Vite 8, Tailwind 4, TypeScript 7. R3F 9 exige react < 19.4.

Correr: `npm install`, `npm run dev`. Build: `npm run build`.

## 5. Estética

- Fondo oscuro cálido, como un estante de madera de noche, con una luz cenital tipo vitrina.
- `Environment` armado con `Lightformer` locales (no descarga HDR) para que el vidrio refleje algo.
- `ContactShadows` bajo los frascos.
- Tipografía: una serif elegante para los nombres y una sans mono para los datos.
- Cada perfume tiñe el panel de detalle con su color (`bottle.glass`).

## 6. Pendientes para confirmar con la colección física

Resuelto: colores y orden de los Homem (3 Identidad, 4 Homem, 5 Essence, 6 Potence, 7 Tato, 8 Elo), Identidad es de 2025 y el Homem es el original de 1997.

1. **Concentraciones.** Las puse según la línea (Homem = Deo Parfum/EDP, Humor/Kaiak/Ekos = Deo Colônia). Verificar en cada caja o etiqueta.
2. **Kaiak Sonar y Homem Potence.** Las fuentes no coinciden en las notas (`verified: false`). Confirmar.
3. **Fotos de referencia.** Sacar una foto de frente y otra de perfil de cada frasco y guardarlas en `refs/<id>.jpg` para ajustar proporciones.
4. **Resto de la colección.** Hay perfumes de otras marcas; quedan para después de v1, con `brand` distinto.

## 7. Plan de implementación

Hecho (2026-11-21):
1. Scaffold con Vite y R3F. Escena con repisa, pared, luces y entorno.
2. Seis formas procedurales (`src/three/shapes/`), rehechas con los close-ups, y `<Bottle>` con hover, tooltip, selección y atenuado.
3. Estante en orden de `shelfOrder`, con los frascos girados y apilados como en la foto, y cámara que encuadra todo según el ancho de pantalla.
4. Vista detalle: el frasco sale al frente y gira, la cámara hace zoom y aparece el panel con la pirámide. Flechas ← → para recorrer y Esc o click en el fondo para salir.
5. Filtros por línea y familia.
6. Modo Catálogo: una estantería por línea masculina, ordenada por año, con carga diferida.

Pendiente:
7. Afinar medidas reales (hoy son proporciones de los close-ups; falta medir alto y ancho de cada frasco).
8. Probar y pulir en mobile.
9. Fuente propia para las etiquetas (hoy `Text` usa la fuente por defecto de troika).
10. Modelos propios para los frascos del catálogo que hoy usan la forma genérica.
11. Deploy.

## Fuentes

- thescentbase.com: Essencial Exclusivo, Cor.agio, Homem, Essence, Tato, Elo, Kaiak Sonar, Humor a Dois, Paz e Humor
- naturacosmeticos.com.ar + fragrantica.es: Homem Identidad
- parfumo.com + natura.cl + naturacosmeticos.com.ar: Homem Potence
- guidodecants.com.br + fragrantica.com + perfumart.com.br: Ekos Copaíba
- correiobraziliense.com.br: pirámide del Homem Tato (coincide con thescentbase)

Las URLs exactas de cada perfume están en el campo `source` de `data/perfumes.json`.
