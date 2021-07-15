<h1 align=center>Motif Studio</h1>
<p align=center>Motif Studio is a browser-based tool to assist in writing and executing motif searches with the <a href="https://github.com/aplbrain/dotmotif">DotMotif</a> motif query language.</p>

<img width="1239" alt="image" src="https://user-images.githubusercontent.com/693511/125712072-de1da258-949c-40e8-8da6-99e54e157947.png">

# Demo

There is a live version of Motif Studio running at http://motifstudio.bossdb.org.

<!-- <img width="1078" alt="image" src="https://user-images.githubusercontent.com/693511/120705675-1f9d5b00-c486-11eb-90f8-443853775eb7.png"> -->
<!-- ![usingmotifstudio](https://user-images.githubusercontent.com/693511/102022121-ad5b8180-3d52-11eb-85c3-45a2aa0d930c.gif) -->

## Deploying with Docker-Compose

You can deploy a production-ready version of the application from the root of the project directory:

```shell
docker-compose up -d
```

If you don't want to support user uploads or a database-backed version of the application, you can run a much simpler version by running:

```shell
docker-compose -f docker-compose.simple.yml up -d
```

Both of these will run the backend server on port 5000, and the frontend on port 80.

## Get Started: Simple Version

You can put a set of graphml files in `server/graphs`. These will be automatically detected.

Start the backend with:

```shell
cd server
python3 ./simpleserver.py
```

Start the frontend in another shell:

```shell
cd motif-studio
yarn start
```

## Get Started: Complete Version

You must run a MongoDB service in the background. By default, it is expected that this lives at `localhost:27017`.

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

This will serve the API at `http://localhost:5000`, and the frontend will be available in the browser at `http://localhost:3000`.

## Roadmap

-   [ ] Click/drag interface for adding edges and nodes
-   [ ] Inspection panel
-   [ ] Motif "interestingness" heuristics to indicate anticipated search complexity
-   [x] Pass warnings and errors from the backend along to the user
-   [ ] Pass Validator errors to the user
