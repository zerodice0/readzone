import type { Transition, Variants } from 'framer-motion';

/**
 * 애니메이션 시스템
 * framer-motion을 위한 재사용 가능한 애니메이션 프리셋
 */

// 기본 전환 설정
export const transitions = {
  fast: { duration: 0.15, ease: 'easeInOut' },
  normal: { duration: 0.3, ease: 'easeInOut' },
  slow: { duration: 0.5, ease: 'easeInOut' },
  spring: {
    type: 'spring' as const,
    damping: 25,
    stiffness: 300,
  },
  springFast: {
    type: 'spring' as const,
    damping: 30,
    stiffness: 400,
  },
  springBouncy: {
    type: 'spring' as const,
    damping: 15,
    stiffness: 200,
  },
} satisfies Record<string, Transition>;

// 애니메이션 프리셋
export const animations = {
  // 페이드 인/아웃
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: transitions.normal,
  },

  fadeInFast: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: transitions.fast,
  },

  // 슬라이드 업
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
    transition: transitions.spring,
  },

  // 슬라이드 다운
  slideDown: {
    initial: { y: -20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 },
    transition: transitions.spring,
  },

  // 슬라이드 왼쪽에서
  slideInLeft: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
    transition: transitions.spring,
  },

  // 슬라이드 오른쪽에서
  slideInRight: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
    transition: transitions.spring,
  },

  // 스케일
  scale: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
    transition: transitions.spring,
  },

  // 스케일 (크게)
  scaleUp: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.1, opacity: 0 },
    transition: transitions.springBouncy,
  },

  // 저장 중 펄스
  pulse: {
    animate: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },

  // 흔들림 (에러)
  shake: {
    animate: {
      x: [0, -10, 10, -10, 10, 0],
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
      },
    },
  },

  // 회전
  rotate: {
    animate: {
      rotate: 360,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  },

  // 진동 (성공 피드백)
  bounce: {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  },
};

// 복합 애니메이션 variants
export const variants = {
  // 설정 섹션 전환
  settingsSection: {
    initial: { opacity: 0, x: 20 },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.2,
        ease: 'easeIn',
      },
    },
  } satisfies Variants,

  // 설정 카드 애니메이션
  settingsCard: {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        delay: 0.1,
      },
    },
    hover: {
      y: -2,
      transition: {
        duration: 0.2,
      },
    },
  } satisfies Variants,

  // 모달 애니메이션
  modal: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        when: 'beforeChildren',
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
        when: 'afterChildren',
      },
    },
  } satisfies Variants,

  modalContent: {
    hidden: { scale: 0.95, opacity: 0, y: 20 },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
      },
    },
    exit: {
      scale: 0.95,
      opacity: 0,
      y: 20,
      transition: {
        duration: 0.2,
      },
    },
  } satisfies Variants,

  // 드롭다운 메뉴
  dropdown: {
    hidden: {
      opacity: 0,
      scale: 0.95,
      transformOrigin: 'top',
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.15,
        ease: 'easeIn',
      },
    },
  } satisfies Variants,

  // 리스트 아이템 스태거링
  listContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  } satisfies Variants,

  listItem: {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
      },
    },
  } satisfies Variants,

  // 저장 상태 표시
  saveStatus: {
    idle: { opacity: 0, scale: 0.8 },
    saving: {
      opacity: 1,
      scale: 1,
      rotate: [0, 360],
      transition: {
        scale: { duration: 0.2 },
        rotate: { duration: 1, repeat: Infinity, ease: 'linear' },
      },
    },
    saved: {
      opacity: 1,
      scale: [1, 1.2, 1],
      rotate: 0,
      transition: {
        duration: 0.3,
      },
    },
    error: {
      opacity: 1,
      scale: 1,
      x: [0, -5, 5, -5, 5, 0],
      transition: {
        duration: 0.5,
      },
    },
  } satisfies Variants,
};

// 접근성 고려 애니메이션
export function getAccessibleAnimation(prefersReducedMotion: boolean) {
  if (prefersReducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.1 },
    };
  }

  return animations.fadeIn;
}

// 조건부 애니메이션 헬퍼
export function conditionalAnimation(
  condition: boolean,
  animationIfTrue: (typeof animations)[keyof typeof animations],
  animationIfFalse?: (typeof animations)[keyof typeof animations]
) {
  return condition ? animationIfTrue : (animationIfFalse ?? animations.fadeIn);
}

// 지연된 애니메이션 생성을 위한 타입 정의
interface AnimateWithTransition {
  transition?: Transition;
  [key: string]: unknown;
}

interface AnimationWithTransition {
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: Transition;
}

// 지연된 애니메이션 생성
export function createDelayedAnimation(
  baseAnimation: (typeof animations)[keyof typeof animations],
  delay: number
): AnimationWithTransition {
  const result: AnimationWithTransition = { ...baseAnimation };

  // 최상위 transition이 있는 경우
  if ('transition' in baseAnimation && baseAnimation.transition) {
    result.transition = {
      ...baseAnimation.transition,
      delay,
    } as Transition;
  }
  // animate 내부에 transition이 있는 경우
  else if (
    'animate' in baseAnimation &&
    baseAnimation.animate &&
    typeof baseAnimation.animate === 'object' &&
    baseAnimation.animate !== null &&
    'transition' in baseAnimation.animate
  ) {
    const animateObj = baseAnimation.animate as AnimateWithTransition;

    const newAnimate: AnimateWithTransition = {
      ...animateObj,
      transition: {
        ...(animateObj.transition ?? {}),
        delay,
      },
    };

    result.animate = newAnimate;
  }
  // transition이 없는 경우 기본값 추가
  else {
    result.transition = {
      ...transitions.normal,
      delay,
    } as Transition;
  }

  return result;
}

// 연속 애니메이션 생성 (스태거링)
export function createStaggeredAnimation(
  baseAnimation: (typeof animations)[keyof typeof animations],
  staggerDelay = 0.1
) {
  return {
    container: {
      animate: {
        transition: {
          staggerChildren: staggerDelay,
        },
      },
    },
    item: baseAnimation,
  };
}

// 애니메이션 상수
export const ANIMATION_DURATIONS = {
  FAST: 0.15,
  NORMAL: 0.3,
  SLOW: 0.5,
  EXTRA_SLOW: 0.8,
} as const;

export const EASING = {
  EASE_OUT: [0.04, 0.62, 0.23, 0.98],
  EASE_IN: [0.4, 0, 1, 1],
  EASE_IN_OUT: [0.4, 0, 0.2, 1],
  BOUNCE: [0.68, -0.55, 0.265, 1.55],
} as const;
