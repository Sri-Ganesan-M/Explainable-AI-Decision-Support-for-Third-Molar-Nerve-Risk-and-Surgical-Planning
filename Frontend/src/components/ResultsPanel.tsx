import { PredictResponse } from "@/lib/api";
import { RiskBadge } from "./RiskBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageViewer } from "./ImageViewer";

interface ResultsPanelProps {
    data: PredictResponse;
}

export function ResultsPanel({ data }: ResultsPanelProps) {
    if (data.status === "failed" || data.risk_score === null || !data.geometric_features || !data.cnn_features || !data.visualization) {
        return (
            <Card className="w-full h-full border border-gray-200 shadow-sm bg-white overflow-hidden flex flex-col">
                <CardHeader className="bg-gray-50 border-b border-gray-100 py-4">
                    <CardTitle className="text-lg font-semibold text-gray-800 flex justify-between items-center">
                        Analysis Results
                        <span className="text-sm font-normal text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Status: {data.status}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center w-full max-w-md text-center py-12 mx-auto">
                        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Analysis Failed</h3>
                        <p className="text-gray-500 text-sm">
                            {data.message || "Failed to extract necessary features. Please ensure the uploaded panoramic X-ray has a clear view of the third molar."}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const displayScore = data.risk_score <= 1.0 ? data.risk_score * 100 : data.risk_score;
    const viz = data.visualization;

    return (
        <Card className="w-full h-full border border-gray-200 shadow-sm bg-white overflow-hidden flex flex-col">
            <CardHeader className="bg-gray-50 border-b border-gray-100 py-4">
                <CardTitle className="text-lg font-semibold text-gray-800 flex justify-between items-center">
                    Analysis Results
                    <span className="text-sm font-normal text-gray-500">Status: {data.status}</span>
                </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
                <CardContent className="p-6 space-y-6">

                    {/* Top Section: Visualization & Risk Score */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm min-h-[350px]">
                            <h3 className="text-sm font-medium text-gray-500 mb-3 w-full text-left uppercase tracking-wider">Processed X-Ray</h3>
                            <Tabs defaultValue="interpretation" className="w-full flex-1 flex flex-col">
                                <TabsList className="grid w-full grid-cols-3 mb-4 bg-gray-200/50">
                                    <TabsTrigger value="roi">ROI</TabsTrigger>
                                    <TabsTrigger value="segmentation">Segmentation</TabsTrigger>
                                    <TabsTrigger value="interpretation">Interpretation</TabsTrigger>
                                </TabsList>

                                <TabsContent value="roi" className="flex-1 m-0">
                                    <div className="relative w-full h-full min-h-[250px] bg-black rounded-lg overflow-hidden border border-gray-300 flex items-center justify-center">
                                        <ImageViewer base64Image={viz.roi_image} altText="ROI Image" />
                                    </div>
                                </TabsContent>

                                <TabsContent value="segmentation" className="flex-1 m-0">
                                    <div className="relative w-full h-full min-h-[250px] bg-black rounded-lg overflow-hidden border border-gray-300 flex items-center justify-center">
                                        <ImageViewer base64Image={viz.segmentation_overlay} altText="Segmentation Overlay" />
                                    </div>
                                </TabsContent>

                                <TabsContent value="interpretation" className="flex-1 m-0">
                                    <div className="relative w-full h-full min-h-[250px] bg-black rounded-lg overflow-hidden border border-gray-300 flex items-center justify-center">
                                        <ImageViewer base64Image={viz.interpretation_overlay} altText="Interpretation Overlay" />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>

                        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-medium text-gray-500 mb-2 w-full text-left uppercase tracking-wider">Risk Assessment</h3>
                            <RiskBadge score={displayScore} />
                            <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg w-full">
                                <p className="text-sm font-medium text-gray-600 mb-1">Clinical Decision:</p>
                                <p className="text-md text-gray-800 font-semibold">{data.decision}</p>
                                {data.message && data.message !== "Success" && data.message !== "Prediction completed." && (
                                    <p className="text-xs text-gray-500 mt-2">{data.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Bottom Section: Features */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Geometric Features */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider border-l-4 border-blue-500 pl-2">
                                Geometric Features
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <FeatureItem label="Winter Angle" value={`${data.geometric_features.winter_angle.toFixed(1)}°`} />
                                <FeatureItem label="Winter Class" value={data.geometric_features.winter_class} />
                                <FeatureItem label="Pell-Gregory" value={data.geometric_features.pell_depth} />
                                <FeatureItem label="Ramus Class" value={data.geometric_features.ramus_class} />
                                <FeatureItem label="Min Distance" value={`${data.geometric_features.min_distance_mm.toFixed(2)} mm`} />
                                <FeatureItem label="Root Complexity" value={data.geometric_features.root_complexity.toFixed(2)} />
                                <FeatureItem label="Contact" value={data.geometric_features.contact ? "Yes" : "No"} />
                            </div>
                        </div>

                        {/* CNN Features */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider border-l-4 border-purple-500 pl-2">
                                CNN Features
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                <FeatureItem label="Overlap" value={data.cnn_features.overlap.toFixed(2)} />
                                <FeatureItem label="Interruption" value={data.cnn_features.interruption.toFixed(2)} />
                                <FeatureItem label="Darkening" value={data.cnn_features.darkening.toFixed(2)} />
                            </div>
                        </div>

                    </div>
                </CardContent>
            </ScrollArea>
        </Card>
    );
}

function FeatureItem({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 flex flex-col justify-center">
            <span className="text-xs text-gray-500 mb-1">{label}</span>
            <span className="text-sm font-medium text-gray-800">{value}</span>
        </div>
    );
}
