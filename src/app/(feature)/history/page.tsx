'use client';

import { useState } from 'react';
import { useAnalysisHistory } from '@/hooks';
import { DiagnosisHistory } from '@/lib/api-config';
import { 
  Search, 
  Filter,
  Download,
  Eye,
  Calendar,
  Mic,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Trash2,
  Share2
} from 'lucide-react';

export default function AnalysisHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');

  const { history, isLoading, error, fetchHistory, deleteAnalysis } = useAnalysisHistory();
  console.log('history:', history);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this analysis?')) {
      await deleteAnalysis(id);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-800 bg-red-100';
      case 'moderate': return 'text-yellow-800 bg-yellow-100';
      case 'low': return 'text-green-800 bg-green-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const getStatusIcon = (prediction: string) => {
    return prediction.toLowerCase() === 'parkinsons' ? 
      <AlertTriangle className="h-4 w-4 text-yellow-500" /> : 
      <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  // Support both array and object with diagnoses array
  const getHistoryArray = (history: unknown): DiagnosisHistory[] => {
    if (Array.isArray(history)) return history as DiagnosisHistory[];
    if (history && typeof history === 'object' && Array.isArray((history as any).diagnoses)) {
      return (history as { diagnoses: DiagnosisHistory[] }).diagnoses;
    }
    return [];
  };

  const filteredData: DiagnosisHistory[] = getHistoryArray(history).filter((item) => {
    const matchesSearch = (item.session_id || item.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Mock stats for when API is not available
  const mockStats = {
    total: Array.isArray(history) ? history.length : 1247,
    high_risk: Array.isArray(history) ? history.filter(h => h.risk_level === 'high').length : 89,
    this_week: 156,
    accuracy: 91.2
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analysis History</h1>
        <p className="text-gray-600">Review and manage previous voice analysis records</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Analyses</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Risk</p>
              <p className="text-2xl font-bold text-red-900">{mockStats.high_risk}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-green-900">{mockStats.this_week}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Accuracy</p>
              <p className="text-2xl font-bold text-blue-900">{mockStats.accuracy}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Mic className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by patient name, ID, or analysis ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="requires_review">Requires Review</option>
                  <option value="processing">Processing</option>
                </select>
              </div>

              <select 
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>

              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Analysis Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prediction</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audio Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading analysis history...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-red-600">
                    <p>Failed to load history</p>
                    <p className="text-sm text-gray-500 mt-1">{error}</p>
                    <button 
                      onClick={fetchHistory}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Try again
                    </button>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <p>No analysis records found</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((analysis: DiagnosisHistory) => (
                  <tr key={analysis.session_id || analysis.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-mono">{analysis.session_id || analysis.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">
                      {Number(analysis.prediction) === 1 ? "Parkinsons" : "Healthy"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{analysis.confidence || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(analysis.risk_level)}`}>
                        {analysis.risk_level || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(analysis.timestamp || analysis.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{'audio_duration' in analysis && analysis.audio_duration ? `${analysis.audio_duration.toFixed(2)}s` : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{analysis.sentence || analysis.sentence_used || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 p-1 rounded">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-800 p-1 rounded">
                          <Download className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-800 p-1 rounded">
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(analysis.session_id || analysis.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing 1 to {filteredData.length} of {filteredData.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
