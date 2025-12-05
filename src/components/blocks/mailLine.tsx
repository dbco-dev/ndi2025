import { useEffect, useState } from "react";


function Mailline({ expediteur, objet, contenu, date, onClick, isSelected }: { expediteur?: string; objet?: string; contenu?: string; date?: string; onClick?: () => void; isSelected?: boolean }) {
    
const [dateFormatted, setDateFormatted] = useState<string>(date || '');


const formatDateTime = (input?: string) => {
    if (!input) return '';
    const parsed = new Date(input);
    if (isNaN(parsed.getTime())) return input;

    const now = new Date();
    const isToday =
        parsed.getFullYear() === now.getFullYear() &&
        parsed.getMonth() === now.getMonth() &&
        parsed.getDate() === now.getDate();

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (isToday) {
        return `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
    }

    // same year: show day/month, otherwise show day/month/year
    const dayMonth = `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}`;
    return parsed.getFullYear() === now.getFullYear()
        ? dayMonth
        : `${dayMonth}/${parsed.getFullYear()}`;
};

useEffect(() => {
    setDateFormatted(formatDateTime(date));
}, [date]);




    const base = 'flex items-center gap-1 p-2 border-b rounded-xl cursor-pointer';
    const selectedClass = isSelected ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-gray-100 hover:bg-gray-200';

    return (
        <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => { if (e.key === 'Enter') onClick && onClick(); }} className={`${base} ${selectedClass}`}>
            <div className="flex-1 min-w-0 truncate px-2 text-sm font-medium">{expediteur}</div>
            <div className="flex-1 min-w-0 truncate px-2 text-sm text-gray-700">{objet}</div>
            <div className="flex-2 min-w-0 truncate px-2 text-sm text-gray-500">{contenu}</div>

            <div className="ml-auto truncate px-2 text-right text-xs text-gray-500">{dateFormatted}</div>
        </div>
    )
}

export default Mailline