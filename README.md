# Visualizador local

Dos páginas en español: una vista del modelo y una red de documentos que muestra cómo se busca contexto para responder. Ambas funcionan con el mismo servidor local.

## Requisitos

- Windows y un navegador con WebGL2, como Chrome o Edge.
- Node.js 24 LTS, que incluye npm. Mínimo admitido: Node.js 22.13.
- Ollama y el modelo `deepseek-r1:7b`.
- Internet para la instalación y las descargas iniciales.
- Espacio para las dependencias y el modelo: este último ocupa aproximadamente [4,7 GB](https://ollama.com/library/deepseek-r1:7b).
- Para ver sensores de GPU: una NVIDIA con su controlador y `nvidia-smi`. Si no están disponibles, esos datos aparecen como `—`.

La velocidad depende de la RAM, la GPU y su memoria disponible. El proyecto no exige Python ni una clave de API.

## Instalación

### 1. Instalar Node.js

Descarga [Node.js 24 LTS](https://nodejs.org/en/download), elige el instalador de Windows y completa la instalación con npm incluido.

### 2. Instalar Ollama

Descarga [Ollama para Windows](https://ollama.com/download/windows), instálalo y abre la aplicación. Déjala funcionando mientras usas el proyecto.

### 3. Abrir la terminal

Guarda o descomprime el proyecto en una carpeta. Abre esa carpeta en el Explorador, escribe `powershell` en la barra de direcciones y pulsa Enter. Debes estar en la carpeta que contiene `package.json`.

Si acabas de instalar los programas, abre una terminal nueva. Comprueba que se reconocen:

```powershell
node --version
npm --version
ollama --version
```

Cada comando debe mostrar una versión.

### 4. Descargar el modelo

```powershell
ollama pull deepseek-r1:7b
```

Espera a que termine y comprueba la descarga:

```powershell
ollama list
```

Debe aparecer exactamente `deepseek-r1:7b`. Este paso se hace una sola vez. No necesitas abrir un chat con `ollama run`: la página carga el modelo cuando lo necesita.

### 5. Preparar el proyecto

En la carpeta que contiene `package.json`, ejecuta:

```powershell
npm install
```

Espera a que termine. También se prepara automáticamente el lector de PDF.

### 6. Iniciar

```powershell
npm run dev
```

Mantén esta terminal abierta. Cuando el servidor esté listo, mostrará las dos direcciones:

- [Visualización 3D](http://127.0.0.1:3002/): vista del modelo, explicación y uso del equipo.
- [Arañita](http://127.0.0.1:3002/arañita): red de documentos y conversación.

Puedes abrir ambas en pestañas distintas al mismo tiempo. No necesitas cambiar puertos, editar archivos ni iniciar otro servidor para la segunda página. La primera consulta puede tardar mientras se carga el modelo.

### 7. Volver a usarlo

En las siguientes ocasiones, abre Ollama y ejecuta `npm run dev` desde la carpeta del proyecto. No repitas las instalaciones ni la descarga del modelo.

Para detener la página, pulsa `Ctrl+C` en la terminal. Esto no cierra Ollama; puedes cerrarlo por separado si ya no lo necesitas.

## Uso

1. En **Arañita**, pulsa **Usar ejemplo** o **Añadir archivo**.
2. Observa cómo aparecen los fragmentos y sus palabras compartidas en la red.
3. Escribe una pregunta a la derecha y pulsa **Preguntar**. Activa **Paso a paso** para ver cada fragmento durante 1,6 segundos: el nodo se marca en ámbar y una tarjeta muestra su texto, similitud y palabras coincidentes. Usa **Pausar búsqueda**, **Siguiente fragmento** y **Continuar búsqueda** para explicarlo a tu ritmo. Desactiva **Paso a paso** antes de preguntar si prefieres una búsqueda rápida.
4. Al terminar la búsqueda, cada fragmento seleccionado recorre una conexión hasta **Modelo local**. Esta animación prepara el contexto; después se realiza la consulta local. La conexión **Modelo → Respuesta** pulsa con el texto recibido.
5. Revisa los fragmentos seleccionados, la respuesta y el registro **Recorrido**. Pulsa un nodo `F1`, `F2`, etc., para leer su texto.

Arrastra para girar, usa la rueda o los botones **+ / −** para acercarte y **Ver toda la red** para recuperar el encuadre. **Cámara automática** sigue y acerca el fragmento activo; pulsa ese control para cambiar a **Cámara libre** y explorar por tu cuenta. **Pausar** detiene la animación; **Detener** cancela la consulta. También puedes preguntar sin cargar un documento.

Formatos: PDF, DOCX, TXT, MD, CSV, TSV, JSON, HTML, XML, LOG y código (PY, JS, TS, CSS, YAML). Límites: 20 MiB, 200 páginas por PDF, un millón de caracteres y 2000 fragmentos. Los PDF necesitan texto seleccionable; no se realiza OCR. El formato antiguo DOC no es compatible.

## Qué se muestra

- La red conecta fragmentos con palabras principales. Incorpora inicialmente hasta 120 fragmentos; la búsqueda analiza todos y añade los resultados y el fragmento que compara.
- La búsqueda usa palabras y similitud de coseno sobre TF-IDF. Selecciona hasta cuatro fragmentos; no interpreta sinónimos como un buscador semántico.
- Embeddings, Atención y MLP son un esquema explicativo. No se leen activaciones, pesos de atención ni FLOPs internos de DeepSeek.
- Los pulsos de salida siguen eventos reales de texto recibido, que pueden contener varios tokens. CPU, GPU y VRAM muestran el uso real de todo el equipo.

Solo la pregunta y los fragmentos seleccionados se envían al modelo local. El archivo se lee en el navegador y debes volver a elegirlo al recargar. Comprueba la respuesta contra el contexto: el modelo puede equivocarse o no seguir el formato de citas solicitado.

## Problemas

| Problema | Solución |
| --- | --- |
| No se reconoce `node`, `npm` u `ollama` | Revisa la instalación y abre una terminal nueva. |
| PowerShell bloquea `npm.ps1` | Usa `npm.cmd install` y `npm.cmd run dev`, sin cambiar la política de seguridad. |
| No se encuentra el modelo | Abre Ollama y comprueba `ollama list`. Descarga `deepseek-r1:7b` si falta. |
| Ollama no responde | Si la aplicación está cerrada, ejecuta `ollama serve` en otra terminal y déjala abierta. Si indica que el puerto ya está ocupado, Ollama ya está activo. |
| Puerto 3002 ocupado | Detén la ejecución anterior con `Ctrl+C` o utiliza la página que ya está abierta. |
| PDF sin texto | Usa un PDF con texto seleccionable o aplica OCR antes de cargarlo. |
| No hay coincidencias | Prueba palabras que aparezcan en el documento. La búsqueda es léxica. |

## Conexión

La guía anterior usa Ollama en el puerto 11434. Si ya tienes `llama-server` activo en 8080 o 8081, el proyecto lo detecta primero y usa su modelo. Para utilizar Ollama, cierra ese servidor. Solo si utilizas llama-server en otro puerto necesitas definir `LLAMA_BASE_URL` en `.env.local` y reiniciar el proyecto.

## Producción

Para ejecutar una versión compilada, detén primero `npm run dev` y ejecuta:

```powershell
npm run build
npm start
```

Mantén Ollama abierto y utiliza las mismas direcciones. No ejecutes desarrollo y producción a la vez en el puerto 3002.

## Comprobar

```powershell
npm run typecheck
npm run build
```

La revisión global de estilo conserva avisos del motor 3D original.
