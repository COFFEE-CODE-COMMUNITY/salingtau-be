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
    return !!result;
  }

  public async createComment(
    userId: string,
    courseId: string,
    dto: CreateCommentDto
  ): Promise<Rating> {

    const hasPurchased = await this.transactionRepository.findSuccessPurchase(userId, courseId)

    if (!hasPurchased) {
      throw new Error("User belum membeli course ini");
    }

    const existing = await this.getRepository().findOne({
      where: { userId, courseId },
    });

    if (existing) {
      throw new Error("User sudah pernah memberi rating pada course ini");
    }

    const newRating = this.getRepository().create({
      userId,
      courseId,
      rating: dto.rating,
      comment: dto.comment ?? null
    });

    return await this.getRepository().save(newRating);
  }

  public async updateComment(
    userId: string,
    courseId: string,
    dto: UpdateCommentDto
  ): Promise<Rating> {

    const existing = await this.getRepository().findOne({
      where: { userId, courseId },
    });

    if (!existing) {
      throw new Error("User belum pernah memberi rating");
    }

    existing.rating = dto.rating ?? existing.rating;
    existing.comment = dto.comment ?? existing.comment;

    return await this.getRepository().save(existing);
  }

  public async getComments(userId: string, courseId: string) {
    const repo = this.getRepository();

    const userReview = await repo
      .createQueryBuilder("rating")
      .leftJoin("rating.user", "user")
      .leftJoin("rating.course", "course")
      .select([
        "rating.id",
        "rating.rating",
        "rating.comment",
        "rating.createdAt",

        "user.id",
        "user.firstName",
        "user.lastName",
        "user.profilePictures", // atau photoProfile

        "course.id",
        "course.title",
      ])
      .where("rating.userId = :userId", { userId })
      .andWhere("rating.courseId = :courseId", { courseId })
      .getOne();

    const otherReviews = await repo
      .createQueryBuilder("rating")
      .leftJoin("rating.user", "user")
      .select([
        "rating.id",
        "rating.rating",
        "rating.comment",
        "rating.createdAt",

        "user.id",
        "user.firstName",
        "user.lastName",
        "user.profilePictures",
      ])
      .where("rating.courseId = :courseId", { courseId })
      .andWhere("rating.userId != :userId", { userId })
      .orderBy("rating.createdAt", "DESC")
      .getMany();

    const stats = await this.getRatingStats(courseId);

    return {
      userReview,
      otherReviews,
      stats,
    };
  }

  public async deleteComment(
    userId: string,
    courseId: string
  ): Promise<void> {

    const existing = await this.getRepository().findOne({
      where: { userId, courseId },
    });

    if (!existing) {
      throw new Error("User belum pernah memberi rating");
    }

    await this.getRepository().remove(existing);
  }

  public async getRatingStats(courseId: string) {
    const repo = this.getRepository();

    const raw = await repo
      .createQueryBuilder("rating")
      .select("rating.rating", "star")
      .addSelect("COUNT(*)", "count")
      .where("rating.courseId = :courseId", { courseId })
      .groupBy("rating.rating")
      .getRawMany();

    let totalReview = 0;
    let totalScore = 0;

    type Star = 1 | 2 | 3 | 4 | 5;

    const stars: Record<Star, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    for (const r of raw) {
      const star = Number(r.star) as Star;
      const count = Number(r.count);

      if (star >= 1 && star <= 5) {
        stars[star] = count;
        totalReview += count;
        totalScore += star * count;
      }
    }

    const averageRating =
      totalReview === 0 ? 0 : Number((totalScore / totalReview).toFixed(1));

    const percentage = {
      1: totalReview ? (stars[1] / totalReview) * 100 : 0,
      2: totalReview ? (stars[2] / totalReview) * 100 : 0,
      3: totalReview ? (stars[3] / totalReview) * 100 : 0,
      4: totalReview ? (stars[4] / totalReview) * 100 : 0,
      5: totalReview ? (stars[5] / totalReview) * 100 : 0
    };

    return {
      totalReview,
      averageRating,
      stars,
      percentage
    };
  }

  public async getCourseRatingSummary(courseId: string): Promise<{
    totalRater: number
    averageRating: number
  }> {
    const repo = this.getRepository()

    const raw = await repo
      .createQueryBuilder("rating")
      .select("COUNT(rating.id)", "total")
      .addSelect("AVG(rating.rating)", "average")
      .where("rating.courseId = :courseId", { courseId })
      .getRawOne()

    const totalRater = Number(raw?.total ?? 0)
    const averageRating =
      totalRater === 0
        ? 0
        : Number(Number(raw.average).toFixed(1))

    return {
      totalRater,
      averageRating
    }
  }
}
