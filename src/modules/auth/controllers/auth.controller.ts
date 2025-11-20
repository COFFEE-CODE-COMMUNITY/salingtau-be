import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Res } from "@nestjs/common"
import { RegisterDto } from "../dto/register.dto"
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse
} from "@nestjs/swagger"
import { CommonResponseDto } from "../../../dto/common-response.dto"
import { RegisterBadRequestResponseDto } from "../dto/register-bad-request-response.dto"
import { LoginDto } from "../dto/login.dto"
import { TokensDto } from "../dto/tokens.dto"
import { PasswordResetBadRequestDto } from "../dto/password-reset-bad-request.dto"
import { GoogleAuthResponseDto } from "../dto/google-auth-response.dto"
import { CommandBus, QueryBus } from "@nestjs/cqrs"
import { RegisterCommand } from "../commands/register.command"
import { LoginCommand } from "../commands/login.command"
import { IpAddress } from "../../../http/ip-address.decorator"
import { CookieOptions, Response } from "express"
import { ConfigService } from "@nestjs/config"
import { NodeEnv } from "../../../enums/node-env"
import { REFRESH_TOKEN_COOKIE_NAME } from "../constants/cookie-name.constant"
import { RequiredHeader } from "../../../http/required-header.decorator"
import { GetGoogleAuthUrlQuery } from "../queries/get-google-auth-url.query"
import { GoogleOAuth2CallbackCommand } from "../commands/google-oauth2-callback.command"
import { OAuth2Provider } from "../enums/oauth2-provider.enum"
import { PasswordResetCommand } from "../commands/password-reset.command"
import { PasswordResetDto } from "../dto/password-reset.dto"
import { ChangePasswordDto } from "../dto/change-password.dto"
import { ChangePasswordCommand } from "../commands/change-password.command"
import { GetRefreshTokenCommand } from "../commands/get-refresh-token.command"
import { Cookie } from "../../../http/cookie.decorator"
import { LogoutCommand } from "../commands/logout.command"
import { ChangePasswordBadRequestResponseDto } from "../dto/change-password-bad-request-response.dto"
import { REFRESH_TOKEN_EXPIRES_MS } from "../constants/auth.constant"
import { OAuth2Platform } from "../services/oauth2-service"

