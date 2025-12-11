import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { DeleteCommentCommand } from "../delete-comment.command"
import { RatingRepository } from "../../repositories/rating.repository"
import { plainToInstance } from "class-transformer"
import { CommonResponseDto } from "../../../../dto/common-response.dto"

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentHandler implements ICommandHandler<DeleteCommentCommand> {
  public constructor(
    private readonly ratingRepository: RatingRepository,
  ) {}

  public async execute(command: DeleteCommentCommand): Promise<any> {
    await this.ratingRepository.deleteComment(command.userId, command.courseId)
    return plainToInstance(CommonResponseDto, {
      message: "Komentar berhasil dihapus"
    })
  }
}
