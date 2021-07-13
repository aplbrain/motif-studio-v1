# pip install gunicorn

NEUPRINT_APPLICATION_CREDENTIALS=XXXX gunicorn -w 4 -b 0.0.0.0:5000 simpleserver:APP
