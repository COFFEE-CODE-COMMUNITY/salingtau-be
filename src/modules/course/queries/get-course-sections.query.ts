import { Query } from "@nestjs/cqrs"
import { PaginationDto } from "../../../dto/pagination.dto"
import { CourseSectionDto } from "../dto/course-section.dto"

export class GetCourseSectionsQuery extends Query<PaginationDto<CourseSectionDto>> {
  public constructor(
    public readonly courseIdOrSlug: string,
    public readonly limit: number,
    public readonly offset: number
  ) {
    super()
  }
}
