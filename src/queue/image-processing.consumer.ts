import { Processor, WorkerHost } from "@nestjs/bullmq"
import { Job } from "bullmq"
import { AllowedResolution, ProfilePicturePath } from "../modules/user/helpers/path.helper"
import { AllowedResolution as VideoAllowedResolution, VideoThumbnailPath } from "../modules/course/helpers/path.helper"
import { FileStorage } from "../storage/file-storage.abstract"
import { Logger } from "../log/logger.abstract"
import { IllegalArgumentException } from "../exceptions/illegal-argument.exception"
import { buffer } from "stream/consumers"
import { Readable } from "stream"
import { User } from "../modules/user/entities/user.entity"
import { Course } from "../modules/course/entities/course.entity"
import { UserRepository } from "../modules/user/repositories/user.repository"
import { CourseRepository } from "../modules/course/repositories/course.repository"
import sharp from "sharp"
import { ALLOWED_IMAGE_MIMETYPES } from "../constants/mimetype.constant"
import { ImageMetadata } from "../entities/image-metadata.entity"
import { plainToInstance } from "class-transformer"
import { fileTypeFromBuffer } from "file-type"

export const IMAGE_PROCESSING_QUEUE = "image-processing"

export interface ImageProcessingData {
  path: string
}

export enum ImageProcessingType {
  PROFILE_PICTURE = "profile-picture",
  VIDEO_THUMBNAIL = "video-thumbnail"
}

@Processor(IMAGE_PROCESSING_QUEUE)
export class ImageProcessingConsumer extends WorkerHost {
  public constructor(
    private readonly userRepository: UserRepository,
    private readonly courseRepository: CourseRepository,
    private readonly fileStorage: FileStorage,
    private readonly logger: Logger
  ) {
    super()
  }

  public async process(job: Job<ImageProcessingData, void, ImageProcessingType>): Promise<void> {
    this.logger.verbose(`Processing job ${job.id} of type ${job.name}`)

    try {
      switch (job.name) {
        case ImageProcessingType.PROFILE_PICTURE:
          return this.processProfilePicture(job.data.path)
        case ImageProcessingType.VIDEO_THUMBNAIL:
          return this.processVideoThumbnail(job.data.path)
        default:
          throw new IllegalArgumentException(`Unknown job type: ${job.name}`)
      }
    } catch (error) {
      this.logger.error(`Error when processing ${job.name} job.`, error)
    }
  }

  private async processProfilePicture(path: string): Promise<void> {
    const originalFilePath = new ProfilePicturePath(path)
    const userId = originalFilePath.getUserId()

    // Fetch original file
    const [imageFileProperties, streamImage] = await Promise.all([
      this.fileStorage.getFileProperties(originalFilePath.toString()),
      this.fileStorage.getFile(originalFilePath.toString())
    ])

    if (!imageFileProperties || !streamImage) {
      this.logger.error("Temporary profile picture file not found.")
      throw new Error("Temporary profile picture file not found.")
    }

    // Load and validate image
    const imageBuffer = await buffer(streamImage)
    const [image, originalFileType] = [sharp(imageBuffer), await fileTypeFromBuffer(imageBuffer)]
    const imageMetadata = await image.metadata()

    if (!imageMetadata.width || !imageMetadata.height) {
      this.logger.error("Failed to retrieve image dimensions.")
      throw new Error("Failed to retrieve image dimensions.")
    }

    if (!originalFileType || !ALLOWED_IMAGE_MIMETYPES.includes(originalFileType.mime as any)) {
      this.logger.error("Failed to determine the original image file type or unsupported file type.")
      throw new Error("Failed to determine the original image file type or unsupported file type.")
    }

    // Crop to square
    const size = Math.min(imageMetadata.width, imageMetadata.height)
    const croppedImage = image.extract({
      left: Math.floor((imageMetadata.width - size) / 2),
      top: Math.floor((imageMetadata.height - size) / 2),
      width: size,
      height: size
    })

    // Generate resized AVIF versions
    const resizedVersions = await Promise.all(
      ([128, 512, 1024] as const).map(async resolution => {
        const filePath = new ProfilePicturePath({
          userId,
          resolution: resolution.toString() as AllowedResolution,
          extension: "avif"
        }).toString()

        const avifImageBuffer = await croppedImage
          .clone()
          .resize(resolution, resolution, { fit: "cover", position: "centre", withoutEnlargement: false })
          .avif({ quality: 80, effort: 2, chromaSubsampling: "4:4:4", lossless: false })
          .toBuffer()

        await this.fileStorage.uploadFile(filePath, Readable.from(avifImageBuffer), {
          contentType: "image/avif"
        })

        return plainToInstance(ImageMetadata, {
          path: filePath,
          width: resolution,
          height: resolution
        })
      })
    )

    // Get existing user profile pictures to check for old original image
    const user = await this.userRepository.findById(userId)
    const existingOriginal = user?.profilePictures?.find(pic => {
      try {
        const picPath = new ProfilePicturePath(pic.path)
        return picPath.getResolution() === "original"
      } catch {
        return false
      }
    })

    // Delete original file and upload new original image without metadata
    const newProfilePicturePath = new ProfilePicturePath({
      userId,
      resolution: "original",
      extension: originalFileType.ext
    }).toString()

    await this.fileStorage.deleteFile(originalFilePath.toString())
    await this.fileStorage.uploadFile(newProfilePicturePath, Readable.from(imageBuffer))

    // Delete old original image if format changed
    if (existingOriginal && existingOriginal.path !== newProfilePicturePath) {
      try {
        await this.fileStorage.deleteFile(existingOriginal.path)
        this.logger.verbose(`Deleted old original image: ${existingOriginal.path}`)
      } catch (error) {
        this.logger.warn(`Failed to delete old original image: ${existingOriginal.path}`, error)
      }
    }

    // Save all profile pictures metadata
    const profilePictures = [
      ...resizedVersions,
      plainToInstance(ImageMetadata, {
        path: newProfilePicturePath,
        width: imageMetadata.width,
        height: imageMetadata.height
      })
    ]

    await this.userRepository.update(userId, { profilePictures } as User)
  }

