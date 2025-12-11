import { Column, Entity, ManyToOne, JoinColumn, Unique } from "typeorm";
import { BaseEntity } from "../../../base/base.entity";
import { User } from "../../user/entities/user.entity";
import { Course } from "../../course/entities/course.entity";

@Entity("course_rating")
@Unique(["userId", "courseId"])
export class Rating extends BaseEntity {

  @Column({ type: "int", nullable: false })
  rating!: number;

  @Column({ type: "text", nullable: true })
  comment!: string | null;

  @Column({ name: "user_id" })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "course_id" })
  courseId!: string;

  @ManyToOne(() => Course, (course) => course.reviews, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "course_id" })
  course!: Course;
}
