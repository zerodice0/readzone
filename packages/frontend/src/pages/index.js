import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import FeedTabs from '@/components/feed/FeedTabs';
import ReviewCard from '@/components/feed/ReviewCard';
import InfiniteScroll from '@/components/common/InfiniteScroll';
import useFeedStore, { useFeedCursor, useFeedReviews } from '@/store/feedStore';
import { useFeed, useLikeMutation } from '@/hooks/useFeedApi';
import { useToast } from '@/hooks/use-toast';
const FEED_LIMIT = 20;
const MainFeed = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { activeTab, isLoading, hasMore, error, setActiveTab, setReviews, appendReviews, updateReviewStats, updateUserInteraction, setLoading, setError, setHasMore } = useFeedStore();
    const reviews = useFeedReviews();
    const cursor = useFeedCursor();
    // 피드 데이터 패칭
    const { data: feedData, isLoading: isQueryLoading, error: queryError } = useFeed({
        tab: activeTab,
        ...(cursor && { cursor }),
        limit: FEED_LIMIT
    });
    const likeMutation = useLikeMutation();
    // 인증 상태 확인
    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
    }, []);
    // 피드 데이터 처리
    useEffect(() => {
        if (feedData) {
            if (cursor) {
                // 무한 스크롤로 추가 로드
                appendReviews(activeTab, feedData.reviews, feedData.nextCursor ?? undefined);
            }
            else {
                // 새 탭 또는 새로고침
                setReviews(activeTab, feedData.reviews, feedData.nextCursor ?? undefined);
            }
            setHasMore(feedData.hasMore);
        }
    }, [feedData, activeTab, cursor, appendReviews, setReviews, setHasMore]);
    // 로딩 및 에러 상태 동기화
    useEffect(() => {
        setLoading(isQueryLoading);
        setError(queryError?.message ?? null);
    }, [isQueryLoading, queryError, setLoading, setError]);
    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };
    const handleLoadMore = () => {
        if (hasMore && !isLoading) {
            // 다음 페이지 로드 (React Query가 자동으로 처리)
        }
    };
    const handleLike = async (reviewId) => {
        if (!isAuthenticated) {
            navigate({ to: '/login' });
            return;
        }
        const review = reviews.find(r => r.id === reviewId);
        if (!review) {
            return;
        }
        const isLiked = review.userInteraction?.isLiked ?? false;
        const action = isLiked ? 'unlike' : 'like';
        // 낙관적 업데이트
        updateUserInteraction(reviewId, {
            isLiked: !isLiked,
            isBookmarked: review.userInteraction?.isBookmarked ?? false
        });
        updateReviewStats(reviewId, {
            likes: review.stats.likes + (isLiked ? -1 : 1)
        });
        try {
            await likeMutation.mutateAsync({ reviewId, action });
        }
        catch (_error) {
            // 실패 시 롤백
            updateUserInteraction(reviewId, review.userInteraction);
            updateReviewStats(reviewId, { likes: review.stats.likes });
        }
    };
    const handleComment = (reviewId) => {
        if (!isAuthenticated) {
            navigate({ to: '/login' });
            return;
        }
        navigate({ to: `/review/${reviewId}#comments` });
    };
    const handleShare = async (reviewId) => {
        const shareUrl = `${window.location.origin}/review/${reviewId}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: '독후감 공유',
                    url: shareUrl
                });
            }
            catch (_error) {
                // 사용자가 공유를 취소한 경우 무시
            }
        }
        else {
            // 웹 공유 API 미지원시 클립보드 복사
            await navigator.clipboard.writeText(shareUrl);
            toast({
                variant: 'success',
                title: '링크 복사됨',
                description: '독후감 링크가 클립보드에 복사되었습니다.',
            });
        }
    };
    const handleProfileClick = (userId) => {
        navigate({ to: `/profile/${userId}` });
    };
    const handleBookClick = (bookId) => {
        navigate({ to: `/books/${bookId}` });
    };
    const handleReviewClick = (reviewId) => {
        navigate({ to: `/review/${reviewId}` });
    };
    if (error) {
        return (_jsx("div", { className: "min-h-screen bg-background", children: _jsx("div", { className: "container max-w-2xl mx-auto px-4 py-8", children: _jsxs("div", { className: "text-center space-y-4", children: [_jsxs("p", { className: "text-destructive", children: ["\uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: ", error] }), _jsx("button", { onClick: () => window.location.reload(), className: "px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors", children: "\uB2E4\uC2DC \uC2DC\uB3C4" })] }) }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-background", children: _jsxs("div", { className: "container max-w-2xl mx-auto", children: [_jsx(FeedTabs, { activeTab: activeTab, onTabChange: handleTabChange, isAuthenticated: isAuthenticated }), _jsx("div", { className: "px-4", children: _jsxs(InfiniteScroll, { hasMore: hasMore, isLoading: isLoading, onLoadMore: handleLoadMore, className: "space-y-6 py-6", children: [reviews.map((review) => (_jsx(ReviewCard, { review: review, onLike: handleLike, onComment: handleComment, onShare: handleShare, onProfileClick: handleProfileClick, onBookClick: handleBookClick, onReviewClick: handleReviewClick, isAuthenticated: isAuthenticated }, review.id))), reviews.length === 0 && !isLoading && (_jsxs("div", { className: "text-center py-12 space-y-4", children: [_jsx("p", { className: "text-muted-foreground", children: "\uB3C5\uD6C4\uAC10\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." }), activeTab === 'following' && isAuthenticated && (_jsx("p", { className: "text-sm text-muted-foreground", children: "\uB2E4\uB978 \uC0AC\uC6A9\uC790\uB97C \uD314\uB85C\uC6B0\uD558\uC5EC \uD53C\uB4DC\uB97C \uCC44\uC6CC\uBCF4\uC138\uC694." }))] }))] }) })] }) }));
};
export default MainFeed;
