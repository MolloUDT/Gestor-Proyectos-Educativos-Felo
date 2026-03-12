import React from 'react';

const InformationPage: React.FC = () => {
    return (
        <div className="p-4 space-y-8 bg-white rounded-lg shadow-md md:p-8">
            <header className="pb-4 border-b">
                <h1 className="text-3xl font-bold text-gray-800">Valoración de Proyectos y Productividad del Alumno</h1>
                <p className="mt-2 text-gray-600">
                    Para valorar un proyecto y poder hacer un seguimiento de su porcentaje de finalización vamos a establecer una serie de conceptos asociados a una serie de valores, a partir de los cuales cuales generaremos un algoritmo para el proyecto. A continuación, aplicaremos la misma técnica para saber cuanto está aportando cada integrante del grupo al proyecto y cual está siendo su porcentaje de evolución.
                </p>
                 <p className="mt-2 text-gray-600">
                    Cada proyecto estará compuesto de una serie de tareas concretas y definidas. Asimismo, a cada tarea hay que añadirle 3 factores de concreción:
                </p>
            </header>

            <section>
                <h2 className="text-2xl font-semibold text-green-700">1. Factores de Concreción por Tarea</h2>
                <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-3">
                    <div className="p-4 border rounded-lg bg-gray-50">
                        <h3 className="font-bold text-gray-700">Factor 1: NIVEL DE DIFICULTAD (ND)</h3>
                        <ul className="mt-2 space-y-1 text-sm list-disc list-inside text-gray-700">
                            <li><span className="font-semibold">Sencilla:</span> 1 punto</li>
                            <li><span className="font-semibold">Moderada:</span> 3 puntos</li>
                            <li><span className="font-semibold">Compleja:</span> 5 puntos</li>
                        </ul>
                    </div>
                    <div className="p-4 border rounded-lg bg-gray-50">
                        <h3 className="font-bold text-gray-700">Factor 2: NIVEL DE PRIORIDAD (NPRI)</h3>
                        <ul className="mt-2 space-y-1 text-sm list-disc list-inside text-gray-700">
                            <li><span className="font-semibold">Baja:</span> 0,25 puntos</li>
                            <li><span className="font-semibold">Media:</span> 0,5 puntos</li>
                            <li><span className="font-semibold">Alta:</span> 0,75 puntos</li>
                        </ul>
                    </div>
                    <div className="p-4 border rounded-lg bg-gray-50">
                        <h3 className="font-bold text-gray-700">Factor 3: NIVEL DE PROGRESO (NPRO)</h3>
                        <ul className="mt-2 space-y-1 text-sm list-disc list-inside text-gray-700">
                            <li><span className="font-semibold">Pendiente:</span> 0 puntos</li>
                            <li><span className="font-semibold">En Progreso:</span> 1,5 puntos</li>
                            <li><span className="font-semibold">Realizada:</span> 3 puntos</li>
                        </ul>
                    </div>
                </div>
                <div className="p-4 mt-4 text-sm text-yellow-800 bg-yellow-100 border-l-4 border-yellow-500">
                    <p>
                        Dado que el valor del Nivel de Progreso irá cambiando a lo largo del tiempo que dura el proyecto, para el cálculo del valor total a futuro siempre utilizaremos el valor de "Realizada", es decir <strong>3</strong>.
                    </p>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-green-700">2. Cálculo del Valor del Proyecto (VP)</h2>
                <ul className="mt-4 space-y-4">
                    <li>
                        <h3 className="font-semibold text-gray-800">Valor de cada Tarea (VT)</h3>
                        <p className="text-sm text-gray-600">Se calcula multiplicando los tres factores.</p>
                        <pre className="p-3 mt-1 text-sm text-gray-800 bg-gray-100 rounded-md">VT = (ND × NPRI × NPRO)</pre>
                    </li>
                    <li>
                        <h3 className="font-semibold text-gray-800">Valor total del Proyecto (VP)</h3>
                        <p className="text-sm text-gray-600">Es la sumatoria de los valores de todas las tareas del proyecto.</p>
                        <pre className="p-3 mt-1 text-sm text-gray-800 bg-gray-100 rounded-md">VP = Σ(VT)</pre>
                    </li>
                </ul>
                <div className="p-4 mt-6 border-l-4 border-green-500 bg-green-50">
                    <h3 className="font-bold text-gray-800">Ejemplo de cálculo del Valor del Proyecto:</h3>
                     <p className="mt-2 text-sm text-gray-600">Vamos a plasmarlo en un ejemplo con 4 tareas (calculando su valor potencial con NPRO = 3):</p>
                    <div className="mt-4 space-y-2 text-sm text-gray-700">
                        <pre className="p-2 text-xs text-gray-800 bg-gray-100 rounded-md">
                            Tarea 1: (ND = 3 x NPRI = 0,25 x NPRO = 3) = 2,25<br/>
                            Tarea 2: (ND = 5 x NPRI = 0,5 x NPRO = 3) = 7,5<br/>
                            Tarea 3: (ND = 5 x NPRI = 0,75 x NPRO = 3) = 11,25<br/>
                            Tarea 4: (ND = 1 x NPRI = 0,25 x NPRO = 3) = 0,75
                        </pre>
                        <pre className="p-3 mt-2 font-bold text-center text-green-800 bg-green-100 rounded-md">
                            Valor del Proyecto (VP) = 2,25 + 7,5 + 11,25 + 0,75 = 21,75
                        </pre>
                        <p className="mt-2 text-sm text-gray-600">Para este ejemplo, el proyecto estaría valorado en un total de 21,75 puntos. Este sería su 100%.</p>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-green-700">3. Valoración de la Productividad de un Alumno</h2>
                 <p className="mt-2 text-gray-600">
                    Ahora debemos calcular la productividad asumida de cada alumno. Esto lo haremos asignando cada tarea a un alumno determinado. Asimismo, cada alumno obtendrá un valor final de productividad asumida, y será la sumatoria del valor de las tareas realizadas.
                </p>
                <p className="mt-2 text-gray-600">
                    Aunque debemos tener en cuenta que como el cálculo se irá mostrando en tiempo real el valor del Factor 3 "Nivel de Progreso" irá cambiando según se vayan finalizando o no las tareas.
                </p>
                 <div className="mt-4">
                    <h3 className="font-semibold text-gray-800">Productividad Asumida por un Alumno (PA)</h3>
                    <p className="text-sm text-gray-600">Es la sumatoria del valor de las tareas asignadas al alumno, usando el Nivel de Progreso (NPRO) actual de cada tarea.</p>
                    <pre className="p-3 mt-1 text-sm text-gray-800 bg-gray-100 rounded-md">PA = Σ(VT de las tareas asignadas)</pre>
                </div>

                 <div className="p-4 mt-6 border-l-4 border-green-500 bg-green-50">
                    <h3 className="font-bold text-gray-800">Ejemplo de cálculo de Productividad por Alumno:</h3>
                    <p className="mt-2 text-sm text-gray-600">Siguiendo el ejemplo anterior y asumiendo que tenemos 3 alumnos y las tareas están "Realizadas" (NPRO = 3):</p>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm text-left border">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 border">Alumno</th>
                                    <th className="px-4 py-2 border">Tarea Asignada</th>
                                    <th className="px-4 py-2 border">Cálculo (ND x NPRI x NPRO)</th>
                                    <th className="px-4 py-2 border">Valor Tarea (VT)</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-800">
                                <tr className="bg-white border-b"><td className="px-4 py-2 border" rowSpan="2">Carlos Gómez</td><td className="px-4 py-2 border">Tarea 1</td><td className="px-4 py-2 border">3 x 0,25 x 3</td><td className="px-4 py-2 border">2,25</td></tr>
                                <tr className="bg-white border-b"><td className="px-4 py-2 border">Tarea 2</td><td className="px-4 py-2 border">5 x 0,5 x 3</td><td className="px-4 py-2 border">7,5</td></tr>
                                <tr className="bg-gray-50 border-b"><td className="px-4 py-2 border">Ana Sánchez</td><td className="px-4 py-2 border">Tarea 3</td><td className="px-4 py-2 border">5 x 0,75 x 3</td><td className="px-4 py-2 border">11,25</td></tr>
                                <tr className="bg-white"><td className="px-4 py-2 border">Juan Pérez</td><td className="px-4 py-2 border">Tarea 4</td><td className="px-4 py-2 border">1 x 0,25 x 3</td><td className="px-4 py-2 border">0,75</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-gray-700">
                        <h4 className="font-semibold text-gray-800">Productividad Asumida (PA) por cada miembro:</h4>
                        <ul className="pl-5 list-disc">
                            <li><span className="font-semibold">PA de Carlos Gómez</span> = 2,25 (Tarea 1) + 7,5 (Tarea 2) = <strong>9,75</strong></li>
                            <li><span className="font-semibold">PA de Ana Sánchez</span> = <strong>11,25</strong> (Tarea 3)</li>
                            <li><span className="font-semibold">PA de Juan Pérez</span> = <strong>0,75</strong> (Tarea 4)</li>
                        </ul>
                    </div>
                     <div className="mt-6">
                        <h4 className="font-semibold text-gray-800">Cálculo de porcentajes:</h4>
                        <p className="mt-1 text-sm text-gray-600">A partir de la PA de cada alumno, y teniendo en cuenta que la valoración total del proyecto es 21,75:</p>
                        <ul className="mt-2 pl-5 list-disc space-y-1">
                             <li>
                                <span className="font-semibold">Carlos Gómez:</span> (9,75 × 100%) / 21,75 = <strong className="font-bold">44,82%</strong>
                            </li>
                            <li>
                                <span className="font-semibold">Ana Sánchez:</span> (11,25 × 100%) / 21,75 = <strong className="font-bold">51,72%</strong>
                            </li>
                             <li>
                                <span className="font-semibold">Juan Pérez:</span> (0,75 × 100%) / 21,75 = <strong className="font-bold">3,44%</strong>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default InformationPage;
