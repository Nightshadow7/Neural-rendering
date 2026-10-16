import React from 'react';
import { HomePage } from '@/src/homepage/HomePage';

export const metadata = {
  title: 'Portafolio - Brendan Bycroft',
  description: 'Portafolio del autor y proyectos.',
};

export default function Page() {
    return <>
        <HomePage />
        <div id="portal-container"></div>
    </>;
}
