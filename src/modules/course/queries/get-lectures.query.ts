import { Query } from "@nestjs/cqrs"
import { PaginationDto } from "../../../dto/pagination.dto"
import { LectureDto } from "../dto/lecture.dto"

export class GetLecturesQuery extends Query<PaginationDto<LectureDto>> {
  public constructor(
    public readonly courseId: string,
    public readonly sectionId: string,
    public readonly offset: number,
    public readonly limit: number
  ) {
    super()
  }
}
