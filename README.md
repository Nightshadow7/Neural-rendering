# El modelo por dentro

Visualización 3D de un modelo de lenguaje, explicaciones en español, inferencia local y sensores reales de CPU/GPU.

## Abrir

Ejecuta `npm run dev` y abre http://127.0.0.1:3002. La pantalla principal muestra directamente el recorrido; no hay que añadir `/llm` ni cambiar la URL del modelo.

Para una ejecución optimizada: `npm run build` y luego `npm start`. Ambos modos usan el puerto 3002 y escuchan solo en este equipo.

## Modelo local

Al abrir la página se busca primero un llama-server activo en los puertos 8080 y 8081. Se usa el nombre del modelo que devuelve su API. Si no está disponible, se conecta con Ollama en el puerto 11434 y carga automáticamente `deepseek-r1:7b`, con un contexto solicitado de 4096 tokens y 30 minutos de permanencia en memoria. La primera carga puede tardar.

Ollama debe estar abierto o llama-server iniciado con su modelo GGUF. La aplicación no descarga modelos ni cambia la configuración de reparto CPU/GPU. Para una instalación de llama-server en otro puerto, se puede definir `LLAMA_BASE_URL` en `.env.local`; no es necesario en la configuración habitual. El navegador siempre usa las API del propio proyecto, sin habilitar CORS global.

## Qué se observa

- CPU: actividad total del equipo calculada a partir de dos muestras de los contadores del sistema.
- GPU NVIDIA: utilización, VRAM, temperatura y potencia leídas mediante `nvidia-smi`.
- RAM: memoria física total y usada del equipo.
- Respuesta: texto transmitido por el modelo, primer fragmento, tokens de salida reportados por el servidor, duración y promedio total de tokens/segundo (incluye la espera inicial).
- Escena 3D: GPT de ejemplo con unas 85 mil variables aprendidas y un recorrido por las operaciones. Sus tensores no son los de DeepSeek. El avance automático cada ocho segundos es una explicación ilustrativa, no una medición de las capas en ejecución. Los identificadores del diagrama inicial son ejemplos.

Los sensores incluyen otros programas y el navegador, no solo el modelo. No se inventan valores si un sensor falla. La salida del modelo puede conservar términos en otros idiomas aunque se le solicita responder en español.

Puedes detener la generación, reconectar y explorar las etapas. El recorrido detallado conserva los controles Continuar/Saltar y el movimiento de cámara. Los atajos no se activan al escribir en el formulario.

## Archivos conservados

`src/llm` contiene el motor 3D y las explicaciones; `src/utils`, sus utilidades; `src/server` y `src/app/api`, la conexión local y los sensores. `public` contiene los pesos del ejemplo, WebAssembly y fuentes necesarias. Los archivos fuente de las fuentes y de WebAssembly permiten reconstruir estos recursos. Se conserva la licencia original.

Los módulos de portafolio, circuitos, compresión y fluidos, la copia duplicada del proyecto y otros archivos sin uso se retiraron de esta carpeta. Hay una copia recuperable en `../respaldo-neural-rendering-20261016-055012`.

## Validación

`npm run typecheck` comprueba los tipos y `npm run build` genera la aplicación de producción.
