import '../src/style.css'
import '../src/stil-utilizatori.css'
import './rezervari.css'
import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import Tabel_utilizatori from './Tabel_utilizatori';
import Tabel_rezervari from '../src/Tabel_rezervari';
import Rezervari_mese from './Rezerevari_mese';
import { jwtDecode } from 'jwt-decode';
import Rezervarile_mele from './Rezervarile_mele';
import {Toaster, toast} from 'react-hot-toast';
import emailjs from '@emailjs/browser';

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const[are_rezervare, setare_rezervare] = useState<boolean>(false);
  const navigate = useNavigate();

  const [LoginUser, setLoginUser] = useState('');
  const [LoginPassword, setLoginPassword] = useState('');
  const [RegisterUsername, setRegisterUsername] = useState('');
  const [RegisterPassword, setRegisterPassword] = useState('');

  const [LoggedinUser, setLoggedinUser] = useState<string | null>(null);

  const location = useLocation();
  const isres_page = location.pathname === "/rezervari/mese";
  const ismy_res_page = location.pathname === "/rezervarile_mele"

  useEffect(() => {
    const handlescroll = () => {
      const activeElement = document.activeElement?.tagName;

      if (activeElement === 'INPUT' || activeElement === 'TEXTAREA') {
        return; 
      }
      if(showLogin) setShowLogin(false);
      if(showRegister) setShowRegister(false);
    }

    if (showLogin || showRegister) window.addEventListener('scroll', handlescroll);
    
    return () => {
      window.removeEventListener('scroll', handlescroll);
    }
  }, [showLogin, showRegister])

  useEffect(() => {
    const handleBack = () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }

    handleBack();

    const timeout = setTimeout(handleBack, 100);
    return () => clearTimeout(timeout);

  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try{
        const decodat: any = jwtDecode(token);

        if (decodat.exp * 1000 < Date.now()){
          localStorage.removeItem('token');
          setLoggedinUser(null);
        }
        else {
          setLoggedinUser(decodat.sub);
          verifica_rezervare();
        }
      } catch (error){
        console.error("Token invalid");
        localStorage.removeItem('token');
      }
    }
  }, [])

  const verifica_rezervare = async () => {
        const token = localStorage.getItem('token');
        if (token){
            try{
                const response = await fetch(`${import.meta.env.VITE_API_URL}/Are_rezervare`, {method: 'GET', headers: {'Authorization': `Bearer ${token}`,'Content-type': 'application/json'}});
                const data = await response.json();
                setare_rezervare(data);
            }catch(error){
                console.error("Erroare la backend");
            }
        }
  }

  const scroll_to_Contact = () => {
    const element = document.getElementById("foot")
    if(element){
      element.scrollIntoView({behavior: 'smooth'})
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/Login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: LoginUser,
                password: LoginPassword
            }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.access_token);
            setLoggedinUser(LoginUser);
            await verifica_rezervare();
            toast.success("Logat cu succes!");
            setShowLogin(false);
        } else {
            toast.error("Eroare: " + (data.detail || "Ceva nu a mers bine"));
        }
    } catch (error) {
        console.error("Eroare la conexiunea cu serverul:", error);
        toast.error("Serverul backend nu este pornit!");
    }
};

