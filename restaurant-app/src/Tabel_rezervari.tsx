import { useState , useEffect } from 'react'

const Tabel_rezervari = () => {
    const [rezervari, setrezervari] = useState<any[]>([]);
    const [loading, setloading] = useState(true);

    const[id, setid] = useState('');

    const incarca_Rezervari = async () => {
        try{
            const token = localStorage.getItem('token');
            const response =await fetch(`${import.meta.env.VITE_API_URL}/Afiseaza_Rezervarile`, {method: 'GET', headers: {'Authorization': `Bearer ${token}`, 'Content-type': 'application/json'}})

            if(response.ok){
                const data_rezervari = await response.json();
                setrezervari(data_rezervari);
            }
            else{
                alert('Eroare' + 'data.detail');
            }
        }catch(error){
            console.error("Erroare la fetch:", error);
        }finally{
            setloading(false);
        }
    }

    const handleStergere = async () => {

        if(!id){
            alert("Trebuie sa alegi un id din lista");
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

    useEffect(() => {incarca_Rezervari();},[]);

    if(loading) return <p>Rezervarile se incarca</p>

    return(
        <div className='admin-container'>
            <h2>Gestiune Rezervari</h2>
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
                                <td>{r.check_in}</td>
                                <td>{r.check_out}</td>
                                <td>{r.status}</td>
                           </tr> 
                        ))
                    }
                </tbody>
            </table>
            <div className="admin-actions-bar">
                <button className="btn-back" onClick={() => window.history.back()}>Inapoi</button>
                <div className="delete-section">
                    <input type="number" placeholder="Introdu ID-ul de șters..." className="input-delete" value={id} onChange={(e) => {setid(e.target.value)}}/>
                    <button onClick={handleStergere} className="btn-action-delete">Șterge Rezervare</button>
                </div>
            </div>

            <div id='foot' className='footer'>
                <h2>©2026 All Rights Reserved</h2>
            </div>
            
        </div>
    )
        
}

export default Tabel_rezervari;