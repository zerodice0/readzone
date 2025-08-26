export declare enum FeedTab {
    RECOMMENDED = "recommended",
    LATEST = "latest",
    FOLLOWING = "following"
}
export declare class FeedQueryDto {
    tab: FeedTab;
    cursor?: string;
    limit: number;
}
