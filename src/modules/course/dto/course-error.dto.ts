class CourseErrorMessage {
  public title!: string[]
  public description!: string[]
  public language!: string[]
  public price!: string[]
}

export class CourseErrorDto {
  public errors!: CourseErrorMessage
}
