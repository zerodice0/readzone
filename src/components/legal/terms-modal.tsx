'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TermsModalProps {
  type: 'terms' | 'privacy';
  isOpen: boolean;
  onClose: () => void;
  onAgree?: () => void;
}

export function TermsModal({ type, isOpen, onClose, onAgree }: TermsModalProps) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      // 약관 내용을 가져옵니다
      fetch(`/api/legal/${type}`)
        .then(res => res.text())
        .then(data => {
          setContent(data);
          setIsLoading(false);
        })
        .catch(() => {
          setContent('약관을 불러올 수 없습니다.');
          setIsLoading(false);
        });
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const title = type === 'terms' ? '이용약관' : '개인정보처리방침';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-2 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          {onAgree && (
            <Button onClick={() => {
              onAgree();
              onClose();
            }}>
              동의합니다
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}