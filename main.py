from fastapi import FastAPI,HTTPException,Depends
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from pydantic import BaseModel
from sqlalchemy import create_engine,Column,Integer,String,DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker,Session
from passlib.context import CryptContext
from jose import jwt,JWTError
import uvicorn

Secret_key = "12334555#343907545433##@@"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def getpswdhash(password):
    return pwd_context.hash(password)

def verificare_parola(parola_normala:str,parola_criptata:str):
    return pwd_context.verify(parola_normala,parola_criptata)

def create_token(username: str, rol: str):
    expiration = datetime.now() + timedelta(minutes=120)
    payload = {"exp": expiration, "sub": username, "rol": rol}
    token = jwt.encode(payload, Secret_key, algorithm="HS256")
    return token

def get_db():
    db = sesiune_locala()
    try:
        yield db
    finally:
        db.close()

oath2scheme = OAuth2PasswordBearer(tokenUrl="Login")

def utilizator_curent(token: str = Depends(oath2scheme), db : Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, Secret_key, algorithms="HS256")
        username = payload.get("sub")
        if username == None:
            raise HTTPException(status_code=403, detail="Token invalid")
    except JWTError:
        raise HTTPException(status_code="402", detail="Eroare la procesarea tokenului")
    user = db.query(userDB).filter(userDB.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizatorul nu exista")
    else:
        return user

database_url = "sqlite:///./rezervari.db"
engine = create_engine(database_url, connect_args={"check_same_thread": False})
sesiune_locala = sessionmaker(autoflush = False, autocommit = False, bind=engine)
baza = declarative_base()

class rezervare(BaseModel): 
    nume : str
    masa : int
    start : datetime
    end : datetime

class UserCreate(BaseModel):
    username : str
    password : str

class rezervareDB(baza):
    __tablename__ = "Rezervari"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nume_client = Column(String)
    masa = Column(Integer)
    check_in = Column(DateTime)
    check_out = Column(DateTime)
    status = Column(String)

class userDB(baza):
    __tablename__ = "Users"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, index=True)
    parola_criptata = Column(String)
    rol = Column(String)

