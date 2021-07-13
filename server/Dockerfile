FROM python:3.9

WORKDIR /app

COPY requirements.txt ./
RUN pip install -r requirements.txt
RUN pip install gunicorn

ENV GUNICORN_CMD_ARGS="--bind=0.0.0.0:5000"
COPY . .

EXPOSE 5000

CMD [ "gunicorn", "server:APP" ]