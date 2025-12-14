import { Injectable } from "@nestjs/common"
import { BaseRepository } from "../../../base/base.repository"
import { Course } from "../entities/course.entity"
import { DataSource, EntityManager, FindOptionsWhere } from "typeorm"
import { TransactionContextService } from "../../../database/unit-of-work/transaction-context.service"
import { isUUID } from "class-validator"

@Injectable()
export class CourseRepository extends BaseRepository<Course> {
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
        category: true,
        sections: {
          lectures: {
            article: true,
            video: true,
            file: true,
            external: true
          }
        }
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
        sections: {
          displayOrder: "ASC",
          lectures: {
            displayOrder: "ASC"
          }
        }
      }
    })
  }

  public async deleteByInstructor(courseId: string, instructorId: string): Promise<void> {
    await this.getRepository()
      .createQueryBuilder()
      .delete()
      .where("id = :courseId", { courseId })
      .andWhere("instructorId = :instructorId", { instructorId })
      .execute()
  }
}
