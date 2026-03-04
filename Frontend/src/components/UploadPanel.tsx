import { useState, useCallback } from "react";
import { UploadCloud, FileImage, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface UploadPanelProps {
    onPredict: (file: File) => Promise<void>;
    isLoading: boolean;
}

export function UploadPanel({ onPredict, isLoading }: UploadPanelProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const clearFile = () => {
        setFile(null);
    };

    const handleUpload = () => {
        if (file) {
            onPredict(file);
        }
    };

    return (
        <Card className="w-full h-full border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6 md:p-8 flex flex-col h-full">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                    <h2 className="text-lg font-bold text-slate-800 tracking-wide">Upload Scan</h2>
                </div>

                <div
                    className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${isDragging
                        ? "border-blue-500 bg-blue-50 scale-[1.02]"
                        : "border-slate-300 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-400"
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {!file ? (
                        <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
                            <div className="p-4 bg-white border border-slate-100 rounded-full mb-5 shadow-sm">
                                <UploadCloud className="w-10 h-10 text-blue-500" />
                            </div>
                            <p className="text-base font-semibold text-slate-700 mb-1">
                                Drop your X-Ray here
                            </p>
                            <p className="text-sm text-slate-500 mb-6">
                                Standard formats: PNG, JPG, DICOM (exported)
                            </p>
                            <label htmlFor="file-upload">
                                <Button variant="outline" className="cursor-pointer bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-blue-600" asChild>
                                    <span>Browse Local Files</span>
                                </Button>
                            </label>
                            <input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={isLoading}
                            />
                        </div>
                    ) : (
                        <div className="w-full flex-1 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 w-full max-w-sm flex items-center justify-between mb-8 transition-all">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                                        <FileImage className="w-6 h-6" />
                                    </div>
                                    <div className="truncate text-left">
                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-slate-500 font-medium">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                {!isLoading && (
                                    <button
                                        onClick={clearFile}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            <Button
                                onClick={handleUpload}
                                disabled={isLoading}
                                className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold tracking-wide shadow-sm transition-all"
                                size="lg"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                        Analyzing Scan...
                                    </>
                                ) : (
                                    "Analyze Scan"
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
