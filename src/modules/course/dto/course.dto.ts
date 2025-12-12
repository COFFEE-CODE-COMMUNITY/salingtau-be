import { ApiProperty } from "@nestjs/swagger"
import { Language } from "../../../enums/language"
import { CourseStatus } from "../enums/course-status.enum"
import { AutoMap } from "@automapper/classes"
import { ReadOnly } from "../../../mappers/readonly.decorator"
import { IsEnum, IsNotEmpty, IsString, MaxLength, MinLength, ValidateNested } from "class-validator"
import { ValidateOnPost } from "../../../validators/validate-on-post.decorator"
import { CourseCategoryDto } from "./course-category.dto"
import { Type } from "class-transformer"
import { ImageDto } from "../../../dto/image.dto"
import { UserPublicDto } from "../../user/dto/user-public.dto"

export class CourseDto {
  @ApiProperty({
    description: "Unique identifier for the course",
    example: "123e4567-e89b-12d3-a456-426614174000",
    type: String,
    readOnly: true
  })
  @ReadOnly()
  @AutoMap()
  public id!: string

  @ApiProperty({
    description: "Title of the course",
    example: "Introduction to Web Development",
    type: String,
    minLength: 1,
    maxLength: 200
  })
  @MaxLength(200, { message: "Title must be at most 200 characters long" })
  @MinLength(1, { message: "Title must be at least 1 character long" })
  @IsNotEmpty({ message: "Title should not be empty" })
  @IsString({ message: "Title must be a string" })
  @ValidateOnPost()
  @AutoMap()
  public title!: string

  @ApiProperty({
    description: "URL-friendly slug generated from the course title",
    example: "introduction-to-web-development",
    type: String,
    readOnly: true
  })
  @ReadOnly()
  @AutoMap()
  public slug!: string

  @ApiProperty({
    description: "Detailed description of the course content and objectives",
    example:
      "Learn the fundamentals of web development including HTML, CSS, and JavaScript. This comprehensive course covers everything you need to start building modern websites.",
    type: String,
    minLength: 1,
    maxLength: 5000
  })
  @MaxLength(5000, { message: "Description must be at most 5000 characters long" })
  @MinLength(1, { message: "Description must be at least 1 character long" })
  @IsNotEmpty({ message: "Description should not be empty" })
  @IsString({ message: "Description must be a string" })
  @ValidateOnPost()
  @AutoMap()
  public description!: string

  @ApiProperty({
    description: "Primary language in which the course is taught",
    example: Language.ENGLISH_US,
    enum: Language,
    enumName: "Language"
  })
  @IsEnum(Language, { message: "Language must be a valid enum value" })
  @ValidateOnPost()
  @AutoMap()
  public language!: Language

  @ApiProperty({
    description: "Price of the course in the default currency",
    example: 99.99,
    type: Number,
    minimum: 0
  })
  @IsNotEmpty({ message: "Price should not be empty" })
  @ValidateOnPost()
  @AutoMap()
  public price!: number

  @ApiProperty({
    description: "File path or URL to the course thumbnail image",
    type: ImageDto,
    readOnly: true
  })
  @ReadOnly()
  @AutoMap(() => ImageDto)
  public thumbnail!: ImageDto

  @ApiProperty({
    description: "Current publication status of the course",
    example: CourseStatus.PUBLISHED,
    enum: CourseStatus,
    enumName: "CourseStatus",
    readOnly: true
  })
  @ReadOnly()
  @AutoMap()
  public status!: CourseStatus

  @ApiProperty({
    description: "Average rating of the course based on user reviews",
    example: 4.5,
    type: Number,
    minimum: 0,
    maximum: 5,
    readOnly: true
  })
  @ReadOnly()
  @AutoMap()
  public averageRating!: number

  @ApiProperty({
    description: "Total number of reviews submitted for the course",
    example: 127,
    type: Number,
    minimum: 0,
    readOnly: true
  })
  @ReadOnly()
  @AutoMap()
  public totalReviews!: number

  @ApiProperty()
  @IsNotEmpty({ message: "Category should not be empty" })
  @ValidateNested()
  @ValidateOnPost()
  @Type(() => CourseCategoryDto)
  @AutoMap(() => CourseCategoryDto)
  public category!: CourseCategoryDto

  @ApiProperty({
    readOnly: true
  })
  @ReadOnly()
  @AutoMap(() => UserPublicDto)
  public instructor!: UserPublicDto

  @ApiProperty({
    description: "Timestamp when the course was created",
    example: "2025-01-15T10:30:00.000Z",
    type: Date,
    readOnly: true
  })
  @ReadOnly()
  @AutoMap()
  public createdAt!: Date

  @ApiProperty({
    description: "Timestamp when the course was last updated",
    example: "2025-11-06T14:20:00.000Z",
    type: Date,
    readOnly: true
  })
  @ReadOnly()
  @AutoMap()
  public updatedAt!: Date
}
