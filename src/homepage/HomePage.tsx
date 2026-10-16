'use client';
import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faCircleDollarToSlot, faEnvelope, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import s from './HomePage.module.scss';
import { Tooltip } from '../utils/Tooltip';

export const HomePage: React.FC = () => {
    let [emailText, setEmailText] = useState('');
    let router = useRouter();

    function showEmail(ev: React.MouseEvent) {
        let last = 'bycroft';
        let first = 'brendan';
        let domain = 'moc.liamg';
        domain = [...domain].reverse().join('');
        let at = '_' + 'at' + '_';
        setEmailText(text => text ? '' : `${first}.${last} ${at} ${domain}`);
        ev.stopPropagation();
        ev.preventDefault();
    }

    function externalIcon() {
        return <FontAwesomeIcon icon={faUpRightFromSquare} fontSize={10} className='ml-3 mr-1 relative top-[-1px]' />;
    }

    return <div className={s.homePage}>
        <div className={s.headerSection}>
            <div className={s.profilePic}>
                <img src="/me.jpeg" alt="Profile Picture" />
            </div>
            <div className={s.nameSection}>
                <div className={s.name}>
                    Brendan Bycroft
                </div>
                <div className={s.subhead}>
                    Ingeniero de Software
                </div>
                <div className={s.links}>
                    <Tooltip tip={<>Github /bbycroft {externalIcon()}</>}>
                        <a href="https://github.com/bbycroft" rel="noopener noreferrer" target="_blank">
                            <FontAwesomeIcon icon={faGithub} />
                        </a>
                    </Tooltip>
                    <Tooltip tip={<>Twitter @brendanbycroft {externalIcon()}</>}>
                        <a href="https://twitter.com/brendanbycroft" rel="noopener noreferrer" target="_blank">
                            <FontAwesomeIcon icon={faTwitter} />
                        </a>
                    </Tooltip>
                    <Tooltip tip={emailText ? 'Clic para ocultar' : 'Clic para ver correo'}>
                        <a onClick={showEmail}>
                            <FontAwesomeIcon icon={faEnvelope} />
                        </a>
                    </Tooltip>
                    <Tooltip tip={<>Apoyar de forma segura vía Stripe {externalIcon()}</>}>
                        <a href="https://donate.stripe.com/dR68yQbhxauue8E6oo" rel="noopener noreferrer" target="_blank">
                            <FontAwesomeIcon icon={faCircleDollarToSlot} />
                        </a>
                    </Tooltip>
                </div>
                <div className={s.emailText}>{emailText}</div>
            </div>
        </div>

        <div className={s.projectsSection}>
            <div className={s.sectionTitle}>Proyectos</div>
            <div className={s.projectCard} onClick={() => router.push('/')}>
                <div className={s.cardImageWrapper}>
                    <div className={s.cardImage}>
                        <img src="/images/llm-viz-screenshot2.png" alt="Captura de Visualización de LLM" />
                    </div>
                </div>
                <div className={s.cardContent}>
                    <div className={s.cardTitle}>
                        <Link href={"/"}>
                            Visualización de LLM
                        </Link>
                    </div>
                    <div className={s.cardText}>
                        Una visualización interactiva y recorrido paso a paso del algoritmo LLM que impulsa ChatGPT de OpenAI.
                        Explora el modelo hasta cada suma y multiplicación, observando todo el proceso en acción.
                    </div>
                </div>
            </div>
        </div>

        <div className={s.divider} />

        <div className={s.projectsSection}>
            <div className={s.sectionTitle}>Biografía</div>
            <div className={s.bioText}>
                <p>
                    Nacido y criado en Nueva Zelanda, he escrito código desde la primera vez que tuve una computadora en mis manos.
                    Tras obtener mi licenciatura en Matemáticas y Física<span className={s.footnoteRef}>1</span>, he trabajado profesionalmente como ingeniero de software desde 2013.
                </p>
                <p>
                    A lo largo de mi carrera he trabajado con una amplia variedad de tecnologías, desde programación en CUDA hasta desarrollo web. En el camino me especialicé en
                    C embebido, arquitectura de sistemas distribuidos, bases de datos, infraestructura en la nube, algoritmos diversos, gráficos 3D y mucho más.
                </p>
                <p>
                    Siempre busco brindar el máximo rendimiento a lo que construyo, esa característica que muchos no saben articular pero que todos pueden percibir.
                    Las computadoras son asombrosamente rápidas y con frecuencia se desaprovecha una gran parte de su potencial.
                </p>
                <p>
                    Tiendo a crear mis propias soluciones desde cero, lo que a largo plazo siempre vale la pena: comprendo a fondo cómo funcionan las cosas, puedo depurarlas y solucionarlas
                    con facilidad, asegurando que estén optimizadas a la medida del problema. También me inclino por un enfoque orientado a datos, ya que la mayoría de las abstracciones
                    resultan innecesarias y las funciones simples te llevan muy lejos.
                </p>
                <div className={s.footnotes}>
                    <div className={s.footnote}>1. Licenciatura (BSc) en Matemáticas y Física por la Universidad de Canterbury en 2012</div>
                </div>
            </div>
        </div>
    </div>;
}
