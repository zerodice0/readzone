// Enums
export var BookSource;
(function (BookSource) {
    BookSource["KAKAO_API"] = "KAKAO_API";
    BookSource["DATABASE"] = "DATABASE";
    BookSource["MANUAL"] = "MANUAL";
})(BookSource || (BookSource = {}));
export var ReviewStatus;
(function (ReviewStatus) {
    ReviewStatus["DRAFT"] = "DRAFT";
    ReviewStatus["PUBLISHED"] = "PUBLISHED";
    ReviewStatus["ARCHIVED"] = "ARCHIVED";
})(ReviewStatus || (ReviewStatus = {}));
export var NotificationType;
(function (NotificationType) {
    NotificationType["LIKE"] = "LIKE";
    NotificationType["COMMENT"] = "COMMENT";
    NotificationType["REPLY"] = "REPLY";
    NotificationType["FOLLOW"] = "FOLLOW";
    NotificationType["SYSTEM"] = "SYSTEM";
})(NotificationType || (NotificationType = {}));
