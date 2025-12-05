import Window from '../blocks/window'
import Mailline from '../blocks/mailLine'
import { useEffect, useState } from 'react';


function Mail({ uuid, title, initialPosition, onClose, onClick, shouldBlink }: { uuid: number, title: string, initialPosition: { x: number, y: number }, onClose: () => void, onClick: (position: { x: number, y: number }) => void, shouldBlink: boolean }) {
    
interface Mail {
    expediteur: string;
    objet: string;
    contenu: string;
    date: string;
    destinataire: string;
}
const [mails, setMails] = useState<Mail[]>([]);
const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent'>('inbox');

const isFromProfessor = (m: Mail) => {
    return (m.expediteur || '').toLowerCase().includes('prof');
}

const inboxMails = mails.filter(m => !isFromProfessor(m) && (m.expediteur || '').toLowerCase() !== 'moi');
const sentMails = mails.filter(m => isFromProfessor(m) || (m.expediteur || '').toLowerCase() === 'moi');
const displayedMails = activeFolder === 'sent' ? sentMails : inboxMails;
const [query, setQuery] = useState<string>('');
const [showCompose, setShowCompose] = useState<boolean>(false);
const [showContacts, setShowContacts] = useState<boolean>(false);
const [composeDraft, setComposeDraft] = useState<Partial<Mail>>({ destinataire: '', objet: '', contenu: '' });

const matchesQuery = (m: Mail, q: string) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
        (m.expediteur || '').toLowerCase().includes(s) ||
        (m.destinataire || '').toLowerCase().includes(s) ||
        (m.objet || '').toLowerCase().includes(s) ||
        (m.contenu || '').toLowerCase().includes(s)
    );
}

const filteredMails = displayedMails.filter(m => matchesQuery(m, query));

// keep selection in sync with filtered results
useEffect(() => {
    if (filteredMails.length === 0) {
        setSelectedMail(null);
        return;
    }
    if (!selectedMail || !filteredMails.includes(selectedMail)) {
        setSelectedMail(filteredMails[0]);
    }
}, [query, activeFolder, mails]);

const openCompose = (prefill?: { destinataire?: string }) => {
    setComposeDraft({ expediteur: 'Moi', destinataire: prefill?.destinataire || '', objet: '', contenu: '' });
    setShowCompose(true);
    setShowContacts(false);
}

const sendCompose = () => {
    const newMail: Mail = {
        expediteur: 'Moi',
        destinataire: composeDraft.destinataire || '',
        objet: composeDraft.objet || '',
        contenu: composeDraft.contenu || '',
        date: new Date().toLocaleString(),
    };
    setMails(prev => [newMail, ...prev]);
    setActiveFolder('sent');
    setSelectedMail(newMail);
    setShowCompose(false);
    setComposeDraft({ destinataire: '', objet: '', contenu: '' });
}

const contacts = Array.from(new Set(mails.flatMap(m => [m.expediteur, m.destinataire]).filter(Boolean)));

