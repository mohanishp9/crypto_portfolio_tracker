import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal } from "lucide-react";

interface SortableMetricCardProps {
    id: string;
    title: string;
    value: React.ReactNode;
    description: string;
}

export const SortableMetricCard = ({ id, title, value, description }: SortableMetricCardProps) => {
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
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative p-5 bg-white border-4 border-black brutalist-shadow-sm group ${
                isDragging ? "opacity-50" : ""
            }`}
        >
            <div
                {...attributes}
                {...listeners}
                className="absolute top-4 right-4 text-black cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <GripHorizontal size={20} strokeWidth={3} />
            </div>
            
            <p className="text-sm font-black tracking-widest uppercase text-black mb-1 mr-6 border-b-4 border-black pb-1">{title}</p>
            <div className="mt-2">{value}</div>
            <p className="text-xs font-mono font-bold text-black mt-2 bg-[#ccff00] inline-block px-1 border-2 border-black">{description}</p>
        </div>
    );
};
