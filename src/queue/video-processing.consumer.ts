import { Processor, WorkerHost } from "@nestjs/bullmq"
import { Job } from "bullmq"
import { IllegalArgumentException } from "../exceptions/illegal-argument.exception"
import { Logger } from "../log/logger.abstract"
import { FileStorage } from "../storage/file-storage.abstract"
import { LectureVideoRepository } from "../modules/course/repositories/lecture-video.repository"
import { spawn, exec } from "child_process"
import { promisify } from "util"
import { tmpdir } from "os"
import { createReadStream, createWriteStream } from "fs"
import { readdir, rm, mkdir } from "fs/promises"
import { LectureVideoTemporaryPath } from "../modules/course/helpers/path.helper"
import { LectureVideoStatus } from "../modules/course/enums/lecture-video-status.enum"

const execAsync = promisify(exec)

export const VIDEO_PROCESSING_QUEUE = "video-processing"

export interface VideoProcessingData {
  path: string
}

export enum VideoProcessingType {
  LECTURE_VIDEO = "lecture-video"
}

@Processor(VIDEO_PROCESSING_QUEUE)
export class VideoProcessingConsumer extends WorkerHost {
  private readonly VIDEO_TEMPORARY_DIRECTORY = `${tmpdir()}/salingtau/videos`

  public constructor(
    private readonly lectureVideoRepository: LectureVideoRepository,
    private readonly fileStorage: FileStorage,
    private readonly logger: Logger
  ) {
    super()
  }

