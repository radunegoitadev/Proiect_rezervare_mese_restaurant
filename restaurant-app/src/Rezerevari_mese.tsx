import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react"
import toast from "react-hot-toast";

const Rezervari_mese = () => {
    const [start_time, setstart_time] = useState('');
    const [end_time, setend_time] = useState('');
    const [date, setdate] = useState('');
    const [mese, setmese] = useState<any[]>([]);
    const [masa_selectata, setmasa_selectata] = useState<number | null>(null);
    const [numar_persoane, setnumar_persoane] = useState(1);
    const peste30ZileDate = new Date();
    peste30ZileDate.setDate(peste30ZileDate.getDate() + 30);
    const peste30Zile = peste30ZileDate.toISOString().split('T')[0];
    

    const handleConfirmare = async (numarMasa: number) => {
        const token = localStorage.getItem('token');
        if(token){
           const decodat : any = jwtDecode(token);
           const numeutilizat = decodat.sub;

           const payload = {
                nume: numeutilizat, 
                masa: numarMasa,
                persoane: numar_persoane,
                start: `${date}T${start_time}:00`,
                end: `${date}T${end_time}:00`
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/Adaugarerezervare`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success("Rezervare reusita!");
                window.dispatchEvent(new Event("update_Navbar"));
                setmasa_selectata(null);
                fetch_mese();
            }
        } else {
            toast.error("Trebuie sa fiti logat pentru a face o rezervare!");
        }
    };

    const fetch_mese = async () => {
            if (start_time && end_time && date){
                const start = new Date(`${date} ${start_time}`);
                const end = new Date(`${date} ${end_time}`);
                const durataOre = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                if (durataOre > 4){
                    toast.error("Intervalul trebuie sa nu depaseasca 4 ore");
                    setend_time('');
                    return;
                }

                if (durataOre <= 0){
                    toast.error("Va rugam sa alegeti o data valida start < finish");
                    setend_time('');
                    return;
                }
                try{ const response = await fetch(`${import.meta.env.VITE_API_URL}/Afisarea_Meselor?data=${date}&start=${start_time}&end=${end_time}`, {
                    method: 'GET',
                    headers: {'Content-type': 'application/json'},
                });
                const data = await response.json();

                if (response.ok){
                setmese(data);}

                }catch (error){
                    console.error("Eroare la serverul de backend");
                }
        }}

    useEffect(() => {
        fetch_mese();
        const api_url = import.meta.env.VITE_API_URL;
        const websocket_url = api_url.replace("http", "ws") + "/ws";
        const socket = new WebSocket(websocket_url);

        socket.onopen = () => console.log("Conectat cu succes");
        socket.onerror = () => console.log("Eroare");
        socket.onclose = () => console.log("Deconectat");

        socket.onmessage = (event) => {
            console.log("Mesaj primit");
            if (event.data === "NOUA_REZERVARE"){
                fetch_mese();
            }
        }

        return () => {
            socket.close();
        };

    }, [start_time, end_time, date])

    const ore = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];

    const acum = new Date();
    const esteAzi = date === acum.toISOString().split('T')[0];
    const oraActuala = acum.getHours();
    const minuteActuale = acum.getMinutes();

    const oreFiltrate = ore.filter(oraString => {
                if (!esteAzi) return true;

                    const [h, m] = oraString.split(':').map(Number);
    
                    if (h > oraActuala) return true;
                    if (h === oraActuala && m > minuteActuale) return true;
    
                    return false;
                });

    return(
        <div className="wrapper">

            <div className="interval">
                <h2>Data și ora:</h2>
                <input max={peste30Zile} onKeyDown={(e) => e.preventDefault()} min={new Date().toISOString().split('T')[0]} onChange={(e) => setdate(e.target.value)} value={date} type="date" />
                <select onChange={(e) => setstart_time(e.target.value)} value={start_time}>
                    <option value="" disabled>Alege Check-in</option>
                    {oreFiltrate.map(ora => (
                    <option key={ora} value={ora}>{ora}</option>
                    ))};
                </select>
                <select onChange={(e) => setend_time(e.target.value)} value={end_time}>
                    <option disabled value="">Alege Check-out</option>
                    {oreFiltrate.map(ora => (
                        <option key={ora} value={ora}>{ora}</option>
                        ))
                    }
                </select>
            </div>

            <div className="mese">
                {mese.length > 0 ? (mese.map((masa) => (

                    <div key={masa.numar} className={`masa-container ${masa_selectata === masa.numar ? 'is-flipped' : ''}`}>
                        <div className="masa-card">
                            
                            <div className={`face front ${masa.ocupat ? 'ocupat' : 'liber'}`} onClick={() => !masa.ocupat && setmasa_selectata(masa.numar)}>
                                {masa.ocupat ? (
                                    <span className="txt-rezervat">Rezervat</span>
                                ):(
                                    <>
                                        Masa {masa.numar}
                                        <p>Max {masa.capacitate} pers</p>
                                    </>
                                )}
                            </div>

                            <div className="face back">
                                <label>Persoane:</label>
                                <input 
                                    type="number"
                                    value={numar_persoane}
                                    min="1"
                                    max={masa.capacitate}
                                    onChange={(e) => setnumar_persoane(parseInt(e.target.value))}
                                />
                                <button onClick={() => handleConfirmare(masa.numar)}>Confirmă</button>
                                <button className="btn-inchide" onClick={() => setmasa_selectata(null)}>Anulează</button>
                            </div>

                        </div>
                    </div>
                    ))) : (
                        <p>Introduceți intervalul dorit pentru a vedea mesele disponibile.</p>
                    )
                }
            </div>
        </div> 
    )
}

export default Rezervari_mese;