import { Column, Entity, JoinColumn, OneToOne } from "typeorm"
import { BaseEntity } from "../../../base/base.entity"
import { Lecture } from "./lecture.entity"

@Entity({ name: "lecture_externals" })
export class LectureExternal extends BaseEntity {
  @OneToOne(() => Lecture, lecture => lecture.external, { onDelete: "CASCADE" })
  @JoinColumn({ name: "lecture_id" })
  public lecture!: Lecture

  @Column({ name: "url" })
  public url!: string
}
