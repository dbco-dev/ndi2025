import Window from '../blocks/window'
import Mailline from '../blocks/mailLine'
import { useEffect, useState } from 'react';


function Mail({ uuid, title, initialPosition, initialSize, onClose, onClick, shouldBlink }: { uuid: number, title: string, initialPosition: { x: number, y: number }, initialSize: { width: number, height: number }, onClose: () => void, onClick: (position: { x: number, y: number }) => void, shouldBlink: boolean }) {
    
interface Mail {
    expediteur: string;
    objet: string;
    contenu: string;
    heureReception: string;
    destinataire: string;
    dateReception: string;
}

const [mails, setMails] = useState<Mail[]>([]);

useEffect(() => {
    // fetching data from json file
    fetch('/mails.json')
        .then(response => response.json())
        .then(data => {
            // Le JSON dans `public/mails.json` est un tableau d'objets mails,
            // donc il faut utiliser `setMails(data)` et non `data.mails`.
            setMails(data);
            console.log('Mails loaded:', Array.isArray(data) ? data.length : 0);
        })
        .catch(error => console.error('Error fetching mails:', error));
        //.then(data => {
        //    setMails(data.mails);
        //    console.log('Contenu du JSON:', data);
        //})
}, []);


    return (
        <Window title={title} initialPosition={initialPosition} initialSize={initialSize} onClose={onClose} onClick={onClick} shouldBlink={shouldBlink}>
            <div className="w-full h-full">
                {mails.map((mail, index) => (
                    <Mailline
                        key={index}
                        expediteur={mail.expediteur}
                        destinataire={mail.destinataire}
                        objet={mail.objet}
                        dateReception={mail.dateReception}
                        heureReception={mail.heureReception}
                        contenu={mail.contenu}
                    />
                ))
                }
            </div>
        </Window>
    )
}

export default Mail