import { IQueryHandler, QueryHandler } from "@nestjs/cqrs"
import { GetCommentQuery } from "../get-comment.query"
import { RatingRepository } from "../../repositories/rating.repository"

@QueryHandler(GetCommentQuery)
export class GetCommentHandler implements IQueryHandler<GetCommentQuery> {
  public constructor(
    private readonly ratingRepository: RatingRepository,
  ) {}

  public async execute(query: GetCommentQuery): Promise<any> {
    return this.ratingRepository.getComments(query.userId, query.courseId)
  }
}
