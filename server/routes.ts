import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { webSocketManager } from "./services/websocket";
import { aiQuizGenerator } from "./services/ai-quiz-generator";
import { insertUserSchema, insertQuizSchema, insertSessionSchema } from "@shared/schema";
import { randomBytes } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket server
  webSocketManager.init(httpServer);

  // User routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.json({ user });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/user/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.patch("/api/user/:id", async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(req.params.id, updates);
      res.json({ user });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Quiz routes
  app.get("/api/quizzes", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }
      
      const quizzes = await storage.getQuizzesByUser(userId as string);
      res.json({ quizzes });
    } catch (error) {
      console.error("Get quizzes error:", error);
      res.status(500).json({ message: "Failed to get quizzes" });
    }
  });

  app.get("/api/quiz/:id", async (req, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json({ quiz });
    } catch (error) {
      console.error("Get quiz error:", error);
      res.status(500).json({ message: "Failed to get quiz" });
    }
  });

  app.post("/api/quiz", async (req, res) => {
    try {
      const quizData = insertQuizSchema.parse(req.body);
      const quiz = await storage.createQuiz(quizData);
      res.json({ quiz });
    } catch (error) {
      console.error("Create quiz error:", error);
      res.status(400).json({ message: "Invalid quiz data" });
    }
  });

  app.patch("/api/quiz/:id", async (req, res) => {
    try {
      const updates = req.body;
      const quiz = await storage.updateQuiz(req.params.id, updates);
      res.json({ quiz });
    } catch (error) {
      console.error("Update quiz error:", error);
      res.status(500).json({ message: "Failed to update quiz" });
    }
  });

  app.delete("/api/quiz/:id", async (req, res) => {
    try {
      const success = await storage.deleteQuiz(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete quiz error:", error);
      res.status(500).json({ message: "Failed to delete quiz" });
    }
  });

  // AI Quiz Generation routes
  app.post("/api/ai/generate-from-text", async (req, res) => {
    try {
      const { content, options } = req.body;
      
      if (!content || !options) {
        return res.status(400).json({ message: "Content and options required" });
      }
      
      const questions = await aiQuizGenerator.generateFromText(content, options);
      res.json({ questions });
    } catch (error) {
      console.error("AI generation error:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to generate questions" });
    }
  });

  app.post("/api/ai/generate-from-url", async (req, res) => {
    try {
      const { url, options } = req.body;
      
      if (!url || !options) {
        return res.status(400).json({ message: "URL and options required" });
      }
      
      const questions = await aiQuizGenerator.generateFromURL(url, options);
      res.json({ questions });
    } catch (error) {
      console.error("AI URL generation error:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to generate questions from URL" });
    }
  });

  // Session routes
  app.post("/api/session", async (req, res) => {
    try {
      const sessionData = req.body;
      
      // Generate unique session code
      const sessionCode = randomBytes(3).toString('hex').toUpperCase();
      
      const session = await storage.createSession({
        ...sessionData,
        sessionCode,
        participants: []
      });
      
      res.json({ session });
    } catch (error) {
      console.error("Create session error:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.get("/api/session/:id", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json({ session });
    } catch (error) {
      console.error("Get session error:", error);
      res.status(500).json({ message: "Failed to get session" });
    }
  });

  app.get("/api/session/code/:code", async (req, res) => {
    try {
      const session = await storage.getSessionByCode(req.params.code);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json({ session });
    } catch (error) {
      console.error("Get session by code error:", error);
      res.status(500).json({ message: "Failed to get session" });
    }
  });

  app.get("/api/sessions/active/:userId", async (req, res) => {
    try {
      const sessions = await storage.getActiveSessionsByUser(req.params.userId);
      res.json({ sessions });
    } catch (error) {
      console.error("Get active sessions error:", error);
      res.status(500).json({ message: "Failed to get active sessions" });
    }
  });

  // Analytics routes
  app.get("/api/session/:id/responses", async (req, res) => {
    try {
      const responses = await storage.getResponsesBySession(req.params.id);
      res.json({ responses });
    } catch (error) {
      console.error("Get responses error:", error);
      res.status(500).json({ message: "Failed to get responses" });
    }
  });

  app.get("/api/session/:id/analytics", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const responses = await storage.getResponsesBySession(req.params.id);
      const quiz = await storage.getQuiz(session.quizId);
      
      // Calculate analytics
      const participants = Array.isArray(session.participants) ? session.participants : [];
      const totalQuestions = Array.isArray(quiz?.questions) ? quiz.questions.length : 0;
      
      const analytics = {
        sessionInfo: {
          id: session.id,
          sessionCode: session.sessionCode,
          status: session.status,
          startedAt: session.startedAt,
          completedAt: session.completedAt,
        },
        participantStats: {
          totalParticipants: participants.length,
          averageScore: participants.length > 0 
            ? participants.reduce((sum, p) => sum + p.score, 0) / participants.length 
            : 0,
          topPerformers: participants
            .sort((a, b) => b.score - a.score)
            .slice(0, 5),
        },
        questionStats: Array.isArray(quiz?.questions) ? quiz.questions.map((question, index) => {
          const questionResponses = responses.filter(r => r.questionIndex === index);
          const correctResponses = questionResponses.filter(r => r.isCorrect);
          
          return {
            questionIndex: index,
            question: question.question,
            totalResponses: questionResponses.length,
            correctResponses: correctResponses.length,
            accuracy: questionResponses.length > 0 
              ? (correctResponses.length / questionResponses.length) * 100 
              : 0,
            averageTime: questionResponses.length > 0
              ? questionResponses.reduce((sum, r) => sum + r.responseTime, 0) / questionResponses.length
              : 0,
          };
        }) : [],
        responseData: responses,
      };
      
      res.json({ analytics });
    } catch (error) {
      console.error("Get analytics error:", error);
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  // Export routes
  app.get("/api/session/:id/export/csv", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const responses = await storage.getResponsesBySession(req.params.id);
      
      // Generate CSV data
      const csvHeaders = "Participant ID,Question Index,Answer,Is Correct,Response Time,Points,Streak,Created At\n";
      const csvData = responses.map(r => 
        `${r.participantId},${r.questionIndex},"${r.answer}",${r.isCorrect},${r.responseTime},${r.points},${r.streak},${r.createdAt?.toISOString()}`
      ).join("\n");
      
      const csv = csvHeaders + csvData;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="quiz-session-${session.sessionCode}-responses.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Export CSV error:", error);
      res.status(500).json({ message: "Failed to export CSV" });
    }
  });

  // Question Bank routes
  app.get("/api/questions", async (req, res) => {
    try {
      const { userId, search } = req.query;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }
      
      let questions;
      if (search) {
        questions = await storage.searchQuestions(userId as string, search as string);
      } else {
        questions = await storage.getQuestionsByUser(userId as string);
      }
      
      res.json({ questions });
    } catch (error) {
      console.error("Get questions error:", error);
      res.status(500).json({ message: "Failed to get questions" });
    }
  });

  app.post("/api/question", async (req, res) => {
    try {
      const questionData = req.body;
      const question = await storage.createQuestion(questionData);
      res.json({ question });
    } catch (error) {
      console.error("Create question error:", error);
      res.status(400).json({ message: "Invalid question data" });
    }
  });

  return httpServer;
}
