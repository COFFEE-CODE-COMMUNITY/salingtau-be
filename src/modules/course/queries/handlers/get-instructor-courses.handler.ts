import { IQueryHandler, QueryHandler } from "@nestjs/cqrs"
import { GetInstructorCoursesQuery } from "../get-instructor-courses.query"
import { PaginationDto } from "../../../../dto/pagination.dto"
import { CourseDto } from "../../dto/course.dto"
import { Pagination } from "../../../../utils/pagination.util"
import { Course } from "../../entities/course.entity"
import { PaginationFactory } from "../../../../factories/pagination.factory"
import { FindOptionsOrder, FindOptionsWhere, ILike } from "typeorm"
import { CourseSortBy } from "../../enums/course-sort-by.enum"
import { SortOrder } from "../../../../enums/sort-order"

@QueryHandler(GetInstructorCoursesQuery)
export class GetInstructorCoursesHandler implements IQueryHandler<GetInstructorCoursesQuery> {
  private readonly pagination: Pagination<Course, CourseDto>

  public constructor(paginationFactory: PaginationFactory) {
    this.pagination = paginationFactory.create(Course, CourseDto)
  }

  public async execute(query: GetInstructorCoursesQuery): Promise<PaginationDto<CourseDto>> {
    const { limit, offset, instructorId } = query
    let where: Array<FindOptionsWhere<Course>> = [
      {
        instructor: { id: instructorId }
      }
    ]
    let order: FindOptionsOrder<Course> = {}

    if (query.search) {
      where = where.concat([{ title: ILike(`%${query.search}%`) }, { description: ILike(`%${query.search}%`) }])
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

    return this.pagination.paginate(offset, limit, {
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
  }
}
