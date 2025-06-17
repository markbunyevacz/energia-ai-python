# Energia AI - Task Automation & Dynamic Cursor Configuration

## Overview

This system provides intelligent task automation and dynamic configuration for the Energia AI Hungarian Legal AI project. It combines **Task Master AI** with **Dynamic Cursor Configuration** to create a context-aware development environment.

## Features

### 🎯 Task Automation & Tailored Extensions

1. **Context-Aware Task Detection**
   - Automatically determines development context based on:
     - Recently modified files
     - Current working directory
     - Git branch names
     - Task Master AI active tasks

2. **Legal AI Specific Extensions**
   - Hungarian legal compliance validation
   - ELI (European Legislation Identifier) standard checking
   - GDPR compliance hints
   - Legal source crawling guidelines

3. **Task Master AI Integration**
   - Intelligent task prioritization
   - Context-aware task suggestions
   - Development phase tracking
   - Automatic task status updates

### 🔧 Dynamic Cursor Configuration

1. **Multi-Context Configurations**
   - **Backend Development**: FastAPI, databases, core services
   - **AI Development**: ML/AI, embeddings, RAG, Hungarian NLP
   - **Crawler Development**: Legal data crawling, anti-detection

2. **Automatic Context Switching**
   - Switches configuration based on current work context
   - Updates cursor rules and shortcuts dynamically
   - Integrates with Task Master AI for intelligent suggestions

## Architecture

```
.cursor/
├── automation-config.json      # Main automation configuration
├── config-manager.py          # Dynamic configuration manager
├── startup.py                 # Environment initialization
├── configs/
│   ├── backend.cursor         # Backend development config
│   ├── ai-development.cursor  # AI/ML development config
│   └── crawler-development.cursor # Crawler development config
├── mcp.json                   # Model Context Protocol config
└── environment.json           # Current environment state

scripts/
└── automation/
    ├── detect-task-context.py      # Task context detection
    └── check-legal-compliance.py   # Legal compliance validation
```

## Usage

### Basic Commands

```bash
# Automatic context detection and switching
python .cursor/config-manager.py auto

# Manual context switching
python .cursor/config-manager.py switch --context backend
python .cursor/config-manager.py switch --context ai-development
python .cursor/config-manager.py switch --context crawler-development

# Check current configuration status
python .cursor/config-manager.py status

# List available configurations
python .cursor/config-manager.py list

# Initialize complete environment
python .cursor/startup.py

# Start the automation service
python scripts/automation/start-task-automation.py start

# Check if it's running
python scripts/automation/start-task-automation.py status

# Stop the service
python scripts/automation/start-task-automation.py stop
```

### Task-Based Command Execution

You can associate a command with a task in Task Master AI to automate parts of your workflow.

1.  **Add a command to a task**: In your `.taskmaster/tasks/tasks.json` file, add a `"command"` key to a task. The value should be a shell command.

    ```json
    {
      "id": 1,
      "title": "Set up Python project structure",
      "status": "in-progress",
      "command": "ruff check . --fix",
      "..."
    }
    ```

2.  **Run the command**: Use the `run-task-action` command to execute the command associated with the *currently active* (`in-progress`) task.

    ```bash
    python .cursor/config-manager.py run-task-action
    ```

This will find the task with `"status": "in-progress"` and execute the command in the `"command"` field.

### Context-Specific Shortcuts

#### Backend Development Context
```bash
# Quick actions available when in backend context:
uvicorn main:app --reload       # Start development server
pytest                          # Run all tests
supabase db lint               # Check database migrations
```

#### AI Development Context
```bash
# Quick actions for AI/ML development:
python scripts/test_embeddings.py          # Test embedding generation
python scripts/validate_rag_pipeline.py    # Validate RAG pipeline
python scripts/benchmark_hungarian_nlp.py  # Benchmark Hungarian NLP
```

#### Crawler Development Context
```bash
# Quick actions for crawler development:
pytest app/crawlers/tests/test_jogtar_crawler.py     # Test Jogtár crawler
pytest app/crawlers/tests/test_magyar_kozlony_crawler.py # Test Magyar Közlöny crawler
python scripts/check_rate_compliance.py              # Check rate limiting compliance
```

## Configuration Details

### Automation Configuration (`.cursor/automation-config.json`)

```json
{
  "project": {
    "name": "Energia AI - Hungarian Legal AI System",
    "type": "legal-ai-backend",
    "language": "python",
    "framework": "fastapi",
    "domain": "legal-tech"
  },
  "automation": {
    "task_triggers": {
      "on_file_change": {
        "patterns": [
          {
            "pattern": "app/crawlers/**/*.py",
            "actions": ["validate_crawler", "run_tests", "update_crawler_docs"]
          }
        ]
      }
    },
    "context_aware_suggestions": {
      "legal_domain": {
        "when": "working_on_legal_logic",
        "suggest": [
          "Validate Hungarian legal citations",
          "Check Magyar Közlöny compliance",
          "Review ELI standard implementation"
        ]
      }
    }
  }
}
```

