
import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './Icons';

interface LoginPageProps {
    onLogin: (username: string, password: string) => void;
    error: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(username, password);
    };

    return (
        <div 
            className="flex items-center justify-center min-h-screen bg-primary-50"
            style={{
                backgroundImage: `radial-gradient(#bbf7d0 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
            }}
        >
            <div className="relative w-full max-w-md p-8 mb-24 space-y-8 bg-white rounded-lg shadow-2xl sm:mb-32">
                <div className="text-center">
                    <img
                        className="w-40 h-auto mx-auto"
                        src="https://i.ibb.co/x8MPvpcr/Logo-Felo.png"
                        alt="Logo CIFP Felo Monzón"
                    />
                    <h1 className="mt-4 text-2xl font-extrabold text-gray-900">
                        Gestor de Proyectos Educativos
                    </h1>
                     <div className="mt-4">
                        <p className="text-sm tracking-wider text-gray-500 uppercase">
                            Departamento
                        </p>
                        <div className="w-1/2 mx-auto mt-1 mb-2 border-t border-gray-300"></div>
                        <p className="text-lg font-bold text-green-700">
                            Actividades Físicas y Deportivas
                        </p>
                        <p className="mt-6 text-sm tracking-wider text-gray-500 uppercase">
                            CIFP Felo Monzón Grau-Bassas
                        </p>
                    </div>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="username" className="sr-only">Usuario</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="relative block w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                                placeholder="Nombre de usuario"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <label htmlFor="password" className="sr-only">Contraseña</label>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                className="relative block w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm pr-10"
                                placeholder="Contraseña"
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
                    
                    {error && <p className="text-sm text-center text-red-600">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md group hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Acceder
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
