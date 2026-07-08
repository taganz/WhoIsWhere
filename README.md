# Adivina el personaje

Juego web de un jugador: adivina un personaje histórico a partir de pistas geográficas (ciudades y años) mostradas sobre un mapa, en un máximo de 4 turnos.

Ver requisitos completos en [`requisitos_juego_adivinar_personajes.md`](requisitos_juego_adivinar_personajes.md) y [`requisitos_tecnicos_juego.md`](requisitos_tecnicos_juego.md).

## Stack

- Frontend: HTML + CSS + JavaScript vanilla (sin framework, sin build).
- Backend: [Supabase](https://supabase.com) (Postgres + API), accedido directamente desde el navegador.
- Mapa: [Leaflet](https://leafletjs.com) + OpenStreetMap.
- Hosting: Netlify o Vercel (sitio estático).

## Arrancar en local

Al usar `<script type="module">`, el navegador bloquea los imports bajo `file://`. Hay que servir el proyecto con un servidor estático local, por ejemplo:

```bash
python -m http.server 5500
# o
npx serve .
```

Luego abrir `http://localhost:5500`.

## Configurar Supabase

1. Crear un proyecto en Supabase.
2. Ejecutar en el SQL Editor, en este orden: [`sql/schema.sql`](sql/schema.sql) y [`sql/seed.sql`](sql/seed.sql).
3. Copiar la URL del proyecto y la `anon key` en [`js/config.js`](js/config.js).

## Despliegue

Conectar el repositorio a Netlify o Vercel como sitio estático (sin build command, publicar la raíz del repo). Ver [`netlify.toml`](netlify.toml).