export interface OAuth2CallbackResult {
  platform: "web"
  refreshToken?: string
}

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  public constructor(
    private readonly config: ConfigService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post("register")
  @ApiOperation({
    summary: "Register a new user",
    description: "Creates a new user account with the provided username, email, and password"
  })
  @ApiCreatedResponse({
    description: "User successfully registered",
    type: CommonResponseDto
  })
  @ApiBadRequestResponse({
    description: "Invalid input data",
    type: RegisterBadRequestResponseDto
  })
  public async register(@Body() body: RegisterDto): Promise<CommonResponseDto> {
    return this.commandBus.execute(new RegisterCommand(body))
  }

  @Post("login")
  @ApiOperation({
    summary: "Login user",
    description: "Login user account with the provided email and password"
  })
  @ApiOkResponse({
    description: "User successfully login",
    type: CommonResponseDto
  })
  @ApiBadRequestResponse({
    description: "Missing required header.",
    type: CommonResponseDto
  })
  @ApiUnauthorizedResponse({
    description: "User unauthorized.",
    type: CommonResponseDto
  })
  @ApiUnprocessableEntityResponse({
    description: "User must login using OAuth2.",
    type: CommonResponseDto
  })
  @HttpCode(HttpStatus.OK)
  public async login(
    @Body() body: LoginDto,
    @RequiredHeader("User-Agent") userAgent: string,
    @IpAddress() ipAddress: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<TokensDto> {
    const tokens = await this.commandBus.execute(new LoginCommand(body, userAgent, ipAddress))

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, this.getSetCookieOptions())

    return tokens
  }

  @Post("logout")
  @ApiOperation({
    summary: "Logout user",
    description: "Logout user and revoke the refresh token."
  })
  @ApiOkResponse({
    description: "User successfully logged out.",
    type: CommonResponseDto
  })
  @ApiBadRequestResponse({
    description: "Missing required header.",
    type: CommonResponseDto
  })
  @ApiUnauthorizedResponse({
    description: "User unauthorized.",
    type: CommonResponseDto
  })
  @HttpCode(HttpStatus.OK)
  public async logout(
    @RequiredHeader("User-Agent") userAgent: string,
    @IpAddress() ipAddress: string,
    @Cookie(REFRESH_TOKEN_COOKIE_NAME) refreshToken: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<CommonResponseDto> {
    const result = await this.commandBus.execute(new LogoutCommand(refreshToken, userAgent, ipAddress))
    this.clearRefreshTokenCookie(res)
    return result
  }

  @Get("refresh-token")
  @ApiOperation({
    summary: "Refresh token.",
    description: "This endpoint refreshes the access token using the refresh token."
  })
  @ApiOkResponse({
    type: TokensDto,
    description: "The access token has been refreshed successfully."
  })
  @ApiUnauthorizedResponse({
    type: CommonResponseDto,
    description: "The user is not authorized to perform this action."
  })
  public async refreshToken(
    @RequiredHeader("User-Agent") _userAgent: string,
    @IpAddress() ipAddress: string,
    @Cookie(REFRESH_TOKEN_COOKIE_NAME) refreshToken: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<TokensDto> {
    const tokens = await this.commandBus.execute(new GetRefreshTokenCommand(refreshToken, _userAgent, ipAddress))

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, this.getSetCookieOptions())

    return tokens
  }

  @Post("/password-reset")
  @ApiOperation({
    summary: "Request password reset",
    description: "This endpoint sends a password reset email to the user."
  })
  @ApiOkResponse({
    type: CommonResponseDto,
    description: "The password reset email has been sent successfully."
  })
  @ApiBadRequestResponse({
    type: PasswordResetBadRequestDto,
    description: "The request body is invalid."
  })
  @HttpCode(HttpStatus.OK)
  public async passwordReset(@Body() dto: PasswordResetDto): Promise<CommonResponseDto> {
    return await this.commandBus.execute(new PasswordResetCommand(dto))
  }

  @Post("/password-reset/change")
  @ApiOperation({
    summary: "Request change password",
    description: "This endpoint change a password reset to the user."
  })
  @ApiOkResponse({
    type: CommonResponseDto,
    description: "The change password email has been sent successfully."
  })
  @ApiBadRequestResponse({
    type: ChangePasswordBadRequestResponseDto,
    description: "The request body is invalid."
  })
  @ApiUnauthorizedResponse({
    type: CommonResponseDto,
    description: "Invalid session token or expired."
  })
  @HttpCode(HttpStatus.OK)
  public async changePassword(
    @Query("token") token: string,
    @Body() dto: ChangePasswordDto
  ): Promise<CommonResponseDto> {
    return this.commandBus.execute(new ChangePasswordCommand(dto, token))
  }

  @Get("/google")
  @ApiOperation({
    summary: "Get Google OAuth2 URL",
    description: "This endpoint returns the Google OAuth2 URL for authentication."
  })
  @ApiOkResponse({
    type: GoogleAuthResponseDto,
    description: "The Google OAuth2 URL has been retrieved successfully."
  })
  public async googleAuth(): Promise<GoogleAuthResponseDto> {
    return this.queryBus.execute(new GetGoogleAuthUrlQuery(OAuth2Platform.WEB))
  }

  @Get("/google/callback")
  @ApiOperation({
    summary: "Handle Google authentication redirect",
    description: "This endpoint handles the redirect from Google after the user has authenticated."
  })
  public async googleAuthCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @RequiredHeader("User-Agent") userAgent: string,
    @IpAddress() ipAddress: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<void> {
    const result = await this.commandBus.execute(new GoogleOAuth2CallbackCommand(code, state, userAgent, ipAddress))

    this.handleOAuth2CallbackResponse(OAuth2Provider.GOOGLE, result, res)
  }

  private getSetCookieOptions(): CookieOptions {
    return {
      domain: this.config.get("client.web.domain", "localhost"),
      httpOnly: true,
      maxAge: REFRESH_TOKEN_EXPIRES_MS,
      sameSite: this.config.get("NODE_ENV") === NodeEnv.PRODUCTION ? "none" : "strict",
      secure: this.config.get("NODE_ENV") === NodeEnv.PRODUCTION,
      path: "/"
    }
  }

  private handleOAuth2CallbackResponse(provider: OAuth2Provider, result: OAuth2CallbackResult, res: Response): void {
    const searchParams = new URLSearchParams({
      success: "true",
      provider
    })

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, this.getSetCookieOptions())
    res.redirect(`${this.config.getOrThrow("client.web.oauth2Redirect")}?${searchParams.toString()}`)

    res.status(500).send("Platform is not supported")
  }

  private clearRefreshTokenCookie(response: Response): void {
    response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      domain: this.config.get("client.web.domain", "localhost"),
      path: "/",
      httpOnly: true,
      sameSite: this.config.get("app.nodeEnv") === NodeEnv.PRODUCTION ? "none" : "strict",
      secure: this.config.get("app.nodeEnv") === NodeEnv.PRODUCTION
      // sameSite: "lax",
      // secure: false
    })
  }
}
