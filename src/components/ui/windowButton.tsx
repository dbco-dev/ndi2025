import { useState } from 'react';

type TailwindColor = 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green' | 'emerald' | 'teal' | 'cyan' | 'sky' | 'blue' | 'indigo' | 'violet' | 'purple' | 'fuchsia' | 'pink' | 'rose' | 'slate' | 'gray' | 'zinc' | 'neutral' | 'stone';

const colorClasses: Record<TailwindColor, string> = {
    red: 'bg-red-400',
    orange: 'bg-orange-400',
    amber: 'bg-amber-400',
    yellow: 'bg-yellow-400',
    lime: 'bg-lime-400',
    green: 'bg-green-400',
    emerald: 'bg-emerald-400',
    teal: 'bg-teal-400',
    cyan: 'bg-cyan-400',
    sky: 'bg-sky-400',
    blue: 'bg-blue-400',
    indigo: 'bg-indigo-400',
    violet: 'bg-violet-500',
    purple: 'bg-purple-400',
    fuchsia: 'bg-fuchsia-400',
    pink: 'bg-pink-400',
    rose: 'bg-rose-400',
    slate: 'bg-slate-400',
    gray: 'bg-gray-400',
    zinc: 'bg-zinc-400',
    neutral: 'bg-neutral-400',
    stone: 'bg-stone-400',
};

function WindowButton({ color, onClick }: { color: TailwindColor, onClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className={`w-3 h-3 rounded-full ${colorClasses[color]} flex items-center justify-center`} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onClick={onClick}>
            <div className={`w-1.5 h-1.5 rounded-full bg-zinc-600 ${isHovered ? 'block' : 'hidden'}`}></div>
        </div>
    )
}

export default WindowButton;