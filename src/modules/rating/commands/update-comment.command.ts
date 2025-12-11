import { Command } from "@nestjs/cqrs"
import { UpdateCommentDto } from "../dtos/update-comment.dto"

export class UpdateCommentCommand extends Command<any> {
  public constructor(
    public readonly userId: string,
    public readonly courseId: string,
    public readonly dto: UpdateCommentDto,
  ) {
    super()
  }
}
