import { AutoMap } from "@automapper/classes"
import { LectureVideoStatus } from "../enums/lecture-video-status.enum"

export class LectureVideoDto {
  @AutoMap()
  public durationMilliseconds?: number

  @AutoMap()
  public size?: number

  @AutoMap()
  public path?: string

  @AutoMap()
  public mimetype?: string

  @AutoMap(() => [Number])
  public resolutions?: number[]

  @AutoMap(() => String)
  public status!: LectureVideoStatus
}
