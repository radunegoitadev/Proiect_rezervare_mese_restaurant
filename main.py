from fastapi import FastAPI,HTTPException
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from pydantic import BaseModel
from sqlalchemy import create_engine,Column,Integer,String,DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from jose import jwt

Secret_key = "12334555#343907545433##@@"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def getpswdhash(password):
    return pwd_context.hash(password)


database_url = "sqlite:///./rezervari.db"
engine = create_engine(database_url, connect_args={"check_same_thread": False})
sesiune_locala = sessionmaker(autoflush = False, autocommit = False, bind=engine)
baza = declarative_base()

class rezervareDB(baza):
    __tablename__ = "Rezervari"
    id = Column(Integer, primary_key=True, index=True)
    nume_client = Column(String)
    masa = Column(Integer)
    check_in = Column(DateTime)
    check_out = Column(DateTime)

class userDB(baza):
    __tablename__ = "Users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    parola_criptata = Column(String)

def verificare_parola(parola_normala:str,parola_criptata:str):
    return pwd_context.verify(parola_normala,parola_criptata)

def create_token(username: str):
    expiration = datetime.now() + timedelta(minutes=30)
    payload = {"exp": expiration, "sub": username}
    token = jwt.encode(payload, Secret_key, algorithm="HS256")
    return token

baza.metadata.create_all(bind = engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

class rezervare(BaseModel):
    id : int 
    masa : int
    nume : str
    start : datetime
    end : datetime

baza_date: list[rezervare] = []

@app.post("/rezervari")
def adauga_rezervare(informatii : rezervare):
    db = sesiune_locala()
    for i in baza_date:
        if(i.id == informatii.id):
            raise HTTPException(status_code=400, detail=f"ID-ul cu numarul {i.id} există deja la clientul {i.nume}!")
        if(i.masa == informatii.masa):
            if(informatii.start < i.end and informatii.end > i.start):
                raise HTTPException(status_code=400, detail="Masa este ocupată!")
    noua_rezervare = rezervareDB(
        id = informatii.id,
        nume_client = informatii.nume,
        masa = informatii.masa,
        check_in = informatii.start,
        check_out = informatii.end
    )
    db.add(noua_rezervare)
    db.commit()
    db.refresh(noua_rezervare)
    db.close()
    return {"Status": "Salvat cu succes in baza de date"}    

@app.get("/toaterezervarile")
def primesterezervari():
    db = sesiune_locala()
    rezervari = db.query(rezervareDB).all()
    db.close()
    return rezervari

@app.delete("/rezervari/{id}")
def sterge_rezervare(id: int):
    db = sesiune_locala()
    rezervare = db.query(rezervareDB).filter(rezervareDB.id == id).first()
    if rezervare:
        db.delete(rezervare)
        db.commit()
        db.close()
        return {"Status": "Sters cu succes", "message": f"Rezervarea cu numarul {id} a fost ștearsă"}
    db.close()
    raise HTTPException(status_code=404, detail="Rezervarea nu a fost găsită")

@app.get("/Nr_rezervari")
def numar_rezervari():
    db = sesiune_locala()
    numar = db.query(rezervareDB).count()
    db.close()
    return {"Numar rezervari": numar}

@app.get("/Rezervarea_cu_id/{id}")
def Afiseaza_rezervarea_id(id: int):
    db = sesiune_locala()
    rezervare = db.query(rezervareDB).filter(rezervareDB.id == id).first()
    db.close()
    if rezervare:
        return rezervare
    raise HTTPException(status_code=404, detail=f"Rezervarea cu numarul {id} nu a fost gasita")

@app.post("/register")
def inregistrarea_utilizatorului(nume:str, password:str):
    db = sesiune_locala()
    parola = getpswdhash(password)
    nou_user = userDB(username = nume, parola_criptata = parola)
    db.add(nou_user)
    db.commit()
    db.close()
    return {"Status": "Utilizator înregistrat cu succes"}

@app.post("/login")
def login(username:str, parola:str):
    db = sesiune_locala()
    user = db.query(userDB).filter(userDB.username == username).first()
    if(not user or not verificare_parola(parola, user.parola_criptata)):
        raise HTTPException(status_code=404, detail="Username-ul sau parola invalide")
    else:
        token = create_token(username)
        return{"access_token": token, "token_type": "bearer"}