  private async processVideoThumbnail(path: string): Promise<void> {
    const originalFilePath = new VideoThumbnailPath(path)
    const videoId = originalFilePath.getVideoId() // Note: videoId here is actually courseId
    this.logger.verbose(`Processing course thumbnail for courseId: ${videoId}`)

    // Fetch original file
    const [imageFileProperties, streamImage] = await Promise.all([
      this.fileStorage.getFileProperties(originalFilePath.toString()),
      this.fileStorage.getFile(originalFilePath.toString())
    ])

    if (!imageFileProperties || !streamImage) {
      this.logger.error("Temporary video thumbnail file not found.")
      throw new Error("Temporary video thumbnail file not found.")
    }

    // Load and validate image
    const imageBuffer = await buffer(streamImage)
    const [image, originalFileType] = [sharp(imageBuffer), await fileTypeFromBuffer(imageBuffer)]
    const imageMetadata = await image.metadata()

    if (!imageMetadata.width || !imageMetadata.height) {
      this.logger.error("Failed to retrieve image dimensions.")
      throw new Error("Failed to retrieve image dimensions.")
    }

    if (!originalFileType || !ALLOWED_IMAGE_MIMETYPES.includes(originalFileType.mime as any)) {
      this.logger.error("Failed to determine the original image file type or unsupported file type.")
      throw new Error("Failed to determine the original image file type or unsupported file type.")
    }

    // Crop to square
    const size = Math.min(imageMetadata.width, imageMetadata.height)
    const croppedImage = image.extract({
      left: Math.floor((imageMetadata.width - size) / 2),
      top: Math.floor((imageMetadata.height - size) / 2),
      width: size,
      height: size
    })

    // Generate resized AVIF versions
    const resizedVersions = await Promise.all(
      ([128, 512, 1024] as const).map(async resolution => {
        const filePath = new VideoThumbnailPath({
          videoId,
          resolution: resolution.toString() as VideoAllowedResolution,
          extension: "avif"
        }).toString()

        const avifImageBuffer = await croppedImage
          .clone()
          .resize(resolution, resolution, { fit: "cover", position: "centre", withoutEnlargement: false })
          .avif({ quality: 80, effort: 2, chromaSubsampling: "4:4:4", lossless: false })
          .toBuffer()

        await this.fileStorage.uploadFile(filePath, Readable.from(avifImageBuffer), {
          contentType: "image/avif"
        })

        return plainToInstance(ImageMetadata, {
          path: filePath,
          width: resolution,
          height: resolution
        })
      })
    )

    // Get existing course to check for old original thumbnail
    const course = await this.courseRepository.findById(videoId)
    if (!course) {
      this.logger.error(`Course not found with id: ${videoId}`)
      throw new Error(`Course not found with id: ${videoId}`)
    }
    const existingOriginal = course.thumbnail
    this.logger.verbose(`Found course: ${course.id}, existing thumbnail: ${existingOriginal?.path}`)

    // Delete original file and upload new original image without metadata
    const newThumbnailPath = new VideoThumbnailPath({
      videoId,
      resolution: "original",
      extension: originalFileType.ext
    }).toString()

    await this.fileStorage.deleteFile(originalFilePath.toString())
    await this.fileStorage.uploadFile(newThumbnailPath, Readable.from(imageBuffer))

    // Delete old original thumbnail if it exists and format changed
    if (existingOriginal?.path && existingOriginal.path !== newThumbnailPath) {
      try {
        await this.fileStorage.deleteFile(existingOriginal.path)
        this.logger.verbose(`Deleted old original thumbnail: ${existingOriginal.path}`)
      } catch (error) {
        this.logger.warn(`Failed to delete old original thumbnail: ${existingOriginal.path}`, error)
      }
    }

    // Save thumbnail metadata (using the original resolution as primary)
    const thumbnail = plainToInstance(ImageMetadata, {
      path: newThumbnailPath,
      width: imageMetadata.width,
      height: imageMetadata.height
    })

    this.logger.verbose(`Saving thumbnail to database for courseId: ${videoId}, path: ${newThumbnailPath}`)
    course.thumbnail = thumbnail
    await this.courseRepository.save(course)
    this.logger.verbose(`Successfully saved thumbnail for courseId: ${videoId}`)
  }
}
