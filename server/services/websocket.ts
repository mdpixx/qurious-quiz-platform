import { WebSocketServer, WebSocket } from "ws";
import { type Server } from "http";
import { storage } from "../storage";
import { type Participant } from "@shared/schema";

interface WebSocketMessage {
  type: string;
  sessionId?: string;
  participantId?: string;
  data?: any;
}

interface SessionConnection {
  sessionId: string;
  isHost: boolean;
  participantId?: string;
  userId?: string;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private connections: Map<WebSocket, SessionConnection> = new Map();
  private sessionConnections: Map<string, Set<WebSocket>> = new Map();

  init(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    
    this.wss.on('connection', (ws) => {
      console.log('New WebSocket connection');
      
      ws.on('message', async (data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('WebSocket message error:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnection(ws);
      });
    });
  }

  private async handleMessage(ws: WebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case 'join_session':
        await this.handleJoinSession(ws, message);
        break;
      case 'host_session':
        await this.handleHostSession(ws, message);
        break;
      case 'participant_answer':
        await this.handleParticipantAnswer(ws, message);
        break;
      case 'host_next_question':
        await this.handleNextQuestion(ws, message);
        break;
      case 'host_start_session':
        await this.handleStartSession(ws, message);
        break;
      case 'host_pause_session':
        await this.handlePauseSession(ws, message);
        break;
      case 'host_end_session':
        await this.handleEndSession(ws, message);
        break;
      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  private async handleJoinSession(ws: WebSocket, message: WebSocketMessage) {
    const { sessionCode, nickname } = message.data;
    
    try {
      const session = await storage.getSessionByCode(sessionCode);
      if (!session) {
        this.sendError(ws, 'Session not found');
        return;
      }

      if (session.status === 'completed') {
        this.sendError(ws, 'Session has ended');
        return;
      }

      const participantId = `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const participant: Participant = {
        id: participantId,
        nickname: nickname,
        joinedAt: new Date().toISOString(),
        isReady: true,
        score: 0,
        streak: 0,
      };

      // Add participant to session
      const currentParticipants = Array.isArray(session.participants) ? session.participants : [];
      currentParticipants.push(participant);
      
      await storage.updateSession(session.id, {
        participants: currentParticipants
      });

      // Store connection info
      this.connections.set(ws, {
        sessionId: session.id,
        isHost: false,
        participantId: participantId
      });

      // Add to session connections
      if (!this.sessionConnections.has(session.id)) {
        this.sessionConnections.set(session.id, new Set());
      }
      this.sessionConnections.get(session.id)!.add(ws);

      // Notify participant
      this.sendMessage(ws, {
        type: 'join_success',
        data: {
          sessionId: session.id,
          participantId: participantId,
          quiz: await storage.getQuiz(session.quizId)
        }
      });

      // Notify all connections in session about new participant
      this.broadcastToSession(session.id, {
        type: 'participant_joined',
        data: {
          participant: participant,
          totalParticipants: currentParticipants.length
        }
      });

    } catch (error) {
      console.error('Join session error:', error);
      this.sendError(ws, 'Failed to join session');
    }
  }

  private async handleHostSession(ws: WebSocket, message: WebSocketMessage) {
    const { sessionId, userId } = message.data;
    
    try {
      const session = await storage.getSession(sessionId);
      if (!session) {
        this.sendError(ws, 'Session not found');
        return;
      }

      if (session.hostId !== userId) {
        this.sendError(ws, 'Unauthorized');
        return;
      }

      // Store connection info
      this.connections.set(ws, {
        sessionId: session.id,
        isHost: true,
        userId: userId
      });

      // Add to session connections
      if (!this.sessionConnections.has(session.id)) {
        this.sessionConnections.set(session.id, new Set());
      }
      this.sessionConnections.get(session.id)!.add(ws);

      // Send current session state
      this.sendMessage(ws, {
        type: 'host_connected',
        data: {
          session: session,
          participants: session.participants || []
        }
      });

    } catch (error) {
      console.error('Host session error:', error);
      this.sendError(ws, 'Failed to connect as host');
    }
  }

  private async handleParticipantAnswer(ws: WebSocket, message: WebSocketMessage) {
    const connection = this.connections.get(ws);
    if (!connection || connection.isHost) {
      this.sendError(ws, 'Unauthorized');
      return;
    }

    const { questionIndex, answer, responseTime } = message.data;
    
    try {
      const session = await storage.getSession(connection.sessionId);
      if (!session) {
        this.sendError(ws, 'Session not found');
        return;
      }

      const quiz = await storage.getQuiz(session.quizId);
      if (!quiz) {
        this.sendError(ws, 'Quiz not found');
        return;
      }

      const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
      const currentQuestion = questions[questionIndex];
      
      if (!currentQuestion) {
        this.sendError(ws, 'Invalid question index');
        return;
      }

      // Calculate if answer is correct
      const isCorrect = answer === currentQuestion.correctAnswer;
      
      // Calculate points (example scoring system)
      let points = 0;
      if (isCorrect) {
        const timeBonus = Math.max(0, 1000 - responseTime);
        points = 500 + timeBonus;
      }

      // Update participant streak
      const participants = Array.isArray(session.participants) ? session.participants : [];
      const participantIndex = participants.findIndex(p => p.id === connection.participantId);
      
      if (participantIndex >= 0) {
        const participant = participants[participantIndex];
        participant.score += points;
        participant.streak = isCorrect ? participant.streak + 1 : 0;
        
        await storage.updateSession(session.id, { participants });
      }

      // Store response
      await storage.createResponse({
        sessionId: connection.sessionId,
        participantId: connection.participantId!,
        questionIndex: questionIndex,
        answer: answer,
        isCorrect: isCorrect,
        responseTime: responseTime,
        points: points,
        streak: participants[participantIndex]?.streak || 0
      });

      // Send response confirmation to participant
      this.sendMessage(ws, {
        type: 'answer_received',
        data: {
          isCorrect: isCorrect,
          points: points,
          streak: participants[participantIndex]?.streak || 0
        }
      });

      // Notify host of response
      this.broadcastToSessionHosts(connection.sessionId, {
        type: 'participant_answered',
        data: {
          participantId: connection.participantId,
          questionIndex: questionIndex,
          totalResponses: await this.getResponseCount(connection.sessionId, questionIndex)
        }
      });

    } catch (error) {
      console.error('Participant answer error:', error);
      this.sendError(ws, 'Failed to process answer');
    }
  }

  private async handleNextQuestion(ws: WebSocket, message: WebSocketMessage) {
    const connection = this.connections.get(ws);
    if (!connection || !connection.isHost) {
      this.sendError(ws, 'Unauthorized');
      return;
    }

    try {
      const session = await storage.getSession(connection.sessionId);
      if (!session) {
        this.sendError(ws, 'Session not found');
        return;
      }

      const nextQuestionIndex = session.currentQuestionIndex + 1;
      
      await storage.updateSession(session.id, {
        currentQuestionIndex: nextQuestionIndex
      });

      // Broadcast next question to all participants
      this.broadcastToSession(connection.sessionId, {
        type: 'next_question',
        data: {
          questionIndex: nextQuestionIndex
        }
      });

    } catch (error) {
      console.error('Next question error:', error);
      this.sendError(ws, 'Failed to advance question');
    }
  }

  private async handleStartSession(ws: WebSocket, message: WebSocketMessage) {
    const connection = this.connections.get(ws);
    if (!connection || !connection.isHost) {
      this.sendError(ws, 'Unauthorized');
      return;
    }

    try {
      await storage.updateSession(connection.sessionId, {
        status: 'active',
        startedAt: new Date()
      });

      this.broadcastToSession(connection.sessionId, {
        type: 'session_started',
        data: {}
      });

    } catch (error) {
      console.error('Start session error:', error);
      this.sendError(ws, 'Failed to start session');
    }
  }

  private async handlePauseSession(ws: WebSocket, message: WebSocketMessage) {
    const connection = this.connections.get(ws);
    if (!connection || !connection.isHost) {
      this.sendError(ws, 'Unauthorized');
      return;
    }

    try {
      await storage.updateSession(connection.sessionId, {
        status: 'paused'
      });

      this.broadcastToSession(connection.sessionId, {
        type: 'session_paused',
        data: {}
      });

    } catch (error) {
      console.error('Pause session error:', error);
      this.sendError(ws, 'Failed to pause session');
    }
  }

  private async handleEndSession(ws: WebSocket, message: WebSocketMessage) {
    const connection = this.connections.get(ws);
    if (!connection || !connection.isHost) {
      this.sendError(ws, 'Unauthorized');
      return;
    }

    try {
      await storage.updateSession(connection.sessionId, {
        status: 'completed',
        completedAt: new Date()
      });

      this.broadcastToSession(connection.sessionId, {
        type: 'session_ended',
        data: {}
      });

      // Clean up connections
      this.cleanupSession(connection.sessionId);

    } catch (error) {
      console.error('End session error:', error);
      this.sendError(ws, 'Failed to end session');
    }
  }

  private handleDisconnection(ws: WebSocket) {
    const connection = this.connections.get(ws);
    if (connection) {
      // Remove from session connections
      const sessionConnections = this.sessionConnections.get(connection.sessionId);
      if (sessionConnections) {
        sessionConnections.delete(ws);
        
        // If participant disconnected, notify others
        if (!connection.isHost && connection.participantId) {
          this.broadcastToSession(connection.sessionId, {
            type: 'participant_left',
            data: {
              participantId: connection.participantId
            }
          });
        }
      }
      
      this.connections.delete(ws);
    }
  }

  private sendMessage(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string) {
    this.sendMessage(ws, {
      type: 'error',
      data: { message: error }
    });
  }

  private broadcastToSession(sessionId: string, message: any) {
    const connections = this.sessionConnections.get(sessionId);
    if (connections) {
      connections.forEach(ws => {
        this.sendMessage(ws, message);
      });
    }
  }

  private broadcastToSessionHosts(sessionId: string, message: any) {
    const connections = this.sessionConnections.get(sessionId);
    if (connections) {
      connections.forEach(ws => {
        const connection = this.connections.get(ws);
        if (connection && connection.isHost) {
          this.sendMessage(ws, message);
        }
      });
    }
  }

  private async getResponseCount(sessionId: string, questionIndex: number): Promise<number> {
    const responses = await storage.getResponsesBySession(sessionId);
    return responses.filter(r => r.questionIndex === questionIndex).length;
  }

  private cleanupSession(sessionId: string) {
    const connections = this.sessionConnections.get(sessionId);
    if (connections) {
      connections.forEach(ws => {
        this.connections.delete(ws);
      });
      this.sessionConnections.delete(sessionId);
    }
  }
}

export const webSocketManager = new WebSocketManager();
