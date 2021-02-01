# pip install gunicorn

NEUPRINT_APPLICATION_CREDENTIALS=#### gunicorn -w 4 -b 0.0.0.0:5000 server:APP
