import { Query } from "@nestjs/cqrs"
import { PaginationDto } from "../../../dto/pagination.dto"
import { CourseDto } from "../dto/course.dto"
import { CourseSortBy } from "../enums/course-sort-by.enum"
import { SortOrder } from "../../../enums/sort-order"

export class GetInstructorCoursesQuery extends Query<PaginationDto<CourseDto>> {
  public constructor(
    public readonly instructorId: string,
    public readonly offset: number,
    public readonly limit: number,
    public readonly sortBy: CourseSortBy,
    public readonly sortOrder: SortOrder,
    public readonly search?: string
  ) {
    super()
  }
}
