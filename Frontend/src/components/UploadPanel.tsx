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
        <Card className="w-full h-full border border-gray-200 shadow-sm bg-white">
            <CardContent className="p-6 flex flex-col h-full">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Upload Panoramic X-Ray</h2>

                <div
                    className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-colors ${isDragging
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {!file ? (
                        <>
                            <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
                            <p className="text-sm font-medium text-gray-700 mb-1">
                                Drag and drop your image here
                            </p>
                            <p className="text-xs text-gray-500 mb-4">
                                Supported formats: PNG, JPG, JPEG
                            </p>
                            <label htmlFor="file-upload">
                                <Button variant="outline" className="cursor-pointer" asChild>
                                    <span>Browse Files</span>
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
                        </>
                    ) : (
                        <div className="w-full flex-1 flex flex-col items-center justify-center">
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 w-full max-w-sm flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                                        <FileImage className="w-6 h-6" />
                                    </div>
                                    <div className="truncate text-left">
                                        <p className="text-sm font-medium text-gray-800 truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                {!isLoading && (
                                    <button
                                        onClick={clearFile}
                                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            <Button
                                onClick={handleUpload}
                                disabled={isLoading}
                                className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white"
                                size="lg"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Analyzing Image...
                                    </>
                                ) : (
                                    "Analyze X-Ray"
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
