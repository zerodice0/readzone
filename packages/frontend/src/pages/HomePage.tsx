import { useEffect } from 'react';
import { MainFeed } from '@/components/feed/MainFeed';

export function HomePage() {
  // SEO 및 접근성을 위한 페이지 메타데이터 설정
  useEffect(() => {
    document.title = 'ReadZone - 독서 후 감상을 공유하는 커뮤니티';
    
    const metaDescription = document.querySelector('meta[name="description"]');

    if (metaDescription) {
      metaDescription.setAttribute('content', 'ReadZone에서 독서 후 감상을 공유하고 다른 독자들과 소통하세요. 독후감을 작성하고 책에 대한 다양한 의견을 나눠보세요.');
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 페이지 헤더 (스크린 리더용) */}
      <div className="sr-only">
        <h1>ReadZone 메인 피드</h1>
        <p>독서 후 감상을 공유하는 커뮤니티의 메인 피드입니다.</p>
      </div>

      <MainFeed />
    </div>
  );
}