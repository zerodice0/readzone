import { beforeEach, describe, expect, it } from 'vitest';
import { useLoginPromptStore } from './loginPromptStore';

describe('loginPromptStore', () => {
  beforeEach(() => {
    useLoginPromptStore.setState({
      isOpen: false,
      message: '이 기능을 사용하려면 로그인이 필요합니다.',
      returnUrl: null,
    });
  });

  it('로그인 후 복귀할 작성 경로를 보존한다', () => {
    const returnUrl = '/reviews/new?bookId=book123456789012';

    useLoginPromptStore
      .getState()
      .show('독후감을 작성하려면 로그인이 필요합니다.', returnUrl);

    expect(useLoginPromptStore.getState()).toMatchObject({
      isOpen: true,
      returnUrl,
    });
  });

  it('로그인 안내를 닫으면 이전 복귀 경로를 제거한다', () => {
    useLoginPromptStore
      .getState()
      .show(undefined, '/reviews/new?bookId=book123456789012');

    useLoginPromptStore.getState().hide();

    expect(useLoginPromptStore.getState()).toMatchObject({
      isOpen: false,
      returnUrl: null,
    });
  });
});
