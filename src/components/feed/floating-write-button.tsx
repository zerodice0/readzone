'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

export function FloatingWriteButton() {
  return (
    <Link
      href="/write"
      className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white rounded-full shadow-lg dark:shadow-xl flex items-center justify-center transition-colors"
      aria-label="독후감 작성"
    >
      <Plus className="w-6 h-6" />
    </Link>
  );
}