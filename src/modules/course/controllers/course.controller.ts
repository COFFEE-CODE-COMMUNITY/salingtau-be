import { Body, Controller, Get, Param, ParseEnumPipe, ParseIntPipe, Post, Put, Query, Req } from "@nestjs/common"
import { CourseDto } from "../dto/course.dto"
import { CommandBus, QueryBus } from "@nestjs/cqrs"
import { CreateCourseCommand } from "../commands/create-course.command"
import { Roles } from "../../../guards/roles.guard"
import { UserRole } from "../../user/enums/user-role.enum"
import { Authorized } from "../../../guards/bearer-token.guard"
import { GetCourseQuery } from "../queries/get-course.query"
import { PaginationDto } from "../../../dto/pagination.dto"
import { GetCoursesQuery } from "../queries/get-courses.query"
import { parsePipeExceptionFactory } from "../../../utils/parse-pipe-exception-factory.util"
import { CourseSortBy } from "../enums/course-sort-by.enum"
import { SortOrder } from "../../../enums/sort-order"
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse
} from "@nestjs/swagger"
import { CoursesDto } from "../dto/courses.dto"
import { CommonResponseDto } from "../../../dto/common-response.dto"
import { CourseCategoryDto } from "../dto/course-category.dto"
import { GetCourseCategoriesQuery } from "../queries/get-course-categories.query"
import { CourseCategoriesDto } from "../dto/course-categories.dto"
import { CourseSectionDto } from "../dto/course-section.dto"
import { CreateCourseSectionCommand } from "../commands/create-course-section.command"
import { Request } from "express"
import { PutLectureContentCommand } from "../commands/put-lecture-content.command"
import { LectureDto } from "../dto/lecture.dto"
import { CreateLectureCommand } from "../commands/create-lecture.command"
import { UploadThumbnailCommand } from "../commands/upload-thumbnail.command"
import { GetCourseSectionsQuery } from "../queries/get-course-sections.query"
import { GetLecturesQuery } from "../queries/get-lectures.query"
import { GetInstructorCoursesQuery } from "../queries/get-instructor-courses.query"
import { UserId } from "../../../http/user-id.decorator"

@ApiTags("Courses")
@Controller("courses")
export class CourseController {
  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Get()
  @ApiOperation({
    summary: "Get paginated list of courses",
    description: "Retrieves a paginated list of courses with optional filtering, sorting, and search capabilities"
  })
  @ApiQuery({
    name: "offset",
    required: false,
    type: Number,
    description: "Number of items to skip from the beginning",
    example: 0
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Maximum number of items to return per page",
    example: 100
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: CourseSortBy,
    enumName: "CourseSortBy",
    description: "Field to sort courses by",
    example: CourseSortBy.NEWEST
  })
  @ApiQuery({
    name: "sortOrder",
    required: false,
    enum: SortOrder,
    enumName: "SortOrder",
    description: "Order direction for sorting",
    example: SortOrder.ASCENDING
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search term to filter courses by title or description",
    example: "web development"
  })
  @ApiOkResponse({
    description: "Successfully retrieved paginated courses",
    type: CoursesDto
  })
  @ApiBadRequestResponse({
    description: "Invalid query parameters",
    type: CommonResponseDto
  })
  public async getCourses(
    @Query("offset", new ParseIntPipe({ optional: true, exceptionFactory: parsePipeExceptionFactory }))
    offset: number = 0,
    @Query("limit", new ParseIntPipe({ optional: true, exceptionFactory: parsePipeExceptionFactory }))
    limit: number = 100,
    @Query("sortBy", new ParseEnumPipe(CourseSortBy, { optional: true, exceptionFactory: parsePipeExceptionFactory }))
    sortBy: CourseSortBy = CourseSortBy.NEWEST,
    @Query("sortOrder", new ParseEnumPipe(SortOrder, { optional: true, exceptionFactory: parsePipeExceptionFactory }))
    sortOrder: SortOrder = SortOrder.ASCENDING,
    @Query("search") search?: string
  ): Promise<PaginationDto<CourseDto>> {
    return this.queryBus.execute(new GetCoursesQuery(offset, limit, sortBy, sortOrder, search))
  }

