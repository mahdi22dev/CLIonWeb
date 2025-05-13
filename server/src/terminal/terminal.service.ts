import { Injectable } from '@nestjs/common';
import { CreateTerminalDto } from './dto/create-terminal.dto';
import { UpdateTerminalDto } from './dto/update-terminal.dto';

@Injectable()
export class TerminalService {
  create(createTerminalDto: CreateTerminalDto) {
    return 'This action adds a new terminal ' + createTerminalDto;
  }
}
