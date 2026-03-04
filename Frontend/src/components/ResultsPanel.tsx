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
    if (data.status === "failed" || !data.nerve_injury_risk || !data.surgical_difficulty || !data.geometric_features || !data.cnn_features || !data.visualization) {
        return (
            <Card className="w-full h-full border border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col rounded-2xl">
                <CardHeader className="bg-slate-50 border-b border-slate-100 py-5">
                    <CardTitle className="text-lg font-bold text-slate-800 flex justify-between items-center tracking-wide">
                        Clinical Analysis
                        <span className="text-sm font-semibold text-red-500 flex items-center gap-1.5 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                            <AlertCircle className="w-4 h-4" />
                            Status: {data.status}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center w-full max-w-md text-center py-12 mx-auto animate-in fade-in zoom-in-95 duration-500">
                        <div className="p-4 bg-red-50 rounded-full mb-6">
                            <AlertCircle className="w-12 h-12 text-red-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3 tracking-wide">Analysis Failed</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            {data.message || "Failed to extract necessary features. Please ensure the uploaded panoramic X-ray has a clear view of the third molar."}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const viz = data.visualization!;
    const nerve_injury_risk = data.nerve_injury_risk!;
    const surgical_difficulty = data.surgical_difficulty!;
    const geometric_features = data.geometric_features!;
    const cnn_features = data.cnn_features!;

    return (
        <Card className="w-full h-full border border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col rounded-2xl">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-5">
                <CardTitle className="text-lg font-bold text-slate-800 flex justify-between items-center tracking-wide">
                    Clinical Analysis
                    <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        Status: {data.status}
                    </span>
                </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 bg-slate-50/50">
                <CardContent className="p-4 md:p-6 lg:p-8 space-y-8">

                    {/* Top Section: Visualization & Clinical Assessment */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                        {/* Left Side: Large X-Ray Viewer */}
                        <div className="xl:col-span-2 flex flex-col p-5 bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[500px]">
                            <h3 className="text-sm font-bold text-slate-500 mb-4 w-full text-left uppercase tracking-widest">Processed X-Ray</h3>
                            <Tabs defaultValue="interpretation" className="w-full flex-1 flex flex-col">
                                <TabsList className="grid w-full max-w-sm grid-cols-3 mb-5 mx-auto bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                                    <TabsTrigger value="roi" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">ROI</TabsTrigger>
                                    <TabsTrigger value="segmentation" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Segmentation</TabsTrigger>
                                    <TabsTrigger value="interpretation" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Interpretation</TabsTrigger>
                                </TabsList>

                                <TabsContent value="roi" className="flex-1 m-0 h-full">
                                    <div className="relative w-full h-[400px] lg:h-[500px] xl:h-[600px] bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                                        <ImageViewer base64Image={viz.roi_image} altText="ROI Image" />
                                    </div>
                                </TabsContent>

                                <TabsContent value="segmentation" className="flex-1 m-0 h-full">
                                    <div className="relative w-full h-[400px] lg:h-[500px] xl:h-[600px] bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                                        <ImageViewer base64Image={viz.segmentation_overlay} altText="Segmentation Overlay" />
                                    </div>
                                </TabsContent>

                                <TabsContent value="interpretation" className="flex-1 m-0 h-full">
                                    <div className="relative w-full h-[400px] lg:h-[500px] xl:h-[600px] bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                                        <ImageViewer base64Image={viz.interpretation_overlay} altText="Interpretation Overlay" />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Right Side: Clinical Risks */}
                        <div className="xl:col-span-1 flex flex-col space-y-6">
                            <div className="flex flex-col p-6 bg-white rounded-2xl border border-slate-200 shadow-sm w-full h-full flex-1">
                                <h3 className="text-sm font-bold text-slate-500 mb-6 w-full text-left uppercase tracking-widest border-b border-slate-100 pb-3">Clinical Assessment</h3>

                                <div className="flex flex-col gap-5 w-full flex-1">
                                    <RiskBadge
                                        title="Nerve Risk"
                                        score={nerve_injury_risk.score}
                                        category={nerve_injury_risk.category}
                                        description={nerve_injury_risk.recommendation}
                                    />

                                    <RiskBadge
                                        title="Surg. Difficulty"
                                        score={surgical_difficulty.score}
                                        category={surgical_difficulty.winter_classification}
                                    />
                                </div>

                                {data.message && data.message !== "Success" && data.message !== "Prediction completed." && (
                                    <div className="mt-6 p-4 bg-blue-50/50 border border-blue-100 rounded-xl w-full">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                                            <div>
                                                <h5 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">System Note</h5>
                                                <p className="text-sm text-blue-800/80 font-medium leading-relaxed">{data.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Features Grid */}
                    <div className="flex flex-col p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                            {/* Geometric Features */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                                        Geometric Analysis
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    <FeatureItem label="Winter Angle" value={`${geometric_features.winter_angle.toFixed(1)}°`} />
                                    <FeatureItem label="Winter Class" value={geometric_features.winter_class} />
                                    <FeatureItem label="Pell-Gregory" value={geometric_features.pell_depth} />
                                    <FeatureItem label="Ramus Class" value={geometric_features.ramus_class} />
                                    <FeatureItem label="Min Distance" value={`${geometric_features.min_distance_mm.toFixed(2)} mm`} />
                                    <FeatureItem label="Root Cmplx" value={geometric_features.root_complexity.toFixed(2)} />
                                    <FeatureItem label="Contact" value={geometric_features.contact ? "Yes" : "No"} />
                                </div>
                            </div>

                            {/* CNN Features */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1.5 h-5 bg-purple-500 rounded-full" />
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                                        AI Confidence Metrics
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    <FeatureItem label="Overlap" value={cnn_features.overlap.toFixed(2)} />
                                    <FeatureItem label="Interruption" value={cnn_features.interruption.toFixed(2)} />
                                    <FeatureItem label="Darkening" value={cnn_features.darkening.toFixed(2)} />
                                </div>
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
        <div className="bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100 flex flex-col justify-center transition-colors hover:bg-slate-100/80">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 mb-1 font-bold">{label}</span>
            <span className="text-sm font-semibold text-slate-800">{value}</span>
        </div>
    );
}
