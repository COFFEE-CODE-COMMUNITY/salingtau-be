import { Global, Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ConfigService } from "@nestjs/config"
import { OAuth2User } from "../modules/auth/entities/oauth2-user.entity"
import { PasswordResetSession } from "../modules/auth/entities/password-reset-session.entity"
import { RefreshToken } from "../modules/auth/entities/refresh-token.entity"
import { User } from "../modules/user/entities/user.entity"
import { InstructorVerification } from "../modules/user/entities/instructor-verification.entity"
import { TransactionContextService } from "./unit-of-work/transaction-context.service"
import { UnitOfWork } from "./unit-of-work/unit-of-work"
import { Course } from "../modules/course/entities/course.entity"
import { CourseCategory } from "../modules/course/entities/course-category.entity"
import { CourseReview } from "../modules/course/entities/course-review.entity"
import { CourseSection } from "../modules/course/entities/course-section.entity"
import { Lecture } from "../modules/course/entities/lecture.entity"
import { LectureArticle } from "../modules/course/entities/lecture-article.entity"
import { LectureExternal } from "../modules/course/entities/lecture-external.entity"
import { LectureFile } from "../modules/course/entities/lecture-file.entity"
import { LectureProgress } from "../modules/course/entities/lecture-progress.entity"
import { LectureVideo } from "../modules/course/entities/lecture-video.entity"
import { Transaction } from "../modules/transaction/entities/transaction.entity"
import { Rating } from "../modules/rating/entities/rating"

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory(config: ConfigService) {
        return {
          type: config.getOrThrow<"postgres">("DATABASE_TYPE"),
          host: config.getOrThrow<string>("DATABASE_HOST"),
          port: parseInt(config.getOrThrow<string>("DATABASE_PORT")),
          username: config.getOrThrow<string>("DATABASE_USERNAME"),
          password: config.getOrThrow<string>("DATABASE_PASSWORD"),
          database: config.getOrThrow<string>("DATABASE_NAME"),
          // synchronize: config.get<NodeEnv>("NODE_ENV", NodeEnv.DEVELOPMENT) != NodeEnv.PRODUCTION,
          synchronize: true,
          entities: [
            OAuth2User,
            PasswordResetSession,
            RefreshToken,
            User,
            InstructorVerification,
            Course,
            CourseCategory,
            CourseReview,
            CourseSection,
            Lecture,
            LectureArticle,
            LectureExternal,
            LectureFile,
            LectureProgress,
            LectureVideo,
            Transaction,
            Rating
          ]
        }
      },
      inject: [ConfigService]
    })
  ],
  providers: [TransactionContextService, UnitOfWork],
  exports: [TransactionContextService, UnitOfWork]
})
export class DatabaseModule {}
