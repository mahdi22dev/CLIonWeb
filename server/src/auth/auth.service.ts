import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { FindUserDto } from 'src/users/dto/find-user.dto';
import { Request, Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async signIn(FindUserDto: FindUserDto, response: Response, request: Request) {
    try {
      // find user from config
      const username = 'admin';
      const configUsername = 'admin';

      if (!username) {
        throw new NotFoundException('The username is incorrect.');
      }
      if (username !== configUsername) {
        throw new NotFoundException('The username is incorrect.');
      }

      // check passwords
      const password = 'password';
      const configPassword = 'password';

      if (!password) {
        throw new NotFoundException('Please provide a password.');
      }
      if (password !== configPassword) {
        throw new NotFoundException('The password is incorrect.');
      }

      // jwt
      const payload = { username: username };
      const token = {
        access_token: await this.jwtService.signAsync(payload, {
          expiresIn: '30d',
        }),
      };

      // send token
      if (token.access_token) {
        response.cookie('access_token', token.access_token);
        request['user'] = payload;
        return token;
      } else {
        throw new ServiceUnavailableException("Couldn't autherize user");
      }
    } catch (error) {
      throw error;
    }
  }

  // async signUp(
  //   createAuthDto: CreateAuthDto,
  //   response: Response,
  //   request: Request,
  // ) {
  //   const user = await this.usersService.create(createAuthDto);
  //   if (!user) {
  //     throw new ServiceUnavailableException("Couldn't create the user");
  //   }
  //   const payload = { id: user.id, user: user.username, email: user.email };
  //   const token = {
  //     access_token: await this.jwtService.signAsync(payload, {
  //       expiresIn: '30d',
  //     }),
  //   };
  //   if (token.access_token) {
  //     response.cookie('pastenest_access_token', token.access_token);

  //     return token;
  //   } else {
  //     throw new ServiceUnavailableException("Couldn't autherize the user");
  //   }
  // }

  async verify(request: Request) {
    try {
      const auth_token = request.cookies.pastenest_access_token;
      const user = await this.jwtService.verify(auth_token, {});

      return user;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('User unauthorized');
    }
  }
}
