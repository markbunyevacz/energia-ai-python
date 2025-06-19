from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, Optional, List, Callable
from datetime import datetime
import asyncio
import structlog
from enum import Enum
import uuid

logger = structlog.get_logger(__name__)


class AgentStatus(Enum):
    """Agent lifecycle status enumeration."""
    INITIALIZING = "initializing"
    READY = "ready"
    BUSY = "busy"
    ERROR = "error"
    STOPPED = "stopped"


@dataclass
class AgentMetrics:
    """Performance metrics for agent monitoring."""
    total_executions: int = 0
    successful_executions: int = 0
    failed_executions: int = 0
    average_response_time: float = 0.0
    last_execution_time: Optional[datetime] = None
    uptime_start: datetime = field(default_factory=datetime.now)


@dataclass
class AgentMessage:
    """Standardized message format for agent communication."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    sender: str = ""
    receiver: str = ""
    message_type: str = "request"  # request, response, notification, error
    payload: Any = None
    timestamp: datetime = field(default_factory=datetime.now)
    correlation_id: Optional[str] = None


@dataclass
class AgentResult:
    """Standardized result format from an agent execution."""
    status: str  # e.g., 'completed', 'failed', 'in_progress'
    output: Any
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    execution_time: Optional[float] = None
    agent_name: Optional[str] = None


@dataclass 
class AgentConfig:
    """Configuration settings for agents."""
    max_concurrent_executions: int = 1
    timeout_seconds: int = 300
    retry_attempts: int = 3
    retry_delay: float = 1.0
    enable_metrics: bool = True
    log_level: str = "INFO"
    custom_settings: Dict[str, Any] = field(default_factory=dict)


class BaseAgent(ABC):
    """
    Abstract Base Class for all specialized agents in the Energia AI system.

    This class defines the common interface and lifecycle that all agents must adhere to,
    ensuring consistency and interoperability within the agentic framework.
    """

    def __init__(self, config: Optional[AgentConfig] = None):
        self.config = config or AgentConfig()
        self.status = AgentStatus.INITIALIZING
        self.metrics = AgentMetrics()
        self._message_handlers: Dict[str, Callable] = {}
        self._active_executions: List[str] = []
        self._semaphore = asyncio.Semaphore(self.config.max_concurrent_executions)
        
        # Initialize logging with agent-specific context
        self.logger = logger.bind(agent_name=self.agent_name)
        self.logger.info("Agent initializing", config=self.config)
        
        # Initialize the agent
        asyncio.create_task(self._initialize())

    @property
    @abstractmethod
    def agent_name(self) -> str:
        """Unique identifier for the agent."""
        pass

    @property
    @abstractmethod
    def agent_description(self) -> str:
        """Human-readable description of the agent's purpose."""
        pass

    async def _initialize(self):
        """Internal initialization method."""
        try:
            await self.initialize()
            self.status = AgentStatus.READY
            self.logger.info("Agent initialized successfully")
        except Exception as e:
            self.status = AgentStatus.ERROR
            self.logger.error("Agent initialization failed", error=str(e))
            raise

    async def initialize(self):
        """Override this method for custom initialization logic."""
        pass

    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None) -> AgentResult:
        """
        The main execution method for the agent with comprehensive error handling and metrics.
        """
        execution_id = str(uuid.uuid4())
        start_time = datetime.now()
        
        async with self._semaphore:
            try:
                self._active_executions.append(execution_id)
                self.status = AgentStatus.BUSY
                
                self.logger.info("Starting execution", 
                               execution_id=execution_id, 
                               query=query,
                               context_keys=list(context.keys()) if context else [])
                
                # Execute with timeout
                result = await asyncio.wait_for(
                    self._execute_with_retry(query, context),
                    timeout=self.config.timeout_seconds
                )
                
                # Update metrics
                execution_time = (datetime.now() - start_time).total_seconds()
                result.execution_time = execution_time
                result.agent_name = self.agent_name
                
                self._update_metrics(True, execution_time)
                self.logger.info("Execution completed successfully", 
                               execution_id=execution_id,
                               execution_time=execution_time)
                
                return result
                
            except asyncio.TimeoutError:
                error_msg = f"Execution timed out after {self.config.timeout_seconds} seconds"
                self.logger.error("Execution timeout", execution_id=execution_id)
                self._update_metrics(False, 0)
                return AgentResult(status="failed", output=None, error=error_msg, agent_name=self.agent_name)
                
            except Exception as e:
                error_msg = f"Execution failed: {str(e)}"
                self.logger.error("Execution failed", execution_id=execution_id, error=str(e))
                self._update_metrics(False, 0)
                return AgentResult(status="failed", output=None, error=error_msg, agent_name=self.agent_name)
                
            finally:
                self._active_executions.remove(execution_id)
                self.status = AgentStatus.READY if not self._active_executions else AgentStatus.BUSY

    async def _execute_with_retry(self, query: str, context: Optional[Dict[str, Any]]) -> AgentResult:
        """Execute with retry logic."""
        last_error = None
        
        for attempt in range(self.config.retry_attempts):
            try:
                return await self._execute_internal(query, context)
            except Exception as e:
                last_error = e
                if attempt < self.config.retry_attempts - 1:
                    await asyncio.sleep(self.config.retry_delay * (2 ** attempt))  # Exponential backoff
                    self.logger.warning("Execution attempt failed, retrying", 
                                      attempt=attempt + 1, 
                                      error=str(e))
                                      
        raise last_error

    @abstractmethod
    async def _execute_internal(self, query: str, context: Optional[Dict[str, Any]] = None) -> AgentResult:
        """
        Internal execution method that subclasses must implement.
        This replaces the old execute method.
        """
        pass

    async def send_message(self, receiver: str, message: AgentMessage):
        """Send a message to another agent."""
        message.sender = self.agent_name
        message.receiver = receiver
        
        self.logger.info("Sending message", 
                        receiver=receiver, 
                        message_type=message.message_type,
                        message_id=message.id)
        
        # In a real implementation, this would route through a message broker
        # For now, it's a placeholder for the communication protocol
        pass

    async def handle_message(self, message: AgentMessage) -> Optional[AgentMessage]:
        """Handle incoming messages from other agents."""
        handler = self._message_handlers.get(message.message_type)
        if handler:
            try:
                return await handler(message)
            except Exception as e:
                self.logger.error("Message handler failed", 
                                message_id=message.id, 
                                error=str(e))
                return AgentMessage(
                    message_type="error",
                    payload={"error": str(e)},
                    correlation_id=message.id
                )
        else:
            self.logger.warning("No handler for message type", 
                              message_type=message.message_type)
        return None

    def register_message_handler(self, message_type: str, handler: Callable):
        """Register a handler for a specific message type."""
        self._message_handlers[message_type] = handler
        self.logger.info("Message handler registered", message_type=message_type)

    def _update_metrics(self, success: bool, execution_time: float):
        """Update agent performance metrics."""
        if not self.config.enable_metrics:
            return
            
        self.metrics.total_executions += 1
        self.metrics.last_execution_time = datetime.now()
        
        if success:
            self.metrics.successful_executions += 1
        else:
            self.metrics.failed_executions += 1
            
        # Update rolling average
        if self.metrics.total_executions == 1:
            self.metrics.average_response_time = execution_time
        else:
            self.metrics.average_response_time = (
                (self.metrics.average_response_time * (self.metrics.total_executions - 1) + execution_time) 
                / self.metrics.total_executions
            )

    def get_info(self) -> Dict[str, Any]:
        """Returns comprehensive metadata about the agent."""
        return {
            "name": self.agent_name,
            "description": self.agent_description,
            "status": self.status.value,
            "metrics": {
                "total_executions": self.metrics.total_executions,
                "successful_executions": self.metrics.successful_executions,
                "failed_executions": self.metrics.failed_executions,
                "success_rate": (
                    self.metrics.successful_executions / max(self.metrics.total_executions, 1) * 100
                ),
                "average_response_time": self.metrics.average_response_time,
                "uptime_hours": (datetime.now() - self.metrics.uptime_start).total_seconds() / 3600,
                "last_execution": self.metrics.last_execution_time.isoformat() if self.metrics.last_execution_time else None
            },
            "config": {
                "max_concurrent_executions": self.config.max_concurrent_executions,
                "timeout_seconds": self.config.timeout_seconds,
                "retry_attempts": self.config.retry_attempts
            },
            "active_executions": len(self._active_executions)
        }

    async def shutdown(self):
        """Gracefully shutdown the agent."""
        self.logger.info("Agent shutting down")
        self.status = AgentStatus.STOPPED
        
        # Wait for active executions to complete
        while self._active_executions:
            await asyncio.sleep(0.1)
            
        self.logger.info("Agent shutdown complete") 