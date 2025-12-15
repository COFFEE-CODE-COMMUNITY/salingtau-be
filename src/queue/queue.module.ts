import { forwardRef, Module } from "@nestjs/common"
import { ImageProcessingConsumer } from "./image-processing.consumer"
import { UserModule } from "../modules/user/user.module"
import { EmailConsumer } from "./email.consumer"
import { CourseModule } from "../modules/course/course.module"
import { VideoProcessingConsumer } from "./video-processing.consumer"

@Module({
  imports: [CourseModule, UserModule],
  providers: [EmailConsumer, ImageProcessingConsumer, VideoProcessingConsumer]
})
export class QueueModule {}
