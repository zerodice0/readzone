import React, { useState, useEffect } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { commentService, type Comment } from '../../services/commentService';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import Button from '../ui/Button';

interface CommentListProps {
  postId: string;
  className?: string;
}

const CommentList: React.FC<CommentListProps> = ({ postId, className }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await commentService.getComments(postId, { page, limit: 20 });
      
      if (page === 1) {
        setComments(response.comments);
      } else {
        setComments(prev => [...prev, ...response.comments]);
      }
      
      setPagination(response.pagination);
    } catch (err) {
      console.error('댓글 로드 실패:', err);
      setError('댓글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async (content: string, parentId?: string) => {
    try {
      const newComment = await commentService.createComment(postId, {
        content,
        parentId
      });

      if (parentId) {
        // 대댓글인 경우 부모 댓글의 replies에 추가
        setComments(prev => prev.map(comment => 
          comment.id === parentId 
            ? { ...comment, replies: [...comment.replies, newComment] }
            : comment
        ));
      } else {
        // 새 댓글인 경우 맨 위에 추가
        setComments(prev => [newComment, ...prev]);
        setPagination(prev => ({ ...prev, total: prev.total + 1 }));
      }

      setReplyingTo(null);
    } catch (err) {
      console.error('댓글 작성 실패:', err);
      throw err;
    }
  };

  const handleUpdateComment = async (content: string) => {
    if (!editingComment) return;

    try {
      const updatedComment = await commentService.updateComment(editingComment.id, {
        content
      });

      setComments(prev => prev.map(comment => 
        comment.id === updatedComment.id 
          ? updatedComment
          : {
              ...comment,
              replies: comment.replies.map(reply => 
                reply.id === updatedComment.id ? updatedComment : reply
              )
            }
      ));

      setEditingComment(null);
    } catch (err) {
      console.error('댓글 수정 실패:', err);
      throw err;
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await commentService.deleteComment(commentId);
      
      // 댓글 목록에서 제거
      setComments(prev => prev.filter(comment => {
        if (comment.id === commentId) {
          return false;
        }
        // 대댓글에서도 제거
        comment.replies = comment.replies.filter(reply => reply.id !== commentId);
        return true;
      }));

      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      console.error('댓글 삭제 실패:', err);
      alert('댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages) {
      loadComments(pagination.page + 1);
    }
  };

  if (loading && comments.length === 0) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">댓글을 불러오는 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-600">{error}</p>
        <Button
          onClick={() => loadComments()}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          댓글 ({pagination.total})
        </h3>
      </div>

      {/* 댓글 작성 폼 */}
      <div className="mb-6">
        <CommentForm
          onSubmit={(content) => handleCreateComment(content)}
          placeholder="이 게시글에 대한 생각을 남겨보세요..."
        />
      </div>

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">아직 댓글이 없습니다.</p>
            <p className="text-sm text-gray-500">첫 번째 댓글을 작성해보세요!</p>
          </div>
        ) : (
          <>
            {comments.map((comment) => (
              <div key={comment.id} className="relative">
                <CommentItem
                  comment={comment}
                  onReply={setReplyingTo}
                  onEdit={setEditingComment}
                  onDelete={handleDeleteComment}
                />
                
                {/* 답글 작성 폼 */}
                {replyingTo === comment.id && (
                  <div className="ml-11 mt-3">
                    <CommentForm
                      onSubmit={(content) => handleCreateComment(content, comment.id)}
                      onCancel={() => setReplyingTo(null)}
                      placeholder={`@${comment.user.displayName || comment.user.username}님에게 답글...`}
                      submitLabel="답글 작성"
                      showCancel={true}
                    />
                  </div>
                )}
              </div>
            ))}

            {/* 더 보기 버튼 */}
            {pagination.page < pagination.totalPages && (
              <div className="text-center py-4">
                <Button
                  onClick={handleLoadMore}
                  variant="outline"
                  loading={loading}
                  disabled={loading}
                >
                  댓글 더 보기 ({pagination.total - comments.length}개 남음)
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 댓글 수정 모달 */}
      {editingComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h4 className="text-lg font-semibold mb-4">댓글 수정</h4>
            <CommentForm
              onSubmit={handleUpdateComment}
              onCancel={() => setEditingComment(null)}
              initialValue={editingComment.content}
              submitLabel="수정하기"
              showCancel={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentList;