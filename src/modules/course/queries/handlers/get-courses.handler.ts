import { IQueryHandler, QueryHandler } from "@nestjs/cqrs"
import { GetCoursesQuery } from "../get-courses.query"
import { PaginationDto } from "../../../../dto/pagination.dto"
import { CourseDto } from "../../dto/course.dto"
import { Course } from "../../entities/course.entity"
import { PaginationFactory } from "../../../../factories/pagination.factory"
import { Pagination } from "../../../../utils/pagination.util"
import { CourseSortBy } from "../../enums/course-sort-by.enum"
import { SortOrder } from "../../../../enums/sort-order"
import { FindOptionsOrder, FindOptionsWhere, ILike } from "typeorm"
import { CourseRepository } from "../../repositories/course.repository"

@QueryHandler(GetCoursesQuery)
export class GetCoursesHandler implements IQueryHandler<GetCoursesQuery> {
  private readonly pagination: Pagination<Course, CourseDto>

  public constructor(
    paginationFactory: PaginationFactory,
    private readonly courseRepository: CourseRepository,
  ) {
    this.pagination = paginationFactory.create(Course, CourseDto)
  }

  public async execute(query: GetCoursesQuery): Promise<PaginationDto<CourseDto>> {
    const { limit, offset } = query
    let where: Array<FindOptionsWhere<Course>> = []
    let order: FindOptionsOrder<Course> = {}

    if (query.search) {
      where = [{ title: ILike(`%${query.search}%`) }, { description: ILike(`%${query.search}%`) }]
    }

    switch (query.sortBy) {
      case CourseSortBy.NAME:
        order = { title: query.sortOrder === SortOrder.ASCENDING ? "ASC" : "DESC" }
        break
      case CourseSortBy.PRICE:
        order = { price: query.sortOrder === SortOrder.ASCENDING ? "ASC" : "DESC" }
        break
      case CourseSortBy.RATING:
        order = { averageRating: query.sortOrder === SortOrder.ASCENDING ? "ASC" : "DESC" }
        break
      case CourseSortBy.OLDEST:
        order = { createdAt: query.sortOrder === SortOrder.ASCENDING ? "ASC" : "DESC" }
        break
      case CourseSortBy.NEWEST:
      default:
        order = { createdAt: query.sortOrder === SortOrder.ASCENDING ? "DESC" : "ASC" }
        break
    }

    const result = await this.pagination.paginate(offset, limit, {
      where,
      order,
      relations: { instructor: true, category: true },
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

    const courseIds = result.data.map(course => course.id)
    const rawRatings = await this.courseRepository.getRatingSummaryByCourseIds(courseIds)

    const ratingMap = new Map(
      rawRatings.map(r => [
        r.courseId,
        {
          totalReviews: Number(r.totalReviews),
          averageRating: Number(Number(r.averageRating).toFixed(1))
        }
      ])
    )

    for (const course of result.data) {
      const rating = ratingMap.get(course.id)

      course.averageRating = rating?.averageRating ?? 0
      course.totalReviews = rating?.totalReviews ?? 0
    }

    return result
  }
}
