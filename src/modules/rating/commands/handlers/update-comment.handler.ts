import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { RatingRepository } from "../../repositories/rating.repository"
import { UpdateCommentCommand } from "../update-comment.command"

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentHandler implements ICommandHandler<UpdateCommentCommand> {
  public constructor(
    private readonly ratingRepository: RatingRepository
  ) {}

  public async execute(command: UpdateCommentCommand): Promise<any> {
    return this.ratingRepository.updateComment(command.userId, command.courseId ,command.dto)
  }
}
