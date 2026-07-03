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
            className={`relative p-5 bg-zinc-900 border ${
                isDragging ? "border-indigo-500 shadow-2xl opacity-80" : "border-zinc-800 shadow-sm"
            } rounded-xl group`}
        >
            <div
                {...attributes}
                {...listeners}
                className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-300 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <GripHorizontal size={16} />
            </div>
            
            <p className="text-[10px] tracking-widest uppercase text-zinc-500 font-semibold mb-1 mr-6">{title}</p>
            <div className="mt-1">{value}</div>
            <p className="text-xs text-zinc-600 mt-2">{description}</p>
        </div>
    );
};
