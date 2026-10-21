import React, { useState, useEffect } from 'react';
import {
  fetchHealth,
  fetchFiles,
  fetchFileContent,
  runInvestigation,
  approvePatch,
  resetSampleWorkspace,
  executeTestDirectly,
} from './api';
import {
  HealthResponse,
  FileEntry,
  AgentExecutionResult,
  TestExecutionResult,
} from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatPanel } from './components/ChatPanel';
import { ToolTimeline } from './components/ToolTimeline';
import { FileExplorer } from './components/FileExplorer';
import { CodeViewer } from './components/CodeViewer';
import { DiffViewer } from './components/DiffViewer';
import { TestResultsPanel } from './components/TestResultsPanel';
import { VerificationSummary } from './components/VerificationSummary';
import { McpModal } from './components/McpModal';
import { SettingsModal } from './components/SettingsModal';
import {
  Terminal,
  FileCode,
  GitPullRequest,
  CheckCircle,
  AlertCircle,
  Layers,
} from 'lucide-react';

export const App: React.FC = () => {
  // Global System State
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [mode, setMode] = useState<'aws_bedrock' | 'local_demo'>('local_demo');
  const [prompt, setPrompt] = useState<string>(
    'Find the bug, explain its cause, propose a fix, and run the tests.'
  );

  // Investigation & Agent State
  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);
  const [agentResult, setAgentResult] = useState<AgentExecutionResult | null>(null);
  const [investigationError, setInvestigationError] = useState<string | null>(null);

  // File & Code State
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>('src/pricing.py');
  const [fileContent, setFileContent] = useState<string>('');

  // Patch & Verification State
  const [isApplyingPatch, setIsApplyingPatch] = useState<boolean>(false);
  const [isPatchApplied, setIsPatchApplied] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestExecutionResult | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Modals
  const [isMcpModalOpen, setIsMcpModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Active right pane tab
  const [activeTab, setActiveTab] = useState<'diff' | 'code' | 'tests'>('diff');

  // Initial Load
  useEffect(() => {
    loadHealth();
    loadWorkspaceFiles();
    loadCode('src/pricing.py');
  }, []);

  const loadHealth = async () => {
    try {
      const data = await fetchHealth();
      setHealth(data);
      if (data.bedrock?.isConnected) {
        setMode('aws_bedrock');
      }
    } catch (err) {
      console.error('Failed to load health status:', err);
    }
  };

  const loadWorkspaceFiles = async () => {
    try {
      const data = await fetchFiles();
      setFiles(data.files);
    } catch (err) {
      console.error('Failed to list files:', err);
    }
  };

  const loadCode = async (filePath: string) => {
    setSelectedFile(filePath);
    try {
      const data = await fetchFileContent(filePath);
      setFileContent(data.content);
    } catch (err) {
      console.error('Failed to load file content:', err);
      setFileContent('// Error loading file.');
    }
  };

  // Run Autonomous Investigation
  const handleStartInvestigation = async (customPrompt?: string) => {
    const query = customPrompt || prompt;
    setPrompt(query);
    setIsInvestigating(true);
    setInvestigationError(null);
    setIsPatchApplied(false);

    try {
      const result = await runInvestigation(query, mode);
      setAgentResult(result);

      if (result.patchProposal) {
        setActiveTab('diff');
      }
      if (result.testResults) {
        setTestResults(result.testResults);
      }
    } catch (err: any) {
      setInvestigationError(err.message);
    } finally {
      setIsInvestigating(false);
    }
  };

  // Approve & Apply Patch
  const handleApprovePatch = async (patchId: string) => {
    setIsApplyingPatch(true);
    try {
      const res = await approvePatch(patchId);
      setIsPatchApplied(true);
      setTestResults(res.testResult);
      setActiveTab('tests');

      // Refresh file content
      if (selectedFile) {
        await loadCode(selectedFile);
      }
      await loadWorkspaceFiles();
    } catch (err: any) {
      setInvestigationError(err.message);
    } finally {
      setIsApplyingPatch(false);
    }
  };

  // Reject Patch
  const handleRejectPatch = () => {
    if (agentResult) {
      setAgentResult({
        ...agentResult,
        patchProposal: undefined,
        requiresApproval: false,
      });
    }
  };

  // Reset Sample Project to Seeded Bug State
  const handleResetSample = async () => {
    setIsResetting(true);
    try {
      await resetSampleWorkspace();
      setIsPatchApplied(false);
      setAgentResult(null);
      setTestResults(null);
      setInvestigationError(null);
      await loadCode('src/pricing.py');
      await loadWorkspaceFiles();
      setActiveTab('code');
    } catch (err: any) {
      setInvestigationError(err.message);
    } finally {
      setIsResetting(false);
    }
  };

  // Directly Run Tests
  const handleRunTestsDirectly = async () => {
    setIsTesting(true);
    try {
      const res = await executeTestDirectly();
      setTestResults(res);
      setActiveTab('tests');
    } catch (err: any) {
      setInvestigationError(err.message);
    } finally {
      setIsTesting(false);
    }
  };

  const isVerified = Boolean(testResults?.passed);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-devDark-950 text-slate-100 font-sans">
      {/* Top Header */}
      <Header
        health={health}
        mode={mode}
        onOpenMcpModal={() => setIsMcpModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          mode={mode}
          onModeChange={setMode}
          onSelectPrompt={(p) => {
            setPrompt(p);
            handleStartInvestigation(p);
          }}
          onResetSample={handleResetSample}
          onRunTestsDirectly={handleRunTestsDirectly}
          isInvestigating={isInvestigating}
          isResetting={isResetting}
          isTesting={isTesting}
          hasBedrockCredentials={Boolean(health?.bedrock?.isConfigured)}
        />

        {/* Center-Left: Chat & Reasoning Stream */}
        <div className="w-96 flex flex-col h-full border-r border-devDark-750 shrink-0">
          <ChatPanel
            prompt={prompt}
            setPrompt={setPrompt}
            onSend={handleStartInvestigation}
            isInvestigating={isInvestigating}
            agentResult={agentResult}
            error={investigationError}
          />
        </div>

        {/* Center-Right Workspace Panes */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-devDark-950">
          {/* Workspace Tabs Header */}
          <div className="h-10 bg-devDark-900 border-b border-devDark-750 flex items-center justify-between px-4 select-none shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('diff')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  activeTab === 'diff'
                    ? 'bg-devDark-800 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GitPullRequest className="w-3.5 h-3.5" />
                <span>Patch Review</span>
                {agentResult?.patchProposal && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  activeTab === 'code'
                    ? 'bg-devDark-800 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>File Explorer & Code</span>
              </button>

              <button
                onClick={() => setActiveTab('tests')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  activeTab === 'tests'
                    ? 'bg-devDark-800 text-purple-400 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Test Execution</span>
                {testResults && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      testResults.passed ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                )}
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              Workspace: checkout_service
            </div>
          </div>

          {/* Active Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Top Verification Summary Card */}
            <VerificationSummary
              agentResult={agentResult}
              isVerified={isVerified}
            />

            {/* Tab 1: Patch Diff & Human Approval */}
            {activeTab === 'diff' && (
              <div className="space-y-4">
                <DiffViewer
                  proposal={agentResult?.patchProposal || null}
                  onApprove={handleApprovePatch}
                  onReject={handleRejectPatch}
                  isApplying={isApplyingPatch}
                  isApplied={isPatchApplied}
                />

                {/* Real Test Results if available */}
                {testResults && (
                  <TestResultsPanel
                    results={testResults}
                    isRunning={isTesting}
                    onRunAgain={handleRunTestsDirectly}
                  />
                )}

                {/* Tool Execution Timeline */}
                <ToolTimeline
                  timeline={agentResult?.timeline || []}
                  isInvestigating={isInvestigating}
                />
              </div>
            )}

            {/* Tab 2: File Explorer & Code Viewer */}
            {activeTab === 'code' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[calc(100vh-180px)]">
                <div className="md:col-span-1 rounded-lg overflow-hidden border border-devDark-750">
                  <FileExplorer
                    files={files}
                    selectedFile={selectedFile}
                    onSelectFile={loadCode}
                    onRefresh={loadWorkspaceFiles}
                    culpritFile={agentResult?.rootCauseAnalysis?.culpritFile}
                  />
                </div>
                <div className="md:col-span-3 rounded-lg overflow-hidden border border-devDark-750">
                  <CodeViewer
                    filePath={selectedFile}
                    content={fileContent}
                    culpritLine={
                      selectedFile?.includes('pricing.py')
                        ? agentResult?.rootCauseAnalysis?.culpritLine || 29
                        : undefined
                    }
                  />
                </div>
              </div>
            )}

            {/* Tab 3: Test Execution Console */}
            {activeTab === 'tests' && (
              <div className="space-y-4">
                <TestResultsPanel
                  results={testResults}
                  isRunning={isTesting}
                  onRunAgain={handleRunTestsDirectly}
                />

                <ToolTimeline
                  timeline={agentResult?.timeline || []}
                  isInvestigating={isInvestigating}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <McpModal
        isOpen={isMcpModalOpen}
        onClose={() => setIsMcpModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        bedrockHealth={health?.bedrock}
      />
    </div>
  );
};

export default App;
