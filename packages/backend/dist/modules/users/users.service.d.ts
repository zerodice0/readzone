import { PrismaService } from '../../prisma/prisma.service';
import { GetUserProfileDto } from './dto/get-user-profile.dto';
export declare class UsersService {
    private readonly prismaService;
    constructor(prismaService: PrismaService);
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
