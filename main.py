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
import uvicorn

Secret_key = "12334555#343907545433##@@"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def getpswdhash(password):
    return pwd_context.hash(password)

def verificare_parola(parola_normala:str,parola_criptata:str):
    return pwd_context.verify(parola_normala,parola_criptata)

def create_token(username: str):
    expiration = datetime.now() + timedelta(minutes=30)
    payload = {"exp": expiration, "sub": username}
    token = jwt.encode(payload, Secret_key, algorithm="HS256")
    return token

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

class userDB(baza):
    __tablename__ = "Users"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, index=True)
    parola_criptata = Column(String)

baza_date: list[rezervare] = []

baza.metadata.create_all(bind = engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/Adaugarerezervare")
def adauga_rezervare(interval: rezervare):
    db = sesiune_locala()
    conflict = db.query(rezervareDB).filter(
        rezervareDB.masa == interval.masa,
        interval.start < rezervareDB.check_out,
        interval.end > rezervareDB.check_in
    ).first()
    if conflict:
        db.close()
        raise HTTPException(status_code=400,detail="Intervalul selectat nu este disponibil")
    else:
        noua_rezervare = rezervareDB(nume_client = interval.nume, masa = interval.masa, check_in = interval.start, check_out = interval.end)
        db.add(noua_rezervare)
        db.commit()
        db.close()
        return{"Status": "Rezervarea a fost salvata in baza de date"}


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
def inregistrarea_utilizatorului(user_Data : UserCreate):
    if(user_Data.password.__len__() < 8):
        return {"Error": "Parola trebuie sa contina minim 8 caractere"}
    elif not any(char.isupper() for char in user_Data.password):
        return {"Error": "Parola trebuie sa contina minim o litera mare"}
    elif not any(not char.isalnum() for char in user_Data.password):
        return {"Error": "Parola trebuie sa contina minim un simbol"}
    elif not any(char.isdigit() for char in user_Data.password):
        return {"Error": "Parola trebuie sa contina cel putin un numar"}
    db = sesiune_locala()
    try:
        parola = getpswdhash(user_Data.password)
        nou_user = userDB(username = user_Data.username, parola_criptata = parola)
        db.add(nou_user)
        db.commit()
        return{"Status": "Utilizator inregistrat cu succes"}
    except Exception as e:
        db.rollback()
    finally:
        db.close()

@app.post("/Login")
def login(user_data : UserCreate):
    db = sesiune_locala()
    user = db.query(userDB).filter(userDB.username == user_data.username).first()
    if(not user or not verificare_parola(user_data.password, user.parola_criptata)):
        db.close()
        raise HTTPException(status_code=404, detail="Username-ul sau parola invalide") 
    else:
        token = create_token(user_data.username)
        db.close()
        return{"access_token": token, "token_type": "bearer"}

@app.get("/Utilizatori")
def vizualizare_utilizatori():
    db = sesiune_locala()
    Utilizatori_inregistrati_inbaza = db.query(userDB).all()
    db.close()
    return Utilizatori_inregistrati_inbaza
    
if __name__=="__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)