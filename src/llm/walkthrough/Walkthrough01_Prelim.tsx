import React from 'react';
import { Phase } from "./Walkthrough";
import { commentary, embed, IWalkthroughArgs, setInitialCamera } from "./WalkthroughTools";
import s from './Walkthrough.module.scss';
import { Vec3 } from '@/src/utils/vector';

let minGptLink = 'https://github.com/karpathy/minGPT';
let pytorchLink = 'https://pytorch.org/';
let andrejLink = 'https://karpathy.ai/';
let zeroToHeroLink = 'https://karpathy.ai/zero-to-hero.html';

export function walkthrough01_Prelim(args: IWalkthroughArgs) {
    let { state, walkthrough: wt } = args;

    if (wt.phase !== Phase.Intro_Prelim) {
        return;
    }

    setInitialCamera(state, new Vec3(184.744, 0.000, -636.820), new Vec3(296.000, 16.000, 13.500));

    let c0 = commentary(wt, null, 0)`
Antes de profundizar en los detalles del algoritmo, demos un breve paso hacia atrás.

Esta guía se enfoca en la _inferencia_, no en el entrenamiento, y como tal representa solo una parte del proceso completo de aprendizaje automático.
En nuestro caso, los pesos del modelo ya están preentrenados, y utilizamos el proceso de inferencia para generar salidas. Todo esto se ejecuta directamente en tu navegador.

El modelo que se muestra aquí pertenece a la familia GPT (Generative Pre-trained Transformer), que se puede describir como un "predictor de tokens basado en contexto".
OpenAI introdujo esta familia en 2018, con integrantes tan destacados como GPT-2, GPT-3 y GPT-3.5 Turbo, siendo este último la base del popular ChatGPT.
También comparte arquitectura con GPT-4.

Esta guía se inspiró en el proyecto de GitHub ${embedLink('minGPT', minGptLink)}, una implementación minimalista de GPT en ${embedLink('PyTorch', pytorchLink)}
creada por ${embedLink('Andrej Karpathy', andrejLink)}.
Su serie de videos en YouTube ${embedLink("Neural Networks: Zero to Hero", zeroToHeroLink)} y el proyecto minGPT han sido recursos invaluables para la creación de esta
guía. El modelo a escala que analizamos aquí se basa en uno de los ejemplos de minGPT.

¡Muy bien, comencemos!
`;

}

export function embedLink(a: React.ReactNode, href: string) {
    return embedInline(<a className={s.externalLink} href={href} target="_blank" rel="noopener noreferrer">{a}</a>);
}

export function embedInline(a: React.ReactNode) {
    return { insertInline: a };
}
