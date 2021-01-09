import { Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiQuery } from "@nestjs/swagger";

import { PaginationQueryDto } from "@app/common/dto/pagination-query.dto";
import { MIPsService } from "./services/mips.service";
import { ParseMIPsService } from "./services/parse-mips.service";

@Controller("mips")
export class MIPsController {
  constructor(
    private readonly mipsService: MIPsService,
    private readonly parseMIPsService: ParseMIPsService
  ) {}

  @Get()
  @ApiQuery({
    name: "limit",
    description: "Default value 10",
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: "offset",
    description: "Default value 0",
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: "order",
    description: `'title -name', means: order property title ASC and name DESC`,
    type: String,
    required: false,
  })
  @ApiQuery({
    name: "search",
    description:
      'The search field treats most punctuation in the string as delimiters, except a hyphen-minus (-) that negates term or an escaped double quotes (\\ ") that specifies a phrase',
    type: String,
    required: false,
  })
  async findAll(
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
    @Query("order") order?: string,
    @Query("search") search?: string
  ) {
    const paginationQueryDto: PaginationQueryDto = {
      limit: +limit || 10,
      offset: +offset,
    };

    const items = await this.mipsService.findAll(
      paginationQueryDto,
      order,
      search
    );
    const total = await this.mipsService.count(search);

    return { items, total };
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.mipsService.findOne(id);
  }

  @Post("callback")
  callback() {
    return this.parseMIPsService.parse();
  }
}