baza.metadata.create_all(bind = engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/Adaugarerezervare")
def adauga_rezervare(interval: rezervare, db: Session = Depends(get_db)):
    timp_curent = datetime.now()
    durata = interval.end - interval.start
    if interval.start.minute != 0 or interval.start.second != 0:
        raise HTTPException(status_code=400, detail="Rezervarile se pot face doar la ore fixe")
    if timp_curent > interval.start:
        raise HTTPException(status_code=400, detail="Nu puteti folosi o data din trecut")
    if durata.total_seconds() != 7200:
        raise HTTPException(status_code=400, detail="Rezervarea trebuie sa dureze fix 2 ore")
    conflict = db.query(rezervareDB).filter(
        rezervareDB.masa == interval.masa,
        interval.start < rezervareDB.check_out,
        interval.end > rezervareDB.check_in
    ).first()
    if conflict:
        raise HTTPException(status_code=400,detail="Intervalul selectat nu este disponibil")
    else:
        noua_rezervare = rezervareDB(nume_client = interval.nume, masa = interval.masa, check_in = interval.start, check_out = interval.end, status = "Nedeterminat")
        db.add(noua_rezervare)
        db.commit()
        return{"Status": "Rezervarea a fost salvata in baza de date"}


@app.get("/Afiseaza_Rezervarile")
def primesterezervari(db: Session = Depends(get_db), user_logat = Depends(utilizator_curent)):
    if user_logat.rol != "admin":
        raise HTTPException(status_code=403, detail="Forbidden acces")
    rezervari_upcoming = db.query(rezervareDB).filter(rezervareDB.check_in > datetime.now()).all()
    for i in rezervari_upcoming:
        i.status = "Upcoming"
    rezervari_in_progres = db.query(rezervareDB).filter(rezervareDB.check_in < datetime.now(), rezervareDB.check_out > datetime.now()).all()
    for j in rezervari_in_progres:
        j.status = "Activa"
    rezervari_finalizate = db.query(rezervareDB).filter(rezervareDB.check_out < datetime.now()).all()
    for k in rezervari_finalizate:
        k.status = "Finalizata"
    lista_rezervari = rezervari_upcoming + rezervari_in_progres + rezervari_finalizate
    return lista_rezervari

@app.get("/Nr_rezervari")
def numar_rezervari(db: Session = Depends(get_db), utilizator_logat = Depends(utilizator_curent)):
    if utilizator_logat.rol != "admin":
        raise HTTPException(status_code=403, detail="Forbidden acces")
    numar = db.query(rezervareDB).count()
    return {"Numar rezervari": numar}

@app.get("/Rezervarea_cu_id/{id}")
def Afiseaza_rezervarea_id(id: int, db: Session = Depends(get_db), user_logat = Depends(utilizator_curent)):
    if user_logat.rol != "admin":
        raise HTTPException(status_code=403, detail="Forbidden acces")
    else:
        rezervare = db.query(rezervareDB).filter(rezervareDB.id == id).first()
        if rezervare:
            return rezervare
        raise HTTPException(status_code=404, detail=f"Rezervarea cu numarul {id} nu a fost gasita")

@app.post("/register")
def inregistrarea_utilizatorului(user_Data : UserCreate, db: Session = Depends(get_db)):
    if(user_Data.password.__len__() < 8):
        return {"Error": "Parola trebuie sa contina minim 8 caractere"}
    elif not any(char.isupper() for char in user_Data.password):
        return {"Error": "Parola trebuie sa contina minim o litera mare"}
    elif not any(not char.isalnum() for char in user_Data.password):
        return {"Error": "Parola trebuie sa contina minim un simbol"}
    elif not any(char.isdigit() for char in user_Data.password):
        return {"Error": "Parola trebuie sa contina cel putin un numar"}
    if user_Data.username == "radu":
        parola = getpswdhash(user_Data.password)
        stat = "admin"
        admin = userDB(username = user_Data.username, parola_criptata = parola, rol = stat)
        db.add(admin)
        db.commit()
        return{"Admin adaugat cu succes"}    
    try:
        parola = getpswdhash(user_Data.password)
        stat = "client"
        nou_user = userDB(username = user_Data.username, parola_criptata = parola, rol = stat)
        db.add(nou_user)
        db.commit()
        return{"Status": "Utilizator inregistrat cu succes"}
    except Exception as e:
        db.rollback()

@app.post("/Login")
def login(user_data : UserCreate, db: Session = Depends(get_db)):
    user = db.query(userDB).filter(userDB.username == user_data.username).first()
    if(not user or not verificare_parola(user_data.password, user.parola_criptata)):
        raise HTTPException(status_code=404, detail="Username-ul sau parola invalide")
    if user.rol == "admin" :
        token = create_token(user_data.username, rol = "admin")
        return{"access_token": token, "token_type": "bearer"}
    else:
        token = create_token(user_data.username, rol = "client")
        return{"access_token": token, "token_type": "bearer"}

@app.get("/Utilizatori")
def vizualizare_utilizatori(db: Session = Depends(get_db), utilizator_logat = Depends(utilizator_curent)):
    if utilizator_logat.rol != "admin":
        raise HTTPException(status_code=403, detail="Forbidden acces")
    Utilizatori_inregistrati_inbaza = db.query(userDB).all()
    return Utilizatori_inregistrati_inbaza

@app.get("/Vezi_propriile_rezervari")
def Vezi_propria_rezervare(db: Session = Depends(get_db), utilizator_logat = Depends(utilizator_curent)):
    rezervari = db.query(rezervareDB).filter(rezervareDB.nume_client == utilizator_logat.username).all()
    return {"mesaj": "Aveti urmatoarele rezervari :", "rezervari": rezervari}

@app.delete("/Stergere_Utilizator/{id}")
def Stergere_utlilizator(id: int, db: Session = Depends(get_db), Utilizator_logat = Depends(utilizator_curent)):
    if Utilizator_logat.rol != "admin":
        raise HTTPException(status_code=403, detail="Forbidden acces")
    cautat = db.query(userDB).filter(userDB.id == id).first()
    if cautat:
        db.delete(cautat)
        db.commit()
        return{"Status":f"Utilizator {cautat.username} sters cu succes"}
    else:
        raise HTTPException(status_code=404, detail="Utilizatorul nu exista")
    
@app.delete("/Stergere_Rezervare/{id}")
def Sterge_rezervare(id: int, user_logat = Depends(utilizator_curent), db: Session = Depends(get_db)):
    rezervare = db.query(rezervareDB).filter(rezervareDB.id == id).first()
    if rezervare and user_logat.rol == "admin":
        db.delete(rezervare)
        db.commit()
        return {"Status": "Sters cu succes", "message": f"Rezervarea pe numele {rezervare.nume_client} cu id-ul {id} a fost ștearsă"}
    elif rezervare and user_logat.rol =="client":
        raise HTTPException(status_code=403, detail="Acces nepermis")
    else :
        raise HTTPException(status_code=404, detail="Rezervarea nu a fost găsită")
    
if __name__=="__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)