  @Get(":courseIdOrSlug")
  @ApiOperation({
    summary: "Get a single course by ID or slug",
    description:
      "Retrieves detailed information about a specific course using either its unique ID or URL-friendly slug"
  })
  @ApiParam({
    name: "courseIdOrSlug",
    type: String,
    description: "Course unique identifier (UUID) or URL-friendly slug",
    example: "introduction-to-web-development"
  })
  @ApiOkResponse({
    description: "Successfully retrieved course details",
    type: CourseDto
  })
  @ApiNotFoundResponse({
    description: "Course not found with the provided ID or slug",
    type: CommonResponseDto
  })
  public async getCourse(@Param("courseIdOrSlug") courseIdOrSlug: string): Promise<CourseDto> {
    return this.queryBus.execute(new GetCourseQuery(courseIdOrSlug))
  }

  @Post()
  @ApiOperation({
    summary: "Create a new course",
    description: "Creates a new course with the provided details. Requires instructor role and authentication."
  })
  @ApiCreatedResponse({
    description: "Course successfully created",
    type: CourseDto
  })
  @ApiBadRequestResponse({
    description: "Invalid course data provided",
    type: CommonResponseDto
  })
  @ApiUnauthorizedResponse({
    description: "Authentication token is missing or invalid",
    type: CommonResponseDto
  })
  @ApiBearerAuth()
  @Roles([UserRole.INSTRUCTOR])
  @Authorized()
  public async createCourse(@Body() dto: CourseDto): Promise<CourseDto> {
    return this.commandBus.execute(new CreateCourseCommand(dto))
  }

  @Get("instructor")
  @Roles([UserRole.INSTRUCTOR])
  @Authorized()
  public async getInstructorCourses(
    @UserId() instructorId: string,
    @Query("offset", new ParseIntPipe({ optional: true, exceptionFactory: parsePipeExceptionFactory }))
    offset: number = 0,
    @Query("limit", new ParseIntPipe({ optional: true, exceptionFactory: parsePipeExceptionFactory }))
    limit: number = 100,
    @Query("sortBy", new ParseEnumPipe(CourseSortBy, { optional: true, exceptionFactory: parsePipeExceptionFactory }))
    sortBy: CourseSortBy = CourseSortBy.NEWEST,
    @Query("sortOrder", new ParseEnumPipe(SortOrder, { optional: true, exceptionFactory: parsePipeExceptionFactory }))
    sortOrder: SortOrder = SortOrder.ASCENDING,
    @Query("search") search?: string
  ): Promise<PaginationDto<CourseDto>> {
    return this.queryBus.execute(new GetInstructorCoursesQuery(instructorId, offset, limit, sortBy, sortOrder, search))
  }

  @Put(":courseIdOrSlug/thumbnail")
  public async uploadCourseThumbnail(
    @Param("courseIdOrSlug") courseIdOrSlug: string,
    @Req() req: Request
  ): Promise<CommonResponseDto> {
    req.setTimeout(0) // Disable timeout for large file uploads
    return this.commandBus.execute(new UploadThumbnailCommand(courseIdOrSlug, req))
  }

  @Get(":courseIdOrSlug/sections")
  public async getCourseSections(
    @Param("courseIdOrSlug") courseIdOrSlug: string,
    @Query("offset", new ParseIntPipe({ optional: true, exceptionFactory: parsePipeExceptionFactory }))
    offset: number = 0,
    @Query("limit", new ParseIntPipe({ optional: true, exceptionFactory: parsePipeExceptionFactory }))
    limit: number = 100
  ): Promise<PaginationDto<CourseSectionDto>> {
    return this.queryBus.execute(new GetCourseSectionsQuery(courseIdOrSlug, limit, offset))
  }

