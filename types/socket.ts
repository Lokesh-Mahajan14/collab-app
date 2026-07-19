export interface ServerToClientEvents {
  receive_message: (message: any) => void;

  user_typing: (
    conversationId: string,
    userId: string
  ) => void;

  user_stop_typing: (
    conversationId: string,
    userId: string
  ) => void;

  user_online: (
    userId: string
  ) => void;

  user_offline: (
    userId: string
  ) => void;
}

export interface ClientToServerEvents {
  join_conversation: (
    conversationId: string
  ) => void;

  leave_conversation: (
    conversationId: string
  ) => void;

  send_message: (
    conversationId: string,
    message: any
  ) => void;

  typing: (
    conversationId: string,
    userId: string
  ) => void;

  stop_typing: (
    conversationId: string,
    userId: string
  ) => void;

  receive_message: (
    message: any
  ) => void;

  user_typing: (
    user: {
      id: string;
      name: string;
    }
  ) => void;

  user_stop_typing: (
    userId: string
  ) => void;

}