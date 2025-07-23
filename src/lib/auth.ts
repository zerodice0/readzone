import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from './db'
import { verifyPassword } from './utils'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('이메일과 비밀번호를 입력해주세요.')
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        })

        if (!user) {
          throw new Error('등록되지 않은 이메일입니다.')
        }

        if (!user.emailVerified) {
          throw new Error('이메일 인증이 완료되지 않았습니다.')
        }

        const isPasswordValid = await verifyPassword(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('비밀번호가 올바르지 않습니다.')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
          nickname: user.nickname,
          image: user.image,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.nickname = user.nickname
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.nickname = token.nickname as string
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      // 로그인 이벤트 로깅
      console.log(`User ${user.email} signed in`)
    },
  },
})

// Legacy export for backward compatibility
export const authOptions = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('이메일과 비밀번호를 입력해주세요.')
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        })

        if (!user) {
          throw new Error('등록되지 않은 이메일입니다.')
        }

        if (!user.emailVerified) {
          throw new Error('이메일 인증이 완료되지 않았습니다.')
        }

        const isPasswordValid = await verifyPassword(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('비밀번호가 올바르지 않습니다.')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
          nickname: user.nickname,
          image: user.image,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.nickname = user.nickname
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.sub!
        session.user.nickname = token.nickname as string
      }
      return session
    },
  },
  events: {
    async signIn({ user }: any) {
      // 로그인 이벤트 로깅
      console.log(`User ${user.email} signed in`)
    },
  },
}