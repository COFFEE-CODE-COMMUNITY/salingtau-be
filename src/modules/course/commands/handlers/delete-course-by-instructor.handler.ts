import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { DeleteCourseByInstructorCommand } from "../delete-course-by-instructor.command"
import { CourseRepository } from "../../repositories/course.repository"
import { FileStorage } from "../../../../storage/file-storage.abstract"

@CommandHandler(DeleteCourseByInstructorCommand)
export class DeleteCourseByInstructorHandler implements ICommandHandler<DeleteCourseByInstructorCommand> {
  public constructor(
    private readonly courseRepository: CourseRepository,
    private readonly fileStorage: FileStorage
  ) {}

  public async execute(command: DeleteCourseByInstructorCommand): Promise<void> {
    const course = await this.courseRepository.findByIdOrSlug(command.courseIdOrSlug)

    if (!course) {
      return
    }

    if (course.thumbnail) {
      await this.fileStorage.deleteFile(course.thumbnail.path)
    }

    await this.courseRepository.deleteByInstructor(command.courseIdOrSlug, command.instructorId)
  }
}
