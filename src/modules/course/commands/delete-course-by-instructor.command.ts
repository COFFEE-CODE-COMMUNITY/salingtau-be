import { Command } from "@nestjs/cqrs"

export class DeleteCourseByInstructorCommand extends Command<void> {
  public constructor(
    public readonly courseIdOrSlug: string,
    public readonly instructorId: string
  ) {
    super()
  }
}
