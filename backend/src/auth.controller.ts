import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { AuthService, sessionCookie } from './auth.service';
import { AllowDuringPasswordChange } from './authorization/authorization.decorators';
import {
  AcceptInvitationDto,
  ChangePasswordDto,
  ConfirmMfaDto,
  InitialPasswordDto,
  LoginDto,
  MfaVerifyDto,
  SetupMfaDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private setSessionCookie(res: Response, token: string) {
    res.cookie(sessionCookie, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: this.auth.getSessionMaxMs(),
    });
  }

  private clearSessionCookie(res: Response) {
    res.clearCookie(sessionCookie, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }

  @Post('login')
  login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return this.auth.login(body.email, body.password, req.ip);
  }

  @Post('invitations/:token/accept')
  acceptInvitation(
    @Param('token') token: string,
    @Body() body: AcceptInvitationDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return this.auth.acceptInvitation(token, body.password, req.ip);
  }

  @Post('mfa')
  async mfa(
    @Body() body: MfaVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    const token = await this.auth.completeMfa(body.challenge, body.code, req.ip);
    this.setSessionCookie(res, token);
    return { ok: true };
  }

  @Post('mfa/confirm-setup')
  async confirmSetup(
    @Body() body: MfaVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    const result = await this.auth.confirmMfaChallenge(body.challenge, body.code, req.ip);
    this.setSessionCookie(res, result.token);
    return { ok: true, recoveryCodes: result.codes };
  }

  @UseGuards(AuthGuard)
  @AllowDuringPasswordChange()
  @Post('logout')
  async logout(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.cookies?.[sessionCookie]) {
      await this.auth.logout(req.cookies[sessionCookie], req.user?.id ?? null, req.ip);
    }
    this.clearSessionCookie(res);
    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @AllowDuringPasswordChange()
  @Post('password')
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() body: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    if (body.newPassword !== body.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }
    const result = await this.auth.changePassword(
      req.user!.id!,
      body.currentPassword,
      body.newPassword,
      req.ip,
    );
    this.setSessionCookie(res, result.token);
    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @AllowDuringPasswordChange()
  @Post('password/initial')
  async setInitialPassword(
    @Req() req: AuthenticatedRequest,
    @Body() body: InitialPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    if (body.newPassword !== body.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }
    const token = req.cookies?.[sessionCookie];
    if (!token) throw new BadRequestException('Sesión no válida');
    const result = await this.auth.setInitialPassword(
      req.user!.id!,
      body.newPassword,
      token,
      req.ip,
    );
    this.setSessionCookie(res, result.token);
    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @AllowDuringPasswordChange()
  @Get('me')
  me(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    return this.auth.buildMePayload(req.user!);
  }

  @UseGuards(AuthGuard)
  @AllowDuringPasswordChange()
  @Post('mfa/setup')
  setup(
    @Req() req: AuthenticatedRequest,
    @Body() body: SetupMfaDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return this.auth.setupMfa(req.user!.id!, body?.currentPassword, req.ip);
  }

  @UseGuards(AuthGuard)
  @AllowDuringPasswordChange()
  @Post('mfa/confirm')
  confirm(
    @Req() req: AuthenticatedRequest,
    @Body() body: ConfirmMfaDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return this.auth.confirmMfa(req.user!.id!, body.code, req.ip);
  }
}
