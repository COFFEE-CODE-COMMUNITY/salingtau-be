import { Injectable } from "@nestjs/common"
import { BaseRepository } from "../../../base/base.repository"
import { Transaction } from "../entities/transaction.entity"
import { DataSource, EntityManager } from "typeorm"
import { TransactionContextService } from "../../../database/unit-of-work/transaction-context.service"
import { PaymentStatus } from "../enums/payment-status.enum"

@Injectable()
export class TransactionRepository extends BaseRepository<Transaction> {
  public constructor(dataSource: DataSource, transactionContextService: TransactionContextService<EntityManager>) {
    super(dataSource, transactionContextService, Transaction)
  }

  public async findByTransactionId(transactionId: string): Promise<Transaction | null> {
    return this.getRepository().findOne({
      where: { transactionId },
      relations: {
        user: true,
        course: true
      }
    })
  }

  public async findByUserId(userId: string): Promise<Transaction[]> {
    return this.getRepository().find({
      where: { user: { id: userId } },
      relations: {
        user: true,
        course: true
      },
      order: {
        createdAt: "DESC"
      }
    })
  }

  public async findByInstructorId(userId: string): Promise<Transaction[]> {
    return this.getRepository().find({
      where: {
        course: {
          instructor: { id: userId }
        }
      },
      relations: {
        user: true, // student / buyer
        course: {
          instructor: true // seller
        }
      },
      order: {
        createdAt: "DESC"
      }
    })
  }

  public async findSuccessPurchase(userId: string, courseId: string) {
    return this.getRepository().findOne({
      where: {
        user: { id: userId },
        course: { id: courseId },
        status: PaymentStatus.COMPLETED
      }
    })
  }

  public async getRatingSummaryByCourseIds(courseIds: string[]) {
    if (courseIds.length === 0) return []

    return this.getRepository()
      .createQueryBuilder("transaction")
      .innerJoin("transaction.course", "course")
      .leftJoin("course.ratings", "rating")
      .select("course.id", "courseId")
      .addSelect("COUNT(rating.id)", "totalReviews")
      .addSelect("COALESCE(AVG(rating.rating), 0)", "averageRating")
      .where("course.id IN (:...courseIds)", { courseIds })
      .groupBy("course.id")
      .getRawMany()
  }
}
