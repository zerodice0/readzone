'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Link2, Check } from 'lucide-react';

interface ShareDialogProps {
  reviewId: string;
  bookTitle: string;
  onClose: () => void;
}

export function ShareDialog({ reviewId, bookTitle, onClose }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/review/${reviewId}`;
  const shareText = `"${bookTitle}" 독후감을 읽어보세요!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleKakaoShare = () => {
    if (window.Kakao) {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: shareText,
          description: 'ReadZone에서 독후감을 확인하세요',
          imageUrl: '/og-image.png', // TODO: 실제 이미지 경로
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
      });
    }
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">공유하기</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleCopyLink}
          >
            <Link2 className="w-4 h-4 mr-2" />
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2 text-green-600" />
                링크가 복사되었습니다
              </>
            ) : (
              '링크 복사'
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleKakaoShare}
          >
            <span className="mr-2">💬</span>
            카카오톡으로 공유
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleTwitterShare}
          >
            <span className="mr-2">🐦</span>
            X(트위터)로 공유
          </Button>
        </div>
      </div>
    </div>
  );
}