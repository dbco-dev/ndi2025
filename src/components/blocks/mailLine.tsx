
function Mailline({ expediteur, objet, contenu, heureReception, destinataire, dateReception }: { expediteur?: string; objet?: string; contenu?: string; heureReception?: string; destinataire?: string; dateReception?: string }) {
    





    return (
        <div className="flex items-center bg-gray-100 gap-1 p-2 border-b rounded-xl hover:bg-gray-200 cursor-pointer">
            <div className="flex-1 min-w-0 truncate px-2">{expediteur}</div>
            <div className="flex-1 min-w-0 truncate px-2">{objet}</div>
            <div className="flex-2 min-w-0 truncate px-2">{contenu}</div>

            <div className="ml-auto truncate px-2 text-right">{heureReception}</div>
            <div className="ml-auto truncate px-2 text-right">{dateReception}</div>
        </div>
    )
}

export default Mailline