// src/ai-demo/Assistant/ConversationContext.ts
// Manages conversation messages and session history

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  textFr: string;
  textWolof?: string;
  timestamp: string;
  actionId?: string;
  actionStatus?: 'success' | 'failed' | 'pending_confirmation';
  data?: any;
}

class ConversationContextService {
  private messages: ChatMessage[] = [];
  private currentLanguage: 'fr' | 'wo' = 'fr';
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.addSystemMessage(
      "Bonjour ! Je suis Acom IA, votre assistant de gestion. Parlez-moi en Français ou en Wolof.",
      "Na nga def ! Mangi tudd Acom IA, sa assistant bu gestion. Waxal ma ci Français walla Wolof."
    );
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }

  public getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  public getLanguage(): 'fr' | 'wo' {
    return this.currentLanguage;
  }

  public setLanguage(lang: 'fr' | 'wo'): void {
    this.currentLanguage = lang;
    this.notify();
  }

  public addUserMessage(text: string): ChatMessage {
    const msg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      textFr: text,
      timestamp: new Date().toISOString()
    };
    this.messages.push(msg);
    this.notify();
    return msg;
  }

  public addAssistantMessage(
    textFr: string,
    textWolof?: string,
    actionId?: string,
    actionStatus?: 'success' | 'failed' | 'pending_confirmation',
    data?: any
  ): ChatMessage {
    const msg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      textFr,
      textWolof,
      timestamp: new Date().toISOString(),
      actionId,
      actionStatus,
      data
    };
    this.messages.push(msg);
    this.notify();
    return msg;
  }

  public addSystemMessage(textFr: string, textWolof?: string): ChatMessage {
    const msg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'system',
      textFr,
      textWolof,
      timestamp: new Date().toISOString()
    };
    this.messages.push(msg);
    this.notify();
    return msg;
  }

  public clearMessages(): void {
    this.messages = [];
    this.notify();
  }
}

export const ConversationContext = new ConversationContextService();
