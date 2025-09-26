import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  role: text("role").notNull().default("student"), // professional, student, teacher
  preferredLanguage: text("preferred_language").notNull().default("en"),
  theme: text("theme").notNull().default("playful"), // playful, minimal
  organizationName: text("organization_name"),
  organizationLogo: text("organization_logo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  questions: jsonb("questions").notNull(), // Array of question objects
  settings: jsonb("settings").notNull(), // Game mode, timer, features
  language: text("language").notNull().default("en"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id),
  hostId: varchar("host_id").notNull().references(() => users.id),
  sessionCode: varchar("session_code", { length: 6 }).notNull().unique(),
  status: text("status").notNull().default("waiting"), // waiting, active, paused, completed
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  participants: jsonb("participants").notNull().default('[]'), // Array of participant objects
  settings: jsonb("settings").notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const responses = pgTable("responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => sessions.id),
  participantId: varchar("participant_id").notNull(),
  questionIndex: integer("question_index").notNull(),
  answer: text("answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  responseTime: integer("response_time").notNull(), // in milliseconds
  points: integer("points").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questionBank = pgTable("question_bank", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  question: text("question").notNull(),
  type: text("type").notNull(), // mcq, true_false, short_answer, poll
  options: jsonb("options"), // Array of options for MCQ
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  difficulty: text("difficulty").notNull().default("medium"), // easy, medium, hard
  category: text("category"),
  tags: jsonb("tags").default('[]'), // Array of tags
  source: text("source"), // Citation from AI generation
  language: text("language").notNull().default("en"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export const insertResponseSchema = createInsertSchema(responses).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questionBank).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export type Response = typeof responses.$inferSelect;
export type InsertResponse = z.infer<typeof insertResponseSchema>;

export type QuestionBankItem = typeof questionBank.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

// Question types
export interface Question {
  id: string;
  text: string;
  type: "mcq" | "true_false" | "short_answer" | "poll";
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  source?: string;
  timeLimit?: number;
}

export interface Participant {
  id: string;
  nickname: string;
  joinedAt: string;
  isReady: boolean;
  score: number;
  streak: number;
  avatar?: string;
}

export interface GameSettings {
  mode: "speed" | "accuracy" | "team";
  timePerQuestion: number;
  enableStreaks: boolean;
  enableConfetti: boolean;
  enableSounds: boolean;
  showAnswersAfterEach: boolean;
}
