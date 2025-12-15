import { IQueryHandler, QueryHandler } from "@nestjs/cqrs"
import { GetAllCourseByFlagsQuery } from "../get-all-course-by-flags.query"
import { PaginationDto } from "../../../../dto/pagination.dto"
import { CourseDto } from "../../../course/dto/course.dto"
import { Course } from "../../../course/entities/course.entity"
import { PaginationFactory } from "../../../../factories/pagination.factory"
import { Pagination } from "../../../../utils/pagination.util"
import { CourseSortBy } from "../../../course/enums/course-sort-by.enum"
import { SortOrder } from "../../../../enums/sort-order"
import { FindOptionsOrder, FindOptionsWhere, ILike, Not, In } from "typeorm"
import { TransactionRepository } from "../../repositories/transaction.repository"

@QueryHandler(GetAllCourseByFlagsQuery)
export class GetAllCourseByFlagsHandler
  implements IQueryHandler<GetAllCourseByFlagsQuery>
{
  private readonly pagination: Pagination<Course, CourseDto>

  public constructor(
    paginationFactory: PaginationFactory,
    private readonly transactionRepository: TransactionRepository
  ) {
    this.pagination = paginationFactory.create(Course, CourseDto)
  }

  public async execute(
    query: GetAllCourseByFlagsQuery
  ): Promise<PaginationDto<CourseDto>> {
    const { userId, flags, limit, offset, search, sortBy, sortOrder } = query

    let where: Array<FindOptionsWhere<Course>> = []
    let order: FindOptionsOrder<Course> = {}

    const transactions = await this.transactionRepository.findByUserId(userId)
    const purchasedCourseIds = [
      ...new Set(transactions.map(t => t.course.id))
    ]

    if (flags) {
      // user SUDAH beli
      const baseWhere: FindOptionsWhere<Course> =
        purchasedCourseIds.length === 0
          ? { id: In([]) }
          : { id: In(purchasedCourseIds) }

      where = search
        ? [
          { ...baseWhere, title: ILike(`%${search}%`) },
          { ...baseWhere, description: ILike(`%${search}%`) }
        ]
        : [baseWhere]
    } else {
      // user BELUM beli
      if (purchasedCourseIds.length === 0) {
        where = search
          ? [{ title: ILike(`%${search}%`) }, { description: ILike(`%${search}%`) }]
          : [{}]
      } else {
        const baseWhere: FindOptionsWhere<Course> = {
          id: Not(In(purchasedCourseIds))
        }

        where = search
          ? [
            { ...baseWhere, title: ILike(`%${search}%`) },
            { ...baseWhere, description: ILike(`%${search}%`) }
          ]
          : [baseWhere]
      }
    }

    switch (sortBy) {
      case CourseSortBy.NAME:
        order = { title: sortOrder === SortOrder.ASCENDING ? "ASC" : "DESC" }
        break
      case CourseSortBy.PRICE:
        order = { price: sortOrder === SortOrder.ASCENDING ? "ASC" : "DESC" }
        break
      case CourseSortBy.RATING:
        // fallback aman
        order = { createdAt: "DESC" }
        break
      case CourseSortBy.OLDEST:
        order = { createdAt: "ASC" }
        break
      case CourseSortBy.NEWEST:
      default:
        order = { createdAt: "DESC" }
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
        createdAt: true,
        updatedAt: true
      }
    })

    if (result.data.length === 0) return result

    const courseIds = result.data.map(course => course.id)

    const rawRatings =
      await this.transactionRepository.getRatingSummaryByCourseIds(courseIds)

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
