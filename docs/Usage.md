# Usage

Start the flask backend in one terminal:

```shell
cd server
python3 ./server.py
```

Start the frontend in another:

```shell
cd motif-studio
yarn start
```

This will serve the API at http://localhost:5000, and the frontend will be available in the browser at http://localhost:3000.

For production use, you can also run the Flask server with `gunicorn`. If you want your users to be able to target a neuPrint instance, you can also pass neuPrint credentials in an environment variable.

For example:

```shell
pip install gunicorn

NEUPRINT_APPLICATION_CREDENTIALS=ABCD1234 gunicorn -w 4 -b 0.0.0.0:5000 server:APP
```

This will run a four-worker server on port 5000, with credentialed access to neuPrint.