  @Post(":courseIdOrSlug/sections")
  @ApiOperation({
    summary: "Create a new course section",
    description: "Creates a new section within a course. Requires instructor role and authentication."
  })
  @ApiParam({
    name: "courseIdOrSlug",
    type: String,
    description: "Course unique identifier (UUID) or URL-friendly slug",
    example: "introduction-to-web-development"
  })
  @ApiCreatedResponse({
    description: "Course section successfully created",
    type: CourseSectionDto
  })
  @ApiBadRequestResponse({
    description: "Invalid section data provided",
    type: CommonResponseDto
  })
  @ApiUnauthorizedResponse({
    description: "Authentication token is missing or invalid",
    type: CommonResponseDto
  })
  @ApiForbiddenResponse({
    description: "User does not have instructor role or is not the course owner",
    type: CommonResponseDto
  })
  @ApiNotFoundResponse({
    description: "Course not found with the provided ID or slug",
    type: CommonResponseDto
  })
  @ApiBearerAuth()
  @Roles([UserRole.INSTRUCTOR])
  @Authorized()
  public async createCourseSection(
    @Param("courseIdOrSlug") courseIdOrSlug: string,
    @Body() dto: CourseSectionDto
  ): Promise<CourseSectionDto> {
    return this.commandBus.execute(new CreateCourseSectionCommand(courseIdOrSlug, dto))
  }

  @Get("categories")
  @ApiOperation({
    summary: "Get paginated list of course categories",
    description: "Retrieves a paginated list of all available course categories with optional search capability"
  })
  @ApiQuery({
    name: "offset",
    required: false,
    type: Number,
    description: "Number of items to skip from the beginning",
    example: 0
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Maximum number of items to return per page",
    example: 100
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search term to filter categories by name or description",
    example: "programming"
  })
  @ApiOkResponse({
    description: "Successfully retrieved paginated course categories",
    type: CourseCategoriesDto
  })
  @ApiBadRequestResponse({
    description: "Invalid query parameters",
    type: CommonResponseDto
  })
  public async getCourseCategories(
    @Query("offset", new ParseIntPipe({ optional: true, exceptionFactory: parsePipeExceptionFactory }))
    offset: number = 0,
    @Query("limit", new ParseIntPipe({ optional: true, exceptionFactory: parsePipeExceptionFactory }))
    limit: number = 100,
    @Query("search") search?: string
  ): Promise<PaginationDto<CourseCategoryDto>> {
    return this.queryBus.execute(new GetCourseCategoriesQuery(offset, limit, search))
  }

  @Get(":courseIdOrSlug/sections/:sectionId/lectures")
  public async getLectures(
    @Param("courseIdOrSlug") courseIdOrSlug: string,
    @Param("sectionId") sectionId: string,
    @Query("offset", new ParseIntPipe({ optional: true, exceptionFactory: parsePipeExceptionFactory }))
    offset: number = 0,
    @Query("limit", new ParseIntPipe({ optional: true, exceptionFactory: parsePipeExceptionFactory }))
    limit: number = 100
  ): Promise<PaginationDto<LectureDto>> {
    return this.queryBus.execute(new GetLecturesQuery(courseIdOrSlug, sectionId, limit, offset))
  }

  @Post(":courseIdOrSlug/sections/:sectionId/lectures")
  public async createLecture(
    @Param("courseIdOrSlug") courseIdOrSlug: string,
    @Param("sectionId") sectionId: string,
    @Body() dto: LectureDto
  ): Promise<LectureDto> {
    return this.commandBus.execute(new CreateLectureCommand(courseIdOrSlug, sectionId, dto))
  }

  @Put(":courseIdOrSlug/lectures/:lectureId/content")
  public async putLectureContent(
    @Param("courseIdOrSlug") courseIdOrSlug: string,
    @Param("lectureId") lectureId: string,
    @Req() req: Request
  ): Promise<CommonResponseDto> {
    req.setTimeout(0) // Disable timeout for large file uploads
    return this.commandBus.execute(new PutLectureContentCommand(courseIdOrSlug, lectureId, req))
  }
}
