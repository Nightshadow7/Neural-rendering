# Visualizador local

## Requisitos

- Node.js 22.13 o superior (recomendado: Node.js 24) y npm.
- Ollama instalado y abierto.
- Modelo `deepseek-r1:7b` (descarga aproximada de 4,7 GB).
- Chrome o Edge con WebGL2 para la vista 3D.
- GPU NVIDIA y controlador con `nvidia-smi` para sus sensores. Sin ellos, la GPU aparece como no disponible.

## Preparar

1. Abre una terminal en esta carpeta e instala las dependencias:
   ```powershell
   npm install
   ```
2. Descarga el modelo una sola vez:
   ```powershell
   ollama pull deepseek-r1:7b
   ```
3. Mantén Ollama abierto. Si no está activo, ejecuta `ollama serve` en otra terminal.

## Ejecutar

```powershell
npm run dev
```

La terminal muestra ambas direcciones. Puedes abrirlas al mismo tiempo:

- [Visualización 3D](http://127.0.0.1:3002/): capas, explicación e inferencia local.
- [Arañita](http://127.0.0.1:3002/arañita): documento, búsqueda de contexto y respuesta.

Un solo servidor sirve las dos páginas. Detén el servidor con `Ctrl+C`. Si el puerto 3002 está ocupado, detén la ejecución anterior antes de iniciar otra.

## Arañita

1. Pulsa **Añadir archivo**: admite PDF, DOCX, TXT, MD, CSV, TSV, JSON, HTML, XML, LOG y código (PY, JS, TS, CSS, YAML). También puedes usar el ejemplo.
2. Escribe una pregunta sobre el documento.
3. Pulsa **Preguntar**. Verás la comparación de fragmentos y hasta cuatro seleccionados.
4. Lee la respuesta y revisa las citas en el contexto. **Detener** cancela la consulta.

La red crece al cargar el documento: cada fragmento se conecta con sus palabras principales. Las palabras compartidas unen grupos mediante física de fuerzas en 3D. La pregunta ilumina los fragmentos comparados y seleccionados; el recorrido registra sus similitudes. Arrastra para girar, usa la rueda para acercarte y pulsa un fragmento para leerlo. El chat permanece a la derecha. Sin documento también puedes preguntar al modelo.

Para mantener la fluidez, la vista incorpora inicialmente hasta 120 fragmentos; la búsqueda analiza todos y añade los resultados y el fragmento que compara.

Límites: 20 MiB por archivo, 200 páginas por PDF, un millón de caracteres y 2000 fragmentos. Los PDF deben tener texto seleccionable; los escaneos requieren OCR previo. DOCX es compatible; el formato antiguo DOC no.

La búsqueda compara palabras con TF-IDF y similitud de coseno; no comprende sinónimos como un buscador semántico. Solo los fragmentos seleccionados y la pregunta se envían al servidor local. El archivo no se guarda; al recargar, debes elegirlo otra vez.

Las etapas Embeddings → Atención → MLP son un esquema explicativo, no activaciones internas de DeepSeek. Los pulsos de salida siguen eventos reales del texto recibido, que pueden contener varios tokens. No se inventan pesos de atención ni FLOPs. La afinidad no indica cuánto utilizó el modelo cada fragmento. CPU y GPU muestran el uso de todo el equipo. La primera carga del modelo puede tardar.

## Producción

```powershell
npm run build
npm start
```

Abre las mismas dos direcciones. Usa este modo o desarrollo, no ambos en el mismo puerto.

## Conexión

Se detecta primero llama-server en los puertos 8080/8081; si no está disponible, se usa Ollama en 11434 con `deepseek-r1:7b`. No necesitas cambiar las URL del navegador. Para otro puerto de llama-server, define `LLAMA_BASE_URL` en `.env.local`.

## Comprobar

```powershell
npm run typecheck
npm run build
```

La revisión global de estilo conserva avisos del motor 3D original.
