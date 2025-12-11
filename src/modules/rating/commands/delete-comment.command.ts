import { Command } from "@nestjs/cqrs"

export class DeleteCommentCommand extends Command<any>{
  public constructor(
    public readonly userId: string,
    public readonly courseId: string,
  ) {
    super()
  }
}
