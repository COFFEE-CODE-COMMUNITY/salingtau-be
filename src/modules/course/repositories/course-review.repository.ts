import { Injectable } from "@nestjs/common"
import { BaseRepository } from "../../../base/base.repository"
import { CourseReview } from "../entities/course-review.entity"
import { DataSource, EntityManager } from "typeorm"
import { TransactionContextService } from "../../../database/unit-of-work/transaction-context.service"

@Injectable()
export class CourseReviewRepository extends BaseRepository<CourseReview> {
  public constructor(dataSource: DataSource, transactionContextService: TransactionContextService<EntityManager>) {
    super(dataSource, transactionContextService, CourseReview)
  }
}
