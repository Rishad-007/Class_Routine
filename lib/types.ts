export type Class = {
  id: number
  name: string
  display_name: string
  periods_count: number
  sort_order: number
}

export type Section = {
  id: number
  class_id: number
  name: string
}

export type Subject = {
  id: number
  name: string
  category: string
  applicable_classes: number[] | null
}

export type Teacher = {
  id: number
  name: string
  teacher_id: string
  photo_url: string | null
  created_at: string
}

export type TeacherSubject = {
  id: number
  teacher_id: number
  subject_id: number
  class_id: number
  class_load: number
  subjects?: Subject
  teachers?: Teacher
}

export type ClassTeacher = {
  id: number
  teacher_id: number
  section_id: number
  teachers?: Teacher
  sections?: Section & { classes?: Class }
}

export type Routine = {
  id: number
  section_id: number
  day_of_week: number
  period_number: number
  teacher_id: number
  subject_id: number
  is_class_teacher_period: boolean
  created_at: string
  updated_at: string
  teachers?: Teacher
  subjects?: Subject
}

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]
export const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu"]

export const PERIOD_START_TIMES: Record<number, string> = {
  1: "8:30",
  2: "9:15",
  3: "10:00",
  4: "10:45",
  5: "☕",
  6: "11:00",
  7: "11:45",
}

export const CATEGORY_COLORS: Record<string, string> = {
  core: "bg-blue-400",
  science: "bg-teal-400",
  commerce: "bg-orange-400",
  humanities: "bg-purple-400",
  additional: "bg-cyan-400",
}

export function getCategoryColor(category?: string) {
  return CATEGORY_COLORS[category || ""] || "bg-slate-300"
}

export const SUBJECT_CATEGORIES: Record<string, string> = {
  core: "Core Subjects (6-10)",
  science: "Science Group (9-10)",
  commerce: "Business Studies Group (9-10)",
  humanities: "Humanities Group (9-10)",
  additional: "Additional Electives",
}

export const DEFAULT_SUBJECTS: { name: string; category: string; applicable_classes: number[] | null }[] = [
  { name: "Bangla 1st Paper", category: "core", applicable_classes: null },
  { name: "Bangla 2nd Paper (Grammar/Composition)", category: "core", applicable_classes: null },
  { name: "English for Today", category: "core", applicable_classes: null },
  { name: "English Grammar", category: "core", applicable_classes: null },
  { name: "Mathematics", category: "core", applicable_classes: null },
  { name: "Science", category: "core", applicable_classes: null },
  { name: "Bangladesh and Global Studies (BGS)", category: "core", applicable_classes: null },
  { name: "Information and Communication Technology (ICT)", category: "core", applicable_classes: null },
  { name: "Physical Education and Health", category: "core", applicable_classes: null },
  { name: "Arts and Crafts / Fine Arts", category: "core", applicable_classes: null },
  { name: "Moral and Religious Education (Islam)", category: "core", applicable_classes: null },
  { name: "Moral and Religious Education (Hinduism)", category: "core", applicable_classes: null },
  { name: "Moral and Religious Education (Christianity)", category: "core", applicable_classes: null },
  { name: "Moral and Religious Education (Buddhism)", category: "core", applicable_classes: null },
  { name: "Work and Life-Oriented Education", category: "core", applicable_classes: null },
  { name: "Physics", category: "science", applicable_classes: [9, 10] },
  { name: "Chemistry", category: "science", applicable_classes: [9, 10] },
  { name: "Biology", category: "science", applicable_classes: [9, 10] },
  { name: "Higher Mathematics", category: "science", applicable_classes: [9, 10] },
  { name: "Accounting", category: "commerce", applicable_classes: [9, 10] },
  { name: "Finance and Banking", category: "commerce", applicable_classes: [9, 10] },
  { name: "Business Entrepreneurship", category: "commerce", applicable_classes: [9, 10] },
  { name: "Geography and Environment", category: "humanities", applicable_classes: [9, 10] },
  { name: "History of Bangladesh and World Civilization", category: "humanities", applicable_classes: [9, 10] },
  { name: "Civics and Citizenship", category: "humanities", applicable_classes: [9, 10] },
  { name: "Economics", category: "humanities", applicable_classes: [9, 10] },
  { name: "Agriculture Studies", category: "additional", applicable_classes: [9, 10] },
  { name: "Home Science", category: "additional", applicable_classes: [9, 10] },
  { name: "Arabic", category: "additional", applicable_classes: [9, 10] },
  { name: "Sanskrit", category: "additional", applicable_classes: [9, 10] },
  { name: "Pali", category: "additional", applicable_classes: [9, 10] },
]
