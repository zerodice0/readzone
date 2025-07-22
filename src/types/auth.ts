export interface User {
  id: string;
  email: string;
  name?: string | null;
  nickname: string;
  bio?: string | null;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: User;
  expires: string;
}