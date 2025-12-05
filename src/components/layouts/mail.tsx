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

            <div className="h-full flex flex-col gap-3">
                {/* Top visual action bar (responsive: boîte à gauche, barre centrée, boutons à droite; on petit écran boutons en dessous) */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-white/40 rounded-md ">
                    <div className="text-sm font-semibold text-left">Boîte mail</div>

                    {/* Centred search bar: becomes the middle flex item and is centered */}
                    <div className="flex-1 flex justify-center mt-2 sm:mt-0">
                        <div className="w-full sm:max-w-md">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Rechercher par expéditeur, objet ou contenu..."
                                className="w-full px-3 py-1 rounded-md border border-gray-200 bg-white text-sm placeholder-gray-400 mx-auto"
                            />
                        </div>
                    </div>

                    <div className="flex items-end gap-2 mt-2 sm:mt-0">
                        <button
                            title="Nouveau mail"
                            onClick={() => { setShowContacts(false); setShowCompose(true); openCompose(); }}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
                        >
                            Nouveau mail
                        </button>
                        <button
                            title="Contact"
                            onClick={() => { setShowContacts(prev => !prev); setShowCompose(false); }}
                            className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-sm"
                        >
                            Contact
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex h-full gap-4 p-4">
                {/* Sidebar */}
                <aside className="w-48 bg-white/50 p-2 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-semibold mb-2">Dossiers</h3>
                    <ul className="space-y-1 text-sm">
                        <li
                            className={`px-2 py-1 rounded cursor-pointer ${activeFolder === 'inbox' ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-100'}`}
                            onClick={() => { setActiveFolder('inbox'); const first = inboxMails[0]; setSelectedMail(first || null); }}
                        >
                            Boîte de réception <span className="text-xs text-gray-500 ml-2">({inboxMails.length})</span>
                        </li>
                        <li
                            className={`px-2 py-1 rounded cursor-pointer ${activeFolder === 'sent' ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-100'}`}
                            onClick={() => { setActiveFolder('sent'); const first = sentMails[0]; setSelectedMail(first || null); }}
                        >
                            Envoyés <span className="text-xs text-gray-500 ml-2">({sentMails.length})</span>
                        </li>
                        <li className="px-2 py-1 rounded hover:bg-gray-100 cursor-pointer">Brouillons</li>
                        <li className="px-2 py-1 rounded hover:bg-gray-100 cursor-pointer">Corbeille</li>
                    </ul>
                </aside>

                {/* Mail list */}
                <section className="flex-1 max-w-xl bg-white/50 p-2 rounded-lg border border-gray-200 overflow-auto">
                    <div className="mb-2 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Messages</h2>
                        <div className="text-sm text-gray-500">{filteredMails.length} messages</div>
                    </div>
                    <div className="space-y-2">
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
                <aside className="w-96 bg-white/50 p-4 rounded-lg border border-gray-200 overflow-visible flex flex-col h-full">
                    <h3 className="text-lg font-semibold mb-2">Aperçu</h3>
                    {showCompose ? (
                        <div className="flex flex-col h-full">
                            <h3 className="text-lg font-semibold mb-2">Nouveau message</h3>
                            <div className="flex-1 flex flex-col gap-2">
                                <input className="border px-2 py-1 rounded text-sm" placeholder="Destinataire" value={composeDraft.destinataire || ''} onChange={(e) => setComposeDraft(d => ({ ...d, destinataire: e.target.value }))} />
                                <input className="border px-2 py-1 rounded text-sm" placeholder="Objet" value={composeDraft.objet || ''} onChange={(e) => setComposeDraft(d => ({ ...d, objet: e.target.value }))} />
                                <textarea className="border px-2 py-1 rounded text-sm h-40" placeholder="Contenu" value={composeDraft.contenu || ''} onChange={(e) => setComposeDraft(d => ({ ...d, contenu: e.target.value }))} />
                            </div>
                            <div className="mt-1 flex gap-1">
                                <button onClick={sendCompose} className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">Envoyer</button>
                                <button onClick={() => setShowCompose(false)} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm">Annuler</button>
                            </div>
                        </div>
                    ) : showContacts ? (
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Contacts</h3>
                            <div className="flex flex-col gap-2">
                                {contacts.length === 0 && <div className="text-sm text-gray-500">Aucun contact.</div>}
                                {contacts.map((c, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                                        <div className="text-sm">{c}</div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { openCompose({ destinataire: c }); }} className="px-2 py-1 text-sm bg-blue-600 text-white rounded">Écrire</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : selectedMail ? (
                        <div>
                            <div className="mb-3">
                                <div className="text-sm text-gray-600">De : <span className="font-medium">{selectedMail.expediteur}</span></div>
                                <div className="text-sm text-gray-600">À : <span className="font-medium">{selectedMail.destinataire}</span></div>
                                <div className="text-sm text-gray-600">Date : <span className="font-medium">{formatDisplayDate(selectedMail.date)}</span></div>
                            </div>
                            <h4 className="text-md font-semibold mb-2">{selectedMail.objet}</h4>
                            <div className="whitespace-pre-wrap text-sm text-gray-800">{selectedMail.contenu}</div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">Aucun message sélectionné.</div>
                    )}
                </aside>

                </div>

            </div>
        </Window>
    )
}

export default Mail