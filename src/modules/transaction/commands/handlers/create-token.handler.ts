import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { CreateTokenCommand } from "../create-token.command"
import Midtrans from "midtrans-client"
import { ConfigService } from "@nestjs/config"
import { TransactionRepository } from "../../repositories/transaction.repository"
import { Mapper } from "@automapper/core"
import { InjectMapper } from "@automapper/nestjs"
import { Transaction } from "../../entities/transaction.entity"
import { CreateTransactionDto } from "../../dtos/create-transaction.dto"
import { UserRepository } from "../../../user/repositories/user.repository"
import { CourseRepository } from "../../../course/repositories/course.repository"
import { PaymentStatus } from "../../enums/payment-status.enum"
import { CreateTransactionResponseDto } from "../../dtos/create-transaction-response.dto"
import { NotFoundException } from "@nestjs/common"

@CommandHandler(CreateTokenCommand)
export class CreateTokenHandler implements ICommandHandler<CreateTokenCommand> {
  private readonly snap: Midtrans.Snap

  public constructor(
    private readonly config: ConfigService,
    private readonly transactionRepository: TransactionRepository,
    private readonly userRepository: UserRepository,
    private readonly courseRepository: CourseRepository,
    @InjectMapper() private readonly mapper: Mapper
  ) {
    this.snap = new Midtrans.Snap({
      isProduction: false,
      serverKey: this.config.getOrThrow("MIDTRANS_SERVER"),
      clientKey: this.config.getOrThrow("MIDTRANS_CLIENT")
    })
  }

  public async execute(command: CreateTokenCommand): Promise<CreateTransactionResponseDto> {
    try {
      const dto = command.dto

      const user = await this.userRepository.findById(dto.userId)
      if (!user) throw new NotFoundException({ message: "User not found" })

      const course = await this.courseRepository.findById(dto.courseId)
      if (!course) throw new NotFoundException({ message: "Course not found" })

      const transaction = this.transactionRepository.create({
        user,
        course,
        amount: course.price,
        currency: "IDR",
        paymentGateway: "midtrans",
        status: PaymentStatus.COMPLETED
      })

      await this.transactionRepository.save(transaction)

      const parameter = {
        item_details: [
          {
            name: course.title,
            price: course.price,
            quantity: 1
          }
        ],
        transaction_details: {
          order_id: transaction.id,
          gross_amount: course.price
        },
        callbacks: {
          finish: this.config.getOrThrow("client.web.finishTransaction")
        }
      }

      const result = await this.snap.createTransaction(parameter)

      return {
        transactionId: transaction.id,
        snapToken: result.token,
        redirectUrl: result.redirect_url
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
