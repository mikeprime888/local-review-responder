import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/business.manage',
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('Invalid email or password');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user) {
        try {
          await prisma.account.updateMany({
            where: {
              userId: user.id,
              provider: 'google',
            },
            data: {
              access_token: account.access_token,
              refresh_token: account.refresh_token || undefined,
              expires_at: account.expires_at,
              token_type: account.token_type,
              id_token: account.id_token,
            },
          });
        } catch (error) {
          console.log('Token update on sign-in (may be first login):', error);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getGoogleTokens(userId: string) {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'google',
    },
  });

  if (!account) {
    throw new Error('No Google account linked');
  }

  return {
    accessToken: account.access_token,
    refreshToken: account.refresh_token,
    expiresAt: account.expires_at,
  };
}

export async function getValidAccessToken(userId: string): Promise<string> {
  const tokens = await getGoogleTokens(userId);

  if (!tokens.accessToken) {
    throw new Error('No access token available. Please re-authenticate.');
  }

  const now = Math.floor(Date.now() / 1000);
  const isExpired = tokens.expiresAt && (tokens.expiresAt - 300) < now;

  if (isExpired && tokens.refreshToken) {
    console.log('Access token expired, refreshing...');
    
    try {
      const { refreshAccessToken } = await import('./google-business');
      const newTokens = await refreshAccessToken(tokens.refreshToken);

      await prisma.account.updateMany({
        where: {
          userId,
          provider: 'google',
        },
        data: {
          access_token: newTokens.access_token,
          expires_at: Math.floor(Date.now() / 1000) + newTokens.expires_in,
        },
      });

      return newTokens.access_token;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw new Error('Token refresh failed. Please re-authenticate.');
    }
  }

  return tokens.accessToken;
}
