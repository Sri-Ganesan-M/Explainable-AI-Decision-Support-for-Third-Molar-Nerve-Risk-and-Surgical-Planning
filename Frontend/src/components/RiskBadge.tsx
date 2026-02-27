import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RiskBadgeProps {
    score: number;
}

export function RiskBadge({ score }: RiskBadgeProps) {
    let colorClass = "";
    let label = "";
    let Icon = Info;

    if (score < 40) {
        colorClass = "bg-green-100 text-green-800 border-green-300";
        label = "Low Risk";
        Icon = CheckCircle;
    } else if (score < 75) {
        colorClass = "bg-yellow-100 text-yellow-800 border-yellow-300";
        label = "Moderate Risk";
        Icon = AlertTriangle;
    } else {
        colorClass = "bg-red-100 text-red-800 border-red-300";
        label = "High Risk";
        Icon = AlertTriangle;
    }

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="text-5xl font-bold mb-2">
                {Math.round(score)}<span className="text-2xl text-gray-500 font-medium">/100</span>
            </div>
            <Badge variant="outline" className={`px-4 py-1.5 text-sm font-semibold flex items-center space-x-2 ${colorClass}`}>
                <Icon className="w-4 h-4" />
                <span>{label}</span>
            </Badge>
        </div>
    );
}
