import React, { useState, useEffect } from 'react';
import { 
  BookMarked, 
  BookOpen, 
  CheckCircle, 
  Edit3, 
  Calendar,
  FileText,
  Trash2
} from 'lucide-react';
import { useLibraryStore, getStatusLabel, getStatusColor } from '../../stores/libraryStore';
import Button from '../ui/Button';
import Input from '../ui/Input';
import type { LibraryStatus, AddOrUpdateLibraryBookParams } from '../../services/libraryService';

interface LibraryBookActionsProps {
  bookId: string;
  className?: string;
}

const LibraryBookActions: React.FC<LibraryBookActionsProps> = ({ bookId, className = '' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    status: 'want_to_read' as LibraryStatus,
    currentPage: 0,
    totalPages: '',
    notes: '',
    startedAt: '',
    finishedAt: '',
  });

  const {
    currentBook,
    isLoading,
    error,
    fetchLibraryBook,
    addOrUpdateLibraryBook,
    removeLibraryBook,
    updateReadingProgress,
    clearError,
  } = useLibraryStore();

  // 컴포넌트 마운트 시 서재 정보 조회
  useEffect(() => {
    fetchLibraryBook(bookId);
  }, [fetchLibraryBook, bookId]);

  // 서재 정보가 있으면 폼 데이터 초기화
  useEffect(() => {
    if (currentBook) {
      setFormData({
        status: currentBook.status,
        currentPage: currentBook.currentPage,
        totalPages: currentBook.totalPages?.toString() || '',
        notes: currentBook.notes || '',
        startedAt: currentBook.startedAt ? new Date(currentBook.startedAt).toISOString().split('T')[0] : '',
        finishedAt: currentBook.finishedAt ? new Date(currentBook.finishedAt).toISOString().split('T')[0] : '',
      });
    }
  }, [currentBook]);

  const handleStatusChange = async (newStatus: LibraryStatus) => {
    try {
      const params: AddOrUpdateLibraryBookParams = {
        status: newStatus,
        currentPage: formData.currentPage,
        totalPages: formData.totalPages ? parseInt(formData.totalPages) : undefined,
        notes: formData.notes || undefined,
      };

      // 상태에 따른 자동 날짜 설정
      if (newStatus === 'reading' && !currentBook?.startedAt) {
        params.startedAt = new Date().toISOString();
      } else if (newStatus === 'completed' && !currentBook?.finishedAt) {
        params.finishedAt = new Date().toISOString();
        if (formData.totalPages) {
          params.currentPage = parseInt(formData.totalPages);
        }
      }

      await addOrUpdateLibraryBook(bookId, params);
      setIsEditing(false);
    } catch (error) {
      console.error('상태 변경 오류:', error);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const params: AddOrUpdateLibraryBookParams = {
        status: formData.status,
        currentPage: formData.currentPage,
        totalPages: formData.totalPages ? parseInt(formData.totalPages) : undefined,
        notes: formData.notes || undefined,
        startedAt: formData.startedAt || undefined,
        finishedAt: formData.finishedAt || undefined,
      };

      await addOrUpdateLibraryBook(bookId, params);
      setIsEditing(false);
    } catch (error) {
      console.error('서재 정보 업데이트 오류:', error);
    }
  };

  const handleProgressUpdate = async () => {
    if (currentBook?.status === 'reading') {
      try {
        await updateReadingProgress(bookId, formData.currentPage, formData.notes);
      } catch (error) {
        console.error('진행률 업데이트 오류:', error);
      }
    }
  };

  const handleRemove = async () => {
    if (confirm('서재에서 이 책을 제거하시겠습니까?')) {
      try {
        await removeLibraryBook(bookId);
      } catch (error) {
        console.error('서재에서 제거 오류:', error);
      }
    }
  };

  const getProgressPercentage = () => {
    if (!currentBook?.totalPages || currentBook.totalPages === 0) return 0;
    return Math.round((currentBook.currentPage / currentBook.totalPages) * 100);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <BookMarked className="w-5 h-5 mr-2" />
        내 서재
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {!currentBook ? (
        // 서재에 없는 경우 - 추가 버튼들
        <div className="space-y-3">
          <p className="text-gray-600 text-sm mb-4">이 책을 서재에 추가하세요</p>
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={() => handleStatusChange('want_to_read')}
              disabled={isLoading}
              className="flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-100"
            >
              <BookMarked className="w-4 h-4 mr-2" />
              읽고 싶은 책
            </Button>
            <Button
              onClick={() => handleStatusChange('reading')}
              disabled={isLoading}
              className="flex items-center justify-center text-yellow-600 bg-yellow-50 hover:bg-yellow-100"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              읽기 시작
            </Button>
            <Button
              onClick={() => handleStatusChange('completed')}
              disabled={isLoading}
              className="flex items-center justify-center text-green-600 bg-green-50 hover:bg-green-100"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              읽기 완료
            </Button>
          </div>
        </div>
      ) : (
        // 서재에 있는 경우 - 상태 표시 및 편집
        <div className="space-y-4">
          {/* 현재 상태 */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentBook.status)}`}>
              {getStatusLabel(currentBook.status)}
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 진행률 (읽는 중인 경우) */}
          {currentBook.status === 'reading' && currentBook.totalPages && (
            <div>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>읽기 진행률</span>
                <span>{currentBook.currentPage} / {currentBook.totalPages} 페이지 ({getProgressPercentage()}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* 날짜 정보 */}
          <div className="space-y-2 text-sm text-gray-600">
            {currentBook.startedAt && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                시작일: {formatDate(currentBook.startedAt)}
              </div>
            )}
            {currentBook.finishedAt && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                완료일: {formatDate(currentBook.finishedAt)}
              </div>
            )}
          </div>

          {/* 메모 */}
          {currentBook.notes && (
            <div>
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <FileText className="w-4 h-4 mr-2" />
                메모
              </div>
              <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">
                {currentBook.notes}
              </p>
            </div>
          )}

          {/* 편집 폼 */}
          {isEditing && (
            <form onSubmit={handleFormSubmit} className="space-y-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상태
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as LibraryStatus })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="want_to_read">읽고 싶은 책</option>
                  <option value="reading">읽는 중</option>
                  <option value="completed">완료</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    현재 페이지
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.currentPage}
                    onChange={(e) => setFormData({ ...formData, currentPage: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    전체 페이지
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.totalPages}
                    onChange={(e) => setFormData({ ...formData, totalPages: e.target.value })}
                    placeholder="선택사항"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시작일
                  </label>
                  <Input
                    type="date"
                    value={formData.startedAt}
                    onChange={(e) => setFormData({ ...formData, startedAt: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    완료일
                  </label>
                  <Input
                    type="date"
                    value={formData.finishedAt}
                    onChange={(e) => setFormData({ ...formData, finishedAt: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="읽으면서 남기고 싶은 메모를 작성하세요..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button type="submit" disabled={isLoading}>
                  저장
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  취소
                </Button>
              </div>
            </form>
          )}

          {/* 빠른 진행률 업데이트 (읽는 중인 경우) */}
          {!isEditing && currentBook.status === 'reading' && (
            <div className="pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  max={currentBook.totalPages || undefined}
                  value={formData.currentPage}
                  onChange={(e) => setFormData({ ...formData, currentPage: parseInt(e.target.value) || 0 })}
                  className="flex-1"
                  placeholder="현재 페이지"
                />
                <Button
                  onClick={handleProgressUpdate}
                  disabled={isLoading}
                  size="sm"
                >
                  업데이트
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LibraryBookActions;