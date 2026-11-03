import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService, sessionCookie } from './auth.service';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login')
  login(@Body() body: { email?: string; password?: string }, @Req() req: Request) {
    if (!body.email || !body.password) throw new Error('Credenciales requeridas');
    return this.auth.login(body.email, body.password, req.ip);
  }
  @Post('invitations/:token/accept')
  acceptInvitation(@Param('token') token: string, @Body() body: { password?: string }) {
    if (!body.password) throw new Error('Contraseña requerida');
    return this.auth.acceptInvitation(token, body.password);
  }
  @Post('mfa')
  async mfa(@Body() body: { challenge?: string; code?: string }, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (!body.challenge || !body.code) throw new Error('Código MFA requerido');
    const token = await this.auth.completeMfa(body.challenge, body.code, req.ip);
    res.cookie(sessionCookie, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 28800000 });
    return { ok: true };
  }
  @Post('mfa/confirm-setup')
  async confirmSetup(@Body() body: { challenge?: string; code?: string }, @Res({ passthrough: true }) res: Response) {
    if (!body.challenge || !body.code) throw new Error('Código MFA requerido');
    const result = await this.auth.confirmMfaChallenge(body.challenge, body.code);
    res.cookie(sessionCookie, result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 28800000 });
    return { ok: true, recoveryCodes: result.codes };
  }
  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    if (req.cookies?.[sessionCookie]) await this.auth.logout(req.cookies[sessionCookie]);
    res.clearCookie(sessionCookie, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
    return { ok: true };
  }
  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    const safe = { ...req.user };
    delete safe.passwordHash;
    delete safe.mfaSecret;
    return safe;
  }
  @UseGuards(AuthGuard)
  @Post('mfa/setup')
  setup(@Req() req: AuthenticatedRequest) { return this.auth.setupMfa(req.user.id); }
  @UseGuards(AuthGuard)
  @Post('mfa/confirm')
  confirm(@Req() req: AuthenticatedRequest, @Body() body: { code?: string }) {
    if (!body.code) throw new Error('Código MFA requerido'); return this.auth.confirmMfa(req.user.id, body.code);
  }
}
