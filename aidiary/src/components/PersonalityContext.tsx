import React, { createContext, useContext, useState } from 'react';

interface PersonalityContextType {
    personality: string;
    setPersonality: (value: string) => void;
}

const PersonalityContext = createContext<PersonalityContextType | undefined>(undefined);

export const PersonalityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [personality, setPersonality] = useState<string>('');
    return (
        <PersonalityContext.Provider value={{ personality, setPersonality }}>
    {children}
    </PersonalityContext.Provider>
);
};

export const usePersonality = () => {
    const context = useContext(PersonalityContext);
    if (!context) {
        throw new Error('usePersonality must be used within PersonalityProvider');
    }
    return context;
};
