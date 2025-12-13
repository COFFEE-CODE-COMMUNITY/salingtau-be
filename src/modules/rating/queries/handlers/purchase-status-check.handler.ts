import { IQueryHandler, QueryHandler } from "@nestjs/cqrs"
import { PurchaseStatusCheckQuery } from "../purchase-status-check.query"
import { RatingRepository } from "../../repositories/rating.repository"

@QueryHandler(PurchaseStatusCheckQuery)
export class PurchaseStatusCheckHandler implements IQueryHandler<PurchaseStatusCheckQuery> {
  public constructor(private readonly ratingRepository: RatingRepository) {}

  public async execute(command: PurchaseStatusCheckQuery): Promise<boolean> {
    return await this.ratingRepository.purchaseStatus(command.userId, command.courseId)
  }
}
