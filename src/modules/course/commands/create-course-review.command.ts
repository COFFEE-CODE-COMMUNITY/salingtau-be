import { Command } from "@nestjs/cqrs"
import { CourseReviewDto } from "../dto/course-review.dto"

export class CreateCourseReviewCommand extends Command<CourseReviewDto> {
  public constructor(
    public readonly courseIdOrSlug: string,
    public readonly userId: string,
    public readonly dto: CourseReviewDto
  ) {
    super()
  }
}
