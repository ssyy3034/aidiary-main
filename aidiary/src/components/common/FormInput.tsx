import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Legacy theme support - to be removed after full refactor
export const THEME_COLORS = {
    main: 'var(--color-main)',
    sub: 'var(--color-sub)',
    subLight: 'var(--color-sub-light)',
} as const;

interface FormInputProps {
    id: string;
    label: string;
    type: 'text' | 'password' | 'email' | 'tel';
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    showPasswordToggle?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({
    id,
    label,
    type,
    placeholder,
    value,
    onChange,
    required = true,
    disabled = false,
    error,
    showPasswordToggle = false,
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
        <div className="w-full">
            <label
                htmlFor={id}
                className="block text-sm font-medium mb-1.5 text-ink/80 font-sans"
            >
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    name={id}
                    type={inputType}
                    required={required}
                    disabled={disabled}
                    className={`
                        w-full px-4 py-3.5 rounded-xl bg-white/50 backdrop-blur-sm
                        border transition-all duration-200
                        text-ink placeholder:text-ink-light/50 font-sans
                        focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${error ? 'border-red-500 focus:ring-red-200' : 'border-sand hover:border-sand-dark'}
                        ${showPasswordToggle ? 'pr-12' : ''}
                    `}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    aria-describedby={error ? `${id}-error` : undefined}
                />

                {type === 'password' && showPasswordToggle && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-ink-light hover:text-ink hover:bg-black/5 transition-colors"
                        aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    >
                        {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                    </button>
                )}
            </div>
            {error && (
                <p id={`${id}-error`} className="mt-1.5 text-sm text-red-500 font-medium flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                    {error}
                </p>
            )}
        </div>
    );
};

export default FormInput;
