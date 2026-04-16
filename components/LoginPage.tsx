
import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './Icons';
import { useLanguage } from '../lib/LanguageContext';

interface LoginPageProps {
    onLogin: (username: string, password: string) => void;
    error: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error }) => {
    const { language, setLanguage, t } = useLanguage();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(username, password);
    };

    return (
        <div 
            className="flex items-center justify-center min-h-screen bg-primary-50 px-4 relative"
            style={{
                backgroundImage: `radial-gradient(#bbf7d0 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
            }}
        >
            <div className="relative w-full max-w-md p-8 mb-12 sm:mb-24 space-y-8 bg-white rounded-lg shadow-2xl">
                {/* Language Flags */}
                <div className="absolute top-4 right-4 flex space-x-2">
                    <button 
                        onClick={() => setLanguage('es')}
                        className={`w-8 h-8 rounded-full border shadow-sm transition-all overflow-hidden ${language === 'es' ? 'border-green-600 ring-2 ring-green-100' : 'border-gray-200 opacity-40 hover:opacity-100'}`}
                        title="Español"
                    >
                        <svg viewBox="0 0 750 500" className="w-full h-full object-cover">
                            <rect width="750" height="500" fill="#c60b1e"/>
                            <rect width="750" height="250" y="125" fill="#ffc400"/>
                        </svg>
                    </button>
                    <button 
                        onClick={() => setLanguage('en')}
                        className={`w-8 h-8 rounded-full border shadow-sm transition-all overflow-hidden ${language === 'en' ? 'border-green-600 ring-2 ring-green-100' : 'border-gray-200 opacity-40 hover:opacity-100'}`}
                        title="English"
                    >
                        <svg viewBox="0 0 60 30" className="w-full h-full object-cover">
                            <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
                            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
                            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
                            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
                            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
                        </svg>
                    </button>
                </div>

                <div className="text-center">
                    <img
                        className="w-40 h-auto mx-auto"
                        src="https://i.ibb.co/x8MPvpcr/Logo-Felo.png"
                        alt="Logo CIFP Felo Monzón"
                    />
                    <h1 className="mt-4 text-2xl font-extrabold text-gray-900 leading-tight">
                        {t('loginTitle')}
                    </h1>
                     <div className="mt-4">
                        <p className="text-sm tracking-widest text-gray-500 uppercase">
                            {t('loginSubtitle')}
                        </p>
                        <div className="w-1/2 mx-auto mt-1 mb-2 border-t border-gray-300"></div>
                        <p className="text-lg font-bold text-green-700">
                            {t('loginDepartment')}
                        </p>
                        <p className="mt-6 text-sm tracking-wider text-gray-500 uppercase">
                            {t('loginSchool')}
                        </p>
                    </div>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="username" className="sr-only">{t('username')}</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="relative block w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                                placeholder={t('username')}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <label htmlFor="password" className="sr-only">{t('password')}</label>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                className="relative block w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm pr-10"
                                placeholder={t('password')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 flex items-center pr-3 z-20 text-gray-400 hover:text-green-600 focus:outline-none"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeOffIcon className="w-5 h-5" />
                                ) : (
                                    <EyeIcon className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>
                    
                    {error && <p className="text-sm text-center text-red-600">{t('loginError')}</p>}

                    <div>
                        <button
                            type="submit"
                            className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md group hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-md"
                        >
                            {t('access')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
