import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Request GBP API access + offline access for refresh tokens
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/business.manage',
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',  // Force consent to always get refresh_token
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Store tokens in the database when user signs in
      if (account && user) {
        try {
          // Update the account record with fresh tokens
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
          // On first sign-in, the adapter creates the account,
          // so updateMany may not find it yet - that's OK
          console.log('Token update on sign-in (may be first login):', error);
        }
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'database',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// ============================================
// Helper: Get Google tokens for a user
// ============================================
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

/**
 * Get a valid access token for a user, refreshing if needed
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const tokens = await getGoogleTokens(userId);

  if (!tokens.accessToken) {
    throw new Error('No access token available. Please re-authenticate.');
  }

  // Check if token is expired (with 5 min buffer)
  const now = Math.floor(Date.now() / 1000);
  const isExpired = tokens.expiresAt && (tokens.expiresAt - 300) < now;

  if (isExpired && tokens.refreshToken) {
    console.log('Access token expired, refreshing...');
    
    try {
      const { refreshAccessToken } = await import('./google-business');
      const newTokens = await refreshAccessToken(tokens.refreshToken);

      // Update tokens in database
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
