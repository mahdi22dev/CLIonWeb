import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  Req,
  Res,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto, CreateAuthDtoSchema } from './dto/create-auth.dto';
import { ZodValidationPipe } from 'src/lib/pipes/pipes';
import { FindUserDto, FindUserSchema } from 'src/users/dto/find-user.dto';
import { LoggingInterceptor } from 'src/interceptor/logging.interceptor';
import { Request, Response } from 'express';

@UseInterceptors(LoggingInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.ACCEPTED)
  @Post('signin')
  async signIn(
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
    @Body(new ZodValidationPipe(FindUserSchema))
    FindUserDto: FindUserDto,
  ) {
    return this.authService.signIn(FindUserDto, response, request);
  }

  @HttpCode(HttpStatus.ACCEPTED)
  @Get('verify')
  async verify(@Req() request: Request) {
    return this.authService.verify(request);
  }

  @HttpCode(HttpStatus.ACCEPTED)
  @Get('logout')
  async Logout(@Res({ passthrough: true }) response: Response) {
    return this.authService.logOut(response);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  async signUp(
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
    @Body(new ZodValidationPipe(CreateAuthDtoSchema))
    createAuthDto: CreateAuthDto,
  ) {
    return await this.authService.signUp(createAuthDto, response, request);
  }
}
