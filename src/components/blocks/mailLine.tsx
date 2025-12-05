import { useEffect, useState } from "react";


function Mailline({ expediteur, objet, contenu, date, destinataire }: { expediteur?: string; objet?: string; contenu?: string; date?: string; destinataire?: string }) {
    
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




    return (
        <div className="flex items-center bg-gray-100 gap-1 p-2 border-b rounded-xl hover:bg-gray-200 cursor-pointer">
            <div className="flex-1 min-w-0 truncate px-2">{expediteur}</div>
            <div className="flex-1 min-w-0 truncate px-2">{objet}</div>
            <div className="flex-2 min-w-0 truncate px-2">{contenu}</div>

            <div className="ml-auto truncate px-2 text-right">{dateFormatted}</div>
        </div>
    )
}

export default Mailline