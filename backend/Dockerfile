FROM python:3.10

WORKDIR /app

COPY . .

RUN pip install fastapi uvicorn sqlalchemy passlib "bcrypt==4.0.1" python-jose[cryptography] numpy python-multipart fastapi-mail

EXPOSE 8000

CMD ["python", "main.py"]