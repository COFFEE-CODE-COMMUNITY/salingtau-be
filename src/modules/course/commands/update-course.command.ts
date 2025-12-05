import { Command } from "@nestjs/cqrs"
import { CourseDto } from "../dto/course.dto"

export class UpdateCourseCommand extends Command<CourseDto> {
  public constructor(
    public readonly courseIdOrSlug: string,
    public readonly dto: CourseDto
  ) {
    super()
  }
}
