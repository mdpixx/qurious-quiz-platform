import { type User, type InsertUser, type Quiz, type InsertQuiz, type Session, type InsertSession, type Response, type InsertResponse, type QuestionBankItem, type InsertQuestion } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Quizzes
  getQuiz(id: string): Promise<Quiz | undefined>;
  getQuizzesByUser(userId: string): Promise<Quiz[]>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz>;
  deleteQuiz(id: string): Promise<boolean>;

  // Sessions
  getSession(id: string): Promise<Session | undefined>;
  getSessionByCode(code: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session>;
  getActiveSessionsByUser(userId: string): Promise<Session[]>;

  // Responses
  createResponse(response: InsertResponse): Promise<Response>;
  getResponsesBySession(sessionId: string): Promise<Response[]>;

  // Question Bank
  getQuestionById(id: string): Promise<QuestionBankItem | undefined>;
  getQuestionsByUser(userId: string): Promise<QuestionBankItem[]>;
  createQuestion(question: InsertQuestion): Promise<QuestionBankItem>;
  searchQuestions(userId: string, query: string): Promise<QuestionBankItem[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private quizzes: Map<string, Quiz>;
  private sessions: Map<string, Session>;
  private responses: Map<string, Response>;
  private questions: Map<string, QuestionBankItem>;

  constructor() {
    this.users = new Map();
    this.quizzes = new Map();
    this.sessions = new Map();
    this.responses = new Map();
    this.questions = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      email: insertUser.email,
      username: insertUser.username,
      role: insertUser.role || "student",
      preferredLanguage: insertUser.preferredLanguage || "en",
      theme: insertUser.theme || "playful",
      organizationName: insertUser.organizationName || null,
      organizationLogo: insertUser.organizationLogo || null,
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Quizzes
  async getQuiz(id: string): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }

  async getQuizzesByUser(userId: string): Promise<Quiz[]> {
    return Array.from(this.quizzes.values()).filter(quiz => quiz.createdBy === userId);
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = randomUUID();
    const quiz: Quiz = { 
      id,
      title: insertQuiz.title,
      description: insertQuiz.description || null,
      createdBy: insertQuiz.createdBy,
      questions: insertQuiz.questions,
      settings: insertQuiz.settings,
      language: insertQuiz.language || "en",
      isPublic: insertQuiz.isPublic || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.quizzes.set(id, quiz);
    return quiz;
  }

  async updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz> {
    const quiz = this.quizzes.get(id);
    if (!quiz) throw new Error("Quiz not found");
    
    const updatedQuiz = { ...quiz, ...updates, updatedAt: new Date() };
    this.quizzes.set(id, updatedQuiz);
    return updatedQuiz;
  }

  async deleteQuiz(id: string): Promise<boolean> {
    return this.quizzes.delete(id);
  }

  // Sessions
  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async getSessionByCode(code: string): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find(session => session.sessionCode === code);
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = randomUUID();
    const session: Session = { 
      id,
      quizId: insertSession.quizId,
      hostId: insertSession.hostId,
      sessionCode: insertSession.sessionCode,
      status: insertSession.status || "waiting",
      currentQuestionIndex: insertSession.currentQuestionIndex || 0,
      participants: insertSession.participants || [],
      settings: insertSession.settings,
      startedAt: insertSession.startedAt || null,
      completedAt: insertSession.completedAt || null,
      createdAt: new Date()
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session> {
    const session = this.sessions.get(id);
    if (!session) throw new Error("Session not found");
    
    const updatedSession = { ...session, ...updates };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async getActiveSessionsByUser(userId: string): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.hostId === userId && session.status !== "completed");
  }

  // Responses
  async createResponse(insertResponse: InsertResponse): Promise<Response> {
    const id = randomUUID();
    const response: Response = { 
      id,
      sessionId: insertResponse.sessionId,
      participantId: insertResponse.participantId,
      questionIndex: insertResponse.questionIndex,
      answer: insertResponse.answer,
      isCorrect: insertResponse.isCorrect,
      responseTime: insertResponse.responseTime,
      points: insertResponse.points || 0,
      streak: insertResponse.streak || 0,
      createdAt: new Date()
    };
    this.responses.set(id, response);
    return response;
  }

  async getResponsesBySession(sessionId: string): Promise<Response[]> {
    return Array.from(this.responses.values())
      .filter(response => response.sessionId === sessionId);
  }

  // Question Bank
  async getQuestionById(id: string): Promise<QuestionBankItem | undefined> {
    return this.questions.get(id);
  }

  async getQuestionsByUser(userId: string): Promise<QuestionBankItem[]> {
    return Array.from(this.questions.values())
      .filter(question => question.createdBy === userId);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<QuestionBankItem> {
    const id = randomUUID();
    const question: QuestionBankItem = { 
      id,
      createdBy: insertQuestion.createdBy,
      question: insertQuestion.question,
      type: insertQuestion.type,
      options: insertQuestion.options || null,
      correctAnswer: insertQuestion.correctAnswer,
      explanation: insertQuestion.explanation || null,
      difficulty: insertQuestion.difficulty || "medium",
      category: insertQuestion.category || null,
      tags: insertQuestion.tags || [],
      source: insertQuestion.source || null,
      language: insertQuestion.language || "en",
      createdAt: new Date()
    };
    this.questions.set(id, question);
    return question;
  }

  async searchQuestions(userId: string, query: string): Promise<QuestionBankItem[]> {
    const userQuestions = await this.getQuestionsByUser(userId);
    return userQuestions.filter(question => 
      question.question.toLowerCase().includes(query.toLowerCase()) ||
      question.category?.toLowerCase().includes(query.toLowerCase())
    );
  }
}

export const storage = new MemStorage();
