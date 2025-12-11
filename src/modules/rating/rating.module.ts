import { Module } from "@nestjs/common"
import { RatingController } from "./controllers/rating.controller"
import { GetCommentHandler } from "./queries/handlers/get-comment.handler"
import { PurchaseStatusCheckHandler } from "./queries/handlers/purchase-status-check.handler"
import { CreateCommentHandler } from "./commands/handlers/create-comment.handler"
import { DeleteCommentHandler } from "./commands/handlers/delete-comment.handler"
import { UpdateCommentHandler } from "./commands/handlers/update-comment.handler"
import { RatingRepository } from "./repositories/rating.repository"
import { TransactionModule } from "../transaction/transaction.module"
import { TransactionRepository } from "../transaction/repositories/transaction.repository"

@Module({
  imports: [TransactionModule],
  controllers: [RatingController],
  providers: [
    GetCommentHandler,
    PurchaseStatusCheckHandler,
    CreateCommentHandler,
    DeleteCommentHandler,
    UpdateCommentHandler,

    RatingRepository,
    TransactionRepository,
  ]
})
export class RatingModule {}
