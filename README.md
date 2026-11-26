# Kcal 🐾 · contador de calorías con chigüiro

App web para contar calorías y bajar de peso, al estilo de apps como BitePal. Registras tus comidas con una foto, una descripción o una búsqueda, y **Chigüi**, un chigüiro, crece contigo.

**Abrir la app:** https://dgallego8.github.io/kcal/

## Qué hace

- 📸 **Foto o descripción → calorías y macros con IA.** Funciona con Google Gemini (gratis con tu propia clave) o con Claude.
- 🔎 **Base de ~190 alimentos y platos colombianos:** arepas, bandeja paisa, ajiaco, tinto, empanadas, corrientazo…
- 🍽️ **¿Qué como?:** ideas de desayuno, almuerzo, cena y mecato con comida colombiana que encajan en las calorías y la proteína que te quedan. Con la IA activa, también pide ideas nuevas a la IA.
- ✍️ **Describir sin IA:** "2 arepas con queso y un tinto" se calcula también con la base de alimentos.
- ⚡ **Registro rápido** y alimentos propios que quedan guardados para buscarlos después.
- 🎯 **Meta diaria** de calorías, proteína, carbohidratos y grasa que se recalcula cada vez que registras tu peso.
- 💧 Agua · ⚖️ peso con gráfica, tendencia real y fecha estimada para llegar a tu meta.
- 🐾 **Mascota:** gana XP cuando registras, sube de nivel, desbloquea accesorios (mandarina, sombrero vueltiao, gafas, corona) y logros.
- 📴 Funciona sin internet (menos la IA) y se instala como app en el iPhone.
- 🔒 Tus datos se guardan **solo en tu celular**. Puedes exportar un respaldo en JSON.

## Instalarla en el iPhone

1. Abre https://dgallego8.github.io/kcal/ en **Safari**.
2. Toca **Compartir** → **Agregar a pantalla de inicio**.
3. Ábrela siempre desde ese ícono: así se ve a pantalla completa y Safari no borra tus datos.

## Activar la IA gratis (Gemini)

1. Entra a https://aistudio.google.com/apikey con tu cuenta de Google.
2. Toca **Create API key** y copia la clave (empieza por `AIza`).
3. En la app: **Ajustes → Inteligencia artificial**, pega la clave y toca **Guardar**.

El plan gratis tiene un límite diario de solicitudes (lo ves en AI Studio). La app elige sola el modelo Flash disponible y, si se acaba la cuota de uno, prueba con otro. En el plan gratis Google puede usar lo que envías para mejorar sus productos, así que no subas fotos con datos personales.

También puedes usar **Claude**: crea una clave de API en la consola de Anthropic (es de pago, se cobra por uso) y elige "Claude" en Ajustes.

## Recordatorios

Una app web en el iPhone no puede poner widgets ni programar avisos por su cuenta, así que los recordatorios se hacen con la app **Recordatorios** del iPhone: uno diario por comida (con las calorías de esa comida y una idea), dos de agua y uno los lunes para pesarte.

## Cómo calcula tu meta

- Metabolismo basal con la fórmula **Mifflin-St Jeor**.
- Gasto diario = basal × factor de actividad (de 1,2 a 1,9).
- Déficit = ritmo elegido (kg por semana) × 7.700 kcal ÷ 7 días.
- Nunca baja de 1.500 kcal en hombres ni de 1.200 kcal en mujeres.
- Proteína 1,6 g por kg · grasa 28 % de las calorías · carbohidratos, el resto.
- No deja poner una meta por debajo del peso saludable (IMC 18,5) y está pensada para mayores de 18 años.

Los valores de los alimentos son aproximados (USDA FoodData Central y Tabla de Composición de Alimentos Colombianos del ICBF) y cambian mucho según la preparación. **Kcal no reemplaza la asesoría de un profesional de la salud.**

## Publicarla con GitHub Pages

En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**. En uno o dos minutos queda en `https://dgallego8.github.io/kcal/`.

## Estructura

```
index.html            pantalla principal
css/styles.css        estilos
js/app.js             pantallas y lógica
js/foods.js           base de alimentos, búsqueda y estimación por texto
js/nutrition.js       cálculo de metas
js/ai.js              conexión con Gemini y Claude
js/game.js            XP, rachas, logros y mensajes de la mascota
js/ideas.js           ideas de comidas según tus calorías
js/mascot.js          dibujo de Chigüi (SVG)
js/charts.js          gráficas
sw.js                 modo sin internet
manifest.webmanifest  instalación como app
icons/                íconos
```

Para probarla en un computador: `python3 -m http.server` dentro de la carpeta y abre http://localhost:8000.

Si cambias archivos, sube también el número de `VERSION` en `sw.js` para que el celular descargue la versión nueva.
