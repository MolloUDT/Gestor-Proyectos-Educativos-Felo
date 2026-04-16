
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations } from '../translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('gestor_proyectos_lang');
        return (saved as Language) || 'es';
    });

    useEffect(() => {
        localStorage.setItem('gestor_proyectos_lang', language);
    }, [language]);

    const t = (key: string, params?: Record<string, string>): string => {
        const keys = key.split('.');
        let translation: any = translations[language];
        
        for (const k of keys) {
            translation = translation?.[k];
        }

        if (!translation) return key;

        if (params) {
            let translatedStr = translation as string;
            Object.entries(params).forEach(([paramKey, value]) => {
                translatedStr = translatedStr.replace(`{${paramKey}}`, value);
            });
            return translatedStr;
        }

        return translation as string;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
