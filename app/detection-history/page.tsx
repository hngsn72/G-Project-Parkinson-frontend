"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface CriticalFeatures {
  jitter_local: number;
  shimmer_local: number;
  hnr: number;
}

interface DiagnosisRecord {
  session_id: string;
  prediction: number;
  probability: number;
  confidence: string;
  diagnosis: string;
  features: Record<string, unknown>;
  critical_features?: CriticalFeatures;
  sentence: string;
  status: string;
  timestamp: string;
  recommendations: string[];
}

interface TrendDataPoint {
  date: string;
  count: number;
  parkinsons_count: number;
  healthy_count: number;
  avg_probability: number;
  avg_jitter_local: number;
  avg_shimmer_local: number;
  avg_hnr: number;
}

export default function DetectionHistoryPage() {
  const [records, setRecords] = useState<DiagnosisRecord[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<DiagnosisRecord | null>(
    null
  );
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [resultType, setResultType] = useState<string>(""); // '', 'positive', 'negative'
  const [confidenceFilter, setConfidenceFilter] = useState<string>(""); // '', 'High', 'Medium', 'Low'
  const [totalCount, setTotalCount] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const userID = localStorage.getItem("user_id");

      if (!token || !userID) {
        console.error("No authentication token or user ID found");
        return;
      }

      // Build query params
      const params = new URLSearchParams({
        user_id: userID,
        limit: limit.toString(),
        offset: ((currentPage - 1) * limit).toString(),
      });

      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (resultType) params.append("result_type", resultType);
      if (confidenceFilter) params.append("confidence", confidenceFilter);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/history/filtered?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch records");

      const result = await response.json();
      setRecords(result.data || []);
      setTotalCount(result.total || 0);
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, startDate, endDate, resultType, confidenceFilter]);

  const fetchTrendData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const userID = localStorage.getItem("user_id");

      if (!token || !userID) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/history/trends?user_id=${userID}&days=30`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch trend data");

      const result = await response.json();
      setTrendData(result.data || []);
    } catch (error) {
      console.error("Error fetching trend data:", error);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
    fetchTrendData();
  }, [fetchRecords, fetchTrendData]);

  const handleViewDetail = (record: DiagnosisRecord) => {
    setSelectedRecord(record);
    setDetailModalOpen(true);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Detection History Report", 14, 20);

    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Records: ${totalCount}`, 14, 34);

    // Table data
    const tableData = records.map((record) => [
      new Date(record.timestamp).toLocaleDateString(),
      record.diagnosis,
      record.confidence,
      `${(record.probability * 100).toFixed(1)}%`,
      record.sentence.substring(0, 30) + "...",
    ]);

    // Add table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).autoTable({
      startY: 40,
      head: [["Date", "Result", "Confidence", "Probability", "Sentence"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Save
    doc.save(`detection-history-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setResultType("");
    setConfidenceFilter("");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / limit);

  const getResultBadgeVariant = (
    prediction: number
  ): "default" | "destructive" | "outline" | "secondary" => {
    return prediction === 1 ? "destructive" : "default";
  };

  const getConfidenceBadgeVariant = (
    confidence: string
  ): "default" | "destructive" | "outline" | "secondary" => {
    switch (confidence) {
      case "High":
        return "default";
      case "Medium":
        return "secondary";
      case "Low":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Detection History</h1>
          <p className="text-gray-500 mt-1">
            View and analyze your Parkinson&apos;s detection test results
          </p>
        </div>
        <Button onClick={handleExportPDF} disabled={records.length === 0}>
          Export to PDF
        </Button>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detection Count Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Detection Trend (Last 30 Days)</CardTitle>
            <CardDescription>
              Number of tests performed over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="parkinsons_count"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  name="Positive Results"
                />
                <Area
                  type="monotone"
                  dataKey="healthy_count"
                  stackId="1"
                  stroke="#22c55e"
                  fill="#22c55e"
                  name="Negative Results"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Probability Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Average Probability Trend</CardTitle>
            <CardDescription>
              Average detection probability over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avg_probability"
                  stroke="#3b82f6"
                  name="Avg Probability"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Critical Features Trend (Jitter, Shimmer, HNR) */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Critical Voice Features Trend</CardTitle>
            <CardDescription>
              Jitter, Shimmer, and HNR measurements over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="avg_jitter_local"
                  fill="#8b5cf6"
                  name="Jitter (Local)"
                />
                <Bar
                  dataKey="avg_shimmer_local"
                  fill="#f59e0b"
                  name="Shimmer (Local)"
                />
                <Bar dataKey="avg_hnr" fill="#10b981" name="HNR" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setStartDate(e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEndDate(e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="result-type">Result Type</Label>
              <select
                id="result-type"
                className="w-full border rounded-md p-2"
                value={resultType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setResultType(e.target.value)
                }
              >
                <option value="">All</option>
                <option value="positive">Positive (Parkinson&apos;s)</option>
                <option value="negative">Negative (Healthy)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="confidence">Confidence Level</Label>
              <select
                id="confidence"
                className="w-full border rounded-md p-2"
                value={confidenceFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setConfidenceFilter(e.target.value)
                }
              >
                <option value="">All</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={fetchRecords}>Apply Filters</Button>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detection Records ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">Loading...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No detection records found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Result</th>
                    <th className="text-left p-2">Confidence</th>
                    <th className="text-left p-2">Probability</th>
                    <th className="text-left p-2">Sentence</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.session_id} className="border-b">
                      <td className="p-2">
                        {new Date(record.timestamp).toLocaleDateString()}
                      </td>
                      <td className="p-2">
                        <Badge variant={getResultBadgeVariant(record.prediction)}>
                          {record.diagnosis}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge
                          variant={getConfidenceBadgeVariant(record.confidence)}
                        >
                          {record.confidence}
                        </Badge>
                      </td>
                      <td className="p-2">
                        {(record.probability * 100).toFixed(1)}%
                      </td>
                      <td className="p-2 max-w-xs truncate">
                        {record.sentence}
                      </td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetail(record)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detection Details</DialogTitle>
            <DialogDescription>
              Full test results and analysis
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <p className="font-semibold">
                    {new Date(selectedRecord.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label>Session ID</Label>
                  <p className="font-mono text-sm">{selectedRecord.session_id}</p>
                </div>
                <div>
                  <Label>Result</Label>
                  <p>
                    <Badge variant={getResultBadgeVariant(selectedRecord.prediction)}>
                      {selectedRecord.diagnosis}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label>Confidence</Label>
                  <p>
                    <Badge
                      variant={getConfidenceBadgeVariant(selectedRecord.confidence)}
                    >
                      {selectedRecord.confidence}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label>Probability</Label>
                  <p className="font-semibold">
                    {(selectedRecord.probability * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p className="capitalize">{selectedRecord.status}</p>
                </div>
              </div>

              {/* Sentence */}
              <div>
                <Label>Recorded Sentence</Label>
                <p className="mt-1 p-3 bg-gray-50 rounded-md">
                  {selectedRecord.sentence}
                </p>
              </div>

              {/* Critical Features */}
              {selectedRecord.critical_features && (
                <div>
                  <Label className="text-lg font-semibold">Critical Voice Features</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div className="p-3 bg-purple-50 rounded-md">
                      <Label>Jitter (Local)</Label>
                      <p className="text-xl font-bold text-purple-600">
                        {selectedRecord.critical_features.jitter_local.toFixed(6)}
                      </p>
                      <p className="text-xs text-gray-500">Frequency perturbation</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-md">
                      <Label>Shimmer (Local)</Label>
                      <p className="text-xl font-bold text-orange-600">
                        {selectedRecord.critical_features.shimmer_local.toFixed(6)}
                      </p>
                      <p className="text-xs text-gray-500">Amplitude perturbation</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-md">
                      <Label>HNR</Label>
                      <p className="text-xl font-bold text-green-600">
                        {selectedRecord.critical_features.hnr.toFixed(6)}
                      </p>
                      <p className="text-xs text-gray-500">Harmonic-to-Noise Ratio</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div>
                <Label className="text-lg font-semibold">Recommendations</Label>
                <ul className="mt-2 space-y-2">
                  {selectedRecord.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* All Features (Collapsible) */}
              <details className="border rounded-md p-3">
                <summary className="cursor-pointer font-semibold">
                  All Features (87 total)
                </summary>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm max-h-60 overflow-y-auto">
                  {Object.entries(selectedRecord.features).map(([key, value]) => (
                    <div key={key} className="flex justify-between p-1 hover:bg-gray-50">
                      <span className="text-gray-600">{key}:</span>
                      <span className="font-mono">
                        {typeof value === "number" ? value.toFixed(4) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
