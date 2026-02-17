import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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
    id, label, type, placeholder, value, onChange,
    required = true, disabled = false, error, showPasswordToggle = false,
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
        <div className="w-full">
            <label
                htmlFor={id}
                className="block text-[12px] font-bold mb-1.5 text-cocoa-light tracking-wide uppercase font-body"
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
                        w-full px-3.5 py-3 rounded-md bg-linen/60
                        border transition-all duration-150
                        text-ink placeholder:text-cocoa-muted/40 font-body text-[14px]
                        focus:outline-none focus:ring-1 focus:ring-terra/30 focus:border-terra
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${error ? 'border-red-400 focus:ring-red-200' : 'border-linen-deep hover:border-dusty'}
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-cocoa-muted hover:text-cocoa transition-colors"
                        aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                )}
            </div>
            {error && (
                <p id={`${id}-error`} className="mt-1 text-[12px] text-red-500 font-medium">
                    {error}
                </p>
            )}
        </div>
    );
};

export default FormInput;