const formatDisplayDate = (input?: string) => {
    if (!input) return '';
    const parsed = new Date(input);
    if (isNaN(parsed.getTime())) return input;

    const now = new Date();
    const isToday = parsed.getFullYear() === now.getFullYear() && parsed.getMonth() === now.getMonth() && parsed.getDate() === now.getDate();
    const pad = (n: number) => n.toString().padStart(2, '0');

    if (isToday) {
        return `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
    }

    const dayMonth = `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}`;
    return parsed.getFullYear() === now.getFullYear() ? dayMonth : `${dayMonth}/${parsed.getFullYear()}`;
}

useEffect(() => {
    // fetching data from json file
    fetch('/mails.json')
        .then(response => response.json())
        .then(data => {
            const arr = Array.isArray(data) ? data as Mail[] : [] as Mail[];
            setMails(arr);
            console.log('Mails loaded:', arr.length);
            // choisir le premier message de la boîte de réception par défaut
            const firstInbox = arr.find(m => !( (m.expediteur||'').toLowerCase().includes('prof') ));
            setSelectedMail(firstInbox || (arr.length > 0 ? arr[0] : null));
        })
        .catch(error => console.error('Error fetching mails:', error));
}, []);


    return (
        <Window uuid={uuid} title={title} initialPosition={initialPosition} initialSize={{width:1250, height:700}} onClose={onClose} onClick={onClick} shouldBlink={shouldBlink}>

            <div className="w-full h-full flex flex-col gap-3 p-3 bg-slate-50">
                {/* Top action bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-white rounded-md shadow-sm">
                    <div className="text-sm font-semibold text-left">Boîte mail</div>

                    {/* Search bar */}
                    <div className="flex-1 flex justify-center mt-2 sm:mt-0 px-4">
                        <div className="w-full">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Rechercher par expéditeur, objet ou contenu..."
                                className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-end gap-2 mt-2 sm:mt-0">
                        <button
                            title="Nouveau mail"
                            onClick={() => { setShowContacts(false); setShowCompose(true); openCompose(); }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            Nouveau mail
                        </button>
                        <button
                            title="Contact"
                            onClick={() => { setShowContacts(prev => !prev); setShowCompose(false); }}
                            className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md text-sm font-medium hover:bg-slate-300 transition-colors"
                        >
                            Contact
                        </button>
                    </div>
                </div>

                {/* Main content area - flexible layout */}
                <div className="flex-1 flex gap-3 min-h-0">
                    {/* Sidebar */}
                    <aside className="w-40 bg-white p-3 rounded-lg border border-slate-200 shadow-sm overflow-auto">
                        <h3 className="text-sm font-semibold mb-3 text-slate-900">Dossiers</h3>
                        <ul className="space-y-1 text-sm">
                            <li
                                className={`px-3 py-2 rounded cursor-pointer transition-colors ${activeFolder === 'inbox' ? 'bg-blue-100 text-blue-900 font-semibold' : 'text-slate-700 hover:bg-slate-100'}`}
                                onClick={() => { setActiveFolder('inbox'); const first = inboxMails[0]; setSelectedMail(first || null); }}
                            >
                                Boîte de réception <span className="text-xs text-slate-500 ml-1">({inboxMails.length})</span>
                            </li>
                            <li
                                className={`px-3 py-2 rounded cursor-pointer transition-colors ${activeFolder === 'sent' ? 'bg-blue-100 text-blue-900 font-semibold' : 'text-slate-700 hover:bg-slate-100'}`}
                                onClick={() => { setActiveFolder('sent'); const first = sentMails[0]; setSelectedMail(first || null); }}
                            >
                                Envoyés <span className="text-xs text-slate-500 ml-1">({sentMails.length})</span>
                            </li>
                            <li className="px-3 py-2 rounded text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors">Brouillons</li>
                            <li className="px-3 py-2 rounded text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors">Corbeille</li>
                        </ul>
                    </aside>

                    {/* Mail list */}
                    <section className="flex-1 min-w-0 bg-white p-3 rounded-lg border border-slate-200 shadow-sm overflow-auto">
                        <div className="mb-3 flex items-center justify-between sticky top-0 bg-white pb-2 border-b border-slate-100">
                            <h2 className="text-base font-semibold text-slate-900">Messages</h2>
                            <div className="text-sm text-slate-500">{filteredMails.length}</div>
                        </div>
                        <div className="space-y-1">
                            {filteredMails.map((mail, index) => (
                                <Mailline
                                    key={index}
                                    expediteur={mail.expediteur}
                                    objet={mail.objet}
                                    date={mail.date}
                                    contenu={mail.contenu}
                                    isSelected={selectedMail === mail}
                                    onClick={() => setSelectedMail(mail)}
                                />
                            ))}
                        </div>
                    </section>

                    {/* Preview pane */}
                    <aside className="flex-1 min-w-0 bg-white p-4 rounded-lg border border-slate-200 shadow-sm overflow-auto">
                        <h3 className="text-base font-semibold mb-3 text-slate-900 sticky top-0 bg-white pb-2 border-b border-slate-100">Aperçu</h3>
                        <div className="space-y-4">
                            {showCompose ? (
                                <div className="flex flex-col gap-3">
                                    <h4 className="text-sm font-semibold text-slate-900">Nouveau message</h4>
                                    <input 
                                        className="border border-slate-300 px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                        placeholder="Destinataire" 
                                        value={composeDraft.destinataire || ''} 
                                        onChange={(e) => setComposeDraft(d => ({ ...d, destinataire: e.target.value }))} 
                                    />
                                    <input 
                                        className="border border-slate-300 px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                        placeholder="Objet" 
                                        value={composeDraft.objet || ''} 
                                        onChange={(e) => setComposeDraft(d => ({ ...d, objet: e.target.value }))} 
                                    />
                                    <textarea 
                                        className="border border-slate-300 px-3 py-2 rounded text-sm flex-1 min-h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
                                        placeholder="Contenu" 
                                        value={composeDraft.contenu || ''} 
                                        onChange={(e) => setComposeDraft(d => ({ ...d, contenu: e.target.value }))} 
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={sendCompose} className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">Envoyer</button>
                                        <button onClick={() => setShowCompose(false)} className="px-3 py-2 bg-slate-200 text-slate-800 rounded-md text-sm font-medium hover:bg-slate-300 transition-colors">Annuler</button>
                                    </div>
                                </div>
                            ) : showContacts ? (
                                <div>
                                    <h4 className="text-sm font-semibold mb-3 text-slate-900">Contacts</h4>
                                    <div className="flex flex-col gap-2">
                                        {contacts.length === 0 && <div className="text-sm text-slate-500">Aucun contact.</div>}
                                        {contacts.map((c, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 border border-slate-200 rounded hover:bg-slate-50 transition-colors">
                                                <div className="text-sm text-slate-900">{c}</div>
                                                <button onClick={() => { openCompose({ destinataire: c }); }} className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Écrire</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : selectedMail ? (
                                <div className="space-y-3">
                                    <div className="pb-3 border-b border-slate-200">
                                        <div className="text-sm text-slate-600 mb-1">De : <span className="font-medium text-slate-900">{selectedMail.expediteur}</span></div>
                                        <div className="text-sm text-slate-600 mb-1">À : <span className="font-medium text-slate-900">{selectedMail.destinataire}</span></div>
                                        <div className="text-sm text-slate-600">Date : <span className="font-medium text-slate-900">{formatDisplayDate(selectedMail.date)}</span></div>
                                    </div>
                                    <h4 className="text-base font-semibold text-slate-900">{selectedMail.objet}</h4>
                                    <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">{selectedMail.contenu}</div>
                                </div>
                            ) : (
                                <div className="text-sm text-slate-500 text-center py-8">Aucun message sélectionné.</div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </Window>
    )
}

export default Mail