
# Requisitos técnicos: implementación del juego

Este documento parte de `requisitos_juego_adivinar_personajes.md` y define cómo construir el programa. Juego online, un jugador, con historial público de partidas (no ranking de mejores puntuaciones).

## 1. Decisiones tomadas

| Aspecto | Decisión |
|---|---|
| Frontend | Web simple: HTML + CSS + JavaScript (sin framework, sin build) |
| Backend / persistencia | Supabase (base de datos + API gestionada) |
| Identificación en historial | Alias opcional, sin login |
| Datos de personajes (fase de pruebas) | Hoja de cálculo (CSV/Excel), se importará a Supabase |
| Mapa | Mapa real con Leaflet + OpenStreetMap |
| Hosting | Netlify o Vercel (despliegue de sitio estático) |

## 2. Arquitectura general

- Sitio estático (HTML/CSS/JS) desplegado en Netlify/Vercel.
- Supabase como backend: base de datos con las tablas de personajes, hechos, ciudades y leaderboard, accedida directamente desde el navegador con la clave pública (anon key).
- Sin servidor propio: toda la lógica del juego corre en el cliente (JavaScript).
- Row Level Security (RLS) en Supabase: lectura pública de personajes/hechos/ciudades; en `partidas` y `respuestas_partida`, solo inserción pública permitida (no editar ni borrar registros ajenos). Lectura pública limitada a las 20 partidas más recientes (o filtrada en el cliente).

## 3. Modelo de datos (Supabase)

### Tabla `ciudades`
| Campo | Tipo | Notas |
|---|---|---|
| id | serial/PK | |
| nombre | text | |
| lat | float | coordenada para Leaflet |
| lon | float | coordenada para Leaflet |

### Tabla `personajes`
| Campo | Tipo | Notas |
|---|---|---|
| id | serial/PK | |
| nombre | text | nombre oficial mostrado al final |
| nombres_alternativos | text[] | alias/variantes aceptadas como acierto |

### Tabla `hechos`
| Campo | Tipo | Notas |
|---|---|---|
| id | serial/PK | |
| personaje_id | FK → personajes | |
| ciudad_id | FK → ciudades | |
| anio | int | |
| actividad | text | |
| orden | int | orden cronológico/narrativo del hecho para ese personaje |

### Tabla `partidas` (antes llamada "leaderboard"; ahora es historial, no ranking)
| Campo | Tipo | Notas |
|---|---|---|
| id | serial/PK | |
| alias | text (nullable) | opcional, el jugador puede no ponerlo |
| personaje_id | FK → personajes | personaje a adivinar en esa partida |
| acertado | boolean | si el jugador adivinó el personaje |
| puntos | int | puntuación obtenida (0 si no acierta) |
| turnos_usados | int | |
| fecha | timestamp | default now() |

### Tabla `respuestas_partida`
| Campo | Tipo | Notas |
|---|---|---|
| id | serial/PK | |
| partida_id | FK → partidas | |
| turno | int | en qué turno se dio esta respuesta |
| respuesta_texto | text | nombre escrito por el jugador (o null/"paso" si pasó turno) |
| acertada | boolean | si esa respuesta concreta fue correcta |

## 4. Datos de prueba

- Se preparará una hoja de cálculo (Excel/CSV) con columnas equivalentes a las tablas `ciudades`, `personajes` y `hechos`.
- Import manual (o script sencillo) desde la hoja a Supabase mientras no exista un panel de administración.
- Pendiente: Ricard aportará los datos reales más adelante; de momento se usan 2-3 personajes de prueba con 4-6 hechos cada uno.

## 5. Lógica del juego (frontend)

- Un personaje por partida. Al iniciar: elegir un personaje al azar de la tabla `personajes` (con sus 4 primeros `hechos`, ordenados por `orden`).
- Evitar repetir personaje: guardar en `localStorage` el `personaje_id` de la última partida jugada en ese navegador y excluirlo del sorteo de la siguiente partida (si solo queda 1 personaje en la tabla, se permite repetir).
- Máximo 4 turnos por partida. Progresión de pistas (ver detalle en `requisitos_juego_adivinar_personajes.md`, sección 3):
  - Turno 1: se muestra la 1ª ciudad.
  - Turno 2: se muestra la 2ª ciudad; se añade el año a todas las ciudades ya mostradas.
  - Turno 3: se muestra la 3ª ciudad (con año).
  - Turno 4: se muestra la 4ª ciudad (con año).
  - Las actividades no se muestran durante los turnos.
- Input del jugador cada turno: nombre escrito o botón "Paso".
- Comprobación de acierto (ver punto 6).
- Actualización de: número de turno, puntos acumulados, lista de intentos fallidos, marcado de ciudades en el mapa.
- Si acierta → fin de partida, gana.
- Si se agotan los 4 turnos sin acertar → fin de partida: se revela el nombre del personaje y se muestra la actividad junto a cada ciudad ya revelada.
- Fin de partida (acierto o turnos agotados): se guarda siempre la partida completa y todas las respuestas dadas turno a turno; se ofrece un campo opcional para introducir alias.

