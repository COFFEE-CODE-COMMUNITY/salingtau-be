import { Column, Entity, ManyToOne, OneToMany } from "typeorm"
import { BaseEntity } from "../../../base/base.entity"
import { Course } from "./course.entity"
import { Lecture } from "./lecture.entity"
import { AutoMap } from "@automapper/classes"

@Entity({ name: "course_sections" })
export class CourseSection extends BaseEntity {
  @Column()
  @AutoMap()
  public title!: string

  @Column({ name: "display_order" })
  @AutoMap()
  public displayOrder!: number

  @ManyToOne(() => Course, course => course.sections)
  public course!: Course

  @OneToMany(() => Lecture, lecture => lecture.section)
  public lectures!: Lecture[]
}
