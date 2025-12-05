import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { UpdateCourseCommand } from "../update-course.command"
import { CourseDto } from "../../dto/course.dto"
import { CourseRepository } from "../../repositories/course.repository"
import { InjectMapper } from "@automapper/nestjs"
import { Mapper } from "@automapper/core"
import { NotFoundException } from "@nestjs/common"
import { plainToInstance } from "class-transformer"
import { CommonResponseDto } from "../../../../dto/common-response.dto"
import { Course } from "../../entities/course.entity"

@CommandHandler(UpdateCourseCommand)
export class UpdateCourseHandler implements ICommandHandler<UpdateCourseCommand> {
  public constructor(
    @InjectMapper() private readonly mapper: Mapper,
    private readonly courseRepository: CourseRepository
  ) {}

  public async execute(command: UpdateCourseCommand): Promise<CourseDto> {
    const course = await this.courseRepository.findByIdOrSlug(command.courseIdOrSlug)

    if (!course) {
      throw new NotFoundException(
        plainToInstance(CommonResponseDto, {
          message: "Course not found."
        })
      )
    }

    return this.mapper.map(
      await this.courseRepository.save(this.courseRepository.merge(course, command.dto)),
      Course,
      CourseDto
    )
  }
}
