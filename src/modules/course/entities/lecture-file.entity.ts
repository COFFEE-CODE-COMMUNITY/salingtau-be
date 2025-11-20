import { Column, Entity, JoinColumn, OneToOne } from "typeorm"
import { BaseEntity } from "../../../base/base.entity"
import { Lecture } from "./lecture.entity"

@Entity({ name: "lecture_files" })
export class LectureFile extends BaseEntity {
  @OneToOne(() => Lecture, lecture => lecture.file, { onDelete: "CASCADE" })
  @JoinColumn({ name: "lecture_id" })
  public lecture!: Lecture

  @Column()
  public path!: string

  @Column({ type: "bigint" })
  public size!: number

  @Column()
  public mimetype!: string
}
