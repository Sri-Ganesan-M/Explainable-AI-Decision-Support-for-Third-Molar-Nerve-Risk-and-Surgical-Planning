import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RiskBadgeProps {
    title: string;
    score: number;
    category: string;
    description?: string;
}

export function RiskBadge({ title, score, category, description }: RiskBadgeProps) {
    let bgClass = "";
    let borderClass = "";
    let textClass = "";
    let badgeClass = "";
    let Icon = Info;

    // Convert float score to 0-100 if necessary
    const displayScore = score <= 1.0 ? score * 100 : score;

    if (displayScore < 40) {
        bgClass = "bg-green-50";
        borderClass = "border-green-200";
        textClass = "text-green-900";
        badgeClass = "bg-green-100 text-green-800 border-green-300";
        Icon = CheckCircle;
    } else if (displayScore < 75) {
        bgClass = "bg-yellow-50";
        borderClass = "border-yellow-200";
        textClass = "text-yellow-900";
        badgeClass = "bg-yellow-100 text-yellow-800 border-yellow-300";
        Icon = AlertTriangle;
    } else {
        bgClass = "bg-red-50";
        borderClass = "border-red-200";
        textClass = "text-red-900";
        badgeClass = "bg-red-100 text-red-800 border-red-300";
        Icon = AlertTriangle;
    }

    return (
        <div className={`flex flex-col items-center justify-center p-6 border rounded-2xl shadow-sm w-full transition-all duration-300 hover:shadow-md ${bgClass} ${borderClass}`}>
            <h4 className={`text-xs font-bold uppercase tracking-widest mb-3 opacity-90 ${textClass}`}>{title}</h4>

            {/* Main Actionable Text (Recommendation or Category) */}
            <div className={`text-2xl font-extrabold text-center mb-4 px-2 tracking-tight ${textClass}`}>
                {description ? description : category}
            </div>

            <Badge variant="outline" className={`px-3 py-1 text-xs font-semibold flex items-center justify-center space-x-2 mb-5 bg-white shadow-sm ${badgeClass}`}>
                <Icon className="w-3.5 h-3.5" />
                <span>{description ? category : `Score: ${Math.round(displayScore)}`}</span>
            </Badge>

            <div className={`text-sm font-medium mt-auto border-t w-full text-center pt-4 border-black/10 opacity-80 ${textClass}`}>
                AI Risk Score: {Math.round(displayScore)}<span className="opacity-60 text-xs ml-1 font-normal">/ 100</span>
            </div>
        </div>
    );
}
