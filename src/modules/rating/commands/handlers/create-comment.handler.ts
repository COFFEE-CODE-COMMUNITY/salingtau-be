import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { CreateCommentCommand } from "../create-comment.command"
import { RatingRepository } from "../../repositories/rating.repository"

@CommandHandler(CreateCommentCommand)
export class CreateCommentHandler implements ICommandHandler<CreateCommentCommand> {
  public constructor(
    private readonly ratingRepository: RatingRepository
  ) {}

  public async execute(command: CreateCommentCommand): Promise<any> {
    return this.ratingRepository.createComment(command.userId, command.courseId, command.dto)
  }
}
