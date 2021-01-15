import { IsOptional, IsPositive } from "class-validator";

export class PaginationQueryDto {
  @IsOptional()
  @IsPositive()
  limit: number;

  @IsOptional()
  @IsPositive()
  offset: number;
}

export class Filters {
  contains?: BinaryOperator[];
  notcontains?: BinaryOperator[];
  equals?: BinaryOperator[];
  notequals?: BinaryOperator[];
}

export class BinaryOperator {
  field: string;
  value: any;
}
