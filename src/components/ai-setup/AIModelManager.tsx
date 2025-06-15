import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, TestTube, Settings, Key, Eye, EyeOff } from 'lucide-react';
import { AI_MODELS, AIModelConfig, aiConfig } from '@/config/ai-config';
import { AIProvider } from '@/llm/ai-service';
import { aiFactory } from '@/llm/ai-factory';

interface CustomAIModel extends AIModelConfig {
  id: string;
  isCustom: boolean;
  isActive: boolean;
}

interface APIKeyConfig {
  provider: AIProvider;
  key: string;
  isVisible: boolean;
}

export const AIModelManager: React.FC = () => {
  const [models, setModels] = useState<CustomAIModel[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKeyConfig[]>([]);
  const [isAddModelOpen, setIsAddModelOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<CustomAIModel | null>(null);
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Map<string, boolean>>(new Map());
  const [activeTab, setActiveTab] = useState('models');

  // Load models and API keys on component mount
  useEffect(() => {
    loadModels();
    loadApiKeys();
  }, []);

  const loadModels = () => {
    const loadedModels: CustomAIModel[] = Object.entries(AI_MODELS).map(([id, config]) => ({
      id,
      ...config,
      isCustom: false,
      isActive: aiConfig.hasApiKey(config.provider),
    }));

    // Load custom models from localStorage
    const customModels = JSON.parse(localStorage.getItem('customAIModels') || '[]');
    customModels.forEach((model: any) => {
      loadedModels.push({
        ...model,
        isCustom: true,
        isActive: aiConfig.hasApiKey(model.provider),
      });
    });

    setModels(loadedModels);
  };

  const loadApiKeys = () => {
    const providers: AIProvider[] = ['openai', 'claude', 'gemini', 'deepseek'];
    const keys = providers.map(provider => ({
      provider,
      key: aiConfig.getApiKey(provider) || '',
      isVisible: false,
    }));
    setApiKeys(keys);
  };

  const saveCustomModels = (customModels: CustomAIModel[]) => {
    const modelsToSave = customModels.filter(m => m.isCustom);
    localStorage.setItem('customAIModels', JSON.stringify(modelsToSave));
  };

  const handleAddModel = (modelData: Omit<CustomAIModel, 'id' | 'isCustom' | 'isActive'>) => {
    const newModel: CustomAIModel = {
      ...modelData,
      id: `custom-${Date.now()}`,
      isCustom: true,
      isActive: aiConfig.hasApiKey(modelData.provider),
    };

    const updatedModels = [...models, newModel];
    setModels(updatedModels);
    saveCustomModels(updatedModels);
    setIsAddModelOpen(false);
  };

  const handleEditModel = (updatedModel: CustomAIModel) => {
    const updatedModels = models.map(m => 
      m.id === updatedModel.id ? updatedModel : m
    );
    setModels(updatedModels);
    saveCustomModels(updatedModels);
    setEditingModel(null);
  };

  const handleDeleteModel = (modelId: string) => {
    const updatedModels = models.filter(m => m.id !== modelId);
    setModels(updatedModels);
    saveCustomModels(updatedModels);
  };

  const handleTestModel = async (modelId: string) => {
    setTestingModel(modelId);
    const model = models.find(m => m.id === modelId);
    
    if (!model) {
      setTestingModel(null);
      return;
    }

    try {
      const service = aiFactory.createService(model.provider, model.model, {
        cacheEnabled: false
      });
      const isWorking = await service.testConnection();
      setTestResults(prev => new Map(prev.set(modelId, isWorking)));
    } catch (error) {
      // console.error(`Test failed for model ${modelId}:`, error);
      setTestResults(prev => new Map(prev.set(modelId, false)));
    } finally {
      setTestingModel(null);
    }
  };

  const handleUpdateApiKey = (provider: AIProvider, newKey: string) => {
    // This would typically update environment variables or secure storage
    // For demo purposes, we'll show how it would work
    // console.log(`Would update ${provider} API key to: ${newKey.substring(0, 8)}...`);
    
    // Update local state
    setApiKeys(prev => prev.map(k => 
      k.provider === provider ? { ...k, key: newKey } : k
    ));

    // Update model active status
    setModels(prev => prev.map(m => ({
      ...m,
      isActive: m.provider === provider ? (newKey.length > 0) : m.isActive
    })));
  };

  const toggleApiKeyVisibility = (provider: AIProvider) => {
    setApiKeys(prev => prev.map(k => 
      k.provider === provider ? { ...k, isVisible: !k.isVisible } : k
    ));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Model Manager</h1>
          <p className="text-muted-foreground mt-2">
            Manage your AI models and API configurations
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          {models.filter(m => m.isActive).length} Active Models
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Models
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Testing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Available Models</h2>
            <Dialog open={isAddModelOpen} onOpenChange={setIsAddModelOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Custom Model
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <ModelForm onSubmit={handleAddModel} onCancel={() => setIsAddModelOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {models.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                testResult={testResults.get(model.id)}
                isTesting={testingModel === model.id}
                onEdit={() => setEditingModel(model)}
                onDelete={() => handleDeleteModel(model.id)}
                onTest={() => handleTestModel(model.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <Alert>
            <AlertDescription>
              API keys are sensitive information. Store them securely and never share them publicly.
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-4">
            {apiKeys.map((apiKey) => (
              <ApiKeyCard
                key={apiKey.provider}
                config={apiKey}
                onUpdate={(newKey) => handleUpdateApiKey(apiKey.provider, newKey)}
                onToggleVisibility={() => toggleApiKeyVisibility(apiKey.provider)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Model Testing</h2>
            <Button 
              onClick={() => models.filter(m => m.isActive).forEach(m => handleTestModel(m.id))}
              disabled={testingModel !== null}
            >
              Test All Active Models
            </Button>
          </div>

          <div className="grid gap-4">
            {models.filter(m => m.isActive).map((model) => (
              <TestResultCard
                key={model.id}
                model={model}
                testResult={testResults.get(model.id)}
                isTesting={testingModel === model.id}
                onTest={() => handleTestModel(model.id)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Model Dialog */}
      {editingModel && (
        <Dialog open={!!editingModel} onOpenChange={() => setEditingModel(null)}>
          <DialogContent className="max-w-md">
            <ModelForm
              initialData={editingModel}
              onSubmit={handleEditModel}
              onCancel={() => setEditingModel(null)}
              isEditing
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Subcomponents
const ModelCard: React.FC<{
  model: CustomAIModel;
  testResult?: boolean;
  isTesting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
}> = ({ model, testResult, isTesting, onEdit, onDelete, onTest }) => (
  <Card className={`relative ${!model.isActive ? 'opacity-60' : ''}`}>
    <CardHeader className="pb-3">
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-lg">{model.displayName}</CardTitle>
          <CardDescription className="capitalize">{model.provider}</CardDescription>
        </div>
        <div className="flex items-center gap-1">
          {model.isCustom && (
            <Badge variant="secondary" className="text-xs">Custom</Badge>
          )}
          {model.isActive && (
            <Badge variant="default" className="text-xs">Active</Badge>
          )}
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Context:</span>
          <br />
          <span className="font-mono">{model.contextWindow.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Cost/1K:</span>
          <br />
          <span className="font-mono">${model.costPer1kTokens.input}/${model.costPer1kTokens.output}</span>
        </div>
      </div>
      
      <Separator />
      
      <div className="flex justify-between items-center">
        <div className="flex gap-1">
          {model.isCustom && (
            <>
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {testResult !== undefined && (
            <Badge variant={testResult ? "default" : "destructive"} className="text-xs">
              {testResult ? "✓ Working" : "✗ Failed"}
            </Badge>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onTest}
            disabled={!model.isActive || isTesting}
          >
            <TestTube className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ApiKeyCard: React.FC<{
  config: APIKeyConfig;
  onUpdate: (key: string) => void;
  onToggleVisibility: () => void;
}> = ({ config, onUpdate, onToggleVisibility }) => {
  const [localKey, setLocalKey] = useState(config.key);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onUpdate(localKey);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="capitalize">{config.provider} API Key</span>
          <Badge variant={config.key ? "default" : "secondary"}>
            {config.key ? "Configured" : "Not Set"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              type={config.isVisible ? "text" : "password"}
              value={isEditing ? localKey : config.key}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder={`Enter your ${config.provider} API key`}
              disabled={!isEditing}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleVisibility}
          >
            {config.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const TestResultCard: React.FC<{
  model: CustomAIModel;
  testResult?: boolean;
  isTesting: boolean;
  onTest: () => void;
}> = ({ model, testResult, isTesting, onTest }) => (
  <Card>
    <CardContent className="flex items-center justify-between p-4">
      <div>
        <h3 className="font-medium">{model.displayName}</h3>
        <p className="text-sm text-muted-foreground capitalize">{model.provider}</p>
      </div>
      
      <div className="flex items-center gap-3">
        {testResult !== undefined && (
          <Badge variant={testResult ? "default" : "destructive"}>
            {testResult ? "✓ Working" : "✗ Failed"}
          </Badge>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onTest}
          disabled={isTesting}
        >
          {isTesting ? "Testing..." : "Test"}
        </Button>
      </div>
    </CardContent>
  </Card>
);

const ModelForm: React.FC<{
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: CustomAIModel;
  isEditing?: boolean;
}> = ({ onSubmit, onCancel, initialData, isEditing }) => {
  const [formData, setFormData] = useState({
    displayName: initialData?.displayName || '',
    provider: initialData?.provider || 'openai' as AIProvider,
    model: initialData?.model || '',
    contextWindow: initialData?.contextWindow || 4000,
    inputCost: initialData?.costPer1kTokens.input || 0,
    outputCost: initialData?.costPer1kTokens.output || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      costPer1kTokens: {
        input: formData.inputCost,
        output: formData.outputCost,
      },
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Edit Model' : 'Add Custom Model'}</DialogTitle>
        <DialogDescription>
          {isEditing ? 'Update model configuration' : 'Add a new custom AI model configuration'}
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={formData.displayName}
            onChange={(e) => setFormData({...formData, displayName: e.target.value})}
            placeholder="e.g., GPT-4 Custom"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="provider">Provider</Label>
          <Select
            value={formData.provider}
            onValueChange={(value: AIProvider) => setFormData({...formData, provider: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="claude">Claude</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
              <SelectItem value="deepseek">Deepseek</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="model">Model Identifier</Label>
          <Input
            id="model"
            value={formData.model}
            onChange={(e) => setFormData({...formData, model: e.target.value})}
            placeholder="e.g., gpt-4o-mini"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contextWindow">Context Window</Label>
            <Input
              id="contextWindow"
              type="number"
              value={formData.contextWindow}
              onChange={(e) => setFormData({...formData, contextWindow: parseInt(e.target.value)})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="inputCost">Input Cost</Label>
              <Input
                id="inputCost"
                type="number"
                step="0.00001"
                value={formData.inputCost}
                onChange={(e) => setFormData({...formData, inputCost: parseFloat(e.target.value)})}
                required
              />
            </div>
            <div>
              <Label htmlFor="outputCost">Output Cost</Label>
              <Input
                id="outputCost"
                type="number"
                step="0.00001"
                value={formData.outputCost}
                onChange={(e) => setFormData({...formData, outputCost: parseFloat(e.target.value)})}
                required
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Update' : 'Add'} Model
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

export default AIModelManager; 
