import { UsersService } from './users.service';
import { GetUserProfileDto } from './dto/get-user-profile.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getUserProfile(getUserProfileDto: GetUserProfileDto): Promise<{
        success: boolean;
        data: {
            user: {
                createdAt: string;
                userid: string;
                nickname: string;
                id: string;
                bio: string | null;
                profileImage: string | null;
                isVerified: boolean;
                _count: {
                    reviews: number;
                    likes: number;
                    following: number;
                    followers: number;
                };
            };
        };
    }>;
}
