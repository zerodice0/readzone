import type { FeedTab } from '@/types/feed';
import { useToast } from '@/hooks/use-toast';

interface FeedTabsProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  isAuthenticated: boolean;
}

const FeedTabs = ({ activeTab, onTabChange, isAuthenticated }: FeedTabsProps) => {
  const { toast } = useToast();
  const tabs = [
    { id: 'recommended' as const, label: '추천', description: '인기 독후감' },
    { id: 'latest' as const, label: '최신', description: '새로운 독후감' },
    { id: 'following' as const, label: '팔로잉', description: '팔로우한 사용자의 독후감' }
  ];

  const handleTabClick = (tabId: FeedTab) => {
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

  return (
    <div className="feed-tabs border-b border-border">
      <div className="flex space-x-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isDisabled = tab.id === 'following' && !isAuthenticated;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              disabled={isDisabled}
              className={`
                flex-1 py-4 px-6 text-center transition-colors relative
                ${isActive 
                  ? 'text-primary font-medium' 
                  : isDisabled 
                    ? 'text-muted-foreground/50 cursor-not-allowed'
                    : 'text-muted-foreground hover:text-foreground'
                }
                ${isActive ? 'border-b-2 border-primary' : ''}
              `}
            >
              <div className="space-y-1">
                <div className="text-sm font-medium">{tab.label}</div>
                <div className="text-xs opacity-75">{tab.description}</div>
              </div>
              
              {/* 팔로잉 탭 비활성화 오버레이 */}
              {isDisabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded">
                  <div className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                    로그인 필요
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FeedTabs;