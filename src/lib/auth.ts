import NextAuth, { type DefaultSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { type JWT } from 'next-auth/jwt'
import { prisma } from './db'
import { verifyPassword } from './utils'
import { logger } from './logger'
import { AuthErrorCode, createAuthError } from '@/types/error'
import { handleAuthError, createErrorContext } from './error-handler'

// Extend NextAuth types for custom properties
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      nickname: string
    } & DefaultSession['user']
  }
  
  interface User {
    nickname: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    nickname: string
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            const error = createAuthError(AuthErrorCode.MISSING_REQUIRED_FIELD)
            throw new Error(error.userMessage)
          }

          const email = credentials.email as string
          const password = credentials.password as string

          // Create error context for logging
          const context = createErrorContext('login', undefined, email)

          const user = await prisma.user.findUnique({
            where: { email },
          })

          if (!user) {
            const error = createAuthError(AuthErrorCode.USER_NOT_FOUND)
            handleAuthError(error, context)
            throw new Error(error.userMessage)
          }

          if (!user.emailVerified) {
            const error = createAuthError(AuthErrorCode.EMAIL_NOT_VERIFIED)
            handleAuthError(error, { ...context, userId: user.id })
            throw new Error(error.userMessage)
          }

          const isPasswordValid = await verifyPassword(password, user.password)

          if (!isPasswordValid) {
            const error = createAuthError(AuthErrorCode.INVALID_CREDENTIALS)
            handleAuthError(error, { ...context, userId: user.id })
            throw new Error(error.userMessage)
          }

          // Log successful login
          logger.auth('Successful login', {
            userId: user.id,
            email: user.email,
            timestamp: new Date().toISOString()
          })

          return {
            id: user.id,
            email: user.email,
            name: user.nickname,
            nickname: user.nickname,
            image: user.image,
          }
        } catch (error) {
          // Re-throw with the structured error message
          if (error instanceof Error) {
            throw error
          }
          
          const authError = createAuthError(AuthErrorCode.INTERNAL_ERROR)
          throw new Error(authError.userMessage)
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
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        token.nickname = user.nickname
      }
      return token
    },
    async session({ session, token }: { session: any; token: JWT }) {
      if (token) {
        session.user.id = token.sub!
        session.user.nickname = token.nickname as string
      }
      return session
    },
  },
  events: {
    async signIn({ user }: { user: any }) {
      // 로그인 이벤트 로깅
      logger.auth('User signed in', { 
        userId: user.id, 
        email: user.email,
        timestamp: new Date().toISOString()
      })
    },
  },
})

