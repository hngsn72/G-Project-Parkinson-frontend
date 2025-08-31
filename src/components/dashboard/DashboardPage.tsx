'use client';

import { useStatistics, useSystemHealth } from '@/hooks';
import { 
	Users, 
	Activity, 
	Calendar, 
	TrendingUp,
	Mic,
	FileText,
	Clock,
	AlertTriangle,
	CheckCircle,
	BarChart3
} from 'lucide-react';
import { dashboardMock } from '@/constants/dashboardMock';

export default function DashboardPage() {
	const { stats, isLoading: statsLoading, error: statsError } = useStatistics();
	const { backendHealth, mlServiceHealth } = useSystemHealth();

	// Mock data fallback when API is not available
	const mockStats = dashboardMock;
	const displayStats = stats || mockStats;
	return (
		<div className="p-6 space-y-6">
			{/* Page Header */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">Medical Dashboard</h1>
				<p className="text-gray-600">Welcome back, Dr. Smith. Here&apos;s your overview for today.</p>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600">Total Patients</p>
							<p className="text-3xl font-bold text-gray-900">{displayStats.total_analyses}</p>
							<p className="text-sm text-green-600 flex items-center mt-1">
								<TrendingUp className="h-4 w-4 mr-1" />
								+12% from last month
							</p>
						</div>
						<div className="p-3 bg-blue-100 rounded-lg">
							<Users className="h-6 w-6 text-blue-600" />
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600">Voice Analyses</p>
							<p className="text-3xl font-bold text-gray-900">{displayStats.total_analyses}</p>
							<p className="text-sm text-green-600 flex items-center mt-1">
								<TrendingUp className="h-4 w-4 mr-1" />
								+8% from last week
							</p>
						</div>
						<div className="p-3 bg-purple-100 rounded-lg">
							<Mic className="h-6 w-6 text-purple-600" />
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600">High Risk Cases</p>
							<p className="text-3xl font-bold text-gray-900">{displayStats.total_high_risk}</p>
							<p className="text-sm text-yellow-600 flex items-center mt-1">
								<Activity className="h-4 w-4 mr-1" />
								Requires attention
							</p>
						</div>
						<div className="p-3 bg-yellow-100 rounded-lg">
							<Activity className="h-6 w-6 text-yellow-600" />
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600">Accuracy Rate</p>
							<p className="text-3xl font-bold text-gray-900">{displayStats.accuracy_rate}%</p>
							<p className="text-sm text-blue-600 flex items-center mt-1">
								<Calendar className="h-4 w-4 mr-1" />
								Model performance
							</p>
						</div>
						<div className="p-3 bg-green-100 rounded-lg">
							<Calendar className="h-6 w-6 text-green-600" />
						</div>
					</div>
				</div>
			</div>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Recent Analysis */}
				<div className="lg:col-span-2">
					<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
						<div className="p-6 border-b border-gray-100">
							<h2 className="text-lg font-semibold text-gray-900">Recent Voice Analysis</h2>
						</div>
						<div className="p-6">
							<div className="space-y-4">
								{statsLoading ? (
									<div className="text-center py-8">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
										<p className="text-gray-500 mt-2">Loading recent analyses...</p>
									</div>
								) : statsError ? (
									<div className="text-center py-8 text-red-600">
										<p>Failed to load recent analyses</p>
										<p className="text-sm text-gray-500 mt-1">{statsError}</p>
									</div>
								) : (
									displayStats.recent_analyses?.map((analysis) => (
										<div key={analysis.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
											<div className="flex items-center space-x-4">
												<div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
													<FileText className="h-5 w-5 text-gray-600" />
												</div>
												<div>
													<p className="font-medium text-gray-900">Analysis #{analysis.id}</p>
													<p className="text-sm text-gray-500">
														{new Date(analysis.created_at).toLocaleDateString()}
													</p>
												</div>
											</div>
											<div className="text-right">
												<div className="flex items-center space-x-2">
													<span className={`px-2 py-1 text-xs rounded-full ${
														analysis.risk_level === 'high' 
															? 'bg-red-100 text-red-800' 
															: analysis.risk_level === 'moderate'
															? 'bg-yellow-100 text-yellow-800'
															: 'bg-green-100 text-green-800'
													}`}>
														{analysis.risk_level} Risk
													</span>
													<CheckCircle className="h-4 w-4 text-green-500" />
												</div>
												<p className="text-sm text-gray-500 mt-1">
													{typeof analysis.confidence === 'number' ? Math.round(analysis.confidence * 100) : '--'}% confidence
												</p>
											</div>
										</div>
									)) || (
										<div className="text-center py-8 text-gray-500">
											<p>No recent analyses available</p>
										</div>
									)
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Sidebar Info */}
				<div className="space-y-6">
					{/* Quick Actions */}
					<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
						<div className="p-6 border-b border-gray-100">
							<h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
						</div>
						<div className="p-6 space-y-3">
							<button className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
								<Mic className="h-4 w-4 mr-2" />
								New Voice Analysis
							</button>
							<button className="w-full flex items-center justify-center px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
								<Users className="h-4 w-4 mr-2" />
								Add Patient
							</button>
							<button className="w-full flex items-center justify-center px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
								<BarChart3 className="h-4 w-4 mr-2" />
								View Reports
							</button>
						</div>
					</div>

					{/* System Status */}
					<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
						<div className="p-6 border-b border-gray-100">
							<h3 className="text-lg font-semibold text-gray-900">System Status</h3>
						</div>
						<div className="p-6 space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-600">AI Model</span>
								<div className="flex items-center space-x-2">
									<div className={`h-2 w-2 rounded-full ${mlServiceHealth ? 'bg-green-500' : 'bg-red-500'}`}></div>
									<span className={`text-sm font-medium ${mlServiceHealth ? 'text-green-600' : 'text-red-600'}`}>
										{mlServiceHealth ? 'Online' : 'Offline'}
									</span>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-600">Backend API</span>
								<div className="flex items-center space-x-2">
									<div className={`h-2 w-2 rounded-full ${backendHealth ? 'bg-green-500' : 'bg-red-500'}`}></div>
									<span className={`text-sm font-medium ${backendHealth ? 'text-green-600' : 'text-red-600'}`}>
										{backendHealth ? 'Connected' : 'Disconnected'}
									</span>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-600">Model Accuracy</span>
								<div className="flex items-center space-x-2">
									<div className="h-2 w-2 bg-green-500 rounded-full"></div>
									<span className="text-sm font-medium text-green-600">{displayStats.accuracy_rate}%</span>
								</div>
							</div>
						</div>
					</div>

					{/* Alerts */}
					<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
						<div className="p-6 border-b border-gray-100">
							<h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
						</div>
						<div className="p-6 space-y-3">
							<div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
								<AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
								<div>
									<p className="text-sm font-medium text-red-800">High-risk patient detected</p>
									<p className="text-xs text-red-600">Patient #P001 requires immediate attention</p>
								</div>
							</div>
							<div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
								<Clock className="h-4 w-4 text-yellow-500 mt-0.5" />
								<div>
									<p className="text-sm font-medium text-yellow-800">Pending reviews</p>
									<p className="text-xs text-yellow-600">5 analyses awaiting your review</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
