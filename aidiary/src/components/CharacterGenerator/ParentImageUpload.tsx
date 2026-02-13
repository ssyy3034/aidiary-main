import React, { useRef } from 'react';
import { THEME_COLORS } from '../common/FormInput';

interface ParentImageUploadProps {
    parent1File: File | null;
    parent2File: File | null;
    onParent1Change: (file: File) => void;
    onParent2Change: (file: File) => void;
    disabled?: boolean;
}

/**
 * 부모 사진 업로드 컴포넌트
 */
const ParentImageUpload: React.FC<ParentImageUploadProps> = ({
    parent1File,
    parent2File,
    onParent1Change,
    onParent2Change,
    disabled = false,
}) => {
    const { sub: subColor } = THEME_COLORS;
    const parent1Ref = useRef<HTMLInputElement>(null);
    const parent2Ref = useRef<HTMLInputElement>(null);

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        onChange: (file: File) => void
    ) => {
        if (e.target.files && e.target.files[0]) {
            onChange(e.target.files[0]);
        }
    };

    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: subColor }}>
                부모님 사진 업로드
            </h3>

            <div className="flex gap-3">
                {/* 엄마 사진 */}
                <button
                    type="button"
                    onClick={() => parent1Ref.current?.click()}
                    disabled={disabled}
                    className="flex-1 py-4 px-4 rounded-2xl border-2 border-dashed transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 flex flex-col items-center gap-2"
                    style={{
                        borderColor: parent1File ? subColor : `${subColor}80`,
                        backgroundColor: parent1File ? `${subColor}10` : 'rgba(255,255,255,0.8)',
                    }}
                >
                    <svg className="w-8 h-8" style={{ color: subColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm font-medium" style={{ color: subColor }}>
                        {parent1File ? parent1File.name : '엄마 사진'}
                    </span>
                    <input
                        ref={parent1Ref}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, onParent1Change)}
                        className="hidden"
                    />
                </button>

                {/* 아빠 사진 */}
                <button
                    type="button"
                    onClick={() => parent2Ref.current?.click()}
                    disabled={disabled}
                    className="flex-1 py-4 px-4 rounded-2xl border-2 border-dashed transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 flex flex-col items-center gap-2"
                    style={{
                        borderColor: parent2File ? subColor : `${subColor}80`,
                        backgroundColor: parent2File ? `${subColor}10` : 'rgba(255,255,255,0.8)',
                    }}
                >
                    <svg className="w-8 h-8" style={{ color: subColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm font-medium" style={{ color: subColor }}>
                        {parent2File ? parent2File.name : '아빠 사진'}
                    </span>
                    <input
                        ref={parent2Ref}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, onParent2Change)}
                        className="hidden"
                    />
                </button>
            </div>
        </div>
    );
};

export default ParentImageUpload;
