import { CommandBus, QueryBus } from "@nestjs/cqrs"
import { ApiTags } from "@nestjs/swagger"
import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common"
import { UserId } from "../../../http/user-id.decorator"
import { PurchaseStatusCheckQuery } from "../queries/purchase-status-check.query"
import { CreateCommentCommand } from "../commands/create-comment.command"
import { CreateCommentDto } from "../dtos/create-comment.dto"
import { UpdateCommentDto } from "../dtos/update-comment.dto"
import { UpdateCommentCommand } from "../commands/update-comment.command"
import { GetCommentQuery } from "../queries/get-comment.query"
import { DeleteCommentCommand } from "../commands/delete-comment.command"


@ApiTags("Rating")
@Controller("rating")
export class RatingController {
  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Get(":courseId/purchase-status")
  public async getByStatus(
    @UserId() userId: string,
    @Param("courseId") courseId: string,
  ): Promise<boolean> {
    return await this.queryBus.execute(new PurchaseStatusCheckQuery(userId, courseId))
  }

  @Post(":courseId")
  public async createComment(
    @UserId() userId: string,
    @Param("courseId") courseId: string,
    @Body() body: CreateCommentDto,
  ): Promise<any> {
    return await this.commandBus.execute(new CreateCommentCommand(userId, courseId, body))
  }

  @Patch(":courseId")
  public async updateComment(
    @UserId() userId: string,
    @Param("courseId") courseId: string,
    @Body() body: UpdateCommentDto,
  ): Promise<any> {
    return await this.commandBus.execute(new UpdateCommentCommand(userId, courseId, body))
  }

  @Get(":courseId")
  public async getComments(
    @UserId() userId: string,
    @Param("courseId") courseId: string,
  ): Promise<any> {
    return await this.queryBus.execute(new GetCommentQuery(userId, courseId))
  }

  @Delete(":courseId")
  public async deleteComment(
    @UserId() userId: string,
    @Param("courseId") courseId: string,
  ): Promise<any> {
    return await this.commandBus.execute(new DeleteCommentCommand(userId, courseId))
  }
}
