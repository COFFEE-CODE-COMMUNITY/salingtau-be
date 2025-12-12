import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { CreateCourseReviewCommand } from "../create-course-review.command"
import { CourseReviewDto } from "../../dto/course-review.dto"
import { InjectMapper } from "@automapper/nestjs"
import { Mapper } from "@automapper/core"
import { CourseReviewRepository } from "../../repositories/course-review.repository"
import { CourseReview } from "../../entities/course-review.entity"
import { UserRepository } from "../../../user/repositories/user.repository"
import { CourseRepository } from "../../repositories/course.repository"
import { NotFoundException } from "@nestjs/common"
import { plainToInstance } from "class-transformer"
import { CommonResponseDto } from "../../../../dto/common-response.dto"

@CommandHandler(CreateCourseReviewCommand)
export class CreateCourseReviewHandler implements ICommandHandler<CreateCourseReviewCommand> {
  public constructor(
    @InjectMapper() private readonly mapper: Mapper,
    private readonly courseRepository: CourseRepository,
    private readonly courseReviewRepository: CourseReviewRepository,
    private readonly userRepository: UserRepository
  ) {}

  public async execute(command: CreateCourseReviewCommand): Promise<CourseReviewDto> {
    const courseReview = this.mapper.map(command.dto, CourseReviewDto, CourseReview)
    const user = await this.userRepository.findById(command.userId)
    const course = await this.courseRepository.findByIdOrSlug(command.courseIdOrSlug)

    if (!course) {
      throw new NotFoundException(
        plainToInstance(CommonResponseDto, {
          message: "Course not found"
        })
      )
    }

    courseReview.user = user!
    courseReview.course = course

    return this.mapper.map(await this.courseReviewRepository.save(courseReview), CourseReview, CourseReviewDto)
  }
}