const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();

  try{
    const response = await fetch(`${import.meta.env.VITE_API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        username: RegisterUsername,
        password: RegisterPassword
      }),
    });

    const data = await response.json();

    if(response.ok && !data.Error){
      toast.success("Inregistrare reusita!")
      setShowRegister(false);
    } else{
      toast.error(data.Error)
    }


  } catch (error) {
    console.error("Eroare la conexiunea cu severul:", error);
    toast.error("Serverul de backend nu este pornit")
  }
  

}


  const [email, setemail] = useState('');
  const [subiect, setsubiect] = useState('');
  const [mesaj, setmesaj] = useState('');


const handlemail = async (e : React.FormEvent) => {
  e.preventDefault();

  const templateParams = {
    email: email,
    subiect: subiect,
    mesaj: mesaj,
  }

  try{
    await emailjs.send(
      'Restaurant delizia',
      'template_f97dkp3',
      templateParams,
      'UZu9uAwqhsv5-MGNN'
      );

      toast("Vă mulțumim pentru mesaj.", {icon: "😊"});

      setemail('');
      setsubiect('');
      setmesaj('');

    }catch(error){
      console.error("Eroare EmailJS:", error);
      toast.error("Eroare la trimitere. Încearcă din nou.");
    }
}

  return (
    <div className="app-container">
      <Toaster position='top-center' reverseOrder={false} />
      <section id="nav">
        <img className='logo' src='/logo.png' alt="" />
        <ul id="lista">
          {LoggedinUser ? (
            <>
              {
                LoggedinUser == "radu" ? (
                <>
                  <li className='welcome'>Welcome,admin!</li>
                  <li style={{cursor: 'pointer'}} onClick={() =>  navigate("/")}>Acasă</li>
                  <li style={{cursor: 'pointer'}} className='logout' onClick={() => {localStorage.removeItem('token'); setLoggedinUser(null); toast("Logged out")}}>Logout</li>
                </>
                ) : (
                  <>
                    <li className='welcome'>Welcome,{LoggedinUser}!</li>
                    <li style={{cursor: 'pointer'}} onClick={() => navigate("/")}>Acasă</li>
                    {!isres_page && !ismy_res_page && (
                      <>
                        <li onClick={() => navigate("/rezervari/mese")} style={{cursor: 'pointer'}}>Rezervă</li>
                        <li style={{cursor: 'pointer'}} onClick={scroll_to_Contact}>Contact</li>
                      </>
                    )}
                    {are_rezervare && isres_page && (
                      <>
                        <li onClick={() => navigate("/rezervarile_mele")} style={{cursor: 'pointer'}}>Rezervările mele</li>
                      </>
                    )}
                    <li style={{cursor: 'pointer'}} className='logout' onClick={() => {localStorage.removeItem('token'); setLoggedinUser(null); toast("Logged out")}}>Logout</li>
                  </>
                )
              }
            </>
          ) : (
            <>
              <li onClick={() => navigate("/")} style={{cursor: "pointer"}}>Acasă</li>
              <li onClick={() => {setShowLogin(!showLogin); setShowRegister(false); setLoginUser(''); setLoginPassword('')}} style={{cursor: 'pointer'}}>Login</li>
              <li onClick={() => {setShowRegister(!showRegister);setShowLogin(false); setRegisterUsername(''); setRegisterPassword('')}} style={{cursor: 'pointer'}}>Register</li>
              <li style={{cursor: 'pointer'}} onClick={scroll_to_Contact}>Contact</li>
            </>
          )}
        </ul>
      </section>

  <Routes> 
    <Route path='/' element = {
      <>
        <div className={`login-overlay ${showLogin ? 'open' : ''}`}>
          <form onSubmit={handleLogin} className="login-form">
            <h2>Autentificare</h2>
            <input value={LoginUser} onChange={(e) => setLoginUser(e.target.value)} type="text" placeholder="Username" />
            <input value={LoginPassword} onChange={(e) => setLoginPassword(e.target.value)} type="password" placeholder="Parola" />
            <button type="submit">Intra in cont</button>
         </form>
        </div>

        <div className={`register-overlay ${showRegister ? 'open' : ''}`}>
          <form onSubmit={handleRegister} className="register-form">
            <h2>Inregistrare</h2>
            <input value={RegisterUsername} onChange={(e) => setRegisterUsername(e.target.value)} type="text" placeholder='Username'/>
            <input value={RegisterPassword} onChange={(e) => setRegisterPassword(e.target.value)} type="password" placeholder='Parola' />
            <button type='submit'>Creeaza un cont</button>
          </form>
        </div>

        <section id="content">
          <div id="descriere">
            <h1>Pasiunea ne defineste</h1>
            <h1>Mâncarea ne recomandă</h1>
          </div>
          {LoggedinUser == 'radu' ?(
          <>
            <div id='dashboardadmin'>
              <div onClick={() => navigate('/admin/rezervari')} className='admin-card' style={{cursor: 'pointer'}}>
                <i className="fas fa-list"></i>
                <h3>Arata toate rezervarile</h3>
                <p>Gestionează fluxul de clienți în timp real.</p>
              </div>
              <div onClick={() => navigate('/admin/utilizatori')} className='admin-card' style={{cursor: 'pointer'}}>
                <i className="fas fa-users"></i>
                <h3>Vezi toti utilizatorii</h3>
                <p>Administrează conturile și permisiunile.</p>
              </div>
            </div>
          </>
          ): (
            <>
              <div className='container-meniuri'>
                <div className='meniu'>
                  <h2>PASTE</h2>
                  <p>Paste Alfredo cu pui .... 48lei</p>
                  <p>Paste Mac and Cheese .... 45lei</p>
                  <p>Paste cu somon și roșii .... 50lei</p>
                  <p>Lasagna .... 42lei</p>
                  <p>Spaghetti Bolognese .... 55lei</p>
                  <p>Gnocchi cu sos de roșii în stil italian .... 60lei</p>
                </div>
                <div className='meniu'>
                  <h2>PIZZA</h2>
                  <p>Pizza cu pui și sos pesto .... 30lei</p>
                  <p>Pizza cu sparanghel și sos pesto .... 26lei</p>
                  <p>Pizza la cuptor cu lemne și aluat cu dospire lentă .... 32lei</p>
                  <p>Pizza Margherita .... 30lei</p>
                  <p>Pizza Quattro Formaggi .... 30lei</p>
                  <p>Pizza Quattro Stagioni .... 30lei</p>
                </div>
                <div className='meniu'>
                  <h2>PESTE</h2>
                  <p>Scoici în sos de roșii .... 40lei</p>
                  <p>Creveți Saganaki .... 50lei</p>
                  <p>Păstrăv la Grătar .... 35lei</p>
                  <p>Calamari prăjiți .... 30lei</p>
                  <p>Somon la cuptor, cu sparanghel .... 50lei</p>
                  <p>Noodles chinezești cu creveți și legume .... 28lei</p>
                </div>
                <div className='meniu'>
                  <h2>SALATE</h2>
                  <p>Salată Caesar cu Pui .... 40lei</p>
                  <p>Salată libaneză de varză .... 30lei</p>
                  <p>Salată Grecească cu Pui și Avocado .... 35lei</p>
                  <p>Salată Caesar cu Creveți .... 43lei</p>
                  <p></p>
                  <p></p>
                </div>
              </div>
              <div className='container-contact'>
                <div className='informatii-contact'>
                  <h3>Ne puteți scrie la adresa radu.negoita.dev@gmail.com</h3>
                  <h3>Tel Contact: 0731754283</h3>
                  <h3>Adresa: Str. Stefan Baciu nr.42</h3>
                </div>
                <div className='formular-contact'>
                  <form onSubmit={handlemail} action="submit">
                    <h2>Părerea ta contează</h2>
                    <input required value={email} onChange={(e) => setemail(e.target.value)} placeholder='Introduceți Email-ul' type="email" />
                    <input required value={subiect} onChange={(e) => setsubiect(e.target.value)} placeholder='Subiect' type="text" />
                    <textarea required value={mesaj} onChange={(e) => setmesaj(e.target.value)} placeholder='Mesaj' name="Mesaj" id="m"></textarea>
                    <button type='submit'>Trimite</button>
                  </form>
                </div>
              </div>
            </>
          )}
        </section>  
      </>  
    } />

    <Route path="/admin/utilizatori" element={LoggedinUser === 'radu' ? <Tabel_utilizatori /> : <Navigate to="/" />} />
    <Route path="/admin/rezervari" element={LoggedinUser === 'radu' ? <Tabel_rezervari /> : <Navigate to="/" />} />
    <Route path="/rezervari/mese" element={localStorage.getItem('token') ? <Rezervari_mese /> : <Navigate to="/" />} />
    <Route path="/rezervarile_mele" element={localStorage.getItem('token') ? <Rezervarile_mele /> : <Navigate to="/" />} />
  </Routes>
  <div id='foot' className='footer'>
            <h2>©2026 All Rights Reserved</h2>
          </div>
  </div>
  );
}

export default App;