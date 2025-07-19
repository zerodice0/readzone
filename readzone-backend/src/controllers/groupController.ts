import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 독서 그룹 목록 조회
export const getGroups = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { page = 1, limit = 20, search, type = 'all' } = req.query;
    const userId = req.user?.id;
    const offset = (Number(page) - 1) * Number(limit);

    let whereCondition: any = {
      isActive: true
    };

    // 검색 조건
    if (search) {
      whereCondition.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // 타입별 필터링
    if (type === 'public') {
      whereCondition.isPublic = true;
    } else if (type === 'my' && userId) {
      whereCondition.OR = [
        { creatorId: userId },
        { members: { some: { userId, status: 'active' } } }
      ];
    }

    const [groups, total] = await Promise.all([
      prisma.readingGroup.findMany({
        where: whereCondition,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          },
          members: {
            where: { status: 'active' },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true
                }
              }
            }
          },
          _count: {
            select: {
              members: { where: { status: 'active' } },
              discussions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: Number(limit)
      }),
      prisma.readingGroup.count({ where: whereCondition })
    ]);

    res.json({
      success: true,
      data: {
        groups: groups.map(group => ({
          ...group,
          memberCount: group._count.members,
          discussionCount: group._count.discussions,
          isUserMember: userId ? group.members.some(member => member.userId === userId) : false
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({
      success: false,
      error: { message: '그룹 목록을 불러오는 중 오류가 발생했습니다.' }
    });
  }
};

// 독서 그룹 상세 조회
export const getGroup = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: { message: '그룹 ID가 필요합니다.' }
      });
    }

    const group = await prisma.readingGroup.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        },
        members: {
          where: { status: 'active' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            }
          },
          orderBy: { joinedAt: 'asc' }
        },
        discussions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            },
            book: {
              select: {
                id: true,
                title: true,
                authors: true,
                thumbnail: true
              }
            }
          },
          orderBy: [
            { isSticky: 'desc' },
            { createdAt: 'desc' }
          ],
          take: 10
        }
      }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: { message: '그룹을 찾을 수 없습니다.' }
      });
    }

    if (!group.isPublic && userId) {
      const isMember = group.members.some(member => member.userId === userId);
      const isCreator = group.creatorId === userId;
      
      if (!isMember && !isCreator) {
        return res.status(403).json({
          success: false,
          error: { message: '비공개 그룹에 접근할 권한이 없습니다.' }
        });
      }
    }

    res.json({
      success: true,
      data: {
        ...group,
        isUserMember: userId ? group.members.some(member => member.userId === userId) : false,
        isCreator: userId ? group.creatorId === userId : false,
        memberCount: group.members.length
      }
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({
      success: false,
      error: { message: '그룹 정보를 불러오는 중 오류가 발생했습니다.' }
    });
  }
};

// 독서 그룹 생성
export const createGroup = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { name, description, isPublic, maxMembers } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: { message: '그룹명은 2글자 이상이어야 합니다.' }
      });
    }

    const group = await prisma.readingGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        isPublic: isPublic !== false,
        maxMembers: maxMembers || 50,
        creatorId: userId
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      }
    });

    // 생성자를 관리자로 자동 가입
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId,
        role: 'admin'
      }
    });

    res.status(201).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      error: { message: '그룹 생성 중 오류가 발생했습니다.' }
    });
  }
};

// 독서 그룹 가입
export const joinGroup = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: { message: '그룹 ID가 필요합니다.' }
      });
    }

    const group = await prisma.readingGroup.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            members: { where: { status: 'active' } }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: { message: '그룹을 찾을 수 없습니다.' }
      });
    }

    if (!group.isActive) {
      return res.status(400).json({
        success: false,
        error: { message: '비활성화된 그룹입니다.' }
      });
    }

    if (group._count.members >= group.maxMembers) {
      return res.status(400).json({
        success: false,
        error: { message: '그룹 정원이 가득 찼습니다.' }
      });
    }

    // 이미 가입한 멤버인지 확인
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId
        }
      }
    });

    if (existingMember) {
      if (existingMember.status === 'active') {
        return res.status(400).json({
          success: false,
          error: { message: '이미 가입한 그룹입니다.' }
        });
      } else {
        // 재가입
        await prisma.groupMember.update({
          where: { id: existingMember.id },
          data: {
            status: 'active',
            joinedAt: new Date(),
            leftAt: null
          }
        });
      }
    } else {
      // 신규 가입
      await prisma.groupMember.create({
        data: {
          groupId: id,
          userId,
          role: 'member'
        }
      });
    }

    res.json({
      success: true,
      message: '그룹에 가입했습니다.'
    });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({
      success: false,
      error: { message: '그룹 가입 중 오류가 발생했습니다.' }
    });
  }
};

// 독서 그룹 탈퇴
export const leaveGroup = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: { message: '그룹 ID가 필요합니다.' }
      });
    }

    const group = await prisma.readingGroup.findUnique({
      where: { id }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: { message: '그룹을 찾을 수 없습니다.' }
      });
    }

    if (group.creatorId === userId) {
      return res.status(400).json({
        success: false,
        error: { message: '그룹 생성자는 탈퇴할 수 없습니다. 그룹을 삭제하거나 관리자를 위임하세요.' }
      });
    }

    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId
        }
      }
    });

    if (!member || member.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: { message: '가입하지 않은 그룹입니다.' }
      });
    }

    await prisma.groupMember.update({
      where: { id: member.id },
      data: {
        status: 'left',
        leftAt: new Date()
      }
    });

    res.json({
      success: true,
      message: '그룹에서 탈퇴했습니다.'
    });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({
      success: false,
      error: { message: '그룹 탈퇴 중 오류가 발생했습니다.' }
    });
  }
};