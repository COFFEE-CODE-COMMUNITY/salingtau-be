import { IsInt, IsNotEmpty, IsString, IsOptional, Min, Max } from "class-validator"

export class CreateCommentDto {
  @IsInt()
  @Min(1)
  @Max(5)
  public rating!: number

  @IsOptional()
  @IsString()
  public comment?: string | null
}
