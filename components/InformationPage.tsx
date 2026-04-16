import React from 'react';
import { useLanguage } from '../lib/LanguageContext';

const InformationPage: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="p-4 space-y-8 bg-white rounded-lg shadow-md md:p-8">
            <header className="pb-4 border-b">
                <h1 className="text-3xl font-bold text-gray-800">{t('infoTitle')}</h1>
                <p className="mt-2 text-gray-600">
                    {t('infoIntro1')} {t('infoIntro2')}
                </p>
                 <p className="mt-2 text-gray-600">
                    {t('infoIntro3')}
                </p>
            </header>

            <section>
                <h2 className="text-2xl font-semibold text-green-700">1. {t('infoFactor1Title').split(':')[0]}</h2>
                <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-3">
                    <div className="p-4 border rounded-lg bg-gray-50">
                        <h3 className="font-bold text-gray-700">{t('infoFactor1Title')}</h3>
                        <ul className="mt-2 space-y-1 text-sm list-disc list-inside text-gray-700">
                            <li><span className="font-semibold">{t('easy')}:</span> {t('infoFactor1Points', { label: '', points: 1 }).replace(': ', '')}</li>
                            <li><span className="font-semibold">{t('moderate')}:</span> {t('infoFactor1Points', { label: '', points: 3 }).replace(': ', '')}</li>
                            <li><span className="font-semibold">{t('complex')}:</span> {t('infoFactor1Points', { label: '', points: 5 }).replace(': ', '')}</li>
                        </ul>
                    </div>
                    <div className="p-4 border rounded-lg bg-gray-50">
                        <h3 className="font-bold text-gray-700">{t('infoFactor2Title')}</h3>
                        <ul className="mt-2 space-y-1 text-sm list-disc list-inside text-gray-700">
                            <li><span className="font-semibold">{t('low')}:</span> 0,25 {t('infoFactor1Points', { label: '', points: '' }).split(' ')[1]}</li>
                            <li><span className="font-semibold">{t('medium')}:</span> 0,5 {t('infoFactor1Points', { label: '', points: '' }).split(' ')[1]}</li>
                            <li><span className="font-semibold">{t('high')}:</span> 0,75 {t('infoFactor1Points', { label: '', points: '' }).split(' ')[1]}</li>
                        </ul>
                    </div>
                    <div className="p-4 border rounded-lg bg-gray-50">
                        <h3 className="font-bold text-gray-700">{t('infoFactor3Title')}</h3>
                        <ul className="mt-2 space-y-1 text-sm list-disc list-inside text-gray-700">
                            <li><span className="font-semibold">{t('pending')}:</span> 0 {t('infoFactor1Points', { label: '', points: '' }).split(' ')[1]}</li>
                            <li><span className="font-semibold">{t('inProgress')}:</span> 1,5 {t('infoFactor1Points', { label: '', points: '' }).split(' ')[1]}</li>
                            <li><span className="font-semibold">{t('realized')}:</span> 3 {t('infoFactor1Points', { label: '', points: '' }).split(' ')[1]}</li>
                        </ul>
                    </div>
                </div>
                <div className="p-4 mt-4 text-sm text-yellow-800 bg-yellow-100 border-l-4 border-yellow-500">
                    <p>
                        {t('infoFactor3Warning')}
                    </p>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-green-700">{t('infoCalculationTitle')}</h2>
                <ul className="mt-4 space-y-4">
                    <li>
                        <h3 className="font-semibold text-gray-800">{t('infoVTTitle')}</h3>
                        <p className="text-sm text-gray-600">{t('infoVTDesc')}</p>
                        <pre className="p-3 mt-1 text-sm text-gray-800 bg-gray-100 rounded-md">VT = (ND × NPRI × NPRO)</pre>
                    </li>
                    <li>
                        <h3 className="font-semibold text-gray-800">{t('infoVPTitle')}</h3>
                        <p className="text-sm text-gray-600">{t('infoVPDesc')}</p>
                        <pre className="p-3 mt-1 text-sm text-gray-800 bg-gray-100 rounded-md">VP = Σ(VT)</pre>
                    </li>
                </ul>
                <div className="p-4 mt-6 border-l-4 border-green-500 bg-green-50">
                    <h3 className="font-bold text-gray-800">{t('infoExampleTitle')}</h3>
                     <p className="mt-2 text-sm text-gray-600">{t('infoExampleDesc')}</p>
                    <div className="mt-4 space-y-2 text-sm text-gray-700">
                        <pre className="p-2 text-xs text-gray-800 bg-gray-100 rounded-md">
                            {t('newTask')} 1: (ND = 3 x NPRI = 0,25 x NPRO = 3) = 2,25<br/>
                            {t('newTask')} 2: (ND = 5 x NPRI = 0,5 x NPRO = 3) = 7,5<br/>
                            {t('newTask')} 3: (ND = 5 x NPRI = 0,75 x NPRO = 3) = 11,25<br/>
                            {t('newTask')} 4: (ND = 1 x NPRI = 0,25 x NPRO = 3) = 0,75
                        </pre>
                        <pre className="p-3 mt-2 font-bold text-center text-green-800 bg-green-100 rounded-md">
                            {t('infoVPTitle')} = 2,25 + 7,5 + 11,25 + 0,75 = 21,75
                        </pre>
                        <p className="mt-2 text-sm text-gray-600">{t('infoExampleResult', { total: '21,75' })}</p>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-green-700">{t('infoProductivityTitle')}</h2>
                 <p className="mt-2 text-gray-600">
                    {t('infoProductivityDesc1')} {t('infoProductivityDesc2')}
                </p>
                <p className="mt-2 text-gray-600">
                    {t('infoProductivityDesc3')}
                </p>
                 <div className="mt-4">
                    <h3 className="font-semibold text-gray-800">{t('infoPATitle')}</h3>
                    <p className="text-sm text-gray-600">{t('infoPADesc')}</p>
                    <pre className="p-3 mt-1 text-sm text-gray-800 bg-gray-100 rounded-md">PA = Σ({t('infoVTTitle')} {t('sent').toLowerCase()})</pre>
                </div>

                 <div className="p-4 mt-6 border-l-4 border-green-500 bg-green-50">
                    <h3 className="font-bold text-gray-800">{t('infoExampleProductivityTitle')}</h3>
                    <p className="mt-2 text-sm text-gray-600">{t('infoExampleProductivityDesc')}</p>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm text-left border">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 border">{t('infoTableStudent')}</th>
                                    <th className="px-4 py-2 border">{t('infoTableTask')}</th>
                                    <th className="px-4 py-2 border">{t('infoTableCalculation')}</th>
                                    <th className="px-4 py-2 border">{t('infoTableValue')}</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-800">
                                <tr className="bg-white border-b"><td className="px-4 py-2 border" rowSpan={2}>Carlos Gómez</td><td className="px-4 py-2 border">{t('newTask')} 1</td><td className="px-4 py-2 border">3 x 0,25 x 3</td><td className="px-4 py-2 border">2,25</td></tr>
                                <tr className="bg-white border-b"><td className="px-4 py-2 border">{t('newTask')} 2</td><td className="px-4 py-2 border">5 x 0,5 x 3</td><td className="px-4 py-2 border">7,5</td></tr>
                                <tr className="bg-gray-50 border-b"><td className="px-4 py-2 border">Ana Sánchez</td><td className="px-4 py-2 border">{t('newTask')} 3</td><td className="px-4 py-2 border">5 x 0,75 x 3</td><td className="px-4 py-2 border">11,25</td></tr>
                                <tr className="bg-white"><td className="px-4 py-2 border">Juan Pérez</td><td className="px-4 py-2 border">{t('newTask')} 4</td><td className="px-4 py-2 border">1 x 0,25 x 3</td><td className="px-4 py-2 border">0,75</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-gray-700">
                        <h4 className="font-semibold text-gray-800">{t('infoPAMembers')}</h4>
                        <ul className="pl-5 list-disc">
                            <li><span className="font-semibold">PA de Carlos Gómez</span> = 2,25 ({t('newTask')} 1) + 7,5 ({t('newTask')} 2) = <strong>9,75</strong></li>
                            <li><span className="font-semibold">PA de Ana Sánchez</span> = <strong>11,25</strong> ({t('newTask')} 3)</li>
                            <li><span className="font-semibold">PA de Juan Pérez</span> = <strong>0,75</strong> ({t('newTask')} 4)</li>
                        </ul>
                    </div>
                     <div className="mt-6">
                        <h4 className="font-semibold text-gray-800">{t('infoPercentCalculation')}</h4>
                        <p className="mt-1 text-sm text-gray-600">{t('infoPercentDesc', { total: '21,75' })}</p>
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
