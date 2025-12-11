import { Query } from "@nestjs/cqrs"

export class PurchaseStatusCheckQuery extends Query<boolean> {
  public constructor(
    public readonly userId: string,
    public readonly courseId: string,
    ) {
    super()
  }
}
