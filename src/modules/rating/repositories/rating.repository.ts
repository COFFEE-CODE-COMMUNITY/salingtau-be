import { Injectable } from "@nestjs/common"
import { BaseRepository } from "../../../base/base.repository"
import { DataSource, EntityManager, Not } from "typeorm"
import { TransactionContextService } from "../../../database/unit-of-work/transaction-context.service"
import { Rating } from "../entities/rating"
import { TransactionRepository } from "../../transaction/repositories/transaction.repository"
import { CreateCommentDto } from "../dtos/create-comment.dto"
import { UpdateCommentDto } from "../dtos/update-comment.dto"

@Injectable()
export class RatingRepository extends BaseRepository<Rating> {
  public constructor(
    private readonly transactionRepository: TransactionRepository,
    dataSource: DataSource,
    transactionContextService: TransactionContextService<EntityManager>
  ) {
    super(dataSource, transactionContextService, Rating)
  }

  public async purchaseStatus(userId: string, courseId: string): Promise<boolean> {
    const result = await this.transactionRepository.findSuccessPurchase(userId, courseId)
    return !!result
  }

  public async createComment(userId: string, courseId: string, dto: CreateCommentDto): Promise<Rating> {
    const hasPurchased = await this.transactionRepository.findSuccessPurchase(userId, courseId)

    if (!hasPurchased) {
      throw new Error("User belum membeli course ini")
    }

    const existing = await this.getRepository().findOne({
      where: { userId, courseId }
    })

    if (existing) {
      throw new Error("User sudah pernah memberi rating pada course ini")
    }

    const newRating = this.getRepository().create({
      userId,
      courseId,
      rating: dto.rating,
      comment: dto.comment ?? null
    })

    return await this.getRepository().save(newRating)
  }

  public async updateComment(userId: string, courseId: string, dto: UpdateCommentDto): Promise<Rating> {
    const existing = await this.getRepository().findOne({
      where: { userId, courseId }
    })

    if (!existing) {
      throw new Error("User belum pernah memberi rating")
    }

    existing.rating = dto.rating ?? existing.rating
    existing.comment = dto.comment ?? existing.comment

    return await this.getRepository().save(existing)
  }

  public async getComments(userId: string, courseId: string) {
    const repo = this.getRepository()

    const userReview = await repo.findOne({
      where: { courseId, userId }
    })

    const otherReviews = await repo.find({
      where: {
        courseId,
        userId: Not(userId)
      },
      order: { createdAt: "DESC" }
    })

    return {
      userReview,
      otherReviews
    }
  }

  public async deleteComment(userId: string, courseId: string): Promise<void> {
    const existing = await this.getRepository().findOne({
      where: { userId, courseId }
    })

    if (!existing) {
      throw new Error("User belum pernah memberi rating")
    }

    await this.getRepository().remove(existing)
  }
}
