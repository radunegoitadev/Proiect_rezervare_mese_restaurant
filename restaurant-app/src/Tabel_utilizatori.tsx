import { useState , useEffect } from 'react'

const Tabel_utilizatori = () => {
    const [utilizatori, setUtilizatori] = useState<any[]>([]);
    const [loading, setLoading] = useState(true)
    const [id_sters, set_id_sters] = useState('');


    const incarca_Utilizatori = async () => {
        try{
            const token = localStorage.getItem('token');
            const response = await fetch('http://127.0.0.1:8000/Utilizatori', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-type': 'application/json'
                }
            });

            if(response.ok){
                const data_utilizatori = await response.json();
                setUtilizatori(data_utilizatori);
            }
            else {alert("Nu ai permisiunea de a vedea datele utilizatorilor");}

        }catch(error){
            console.error("Eroare la fetch:", error);
        }finally{
            setLoading(false);
        }
    }

    const handleStergere = async () => {

        if(!id_sters){
            alert("Trebuie sa alegi un id din lista");
            return;
        }

        try{
            const token = localStorage.getItem('token');
            const response = await fetch(`http://127.0.0.1:8000/Stergere_Utilizator/${id_sters}`, {
                method: 'DELETE',
                headers: {'Authorization': `Bearer ${token}`}
            })

            const data = await response.json();

            if(response.ok){
                set_id_sters('');
                incarca_Utilizatori();
            }
            else{
                alert(data.detail);
            }
        }catch(error){
            alert("Eroare la stergere");
        }
    }

    useEffect(() => {incarca_Utilizatori();}, []);

    if(loading) return <p>Se încarcă rezervările...</p>

    return(
        <div className="admin-container">
            <h2>Gestiune Utilizatori</h2>
            <table className='utilizatori-table'>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Rol</th>
                        <th>Parola Criptata</th>
                    </tr>
                </thead>
                <tbody>
                    {utilizatori.map((u) => (
                        <tr key={u.id}>
                            <td>{u.id}</td>
                            <td>{u.username}</td>
                            <td>{u.rol}</td>
                            <td className='password-cell'>{u.parola_criptata}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="admin-actions-bar">
                <button className="btn-back" onClick={() => window.history.back()}>Inapoi</button>
                <div className="delete-section">
                    <input type="number" placeholder="Introdu ID-ul de șters..." className="input-delete" value={id_sters} onChange={(e) => {set_id_sters(e.target.value)}}/>
                    <button onClick={handleStergere} className="btn-action-delete">Șterge Utilizator</button>
                </div>
            </div>
        </div>
    )
}

export default Tabel_utilizatori;