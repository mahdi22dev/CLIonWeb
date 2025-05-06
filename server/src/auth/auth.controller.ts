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
import { Request, Response } from 'express';

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
    console.log(FindUserDto);

    return this.authService.signIn(FindUserDto, response, request);
  }

  @HttpCode(HttpStatus.ACCEPTED)
  @Get('verify')
  async verify(@Req() request: Request) {
    return this.authService.verify(request);
  }

  // @HttpCode(HttpStatus.CREATED)
  // @Post('signup')
  // async signUp(
  //   @Res({ passthrough: true }) response: Response,
  //   @Req() request: Request,
  //   @Body(new ZodValidationPipe(CreateAuthDtoSchema))
  //   createAuthDto: CreateAuthDto,
  // ) {
  //   return await this.authService.signUp(createAuthDto, response, request);
  // }
}
