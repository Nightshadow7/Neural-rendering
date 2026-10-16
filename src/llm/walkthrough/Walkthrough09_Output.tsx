import { Vec3 } from "@/src/utils/vector";
import { Phase } from "./Walkthrough";
import { commentary, IWalkthroughArgs, setInitialCamera } from "./WalkthroughTools";

export function walkthrough09_Output(args: IWalkthroughArgs) {
    let { walkthrough: wt, state } = args;

    if (wt.phase !== Phase.Input_Detail_Output) {
        return;
    }

    setInitialCamera(state, new Vec3(-20.203, 0.000, -1642.819), new Vec3(281.600, -7.900, 2.298));

    let c0 = commentary(wt, null, 0)`

Finalmente, llegamos al final del modelo. La salida del último bloque transformer se pasa por una
normalización de capa, y luego utilizamos una transformación lineal (multiplicación de matrices), esta vez sin sesgo.

Esta transformación final toma cada uno de nuestros vectores columna de longitud C y los lleva a una longitud nvocab. Por lo tanto,
produce efectivamente una puntuación para cada palabra o símbolo en el vocabulario para cada una de nuestras columnas. Estas
puntuaciones reciben un nombre especial: logits.

El término "logits" proviene de "log-odds" (logaritmo de las probabilidades relativas de cada token). Se utiliza "log"
porque la función softmax que aplicamos a continuación realiza una exponenciación para convertirlos en probabilidades reales.

Para convertir estas puntuaciones en probabilidades bien definidas, las pasamos a través de una operación softmax. Ahora, para
cada columna, tenemos una probabilidad asignada por el modelo a cada palabra o símbolo del vocabulario.

En este modelo en particular, ha aprendido con precisión a resolver el problema de ordenar tres letras, por lo que las probabilidades
están fuertemente inclinadas hacia la respuesta correcta.

Cuando avanzamos el modelo paso a paso en el tiempo, usamos las probabilidades de la última columna para determinar el
siguiente token que se añadirá a la secuencia. Por ejemplo, si hemos introducido seis tokens en el modelo, utilizaremos
las probabilidades de salida de la sexta columna.

La salida de esta columna es una serie de probabilidades, y debemos elegir una de ellas para usarla como la siguiente en la
secuencia. Esto lo hacemos mediante un "muestreo de la distribución" (sampling). Es decir, elegimos un token de forma aleatoria,
ponderado por su probabilidad. Por ejemplo, un token con una probabilidad de 0.9 será elegido el 90% de las veces.

Sin embargo, existen otras alternativas, como elegir siempre el token con la mayor probabilidad (método voraz o greedy).

También podemos controlar la "suavidad" de la distribución mediante un parámetro de temperatura. Una temperatura más alta
hará que la distribución sea más uniforme (más creativa o variada), mientras que una temperatura más baja la hará más
concentrada en los tokens de mayor probabilidad (más determinista y precisa).

Esto se logra dividiendo los logits (la salida de la transformación lineal) entre la temperatura antes de aplicar la
función softmax. Dado que la exponenciación en softmax tiene un impacto desproporcionado sobre números más grandes, reducir
sus diferencias relativas disminuye este efecto.
`;

}
