import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal } from "lucide-react";
import React from "react";

interface SortableDashboardWidgetProps {
    id: string;
    children: React.ReactNode;
    className?: string;
}

export const SortableDashboardWidget = ({ id, children, className = "" }: SortableDashboardWidgetProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group ${className} ${isDragging ? "opacity-75 shadow-2xl" : ""}`}
        >
            <div
                {...attributes}
                {...listeners}
                className={`absolute top-4 right-4 z-[100] p-1.5 bg-zinc-800/90 text-zinc-400 hover:text-zinc-50 border border-zinc-700/50 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-all shadow-md ${isDragging ? "opacity-100 bg-indigo-500/20 text-indigo-400 border-indigo-500/50" : ""}`}
            >
                <GripHorizontal size={18} />
            </div>
            
            {children}
        </div>
    );
};
