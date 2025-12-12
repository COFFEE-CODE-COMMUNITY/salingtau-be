import { IQueryHandler, QueryHandler } from "@nestjs/cqrs"
import { GetLecturesQuery } from "../get-lectures.query"
import { PaginationDto } from "../../../../dto/pagination.dto"
import { LectureDto } from "../../dto/lecture.dto"
import { PaginationFactory } from "../../../../factories/pagination.factory"
import { Pagination } from "../../../../utils/pagination.util"
import { Lecture } from "../../entities/lecture.entity"

@QueryHandler(GetLecturesQuery)
export class GetLecturesQueryHandler implements IQueryHandler<GetLecturesQuery> {
  private readonly pagination: Pagination<Lecture, LectureDto>

  public constructor(private readonly paginationFactory: PaginationFactory) {
    this.pagination = this.paginationFactory.create(Lecture, LectureDto)
  }

  public async execute(query: GetLecturesQuery): Promise<PaginationDto<LectureDto>> {
    const { limit, offset } = query

    return this.pagination.paginate(offset, limit, {
      where: {
        section: {
          id: query.sectionId,
          course: {
            id: query.courseId
          }
        }
      },
      order: {
        createdAt: "ASC"
      }
    })
  }
}