  public async process(job: Job<VideoProcessingData, void, VideoProcessingType>): Promise<void> {
    this.logger.verbose(`Processing video job ${job.id} of type ${job.name}`)

    try {
      switch (job.name) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        case VideoProcessingType.LECTURE_VIDEO:
          await this.processLectureVideo(job.data.path)
          break
        default:
          throw new IllegalArgumentException(`Unknown job type: ${job.name}`)
      }
    } catch (error) {
      this.logger.error(`Error when processing ${job.name} job.`, error)
    }
  }

  private async processLectureVideo(path: string): Promise<void> {
    this.logger.verbose(`Starting processing lecture video: ${path}`)
    const videoPath = new LectureVideoTemporaryPath(path)

    const video = await this.fileStorage.getFile(videoPath.toString())

    if (!video) {
      throw new IllegalArgumentException("Video file not found in storage.")
    }

    // Ensure the directory exists
    await mkdir(this.VIDEO_TEMPORARY_DIRECTORY, { recursive: true })

    const writeVideoStream = createWriteStream(this.getVideoPath(videoPath.getLectureId()))

    this.logger.verbose(`Downloading video to temporary path: ${this.getVideoPath(videoPath.getLectureId())}`)

    await new Promise<void>((resolve, reject) => {
      video.pipe(writeVideoStream)

      writeVideoStream.on("finish", () => {
        resolve()
      })

      writeVideoStream.on("error", err => {
        reject(err)
      })

      video.on("error", err => {
        reject(err)
      })
    })

    this.logger.verbose(`Video downloaded to temporary path: ${this.getVideoPath(videoPath.getLectureId())}`)

    const ffprobeStdout = await execAsync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=s=x:p=0 ${this.getVideoPath(videoPath.getLectureId())}`
    )
    const [heightStr] = ffprobeStdout.stdout.trim().split("x")
    const height = parseInt(heightStr!, 10)

    const ffprobeDuration = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${this.getVideoPath(videoPath.getLectureId())}`
    )
    const durationInSeconds = parseFloat(ffprobeDuration.stdout.trim())
    const durationInMs = Math.round(durationInSeconds * 1000)

    const targetResolutions = [240, 360, 480, 720, 1080, 1440, 2160, 4320].filter(level => level <= height)

    const resolutionBandwidths: Array<{ resolution: number; bandwidth: number }> = []

    this.logger.verbose(`Transcoding video to resolutions: ${targetResolutions.join(", ")}`)

    for (const resolution of targetResolutions) {
      const baseOutputPath = `${this.VIDEO_TEMPORARY_DIRECTORY}/${videoPath.getLectureId()}/${resolution}p`

      // Ensure the output directory exists
      await mkdir(baseOutputPath, { recursive: true })

      await new Promise<void>((resolve, reject) => {
        const ffmpeg = spawn("ffmpeg", [
          "-i",
          this.getVideoPath(videoPath.getLectureId()),
          "-vf",
          `scale=-2:${resolution}`,
          "-c:a",
          "aac",
          "-ar",
          "48000",
          "-c:v",
          "h264",
          "-profile:v",
          "main",
          "-crf",
          "23",
          "-g",
          "48",
          "-keyint_min",
          "48",
          "-hls_time",
          "6",
          "-hls_playlist_type",
          "vod",
          "-hls_segment_filename",
          `${baseOutputPath}/segment-%03d.ts`,
          `${baseOutputPath}/index.m3u8`
        ])

        // Drain stdout and stderr to prevent process from hanging
        ffmpeg.stdout.on("data", data => {
          this.logger.debug(`FFmpeg stdout [${resolution}p]: ${data.toString()}`)
        })

        ffmpeg.stderr.on("data", data => {
          this.logger.debug(`FFmpeg stderr [${resolution}p]: ${data.toString()}`)
        })

        ffmpeg.on("error", err => {
          reject(new Error(`FFmpeg process error: ${err.message}`))
        })

        ffmpeg.on("close", code => {
          if (code === 0) {
            resolve()
          } else {
            reject(new Error(`FFmpeg process exited with code ${code}`))
          }
        })
      })

      const segmentFiles = await readdir(baseOutputPath)

      for (const file of segmentFiles) {
        const segmentFile = createReadStream(`${baseOutputPath}/${file}`)
        await this.fileStorage.uploadFile(`courses/${videoPath.getCourseId()}/${resolution}p/${file}`, segmentFile, {
          contentType: file.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/mp2t"
        })
      }

      // Estimate bandwidth based on resolution
      const bandwidth = this.estimateBandwidth(resolution)
      resolutionBandwidths.push({ resolution, bandwidth })

      await rm(baseOutputPath, { recursive: true, force: true })

      this.logger.verbose(`Finished transcoding to ${resolution}p`)
    }

    // Create master.m3u8 playlist
    await this.createMasterPlaylist(videoPath.getCourseId(), resolutionBandwidths)

    await rm(this.getVideoPath(videoPath.getLectureId()), { force: true })

    const lectureVideo = await this.lectureVideoRepository.findByLectureId(videoPath.getLectureId())

    if (lectureVideo) {
      lectureVideo.status = LectureVideoStatus.READY
      lectureVideo.durationMilliseconds = durationInMs
      lectureVideo.resolutions = targetResolutions
      await this.lectureVideoRepository.save(lectureVideo)
    }

    this.logger.verbose(`Finished processing lecture video: ${videoPath.toString()}`)
  }

  private getVideoPath(lectureId: string): string {
    return `${this.VIDEO_TEMPORARY_DIRECTORY}/${lectureId}.bin`
  }

  private async createMasterPlaylist(
    courseId: string,
    resolutionBandwidths: Array<{ resolution: number; bandwidth: number }>
  ): Promise<void> {
    let masterPlaylist = "#EXTM3U\n#EXT-X-VERSION:3\n"

    for (const { resolution, bandwidth } of resolutionBandwidths) {
      masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${this.getResolutionWidth(resolution)}x${resolution}\n`
      masterPlaylist += `${resolution}p/index.m3u8\n`
    }

    const masterPlaylistBuffer = Buffer.from(masterPlaylist, "utf-8")
    const { Readable } = await import("stream")
    const masterPlaylistStream = Readable.from(masterPlaylistBuffer)

    await this.fileStorage.uploadFile(`courses/${courseId}/master.m3u8`, masterPlaylistStream, {
      contentType: "application/vnd.apple.mpegurl"
    })
  }

  private estimateBandwidth(resolution: number): number {
    // Estimate bandwidth based on resolution (in bits per second)
    const bandwidthMap: Record<number, number> = {
      240: 400000, // 400 Kbps
      360: 800000, // 800 Kbps
      480: 1400000, // 1.4 Mbps
      720: 2800000, // 2.8 Mbps
      1080: 5000000, // 5 Mbps
      1440: 8000000, // 8 Mbps
      2160: 16000000, // 16 Mbps
      4320: 40000000 // 40 Mbps
    }
    return bandwidthMap[resolution] || 1000000
  }

  private getResolutionWidth(height: number): number {
    // Calculate width based on 16:9 aspect ratio
    return Math.round((height * 16) / 9)
  }
}
