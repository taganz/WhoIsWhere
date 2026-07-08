# Requisitos: Juego de adivinar personajes

## 1. Concepto

Juego de adivinar un personaje histórico/real a partir de pistas (ciudades donde estuvo, años, actividades), en el menor número de turnos posible.

## 2. Experiencia de usuario mínima

### 2.1 Presentación

- [ ] Mensaje inicial: "Vamos a adivinar personajes"
- [ ] Mensaje: "Me voy a pensar un personaje"
- [ ] Mensaje: "Te voy a decir ciudades en las que estuvo y en qué año"
- [ ] Instrucciones: "Si sabes quién es, escribe el nombre; si no, dale a 'paso'"
- [ ] Mensaje: "Cuanto antes lo adivines, más puntos obtendrás"
- [ ] Botón "Empezar"

### 2.2 Flujo de juego

- [ ] Al empezar, aparece un mapa
- [ ] Comienzan los turnos

### 2.3 En cada turno

- [ ] Se muestra:
  - Número de turno
  - Puntos que tienes
  - Puntos en juego (definidos en una matriz/tabla de puntuación)
- [ ] Aparece una pista nueva (ver "Mecánica de pistas")
- [ ] El jugador tiene dos opciones:
  - Escribir un nombre
  - Pulsar el botón "Paso"
- [ ] Si acierta el nombre → gana la partida
- [ ] Si no acierta → el nombre dado se guarda en una lista de intentos fallidos
- [x] Si se alcanza el máximo de turnos (4) sin acertar → fin de la partida: se revela el nombre del personaje, y se escribe junto a cada ciudad ya mostrada su actividad correspondiente.

## 3. Mecánica de pistas

Un personaje por partida, 4 turnos máximo. Progresión de pistas:

- [x] Turno 1: se muestra una ciudad (la primera del recorrido del personaje).
- [x] Turno 2: se muestra una nueva ciudad, y además se añade el año a cada ciudad ya mostrada.
- [x] Turno 3: se muestra una nueva ciudad (con su año).
- [x] Turno 4: se muestra la última ciudad (con su año).
- [x] Las actividades no se muestran durante los turnos: solo aparecen en la pantalla final si se agotan los turnos sin acertar (una por cada ciudad ya revelada).

Nota: esto es una propuesta concreta a partir de tus respuestas ("en cada turno se muestra la ciudad", "si no se acierta se da un turno adicional y se muestran los años"). Confírmalo o ajústalo si no es exactamente así.

## 4. Dudas / preguntas abiertas

- [x] ¿Cómo asegurar que se reconoce el nombre aunque no esté escrito de forma exacta? → umbral de tolerancia alto (ver documento técnico, sección 6)
- [x] ¿Qué pasa si se agotan los turnos sin acertar? → se revela el personaje y se escribe la actividad junto a cada ciudad
- [x] ¿Cómo se calcula la matriz de puntos en juego? → 100, 85, 55, 25 (uno por turno, 4 turnos)
- [x] ¿Un único personaje por partida o varias rondas seguidas? → un único personaje por partida
- [x] Progresión de pistas por turno → ver mecánica detallada en sección 3
- [x] En el historial, ¿se muestra resumen o detalle turno a turno? → solo resumen, mostrando el nombre del personaje jugado (no el detalle de cada respuesta)

## 5. Requisitos técnicos

### 5.1 Tabla de hechos

| Campo | Descripción |
|---|---|
| Personaje | Nombre del personaje |
| Ciudad | Ciudad relacionada con el hecho |
| Año | Año del hecho |
| Actividad | Actividad realizada |

### 5.2 Tabla de ciudades

| Campo | Descripción |
|---|---|
| Ciudad | Nombre de la ciudad |
| Coordenadas | Coordenadas para pintar en el mapa |

## 6. Requisitos visuales

- [ ] Un mapa como elemento central
- [ ] Las ciudades deben estar unidas por una curva elegante (trazado del recorrido del personaje)
