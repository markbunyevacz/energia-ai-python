export interface AgentTask {
  document?: any; // Base task, can be extended
}

export interface AgentResponse {
  [key: string]: any;
} 