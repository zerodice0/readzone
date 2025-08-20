import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Share } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
const ReviewCard = ({ review, onLike, onComment, onShare, onProfileClick, onBookClick, onReviewClick, isAuthenticated }) => {
    const [isLikeAnimating, setIsLikeAnimating] = useState(false);
    const { toast } = useToast();
    const handleLike = () => {
        if (!isAuthenticated) {
            toast({
                variant: 'warning',
                title: '로그인 필요',
                description: '좋아요를 누르려면 로그인이 필요합니다.',
            });
            return;
        }
        setIsLikeAnimating(true);
        onLike(review.id);
        // 애니메이션 완료 후 상태 리셋
        setTimeout(() => setIsLikeAnimating(false), 300);
    };
    const handleComment = () => {
        if (!isAuthenticated) {
            toast({
                variant: 'warning',
                title: '로그인 필요',
                description: '댓글을 남기려면 로그인이 필요합니다.',
            });
            return;
        }
        onComment(review.id);
    };
    const handleShare = () => {
        onShare(review.id);
    };
    const isLiked = review.userInteraction?.isLiked ?? false;
    return (_jsxs("article", { className: "review-card bg-card border border-border rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("button", { onClick: () => onProfileClick(review.author.id), className: "flex items-center space-x-3 hover:opacity-80 transition-opacity", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden", children: review.author.profileImage ? (_jsx("img", { src: review.author.profileImage, alt: `${review.author.username}의 프로필`, className: "w-full h-full object-cover" })) : (_jsx("span", { className: "text-sm font-medium text-muted-foreground", children: review.author.username.charAt(0).toUpperCase() })) }), _jsxs("div", { className: "text-left", children: [_jsx("p", { className: "font-medium text-foreground", children: review.author.username }), _jsx("p", { className: "text-xs text-muted-foreground", children: formatTimeAgo(review.createdAt) })] })] }), _jsx("div", { className: "ml-auto", children: _jsx("button", { className: "p-1 rounded-full hover:bg-muted transition-colors", children: _jsx(MoreHorizontal, { className: "h-4 w-4 text-muted-foreground" }) }) })] }), _jsxs("div", { className: "flex space-x-4", children: [_jsx("button", { onClick: () => onBookClick(review.book.id), className: "flex-shrink-0 hover:opacity-80 transition-opacity", children: _jsx("div", { className: "w-16 h-20 bg-muted rounded-md overflow-hidden", children: review.book.cover ? (_jsx("img", { src: review.book.cover, alt: `${review.book.title} 표지`, className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center", children: _jsx("span", { className: "text-xs text-muted-foreground text-center px-1", children: "\uD45C\uC9C0 \uC5C6\uC74C" }) })) }) }), _jsx("div", { className: "flex-grow min-w-0", children: _jsxs("button", { onClick: () => onBookClick(review.book.id), className: "text-left hover:opacity-80 transition-opacity", children: [_jsx("h3", { className: "font-medium text-foreground line-clamp-2 mb-1", children: review.book.title }), _jsx("p", { className: "text-sm text-muted-foreground mb-2", children: review.book.author })] }) })] }), _jsx("div", { className: "space-y-2", children: _jsx("button", { onClick: () => onReviewClick(review.id), className: "text-left w-full hover:opacity-80 transition-opacity", children: _jsx("p", { className: "text-foreground line-clamp-4 whitespace-pre-line", children: review.content }) }) }), _jsxs("div", { className: "flex items-center space-x-6 pt-2", children: [_jsxs("button", { onClick: handleLike, className: `flex items-center space-x-2 group transition-colors ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`, children: [_jsx(Heart, { className: `h-5 w-5 transition-all duration-300 ${isLiked ? 'fill-current' : 'group-hover:scale-110'} ${isLikeAnimating ? 'scale-125' : ''}` }), _jsx("span", { className: "text-sm font-medium", children: review.stats.likes > 0 ? review.stats.likes : '' })] }), _jsxs("button", { onClick: handleComment, className: "flex items-center space-x-2 text-muted-foreground hover:text-blue-500 transition-colors group", children: [_jsx(MessageCircle, { className: "h-5 w-5 group-hover:scale-110 transition-transform" }), _jsx("span", { className: "text-sm font-medium", children: review.stats.comments > 0 ? review.stats.comments : '' })] }), _jsxs("button", { onClick: handleShare, className: "flex items-center space-x-2 text-muted-foreground hover:text-green-500 transition-colors group", children: [_jsx(Share, { className: "h-5 w-5 group-hover:scale-110 transition-transform" }), _jsx("span", { className: "text-sm font-medium", children: review.stats.shares > 0 ? review.stats.shares : '' })] })] })] }));
};
export default ReviewCard;
