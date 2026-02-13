import React from 'react';
import { THEME_COLORS } from '../common/FormInput';

interface ChildInfoFormProps {
    childName: string;
    childBirthday: string;
    onNameChange: (name: string) => void;
    onBirthdayChange: (date: string) => void;
    disabled?: boolean;
}

/**
 * 아이 정보 입력 폼 컴포넌트
 */
const ChildInfoForm: React.FC<ChildInfoFormProps> = ({
    childName,
    childBirthday,
    onNameChange,
    onBirthdayChange,
    disabled = false,
}) => {
    const { sub: subColor } = THEME_COLORS;

    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: subColor }}>
                아이 정보 입력
            </h3>

            <div className="space-y-4">
                <div>
                    <label
                        htmlFor="childName"
                        className="block text-sm font-medium mb-1"
                        style={{ color: subColor }}
                    >
                        아이 이름
                    </label>
                    <input
                        id="childName"
                        type="text"
                        value={childName}
                        onChange={(e) => onNameChange(e.target.value)}
                        disabled={disabled}
                        className="w-full px-4 py-3 rounded-2xl bg-white/80 transition-all duration-300 focus:outline-none focus:ring-2 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
                        style={{
                            borderColor: subColor,
                            borderWidth: '1px',
                        }}
                        placeholder="아이 이름을 입력해주세요"
                    />
                </div>

                <div>
                    <label
                        htmlFor="childBirthday"
                        className="block text-sm font-medium mb-1"
                        style={{ color: subColor }}
                    >
                        예정일
                    </label>
                    <input
                        id="childBirthday"
                        type="date"
                        value={childBirthday}
                        onChange={(e) => onBirthdayChange(e.target.value)}
                        disabled={disabled}
                        className="w-full px-4 py-3 rounded-2xl bg-white/80 transition-all duration-300 focus:outline-none focus:ring-2 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
                        style={{
                            borderColor: subColor,
                            borderWidth: '1px',
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ChildInfoForm;
