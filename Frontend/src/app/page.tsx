"use client";

import { useState } from "react";
import { UploadPanel } from "@/components/UploadPanel";
import { ResultsPanel } from "@/components/ResultsPanel";
import { predict, PredictResponse } from "@/lib/api";
import { AlertCircle, Activity } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await predict(file);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to communicate with prediction service");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-600 text-white rounded-lg">
          <Activity className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">
          AI-Assisted Mandibular Third Molar Planning
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pb-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Error Alert */}
        {error && (
          <div className="col-span-1 lg:col-span-12">
            <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Prediction Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Left Panel: Upload Zone */}
        <div className="col-span-1 lg:col-span-4 h-full min-h-[500px]">
          <UploadPanel onPredict={handlePredict} isLoading={isLoading} />
        </div>

        {/* Right Panel: Results */}
        <div className="col-span-1 lg:col-span-8 h-full min-h-[500px]">
          {result ? (
            <ResultsPanel data={result} />
          ) : (
            <Card className="w-full h-full border border-gray-200 shadow-sm bg-white flex items-center justify-center">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center text-gray-400">
                <Activity className="w-16 h-16 text-gray-200 mb-4" />
                <h3 className="text-lg font-medium text-gray-500">No Analysis Available</h3>
                <p className="text-sm">Upload a panoramic X-ray to view the clinical prediction results.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-4 text-center border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-400 font-medium tracking-wide">
          For clinical decision support only. Not a diagnostic device.
        </p>
      </footer>
    </div>
  );
}
