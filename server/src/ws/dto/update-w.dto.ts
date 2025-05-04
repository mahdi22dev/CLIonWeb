import { PartialType } from '@nestjs/mapped-types';
import { CreateWDto } from './create-w.dto';

export class UpdateWDto extends PartialType(CreateWDto) {
  id: number;
}
