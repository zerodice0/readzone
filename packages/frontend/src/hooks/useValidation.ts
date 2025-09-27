import { useCallback, useEffect, useState } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
  email?: boolean;
  url?: boolean;
}

interface ValidationState<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
}

interface UseValidationReturn<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  setFieldValue: (fieldName: keyof T, value: T[keyof T]) => void;
  setFieldTouched: (fieldName: keyof T, touched?: boolean) => void;
  setFieldError: (fieldName: keyof T, error: string) => void;
  clearFieldError: (fieldName: keyof T) => void;
  validateField: (fieldName: keyof T) => string | null;
  validateAll: () => boolean;
  reset: (newValues?: T) => void;
  setSubmitting: (isSubmitting: boolean) => void;
}

/**
 * 실시간 폼 검증 훅
 * 필드별 검증 규칙과 실시간 에러 처리
 */
export function useValidation<T extends Record<string, unknown>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, ValidationRule>> = {}
): UseValidationReturn<T> {
  const [state, setState] = useState<ValidationState<T>>({
    values: initialValues,
    errors: {} as Record<keyof T, string>,
    touched: {} as Record<keyof T, boolean>,
    isValid: true,
    isSubmitting: false,
  });

  // 필드별 검증 함수
  const validateField = useCallback(
    (fieldName: keyof T): string | null => {
      const value = state.values[fieldName];
      const rule = validationRules[fieldName];

      if (!rule) {
        return null;
      }

      const errors: string[] = [];

      // 필수 입력 검사
      if (rule.required && (!value || value.toString().trim() === '')) {
        errors.push('필수 입력 항목입니다.');
      }

      // 값이 있을 때만 추가 검증 수행
      if (value && value.toString().trim() !== '') {
        // 최소 길이 검사
        if (rule.minLength && value.toString().length < rule.minLength) {
          errors.push(`최소 ${rule.minLength}자 이상 입력해주세요.`);
        }

        // 최대 길이 검사
        if (rule.maxLength && value.toString().length > rule.maxLength) {
          errors.push(`최대 ${rule.maxLength}자까지 입력 가능합니다.`);
        }

        // 패턴 검사
        if (rule.pattern && !rule.pattern.test(value.toString())) {
          errors.push('올바른 형식을 입력해주세요.');
        }

        // 이메일 검사
        if (rule.email) {
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

          if (!emailPattern.test(value.toString())) {
            errors.push('올바른 이메일 주소를 입력해주세요.');
          }
        }

        // URL 검사
        if (rule.url) {
          try {
            new URL(value.toString());
          } catch {
            errors.push('올바른 URL을 입력해주세요.');
          }
        }

        // 커스텀 검증
        if (rule.custom) {
          const customError = rule.custom(value);

          if (customError) {
            errors.push(customError);
          }
        }
      }

      return errors[0] ?? null;
    },
    [state.values, validationRules]
  );

  // 전체 검증
  const validateAll = useCallback((): boolean => {
    const newErrors = {} as Record<keyof T, string>;
    let isFormValid = true;

    Object.keys(state.values).forEach((key) => {
      const fieldName = key as keyof T;
      const error = validateField(fieldName);

      if (error) {
        newErrors[fieldName] = error;
        isFormValid = false;
      }
    });

    setState((prev) => ({
      ...prev,
      errors: newErrors,
      isValid: isFormValid,
    }));

    return isFormValid;
  }, [state.values, validateField]);

  // 필드 값 설정
  const setFieldValue = useCallback(
    (fieldName: keyof T, value: T[keyof T]) => {
      setState((prev) => {
        const newValues = { ...prev.values, [fieldName]: value };
        const error = prev.touched[fieldName] ? validateField(fieldName) : null;

        return {
          ...prev,
          values: newValues,
          errors: {
            ...prev.errors,
            [fieldName]: error ?? '',
          },
        };
      });
    },
    [validateField]
  );

  // 필드 터치 상태 설정
  const setFieldTouched = useCallback(
    (fieldName: keyof T, touched = true) => {
      setState((prev) => {
        const newTouched = { ...prev.touched, [fieldName]: touched };
        const error = touched ? validateField(fieldName) : null;

        return {
          ...prev,
          touched: newTouched,
          errors: {
            ...prev.errors,
            [fieldName]: error ?? '',
          },
        };
      });
    },
    [validateField]
  );

  // 필드 에러 직접 설정
  const setFieldError = useCallback((fieldName: keyof T, error: string) => {
    setState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldName]: error,
      },
    }));
  }, []);

  // 필드 에러 초기화
  const clearFieldError = useCallback((fieldName: keyof T) => {
    setState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldName]: '',
      },
    }));
  }, []);

  // 전체 상태 리셋
  const reset = useCallback(
    (newValues?: T) => {
      setState({
        values: newValues ?? initialValues,
        errors: {} as Record<keyof T, string>,
        touched: {} as Record<keyof T, boolean>,
        isValid: true,
        isSubmitting: false,
      });
    },
    [initialValues]
  );

  // 제출 상태 설정
  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setState((prev) => ({ ...prev, isSubmitting }));
  }, []);

  // 전체 검증 상태 업데이트
  useEffect(() => {
    const hasErrors = Object.values(state.errors).some((error) => error);

    setState((prev) => ({ ...prev, isValid: !hasErrors }));
  }, [state.errors]);

  return {
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isValid: state.isValid,
    isSubmitting: state.isSubmitting,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    clearFieldError,
    validateField,
    validateAll,
    reset,
    setSubmitting,
  };
}

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
}
/**
 * 비밀번호 강도 검증 훅
 */
export function usePasswordValidation() {
  const validatePasswordStrength = useCallback(
    (password: string): PasswordStrength => {
      let score = 0;
      const feedback: string[] = [];

      // 길이 검증
      if (password.length >= 8) {
        score += 1;
      } else {
        feedback.push('최소 8자 이상 입력해주세요');
      }

      // 대소문자 검증
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
        score += 1;
      } else {
        feedback.push('대문자와 소문자를 모두 포함해주세요');
      }

      // 숫자 검증
      if (/\d/.test(password)) {
        score += 1;
      } else {
        feedback.push('숫자를 포함해주세요');
      }

      // 특수문자 검증
      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        score += 1;
      } else {
        feedback.push('특수문자를 포함해주세요');
      }

      return {
        score,
        feedback,
        isValid: score >= 3,
      };
    },
    []
  );

  return {
    validatePasswordStrength,
  };
}

/**
 * 사용자명 중복 검증 훅
 */
export function useUsernameValidation() {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const checkUsernameAvailability = useCallback(
    async (username: string): Promise<boolean> => {
      if (!username || username.length < 3) {
        setIsAvailable(null);

        return false;
      }

      setIsChecking(true);
      try {
        // API 호출 (실제 구현 필요)
        const response = await fetch(
          `/api/auth/check-username?username=${encodeURIComponent(username)}`
        );
        const data = await response.json();

        setIsAvailable(data.available);

        return data.available;
      } catch (error) {
        console.error('Username check failed:', error);
        setIsAvailable(null);

        return false;
      } finally {
        setIsChecking(false);
      }
    },
    []
  );

  return {
    isChecking,
    isAvailable,
    checkUsernameAvailability,
  };
}
