import { Query } from "@nestjs/cqrs"

export class GetCommentQuery extends Query<any> {
  public constructor(
    public readonly userId: string,
    public readonly courseId: string
  ) {
    super()
  }
}
