import { Column, Entity, ManyToOne, OneToMany, VirtualColumn } from "typeorm"
import { BaseEntity } from "../../../base/base.entity"
import { Language } from "../../../enums/language"
import { CourseStatus } from "../enums/course-status.enum"
import { CourseSection } from "./course-section.entity"
import { AutoMap } from "@automapper/classes"
import { CourseCategory } from "./course-category.entity"
import { CourseReview } from "./course-review.entity"
import { ImageMetadata } from "../../../entities/image-metadata.entity"
import { User } from "../../user/entities/user.entity"
import { Transaction } from "../../transaction/entities/transaction.entity"
import { Rating } from "../../rating/entities/rating"

@Entity({ name: "courses" })
export class Course extends BaseEntity {
  @Column()
  @AutoMap()
  public title!: string

  @Column({ unique: true })
  @AutoMap()
  public slug!: string

  @Column({ type: "text", nullable: true })
  @AutoMap()
  public description?: string

  @Column({ type: "enum", enum: Language, default: Language.ENGLISH_US })
  @AutoMap()
  public language!: Language

  @Column()
  @AutoMap()
  public price!: number

  @Column({ type: "enum", enum: CourseStatus, default: CourseStatus.DRAFT })
  @AutoMap()
  public status!: CourseStatus

  @Column({ name: "thumbnail", type: "jsonb", nullable: true })
  @AutoMap(() => ImageMetadata)
  public thumbnail?: ImageMetadata

  @VirtualColumn({
    query: alias => `SELECT COALESCE(AVG(cr.rating), 0) FROM course_reviews cr WHERE cr."courseId" = ${alias}.id`
  })
  @AutoMap()
  public averageRating!: number

  @VirtualColumn({
    query: alias => `SELECT COUNT(cr.id) FROM course_reviews cr WHERE cr."courseId" = ${alias}.id`
  })
  @AutoMap()
  public totalReviews!: number

  @OneToMany(() => CourseSection, section => section.course, { cascade: true, onDelete: "CASCADE" })
  public sections!: CourseSection[]

  @ManyToOne(() => CourseCategory, category => category.courses)
  @AutoMap(() => CourseCategory)
  public category!: CourseCategory

  @OneToMany(() => CourseReview, courseReview => courseReview.course, { cascade: true, onDelete: "CASCADE" })
  public reviews!: CourseReview[]

  @ManyToOne(() => User, user => user.courses)
  @AutoMap(() => User)
  public instructor!: User

  @OneToMany(() => Transaction, transaction => transaction.course)
  public transactions!: Transaction[]

  @OneToMany(() => Rating, rating => rating.course)
  public ratings!: Rating[]
}
