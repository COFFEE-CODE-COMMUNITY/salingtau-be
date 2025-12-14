import { IQueryHandler, QueryHandler } from "@nestjs/cqrs"
import { GetLecturesQuery } from "../get-lectures.query"
import { PaginationDto } from "../../../../dto/pagination.dto"
import { LectureDto } from "../../dto/lecture.dto"
import { PaginationFactory } from "../../../../factories/pagination.factory"
import { Pagination } from "../../../../utils/pagination.util"
import { Lecture } from "../../entities/lecture.entity"
import { isUUID } from "class-validator"

@QueryHandler(GetLecturesQuery)
export class GetLecturesQueryHandler implements IQueryHandler<GetLecturesQuery> {
  private readonly pagination: Pagination<Lecture, LectureDto>

  public constructor(private readonly paginationFactory: PaginationFactory) {
    this.pagination = this.paginationFactory.create(Lecture, LectureDto)
  }

  public async execute(query: GetLecturesQuery): Promise<PaginationDto<LectureDto>> {
    const { limit, offset, courseId: courseIdOrSlug, sectionId } = query

    const courseWhere = isUUID(courseIdOrSlug) ? { id: courseIdOrSlug } : { slug: courseIdOrSlug }

    return this.pagination.paginate(offset, limit, {
      where: {
        section: {
          id: sectionId,
          course: courseWhere
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        displayOrder: true,
        video: {
          durationMilliseconds: true,
          size: true,
          path: true,
          mimetype: true,
          resolutions: true,
          status: true
        }
      },
      relations: {
        video: true
      },
      order: {
        displayOrder: "ASC"
      }
    })
  }
}
