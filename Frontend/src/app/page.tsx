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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-500/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm px-6 py-4 flex items-center space-x-4 mb-6 sticky top-0 z-50">
        <div className="p-2.5 bg-blue-600/10 text-blue-600 rounded-xl border border-blue-600/20 shadow-sm">
          <Activity className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          MTM<span className="text-blue-600 font-light"> Vision</span>
          <span className="ml-3 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 align-middle">
            CLINICAL AI
          </span>
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-screen-2xl w-full mx-auto px-6 pb-6 flex flex-col gap-6">

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200 shadow-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Prediction Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Dynamic Layout: If result exists, UploadPanel becomes a small top bar, and ResultsPanel takes main space */}
        {!result ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-2xl h-[500px]">
              <UploadPanel onPredict={handlePredict} isLoading={isLoading} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col xl:flex-row gap-6 h-full flex-1">
            {/* Left/Top: Results Panel takes most of the space */}
            <div className="flex-1 min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
              <ResultsPanel data={result} />
            </div>

            {/* Right/Bottom: Upload a new image (smaller) */}
            <div className="w-full xl:w-80 flex-shrink-0 h-[400px]">
              <UploadPanel onPredict={handlePredict} isLoading={isLoading} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-5 text-center border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-center space-x-2 text-slate-500">
          <Activity className="w-3.5 h-3.5 text-slate-400" />
          <p className="text-xs font-medium tracking-widest uppercase text-slate-400">
            For clinical decision support only. Not a diagnostic device.
          </p>
        </div>
      </footer>
    </div>
  );
}
