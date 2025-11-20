import { Column, Entity, JoinColumn, OneToOne } from "typeorm"
import { BaseEntity } from "../../../base/base.entity"
import { Lecture } from "./lecture.entity"

@Entity({ name: "lecture_articles" })
export class LectureArticle extends BaseEntity {
  @OneToOne(() => Lecture, lecture => lecture.article, { onDelete: "CASCADE" })
  @JoinColumn({ name: "lecture_id" })
  public lecture!: Lecture

  @Column()
  public content!: string
}
