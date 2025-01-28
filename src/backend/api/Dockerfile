FROM python:3.13-slim

WORKDIR /app/
COPY . .

RUN pip3 install --no-cache-dir -r requirements.txt

CMD ["fastapi", "run", "api.py"]
