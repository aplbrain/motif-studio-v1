# motif-studio

Motif Studio is a browser-based tool to assist in writing motifs.

## Get started

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

<img width="1379" alt="image" src="https://user-images.githubusercontent.com/693511/102020653-8c8e2e80-3d48-11eb-828f-71b1b3ceb64f.png">


## Roadmap

- [ ] Click/drag interface for adding edges and nodes
- [ ] Inspection panel
- [ ] Motif "interestingness" heuristics to indicate anticipated search complexity
- [ ] Pass warnings and errors from the backend along to the user
- [ ] Pass Validator errors to the user
