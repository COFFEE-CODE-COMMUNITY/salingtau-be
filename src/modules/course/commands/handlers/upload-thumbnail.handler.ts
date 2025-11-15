import { UploadThumbnailCommand } from "../upload-thumbnail.command"
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import {
  FileTypeValidator,
  SizeLimitingValidator,
  StreamValidation,
  StreamValidationException
} from "../../../../io/stream-validation"
import { ALLOWED_IMAGE_MIMETYPES } from "../../../../constants/mimetype.constant"
import { VideoThumbnailPath } from "../../helpers/path.helper"
import {
  IMAGE_PROCESSING_QUEUE,
  ImageProcessingData,
  ImageProcessingType
} from "../../../../queue/image-processing.consumer"
import { NotFoundException, PayloadTooLargeException, UnsupportedMediaTypeException } from "@nestjs/common"
import { plainToInstance } from "class-transformer"
import { CommonResponseDto } from "../../../../dto/common-response.dto"
import { InjectQueue } from "@nestjs/bullmq"
import { Queue } from "bullmq"
import { FileStorage } from "../../../../storage/file-storage.abstract"
import { CourseRepository } from "../../repositories/course.repository"

@CommandHandler(UploadThumbnailCommand)
export class UploadThumbnailHandler implements ICommandHandler<UploadThumbnailCommand> {
  private readonly THUMBNAIL_SIZE_LIMIT = 10485760 // 10MB

  public constructor(
    @InjectQueue(IMAGE_PROCESSING_QUEUE) private readonly thumbnailQueue: Queue<ImageProcessingData>,
    private readonly fileStorage: FileStorage,
    private readonly courseRepository: CourseRepository
  ) {}

  public async execute(dto: UploadThumbnailCommand): Promise<CommonResponseDto> {
    // Verify course exists and get courseId
    const course = await this.courseRepository.findByIdOrSlug(dto.courseIdOrSlug)
    if (!course) {
      throw new NotFoundException(
        plainToInstance(CommonResponseDto, {
          message: `Course with id or slug '${dto.courseIdOrSlug}' not found`
        })
      )
    }

    const abortController = new AbortController()
    const sizeValidator = new SizeLimitingValidator(this.THUMBNAIL_SIZE_LIMIT)
    const fileTypeValidator = new FileTypeValidator(ALLOWED_IMAGE_MIMETYPES as unknown as string[])
    const streamValidation = new StreamValidation(sizeValidator, fileTypeValidator)

    try {
      dto.req.pipe(streamValidation)

      const filePath = new VideoThumbnailPath({
        videoId: course.id,
        resolution: "original",
        extension: "bin"
      })
      await this.fileStorage.uploadFile(
        filePath.toString(),
        streamValidation,
        {
          contentType: "application/octet-stream"
        },
        undefined,
        abortController
      )
      await this.thumbnailQueue.add(ImageProcessingType.VIDEO_THUMBNAIL, { path: filePath.toString() })

      return plainToInstance(CommonResponseDto, {
        message: "Thumbnail uploaded successfully. Processing in background."
      })
    } catch (error) {
      abortController.abort()

      if (error instanceof StreamValidationException) {
        if (error.getValidator() instanceof SizeLimitingValidator) {
          throw new PayloadTooLargeException(
            plainToInstance(CommonResponseDto, {
              message: `Thumbnail exceeds the maximum allowed size of ${this.THUMBNAIL_SIZE_LIMIT / 1048576}MB.`
            })
          )
        } else if (error.getValidator() instanceof FileTypeValidator) {
          throw new UnsupportedMediaTypeException(
            plainToInstance(CommonResponseDto, {
              message: `Unsupported file type. Allowed types are: ${ALLOWED_IMAGE_MIMETYPES.join(", ")}.`
            })
          )
        }
      }
      throw error
    }
  }
}
