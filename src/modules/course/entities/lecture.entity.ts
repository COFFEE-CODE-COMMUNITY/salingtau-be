import { Column, Entity, ManyToOne, OneToOne } from "typeorm"
import { BaseEntity } from "../../../base/base.entity"
import { CourseLectureType } from "../enums/course-lecture-type.enum"
import { CourseSection } from "./course-section.entity"
import { LectureArticle } from "./lecture-article.entity"
import { LectureExternal } from "./lecture-external.entity"
import { LectureFile } from "./lecture-file.entity"
import { LectureVideo } from "./lecture-video.entity"
import { AutoMap } from "@automapper/classes"

@Entity({ name: "lectures" })
export class Lecture extends BaseEntity {
  @Column()
  @AutoMap()
  public title!: string

  @Column()
  @AutoMap()
  public description!: string

  @Column({
    type: "enum",
    enum: CourseLectureType
  })
  @AutoMap()
  public type!: CourseLectureType

  @Column({ name: "display_order" })
  @AutoMap()
  public displayOrder!: number

  @OneToOne(() => LectureArticle, article => article.lecture, { cascade: true, onDelete: "CASCADE" })
  public article?: LectureArticle

  @OneToOne(() => LectureExternal, external => external.lecture, { cascade: true, onDelete: "CASCADE" })
  public external?: LectureExternal

  @OneToOne(() => LectureFile, file => file.lecture, { cascade: true, onDelete: "CASCADE" })
  public file?: LectureFile

  @OneToOne(() => LectureVideo, video => video.lecture, { cascade: true, onDelete: "CASCADE" })
  @AutoMap(() => LectureVideo)
  public video?: LectureVideo

  @ManyToOne(() => CourseSection, section => section.id, { onDelete: "CASCADE" })
  public section!: CourseSection
}
