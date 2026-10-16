import React from 'react';
import { LayerView } from '@/src/llm/LayerView';
import { InfoButton, WelcomePopup } from '@/src/llm/WelcomePopup';
import { Header } from '@/src/llm/Header';

export const metadata = {
  title: 'Visualización de LLM en 3D',
  description: 'Visualización 3D animada e interactiva de un modelo de lenguaje grande (LLM) con guía paso a paso.',
};

export default function Page() {
    return <>
        <Header title="Visualización de LLM en 3D">
            <InfoButton />
        </Header>
        <LayerView />
        <WelcomePopup />
        <div id="portal-container"></div>
    </>;
}
