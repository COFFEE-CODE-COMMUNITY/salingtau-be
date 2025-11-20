import { Injectable } from "@nestjs/common"
import { BaseRepository } from "../../../base/base.repository"
import { Course } from "../../course/entities/course.entity"
import { DataSource, EntityManager, FindOptionsWhere } from "typeorm"
import { TransactionContextService } from "../../../database/unit-of-work/transaction-context.service"
import { isUUID } from "class-validator"
import { CourseStatus } from "../../course/enums/course-status.enum"

@Injectable()
export class AdminRepository extends BaseRepository<Course> {
  public constructor(dataSource: DataSource, transactionContextService: TransactionContextService<EntityManager>) {
    super(dataSource, transactionContextService, Course)
  }

  public async findByIdOrSlug(idOrSlug: string): Promise<Course | null> {
    let where: FindOptionsWhere<Course>

    if (isUUID(idOrSlug)) {
      where = { id: idOrSlug }
    } else {
      where = { slug: idOrSlug }
    }

    return this.getRepository().findOne({
      where,
      relations: {
        instructor: true,
        category: true
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        language: true,
        price: true,
        thumbnail: true,
        status: true,
        averageRating: true,
        totalReviews: true,
        createdAt: true,
        updatedAt: true
      }
    })
  }

  public async findByStatusReview(): Promise<Course[]> {
    return this.getRepository().find({
      where: {
        status: CourseStatus.REVIEW
      },
      relations: {
        instructor: true,
        category: true
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        language: true,
        price: true,
        thumbnail: true,
        status: true,
        averageRating: true,
        totalReviews: true,
        createdAt: true,
        updatedAt: true
      },
      order: {
        createdAt: "DESC"
      }
    })
  }
}
