import type { FeedTab } from '@/types/feed';
interface FeedTabsProps {
    activeTab: FeedTab;
    onTabChange: (tab: FeedTab) => void;
    isAuthenticated: boolean;
}
declare const FeedTabs: ({ activeTab, onTabChange, isAuthenticated }: FeedTabsProps) => import("react/jsx-runtime").JSX.Element;
export default FeedTabs;
