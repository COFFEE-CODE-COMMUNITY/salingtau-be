import { IQueryHandler, QueryHandler } from "@nestjs/cqrs"
import { GetCourseSectionsQuery } from "../get-course-sections.query"
import { PaginationDto } from "../../../../dto/pagination.dto"
import { CourseSectionDto } from "../../dto/course-section.dto"
import { PaginationFactory } from "../../../../factories/pagination.factory"
import { CourseSection } from "../../entities/course-section.entity"
import { Pagination } from "../../../../utils/pagination.util"

@QueryHandler(GetCourseSectionsQuery)
export class GetCourseSectionsHandler implements IQueryHandler<GetCourseSectionsQuery> {
  private readonly pagination: Pagination<CourseSection, CourseSectionDto>

  public constructor(paginationFactory: PaginationFactory) {
    this.pagination = paginationFactory.create(CourseSection, CourseSectionDto)
  }

  public async execute(query: GetCourseSectionsQuery): Promise<PaginationDto<CourseSectionDto>> {
    const { limit, offset } = query

    return this.pagination.paginate(offset, limit, {
      where: { course: { id: query.courseIdOrSlug } },
      select: {
        id: true,
        title: true,
        displayOrder: true
      },
      order: { displayOrder: "ASC" }
    })
  }
}
