import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const Rezervarile_mele = () => {
    const [rezervari, setrezervari] = useState<any[]>([]);
    const[id, setid] = useState('');

    const incarca_Rezervari = async () => {
        try{
            const token = localStorage.getItem('token');
            const response =await fetch(`${import.meta.env.VITE_API_URL}/Vezi_propriile_rezervari`, {method: 'GET', headers: {'Authorization': `Bearer ${token}`, 'Content-type': 'application/json'}})

            if(response.ok){
                const data_rezervari = await response.json();
                setrezervari(data_rezervari);
            }
            else{
                toast.error('Eroare' + 'data.detail');
            }
        }catch(error){
            console.error("Erroare la fetch:", error);
        }
    }

    const handleStergere = async () => {

        if(!id){
            toast.loading("Trebuie sa alegi un id din lista");
            return;
        }

        try{
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/Stergere_Rezervare/${id}`, {
                method: 'DELETE',
                headers: {'Authorization': `Bearer ${token}`}
            })

            const data = await response.json();

            if(response.ok){
                setid('');
                incarca_Rezervari();
            }
            else{
                alert(data.detail);
            }
        }catch(error){
            alert("Eroare la stergere");
        }
    }

    useEffect(() => {incarca_Rezervari()}, []);

    return(
        <div className='admin-container'>
            <h2>Rezervările mele</h2>
            <div className="div-tabel">
            <table className='utilizatori-table'>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nume</th>
                        <th>Masa</th>
                        <th>Persoane</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        rezervari.map((r) => (
                           <tr key={r.id}>
                                <td>{r.id}</td>
                                <td>{r.nume_client}</td>
                                <td>{r.masa}</td>
                                <td>{r.persoane}</td>
                                <td>{r.check_in.replace('T', ' ')}</td>
                                <td>{r.check_out.replace('T', ' ')}</td>
                                <td>{r.status}</td>
                           </tr> 
                        ))
                    }
                </tbody>
            </table>
            </div>
            <div className="admin-actions-bar">
                <button className="btn-back" onClick={() => window.history.back()}>Inapoi</button>
                <div className="delete-section">
                    <input type="number" placeholder="Introdu ID-ul de șters..." className="input-delete" value={id} onChange={(e) => {setid(e.target.value)}}/>
                    <button onClick={handleStergere} className="btn-action-delete">Șterge Rezervare</button>
                </div>
            </div>
        </div>
    )
}

export default Rezervarile_mele ;