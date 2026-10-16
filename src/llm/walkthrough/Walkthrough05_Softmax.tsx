import { Vec3 } from "@/src/utils/vector";
import { Phase } from "./Walkthrough";
import { commentary, IWalkthroughArgs, setInitialCamera } from "./WalkthroughTools";

export function walkthrough05_Softmax(args: IWalkthroughArgs) {
    let { walkthrough: wt, state } = args;

    if (wt.phase !== Phase.Input_Detail_Softmax) {
        return;
    }

    setInitialCamera(state, new Vec3(-24.350, 0.000, -1702.195), new Vec3(283.100, 0.600, 1.556));

    let c0 = commentary(wt, null, 0)`

La operación softmax se utiliza como parte de la autoatención, como vimos en la sección anterior, y
también aparecerá al final del modelo.

Su objetivo es tomar un vector y normalizar sus valores para que sumen 1.0. Sin embargo, no es tan
simple como dividir entre la suma. En su lugar, cada valor de entrada primero se exponencia.

  a = exp(x_1)

Esto tiene el efecto de hacer positivos todos los valores. Una vez que tenemos un vector con nuestros
valores exponenciados, podemos dividir cada valor entre la suma de todos los valores. Esto asegurará
que la suma de los valores sea 1.0. Dado que todos los valores exponenciados son positivos, sabemos
que los valores resultantes estarán entre 0.0 y 1.0, lo que proporciona una distribución de
probabilidad sobre los valores originales.

Eso es todo para softmax: simplemente exponenciar los valores y luego dividir entre la suma.

Sin embargo, hay una ligera complicación. Si alguno de los valores de entrada es muy grande, los
valores exponenciados serán enormes. Terminaremos dividiendo un número grande entre otro sumamente grande,
lo que puede causar problemas con la aritmética de punto flotante (desbordamiento numérico).

Una propiedad muy útil de softmax es que si sumamos (o restamos) una constante a todos los valores de
entrada, el resultado no cambia. Así que podemos encontrar el valor máximo en el vector de entrada y
restárselo a todos los valores. Esto asegura que el valor más grande sea 0.0 y que la operación softmax
se mantenga numéricamente estable.

Echemos un vistazo a la operación softmax en el contexto de la capa de autoatención. Nuestro vector de
entrada para cada operación softmax es una fila de la matriz de autoatención (pero sólo hasta la diagonal).

Al igual que en la normalización de capa, tenemos un paso intermedio donde almacenamos algunos valores
de agregación para mantener el proceso eficiente.

Para cada fila, almacenamos el valor máximo de la fila y la suma de los valores desplazados y
exponenciados. Luego, para producir la fila de salida correspondiente, realizamos una pequeña serie de
operaciones: restar el máximo, exponenciar y dividir entre la suma.

¿Por qué se llama "softmax"? La versión "dura" (hardmax o argmax) simplemente toma el valor máximo, lo
fija en 1.0 y asigna 0.0 a todos los demás valores. Por el contrario, la operación softmax funciona
como una versión "suave" de eso. Debido a la exponenciación en softmax, el valor más grande se enfatiza
y se empuja hacia 1.0, pero manteniendo una distribución de probabilidad sobre todos los valores de
entrada. Esto permite una representación más matizada que captura no solo la opción más probable, sino
también la probabilidad relativa de las demás opciones.
`;

}
