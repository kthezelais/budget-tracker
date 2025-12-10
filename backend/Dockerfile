FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEV_MODE_ENABLED=0

WORKDIR /app
RUN mkdir /app/database

COPY requirements.txt .
COPY *.sh .
RUN ./init.sh 

COPY *.py .

EXPOSE 8000

CMD ["./run.sh"]
