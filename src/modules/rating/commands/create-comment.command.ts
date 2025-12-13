import { Command } from "@nestjs/cqrs"
import { CreateCommentDto } from "../dtos/create-comment.dto"

export class CreateCommentCommand extends Command<any> {
  public constructor(
    public readonly userId: string,
    public readonly courseId: string,
    public readonly dto: CreateCommentDto
  ) {
    super()
  }
}
