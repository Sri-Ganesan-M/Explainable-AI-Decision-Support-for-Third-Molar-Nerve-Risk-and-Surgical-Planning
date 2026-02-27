import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { ZoomIn, X } from "lucide-react";
import { useState } from "react";

interface ImageViewerProps {
    base64Image: string;
    altText: string;
}

export function ImageViewer({ base64Image, altText }: ImageViewerProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="relative w-full h-full group cursor-pointer">
                    <img
                        src={`data:image/png;base64,${base64Image}`}
                        alt={altText}
                        className="w-full h-full object-contain absolute inset-0 transition-opacity group-hover:opacity-80"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                        <div className="bg-white/90 p-3 rounded-full text-gray-800 shadow-lg flex items-center gap-2">
                            <ZoomIn className="w-5 h-5" />
                            <span className="text-sm font-semibold">Click to enlarge</span>
                        </div>
                    </div>
                </div>
            </DialogTrigger>

            <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] w-full h-[90vh] p-1 sm:p-4 bg-black/95 border-none flex flex-col justify-center items-center shadow-2xl">
                <DialogTitle className="sr-only">Full Size Image View</DialogTitle>
                {/* Added a custom close button for better visibility on dark background */}
                <button
                    onClick={() => setOpen(false)}
                    className="absolute right-4 top-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-50 focus:outline-none"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="w-full h-full flex items-center justify-center p-2 sm:p-6 overflow-hidden relative">
                    <img
                        src={`data:image/png;base64,${base64Image}`}
                        alt={altText}
                        className="max-w-full max-h-full object-contain pointer-events-none"
                    />
                </div>
                <div className="absolute bottom-4 left-0 w-full text-center pointer-events-none">
                    <p className="inline-block bg-black/60 text-white/90 px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm shadow-md">
                        {altText} - Full View
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
