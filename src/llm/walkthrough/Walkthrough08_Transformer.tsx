import { Vec3 } from "@/src/utils/vector";
import { Phase } from "./Walkthrough";
import { commentary, IWalkthroughArgs, setInitialCamera } from "./WalkthroughTools";

export function walkthrough08_Transformer(args: IWalkthroughArgs) {
    let { walkthrough: wt, state } = args;

    if (wt.phase !== Phase.Input_Detail_Transformer) {
        return;
    }

    setInitialCamera(state, new Vec3(-135.531, 0.000, -353.905), new Vec3(291.100, 13.600, 5.706));

    let c0 = commentary(wt, null, 0)`

¡Y ese es un bloque transformer completo!

Estos bloques forman la mayor parte de cualquier modelo GPT y se repiten varias veces, alimentando la
salida de un bloque al siguiente y continuando el camino residual.

Como es común en el aprendizaje profundo (deep learning), es difícil determinar con exactitud qué hace cada
una de estas capas, pero tenemos una noción general: las capas iniciales suelen enfocarse en aprender
características y patrones de bajo nivel, mientras que las capas posteriores aprenden a reconocer y
comprender abstracciones y relaciones de alto nivel. En el procesamiento de lenguaje natural, las capas
inferiores pueden aprender gramática, sintaxis y asociaciones simples de palabras, mientras que las capas
superiores capturan relaciones semánticas más complejas, estructuras discursivas y significado dependiente del contexto.

`;

}
