import { IsOptional, Min, Max } from "class-validator";

export class UpdateCommentDto {
  @IsOptional()
  @Min(1)
  @Max(5)
  public rating!: number | null;

  @IsOptional()
  public comment?: string | null;
}
