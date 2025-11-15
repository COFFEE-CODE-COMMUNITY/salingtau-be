import { Command } from "@nestjs/cqrs"
import { Request } from "express"

export class UploadThumbnailCommand extends Command<any> {
  public constructor(
    public readonly courseIdOrSlug: string,
    public readonly req: Request
  ) {
    super()
  }
}
