#!/usr/bin/env tsx

import { aiConfig } from '../config/ai-config';
import { aiFactory } from '../llm/ai-factory';
import { AIProvider } from '../llm/ai-service';
import { createTaskAI, createAIService } from '@/llm/ai-factory';

async function main() {
  console.log('🚀 Setting up AI Services for Jogi AI Demo\n');
  
  // Print current configuration
  aiConfig.printConfiguration();
  console.log('\n');

  // Validate configuration
  const validation = aiConfig.validateConfiguration();
  if (!validation.valid) {
    console.log('❌ Configuration validation failed!');
    console.log('Please check the following issues:');
    validation.errors.forEach(error => console.log(`   - ${error}`));
    console.log('\n📝 To fix these issues:');
    console.log('1. Create a .env file in the project root');
    console.log('2. Add your API keys using these variable names:');
    console.log('   - OPENAI_API_KEY=your_openai_key_here');
    console.log('   - ANTHROPIC_API_KEY=your_anthropic_key_here');
    console.log('   - GEMINI_API_KEY=your_gemini_key_here');
    console.log('   - DEEPSEEK_API_KEY=your_deepseek_key_here');
    console.log('3. Also add VITE_ prefixed versions for frontend access');
    console.log('4. Restart the application');
    return;
  }

  console.log('✅ Configuration is valid!\n');

  // Test available services
  console.log('🔍 Testing AI service connections...\n');
  
  const testResults = await aiFactory.testAllServices();
  
  let workingServices = 0;
  for (const [provider, isWorking] of testResults) {
    if (isWorking) {
      workingServices++;
      
      // Test specific tasks with working services
      console.log(`\n🧪 Testing ${provider} with different task optimizations:`);
      
      try {
        const analysisAI = aiFactory.createForTask('analysis');
        const reasoningAI = aiFactory.createForTask('reasoning');
        
        if (analysisAI && reasoningAI) {
          console.log(`   ✅ Task-specific AI services created successfully`);
        }
      } catch (error) {
        console.log(`   ⚠️  Task-specific service creation failed: ${error}`);
      }
    }
  }

  if (workingServices === 0) {
    console.log('\n❌ No AI services are working properly!');
    console.log('Please check:');
    console.log('1. Your API keys are correct and valid');
    console.log('2. You have sufficient API credits/quota');
    console.log('3. Your internet connection is working');
    return;
  }

  console.log(`\n🎉 Setup complete! ${workingServices} AI service(s) are working properly.`);
  
  // Show model recommendations
  console.log('\n💡 Model Recommendations:');
  console.log('  • For legal reasoning: Claude 3.5 Sonnet');
  console.log('  • For code analysis: GPT-4o');
  console.log('  • For document translation: Gemini 1.5 Pro');
  console.log('  • For creative tasks: Any model with higher temperature');
  
  // Show usage examples
  console.log('\n📖 Usage Examples:');
  console.log(`
import { createTaskAI, createAIService } from '@/llm/ai-factory';

// Task-optimized (automatically selects best model)
const legalAI = createTaskAI('analysis');      // Uses Claude for reasoning
const codeAI = createTaskAI('coding');         // Uses GPT-4o Mini
const translationAI = createTaskAI('translation'); // Uses Gemini

// Specific models
const claude = createAIService('claude', 'claude-4-sonnet-thinking');
const gpt = createAIService('openai', 'gpt-4o-mini-high');
const gemini = createAIService('gemini', 'gemini-2.5-pro');
const deepseek = createAIService('deepseek', 'deepseek-r1-0528');

// Generate responses
const result = await legalAI.generate('Analyze this contract...');
console.log(result.content);
`);

  console.log('\n🎯 Available Models:');
  console.log('  • o4 mini (high) - Fast and efficient for general tasks');
  console.log('  • claude 4 sonnet thinking - Advanced reasoning and analysis');
  console.log('  • gemini 2.5 pro (06.25) - Large context window and multimodal');
  console.log('  • Deepseek R1 0528 - Cost-effective and powerful');

  console.log('\n🔧 Management Interface:');
  console.log('  • Access the AI Model Manager UI at /ai-setup');
  console.log('  • Add custom models and manage API keys');
  console.log('  • Test model connections and performance');

  console.log('\n✨ Your AI-powered legal platform is ready to use!');
}

// Handle CLI arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
AI Setup Script for Jogi AI Demo

Usage: npm run setup:ai [options]

Options:
  --help, -h        Show this help message
  --config-only     Only show configuration without testing
  --test-only       Only test services without setup info

Environment Variables Required:
  OPENAI_API_KEY         Your OpenAI API key
  ANTHROPIC_API_KEY      Your Anthropic (Claude) API key  
  GEMINI_API_KEY         Your Google AI (Gemini) API key
  DEFAULT_AI_PROVIDER    Default provider (openai|claude|gemini)
  DEFAULT_AI_MODEL       Default model key

Note: Also set VITE_ prefixed versions of API keys for frontend access.
`);
  process.exit(0);
}

if (args.includes('--config-only')) {
  aiConfig.printConfiguration();
  const validation = aiConfig.validateConfiguration();
  if (!validation.valid) {
    console.log('\n❌ Configuration Issues:');
    validation.errors.forEach(error => console.log(`  - ${error}`));
  } else {
    console.log('\n✅ Configuration is valid!');
  }
  process.exit(0);
}

if (args.includes('--test-only')) {
  aiFactory.testAllServices().then(results => {
    console.log('\nTest Results:');
    for (const [provider, isWorking] of results) {
      console.log(`  ${provider}: ${isWorking ? '✅ Working' : '❌ Failed'}`);
    }
  });
  process.exit(0);
}

// Run main setup
main().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
}); 