import { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';

/**
 * 회원가입 폼 스키마 (Zod)
 * - 타입이 자동으로 추론됨
 * - 검증 규칙과 에러 메시지가 한 곳에 정의됨
 */
export const registerSchema = z.object({
    name: z
        .string()
        .min(1, '이름을 입력해주세요.')
        .min(2, '이름은 2자 이상이어야 합니다.')
        .max(30, '이름은 30자 이하여야 합니다.'),

    username: z
        .string()
        .min(1, '아이디를 입력해주세요.')
        .min(3, '아이디는 3자 이상이어야 합니다.')
        .regex(/^[a-zA-Z0-9]+$/, '영문자와 숫자만 사용 가능합니다.'),

    password: z
        .string()
        .min(1, '비밀번호를 입력해주세요.')
        .min(8, '비밀번호는 8자 이상이어야 합니다.')
        .regex(/[a-zA-Z]/, '영문자를 포함해야 합니다.')
        .regex(/[0-9]/, '숫자를 포함해야 합니다.')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, '특수문자를 포함해야 합니다.'),

    confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요.'),

    email: z
        .string()
        .min(1, '이메일을 입력해주세요.')
        .email('올바른 이메일 주소를 입력해주세요.'),

    phone: z
        .string()
        .min(1, '전화번호를 입력해주세요.')
        .regex(/^01[0-9]{9}$/, '올바른 전화번호를 입력해주세요. (예: 01012345678)'),
}).refine(data => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
});

// 스키마에서 타입 자동 추론!
export type FormData = z.infer<typeof registerSchema>;

// 에러 타입
export type FormErrors = Partial<Record<keyof FormData, string>>;

// 초기값
export const initialFormData: FormData = {
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
};

/**
 * Zod 기반 폼 유효성 검사 커스텀 훅
 */
export const useFormValidation = (form: FormData) => {
    const [errors, setErrors] = useState<FormErrors>({});

    useEffect(() => {
        // 빈 필드는 검증하지 않음 (입력 시작 전)
        const hasInput = Object.values(form).some(v => v !== '');
        if (!hasInput) {
            setErrors({});
            return;
        }

        // Zod로 검증
        const result = registerSchema.safeParse(form);

        if (result.success) {
            setErrors({});
        } else {
            // Zod 에러를 필드별로 매핑
            const newErrors: FormErrors = {};
            result.error.issues.forEach(err => {
                const field = err.path[0] as keyof FormData;
                // 첫 번째 에러만 표시 (여러 개면 처음 것만)
                if (!newErrors[field]) {
                    newErrors[field] = err.message;
                }
            });
            setErrors(newErrors);
        }
    }, [form]);

    // 유효성 여부
    const isValid = useMemo(() => {
        const allFilled = Object.values(form).every(v => v !== '');
        if (!allFilled) return false;

        const result = registerSchema.safeParse(form);
        return result.success;
    }, [form]);

    return { errors, isValid };
};

export default useFormValidation;
