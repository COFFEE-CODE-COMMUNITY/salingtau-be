import { AutoMap } from "@automapper/classes"
import { CourseLectureType } from "../enums/course-lecture-type.enum"
import { IsEnum, IsNotEmpty, MaxLength, Min } from "class-validator"
import { ValidateOnPost } from "../../../validators/validate-on-post.decorator"
import { ReadOnly } from "../../../mappers/readonly.decorator"
import { LectureVideoDto } from "./lecture-video.dto"

export class LectureDto {
  @ReadOnly()
  @AutoMap()
  public id!: string

  @MaxLength(200, { message: "Title must be at most 200 characters long" })
  @IsNotEmpty({ message: "Title should not be empty" })
  @ValidateOnPost()
  @AutoMap()
  public title!: string

  @MaxLength(5000, { message: "Description must be at most 5000 characters long" })
  @IsNotEmpty({ message: "Description should not be empty" })
  @ValidateOnPost()
  @AutoMap()
  public description!: string

  @IsEnum(CourseLectureType, { message: "Type must be a valid CourseLectureType" })
  @IsNotEmpty({ message: "Type should not be empty" })
  @ValidateOnPost()
  @AutoMap()
  public type!: CourseLectureType

  @Min(1, { message: "Display order must be at least 1" })
  @IsNotEmpty({ message: "Display order should not be empty" })
  @ValidateOnPost()
  @AutoMap()
  public displayOrder!: number

  @AutoMap(() => LectureVideoDto)
  public video?: LectureVideoDto
}
