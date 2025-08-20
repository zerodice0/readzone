import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useToast } from '@/hooks/use-toast';
const FeedTabs = ({ activeTab, onTabChange, isAuthenticated }) => {
    const { toast } = useToast();
    const tabs = [
        { id: 'recommended', label: '추천', description: '인기 독후감' },
        { id: 'latest', label: '최신', description: '새로운 독후감' },
        { id: 'following', label: '팔로잉', description: '팔로우한 사용자의 독후감' }
    ];
    const handleTabClick = (tabId) => {
        // 팔로잉 탭은 로그인 사용자만 접근 가능
        if (tabId === 'following' && !isAuthenticated) {
            toast({
                variant: 'warning',
                title: '로그인 필요',
                description: '팔로잉 피드를 보려면 로그인이 필요합니다.',
            });
            return;
        }
        onTabChange(tabId);
    };
    return (_jsx("div", { className: "feed-tabs border-b border-border", children: _jsx("div", { className: "flex space-x-0", children: tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const isDisabled = tab.id === 'following' && !isAuthenticated;
                return (_jsxs("button", { onClick: () => handleTabClick(tab.id), disabled: isDisabled, className: `
                flex-1 py-4 px-6 text-center transition-colors relative
                ${isActive
                        ? 'text-primary font-medium'
                        : isDisabled
                            ? 'text-muted-foreground/50 cursor-not-allowed'
                            : 'text-muted-foreground hover:text-foreground'}
                ${isActive ? 'border-b-2 border-primary' : ''}
              `, children: [_jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "text-sm font-medium", children: tab.label }), _jsx("div", { className: "text-xs opacity-75", children: tab.description })] }), isDisabled && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-background/80 rounded", children: _jsx("div", { className: "text-xs text-muted-foreground px-2 py-1 bg-muted rounded", children: "\uB85C\uADF8\uC778 \uD544\uC694" }) }))] }, tab.id));
            }) }) }));
};
export default FeedTabs;