### Context-Specific Configurations

Each context has its own `.cursor` file with:
- **Rules**: Context-specific development guidelines
- **AI Instructions**: Tailored AI assistant behavior
- **File Associations**: Context-aware file handling
- **Shortcuts**: Quick commands for the context
- **Research Tools**: Relevant resources and databases

## Integration with Task Master AI

### Task Context Detection

The system integrates with your existing Task Master AI setup:

1. **Current Task Analysis**: Reads active tasks from `.taskmaster/tasks/tasks.json`
2. **Tag-Based Context**: Determines context from task tags (crawler, ai, backend)
3. **Priority Weighting**: Considers task priorities for context switching
4. **Status Tracking**: Updates configuration based on task status changes

### Automatic Task Suggestions

Based on current context, the system suggests:
- **Legal Domain Tasks**: Hungarian legal compliance, ELI standards
- **AI Component Tasks**: Hungarian NLP, embedding validation, RAG testing
- **Crawler Tasks**: Anti-detection, rate limiting, data validation

## Legal AI Specific Features

### Hungarian Legal Compliance

The system includes specialized validation for:
- **ELI Standards**: European Legislation Identifier compliance
- **GDPR Compliance**: Data protection requirements
- **Character Encoding**: Proper Hungarian character handling
- **Legal Citation Formats**: Hungarian legal citation standards

### Legal Source Integration

Automated support for Hungarian legal sources:
- **njt.hu**: National legal database
- **kozlonyok.hu**: Magyar Közlöny archive
- **birosag.hu**: Court decisions
- **kuria.hu**: Supreme Court rulings

## Advanced Features

### Git Integration

- **Pre-commit Hooks**: Automatic compliance checking
- **Branch-Based Context**: Context switching based on git branch names
- **Change Detection**: Configuration updates based on file changes

### Editor Integration

- **VSCode/Cursor Tasks**: Integrated task runner
- **Settings Sync**: Automatic settings updates
- **Context Files**: Dynamic context file management

## Troubleshooting

### Common Issues

1. **Unicode Encoding Issues**
   - Ensure proper UTF-8 encoding for Hungarian characters
   - Check terminal encoding settings

2. **Task Master AI Not Found**
   - Run `npx task-master-ai init` to initialize
   - Verify MCP configuration in `.cursor/mcp.json`

3. **Context Not Switching**
   - Check file modification timestamps
   - Verify git repository status
   - Review Task Master AI task status

### Debug Commands

```bash
# Check current context detection
python scripts/automation/detect-task-context.py

# Validate legal compliance
python scripts/automation/check-legal-compliance.py <file_path>

# Check configuration status
python .cursor/config-manager.py status
```

## Customization

### Adding New Contexts

1. Create new configuration file in `.cursor/configs/`
2. Define context-specific rules and shortcuts
3. Update automation configuration
4. Test context switching

### Extending Automation

1. Add new patterns to `automation-config.json`
2. Create helper scripts in `scripts/automation/`
3. Update context detection logic
4. Test with Task Master AI integration

## Community Extensions

The system is designed for extensibility:

### Creating Extensions

1. **Extension Structure**:
   ```
   .cursor/extensions/
   └── your-extension/
       ├── config.json
       ├── rules.json
       └── scripts/
   ```

2. **Extension Configuration**:
   ```json
   {
     "name": "Your Extension",
     "version": "1.0.0",
     "contexts": ["backend", "ai-development"],
     "triggers": ["file_change", "task_update"],
     "actions": ["validate", "suggest", "automate"]
   }
   ```

### Community Contributions

To contribute extensions:
1. Fork the repository
2. Create your extension in `.cursor/extensions/`
3. Add documentation and tests
4. Submit a pull request

## Best Practices

1. **Regular Updates**: Keep configurations updated with project evolution
2. **Context Validation**: Regularly validate context detection accuracy
3. **Performance Monitoring**: Monitor automation performance impact
4. **Legal Compliance**: Always validate legal compliance features
5. **Task Integration**: Maintain Task Master AI integration

## Future Enhancements

- **Machine Learning Context Detection**: More intelligent context switching
- **Cross-Project Configuration**: Share configurations across projects
- **Real-time Collaboration**: Team-based configuration sharing
- **Advanced Legal Validation**: More sophisticated compliance checking

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Task Master AI documentation
3. Check project-specific documentation in `docs/`
4. Create an issue in the project repository

This system transforms your development environment into an intelligent, context-aware assistant specifically tailored for Hungarian Legal AI development! 🚀 