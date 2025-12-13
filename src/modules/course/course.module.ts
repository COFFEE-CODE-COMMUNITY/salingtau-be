import { Module } from "@nestjs/common"
import { CourseController } from "./controllers/course.controller"
import { CreateCourseHandler } from "./commands/handlers/create-course.handler"
import { CourseRepository } from "./repositories/course.repository"
import { CourseMapper } from "./mappers/course.mapper"
import { CourseSubscriber } from "./entities/subscribers/course.subscriber"
import { UserModule } from "../user/user.module"
import { GetCourseHandler } from "./queries/handlers/get-course.handler"
import { GetCoursesHandler } from "./queries/handlers/get-courses.handler"
import { CourseCategoryRepository } from "./repositories/course-category.repository"
import { LectureRepository } from "./repositories/lecture.repository"
import { LectureArticleRepository } from "./repositories/lecture-article.repository"
import { LectureExternalRepository } from "./repositories/lecture-external.repository"
import { LectureFileRepository } from "./repositories/lecture-file.repository"
import { BullModule } from "@nestjs/bullmq"
import { VIDEO_PROCESSING_QUEUE } from "../../queue/video-processing.consumer"
import { PutLectureContentHandler } from "./commands/handlers/put-lecture-content.handler"
import { LectureVideoRepository } from "./repositories/lecture-video.repository"
import { CreateCourseSectionHandler } from "./commands/handlers/create-course-section.handler"
import { CourseSectionRepository } from "./repositories/course-section.repository"
import { CreateLectureHandler } from "./commands/handlers/create-lecture.handler"
import { UploadThumbnailHandler } from "./commands/handlers/upload-thumbnail.handler"
import { IMAGE_PROCESSING_QUEUE } from "../../queue/image-processing.consumer"
import { GetCourseSectionsHandler } from "./queries/handlers/get-course-sections.handler"
import { GetLecturesQueryHandler } from "./queries/handlers/get-lectures.query"
import { GetInstructorCoursesHandler } from "./queries/handlers/get-instructor-courses.handler"

@Module({
  imports: [
    BullModule.registerQueue({
      name: IMAGE_PROCESSING_QUEUE
    }),
    BullModule.registerQueue({
      name: VIDEO_PROCESSING_QUEUE
    }),
    UserModule
  ],
  controllers: [CourseController],
  providers: [
    // Handlers
    CreateCourseHandler,
    CreateCourseSectionHandler,
    CreateLectureHandler,
    GetCourseHandler,
    GetCoursesHandler,
    GetCourseSectionsHandler,
    GetInstructorCoursesHandler,
    GetLecturesQueryHandler,
    PutLectureContentHandler,
    UploadThumbnailHandler,

    // Mappers
    CourseMapper,

    // Repositories
    CourseRepository,
    CourseCategoryRepository,
    CourseSectionRepository,
    LectureRepository,
    LectureArticleRepository,
    LectureExternalRepository,
    LectureFileRepository,
    LectureVideoRepository,

    // Subscribers
    CourseSubscriber
  ],
  exports: [CourseRepository, LectureVideoRepository]
})
export class CourseModule {}
