import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "./use-websocket";
import { useToast } from "./use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Session, type Participant, type GameSettings } from "@shared/schema";

export function useSession() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<string>("");
  const [participantId, setParticipantId] = useState<string>("");
  const [isHost, setIsHost] = useState(false);

  const { subscribe, send, isConnected } = useWebSocket();

  // Get session details
  const { data: sessionData, isLoading } = useQuery({
    queryKey: ["/api/session", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const response = await fetch(`/api/session/${sessionId}`);
      if (!response.ok) throw new Error("Failed to fetch session");
      return response.json();
    },
    enabled: !!sessionId
  });

  const session: Session | null = sessionData?.session || null;

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: {
      quizId: string;
      hostId: string;
      settings: GameSettings;
    }) => {
      const response = await apiRequest("POST", "/api/session", data);
      return response.json();
    },
    onSuccess: (data) => {
      setSessionId(data.session.id);
      setIsHost(true);
      queryClient.invalidateQueries({ queryKey: ["/api/session", data.session.id] });
      
      if (isConnected) {
        send({
          type: "host_session",
          data: {
            sessionId: data.session.id,
            userId: data.session.hostId
          }
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Session",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Join session function
  const joinSession = useCallback(async (sessionCode: string, nickname: string) => {
    try {
      const response = await fetch(`/api/session/code/${sessionCode}`);
      if (!response.ok) throw new Error("Session not found");
      
      const data = await response.json();
      setSessionId(data.session.id);
      setIsHost(false);
      
      if (isConnected) {
        send({
          type: "join_session",
          data: { sessionCode, nickname }
        });
      }
      
      return data.session;
    } catch (error) {
      toast({
        title: "Failed to Join Session",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      throw error;
    }
  }, [send, isConnected, toast]);

  // Session control functions
  const startSession = useCallback(() => {
    if (!sessionId || !isConnected || !isHost) return;
    
    send({
      type: "host_start_session",
      data: { sessionId }
    });
  }, [sessionId, isConnected, isHost, send]);

  const pauseSession = useCallback(() => {
    if (!sessionId || !isConnected || !isHost) return;
    
    send({
      type: "host_pause_session", 
      data: { sessionId }
    });
  }, [sessionId, isConnected, isHost, send]);

  const nextQuestion = useCallback((questionIndex: number) => {
    if (!sessionId || !isConnected || !isHost) return;
    
    send({
      type: "host_next_question",
      data: { sessionId, questionIndex }
    });
  }, [sessionId, isConnected, isHost, send]);

  const endSession = useCallback(() => {
    if (!sessionId || !isConnected || !isHost) return;
    
    send({
      type: "host_end_session",
      data: { sessionId }
    });
  }, [sessionId, isConnected, isHost, send]);

  const submitAnswer = useCallback((questionIndex: number, answer: string, responseTime: number) => {
    if (!sessionId || !isConnected || isHost) return;
    
    send({
      type: "participant_answer",
      data: { questionIndex, answer, responseTime }
    });
  }, [sessionId, isConnected, isHost, send]);

  return {
    // State
    session,
    sessionId,
    participantId,
    isHost,
    isLoading,
    isConnected,
    
    // Mutations
    createSession: createSessionMutation.mutate,
    isCreatingSession: createSessionMutation.isPending,
    
    // Functions
    joinSession,
    startSession,
    pauseSession,
    nextQuestion,
    endSession,
    submitAnswer,
    
    // WebSocket utilities
    subscribe,
    send,
    
    // Setters (for manual state management if needed)
    setSessionId,
    setParticipantId,
    setIsHost
  };
}
