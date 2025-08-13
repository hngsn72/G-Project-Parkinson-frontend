'use client';

import { useVoiceAnalysis, useAudioRecording, useSentences } from '@/hooks';
import { 
  Mic, 
  Upload, 
  Square,
  AlertTriangle,
  CheckCircle,
  Clock,
  Brain,
  Zap,
  BarChart3,
  Download,
  RefreshCw
} from 'lucide-react';

export default function VoiceAnalysis() {
  const { 
    analyzeVoice, 
    resetAnalysis, 
    isAnalyzing, 
    result, 
    error: analysisError 
  } = useVoiceAnalysis();
  
  const { 
    startRecording, 
    stopRecording, 
    resetRecording, 
    isRecording, 
    recordingTime,
    error: recordingError 
  } = useAudioRecording();
  
  const { 
    sentence, 
    fetchRandomSentence,
    error: sentenceError 
  } = useSentences();

  const handleStartRecording = async () => {
    await startRecording();
  };

  const handleStopRecording = async () => {
    const file = await stopRecording();
    if (file && sentence) {
      // Automatically start analysis after recording
      await analyzeVoice(file, sentence.sentence);
    }
  };

  const handleReset = () => {
    resetRecording();
    resetAnalysis();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && sentence) {
      resetRecording();
      await analyzeVoice(file, sentence.sentence);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-800 bg-red-100 border-red-200';
      case 'moderate': return 'text-yellow-800 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-800 bg-green-100 border-green-200';
      default: return 'text-gray-800 bg-gray-100 border-gray-200';
    }
  };

  const error = analysisError || recordingError || sentenceError;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Voice Analysis</h1>
        <p className="text-gray-600">AI-powered Parkinson&apos;s disease detection through voice pattern analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recording Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Mic className="h-6 w-6 mr-2 text-blue-600" />
                Voice Recording
              </h2>
            </div>
            
            <div className="p-8">
              {/* Recording Interface */}
              <div className="text-center space-y-6">
                {/* Recording Visualizer */}
                <div className="relative">
                  <div className={`w-32 h-32 mx-auto rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                    isRecording 
                      ? 'border-red-500 bg-red-50 animate-pulse' 
                      : result
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}>
                    {isRecording ? (
                      <div className="relative">
                        <Mic className="h-12 w-12 text-red-500" />
                        <div className="absolute inset-0 animate-ping">
                          <div className="w-full h-full bg-red-400 rounded-full opacity-75"></div>
                        </div>
                      </div>
                    ) : isAnalyzing ? (
                      <Brain className="h-12 w-12 text-blue-500 animate-spin" />
                    ) : result ? (
                      <CheckCircle className="h-12 w-12 text-green-500" />
                    ) : (
                      <Mic className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Recording Time */}
                  {isRecording && (
                    <div className="mt-4">
                      <div className="text-2xl font-mono font-bold text-red-600">
                        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="text-sm text-gray-500">Recording...</div>
                    </div>
                  )}
                  
                  {isAnalyzing && (
                    <div className="mt-4">
                      <div className="text-lg font-semibold text-blue-600">Analyzing Voice Pattern</div>
                      <div className="text-sm text-gray-500">AI processing in progress...</div>
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm text-red-800">{error}</div>
                    </div>
                  )}
                </div>

                {/* Control Buttons */}
                <div className="flex justify-center space-x-4">
                  {!isRecording && !isAnalyzing ? (
                    <>
                      <button
                        onClick={handleStartRecording}
                        className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        disabled={isAnalyzing}
                      >
                        <Mic className="h-5 w-5 mr-2" />
                        Start Recording
                      </button>
                      <label className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <Upload className="h-5 w-5 mr-2" />
                        Upload File
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </>
                  ) : isRecording ? (
                    <button
                      onClick={handleStopRecording}
                      className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Square className="h-5 w-5 mr-2" />
                      Stop Recording
                    </button>
                  ) : result ? (
                    <div className="flex space-x-3">
                      <button
                        onClick={handleReset}
                        className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <RefreshCw className="h-5 w-5 mr-2" />
                        New Analysis
                      </button>
                      <button className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        <Download className="h-5 w-5 mr-2" />
                        Export Report
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Instructions */}
                {!isRecording && !isAnalyzing && !result && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Recording Instructions</h3>
                    {sentence ? (
                      <div className="mb-3">
                        <p className="text-sm text-blue-800 font-medium mb-1">Please read this sentence:</p>
                        <div className="bg-white p-3 rounded border border-blue-200">
                          <p className="text-gray-900 font-medium">&quot;{sentence.sentence}&quot;</p>
                        </div>
                        <button 
                          onClick={fetchRandomSentence}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                        >
                          Get different sentence
                        </button>
                      </div>
                    ) : null}
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Speak clearly into your microphone</li>
                      <li>• Record for at least 10-15 seconds</li>
                      <li>• Ensure you&apos;re in a quiet environment</li>
                      <li>• Maintain consistent distance from microphone</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analysis Results */}
          {result && (
            <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="h-6 w-6 mr-2 text-green-600" />
                  Analysis Results
                </h3>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Risk Assessment */}
                  <div className={`text-center p-4 rounded-lg border ${getRiskColor(result.risk_level)}`}>
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <div className="text-sm font-medium">Risk Level</div>
                    <div className="text-2xl font-bold">{result.risk_level}</div>
                    <div className="text-xs">{result.prediction === 'parkinsons' ? 'Positive indicators' : 'Normal patterns'}</div>
                  </div>
                  
                  {/* Confidence Score */}
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Zap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-blue-800">Confidence</div>
                    <div className="text-2xl font-bold text-blue-900">{Math.round(result.confidence * 100)}%</div>
                    <div className="text-xs text-blue-700">Analysis accuracy</div>
                  </div>
                  
                  {/* Processing Time */}
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-green-800">Status</div>
                    <div className="text-2xl font-bold text-green-900">Complete</div>
                    <div className="text-xs text-green-700">Analysis finished</div>
                  </div>
                </div>

                {/* Detailed Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Analysis Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-2">Prediction</div>
                      <div className="text-lg font-semibold text-gray-900 capitalize">
                        {result.prediction === 'parkinsons' ? 'Parkinson\'s Indicators Detected' : 'Normal Voice Patterns'}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-2">Analysis ID</div>
                      <div className="text-lg font-mono text-gray-900">{result.id}</div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-2">Timestamp</div>
                      <div className="text-lg text-gray-900">
                        {new Date(result.created_at).toLocaleString()}
                      </div>
                    </div>
                    
                    {result.analysis_metadata && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2">Model Version</div>
                        <div className="text-lg text-gray-900">{result.analysis_metadata.model_version}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Today&apos;s Statistics</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Analyses</span>
                <span className="text-lg font-semibold text-gray-900">24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">High Risk</span>
                <span className="text-lg font-semibold text-red-600">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Normal</span>
                <span className="text-lg font-semibold text-green-600">18</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg. Accuracy</span>
                <span className="text-lg font-semibold text-blue-600">91%</span>
              </div>
            </div>
          </div>

          {/* Recent Analyses */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Recent Analyses</h3>
            </div>
            <div className="p-6 space-y-3">
              {[
                { id: 'A001', time: '2 min ago', risk: 'Low', confidence: '94%' },
                { id: 'A002', time: '15 min ago', risk: 'High', confidence: '87%' },
                { id: 'A003', time: '1 hour ago', risk: 'Medium', confidence: '91%' },
              ].map((analysis) => (
                <div key={analysis.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">#{analysis.id}</div>
                    <div className="text-xs text-gray-500">{analysis.time}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      analysis.risk === 'High' 
                        ? 'bg-red-100 text-red-800'
                        : analysis.risk === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {analysis.risk}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{analysis.confidence}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Info */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">AI Model Info</h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Model Version</span>
                <span className="text-sm font-medium text-gray-900">v2.1.4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Training Data</span>
                <span className="text-sm font-medium text-gray-900">15K samples</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Accuracy</span>
                <span className="text-sm font-medium text-green-600">94.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Update</span>
                <span className="text-sm font-medium text-gray-900">2 days ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
