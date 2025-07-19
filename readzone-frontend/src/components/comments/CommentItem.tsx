import React, { useState } from 'react';
import { MessageCircle, Edit3, Trash2, User, MoreHorizontal } from 'lucide-react';
import type { Comment } from '../../services/commentService';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';
import Button from '../ui/Button';

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: string) => void;
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  depth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onEdit,
  onDelete,
  depth = 0
}) => {
  const { user } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const isOwner = user?.id === comment.userId;
  const maxDepth = 2;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes}분 전`;
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else if (diffInDays < 7) {
      return `${diffInDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  return (
    <div className={cn('relative', depth > 0 && 'ml-8 mt-3')}>
      <div className="flex space-x-3">
        {/* 사용자 아바타 */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            {comment.user.avatar ? (
              <img
                src={comment.user.avatar}
                alt={comment.user.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </div>

        {/* 댓글 내용 */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm text-gray-900">
                  {comment.user.displayName || comment.user.username}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              
              {isOwner && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  
                  {showMenu && (
                    <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border z-10">
                      <button
                        onClick={() => {
                          onEdit(comment);
                          setShowMenu(false);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Edit3 className="w-3 h-3 inline mr-2" />
                        수정
                      </button>
                      <button
                        onClick={() => {
                          onDelete(comment.id);
                          setShowMenu(false);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <Trash2 className="w-3 h-3 inline mr-2" />
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-800 whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>

          {/* 답글 버튼 */}
          {user && depth < maxDepth && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(comment.id)}
                className="text-gray-500 hover:text-gray-700"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                답글
              </Button>
            </div>
          )}

          {/* 대댓글 */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;