## 6. Reconocimiento del nombre (acierto no exacto)

Propuesta técnica:
- Normalizar texto: minúsculas, sin tildes/diacríticos, sin espacios extra.
- Comparar contra `nombre` y todos los `nombres_alternativos` normalizados.
- Aceptar coincidencia si: es igual tras normalizar, o el texto introducido coincide con el apellido, o coincide parcialmente con nombre/apellido (contiene o está contenido), o la distancia de Levenshtein está por debajo del umbral.
- **Umbral propuesto (tolerancia alta)**: se acepta si `distancia_Levenshtein ≤ max(2, round(0.3 × longitud_texto_normalizado))`. En la práctica: nombres cortos (≤7 letras) admiten hasta 2 caracteres de diferencia; nombres más largos admiten ~30% de la longitud (ej. "Cristobal Colon" con 1-2 erratas o sin tildes se sigue aceptando).
- Comparar tanto contra el nombre completo como contra cada palabra suelta (nombre y apellidos por separado), quedándose con la mejor coincidencia.
- Ajustar el umbral tras pruebas con los datos reales; si da demasiados falsos positivos, bajar a 20%.

## 7. Puntuación

- Matriz de puntos por turno (4 turnos): **turno 1 = 100, turno 2 = 85, turno 3 = 55, turno 4 = 25**.
- Los "puntos en juego" del turno actual se muestran siempre en pantalla.

## 8. Mapa

- Librería: Leaflet.js + tiles de OpenStreetMap (gratuito).
- Cada ciudad revelada se marca en el mapa con sus coordenadas.
- Las ciudades se unen con una curva (línea curva tipo "great circle" o Bézier simple) en el orden en que se han ido revelando.

## 9. Historial de partidas (antes "leaderboard")

- **No es un ranking de mejores puntuaciones**: es un historial de partidas, ordenado de la más reciente a la más antigua.
- **Es global**: se muestran partidas de todos los jugadores, no solo del jugador actual (no hay login que permita separarlo por jugador).
- En pantalla se muestran solo **las 20 partidas más recientes**, tanto acertadas como falladas (no se filtran solo las acertadas).
- Se guardan **todas las partidas jugadas**, se acierte o no.
- Se guardan también **todas las respuestas dadas turno a turno** dentro de cada partida (tabla `respuestas_partida`), pero en la pantalla del historial cada partida se muestra solo como resumen (alias si lo hay, **nombre del personaje**, puntos, acierto/fallo, fecha) — sin desglose turno a turno.
- El alias es **opcional**: el jugador puede terminar la partida sin poner nombre.
- Filtro de lenguaje en el alias: **pospuesto a una v2**, no es necesario para el primer lanzamiento.

## 10. Anti-abuso en el guardado de partidas

Al no haber login, cualquiera puede insertar registros directamente en Supabase. Propuesta sencilla para el MVP:

- **Honeypot**: un campo oculto en el formulario de alias que un humano nunca rellena; si llega relleno, se descarta el guardado (filtra bots simples).
- **Límite de frecuencia en cliente**: guardar en `localStorage` la marca de tiempo del último guardado y bloquear un nuevo guardado antes de, por ejemplo, 10 segundos (evita scripts que repiten peticiones muy rápido).
- **Validación con constraints en Supabase**: restringir por esquema que `puntos` solo pueda ser uno de {0, 25, 55, 85, 100}, `turnos_usados` entre 1 y 4, y `personaje_id`/`ciudad_id` deban existir (FK). Así una petición manual con datos absurdos se rechaza en la base de datos, no solo en el cliente.
- No incluye captcha ni verificación de identidad: suficiente para un MVP, se puede reforzar más adelante si hay abuso real.

## 11. Despliegue

- Repositorio conectado a Netlify o Vercel para despliegue automático.
- Variables de entorno: URL de Supabase y clave anon (pública, protegida por RLS).

## 12. Preguntas abiertas pendientes

- [x] Valores exactos de la matriz de puntuación por turno → 100, 85, 55, 25
- [x] Umbral de tolerancia para el reconocimiento de nombres → alto; propuesta concreta de fórmula en sección 6
- [x] Número máximo de turnos por partida → 4
- [x] Cuántas posiciones muestra el historial → últimas 20 (por fecha, no por puntuación)
- [x] ¿Se guardan todas las partidas o solo si se acierta el personaje? → todas las partidas, se acierte o no
- [x] ¿Filtro de lenguaje/validación en el alias? → pospuesto a v2
- [x] El historial, ¿es global o por jugador? → global, de todos los jugadores
- [x] ¿Se evita repetir el mismo personaje en partidas consecutivas del mismo jugador? → sí, vía exclusión por `localStorage` (sección 5)
- [x] Medida anti-abuso para inserciones públicas sin login → honeypot + límite de frecuencia en cliente + constraints en Supabase (sección 10)

Sin preguntas abiertas pendientes por ahora. Próximo paso natural: preparar los datos de prueba (CSV) y empezar a montar el proyecto (Supabase + esqueleto HTML/JS).
