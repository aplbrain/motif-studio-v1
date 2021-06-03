# motif-studio

Motif Studio is a browser-based tool to assist in writing motifs with the [DotMotif](https://github.com/aplbrain/dotmotif) subgraph syntax.

<img width="1078" alt="image" src="https://user-images.githubusercontent.com/693511/120705675-1f9d5b00-c486-11eb-90f8-443853775eb7.png">

![usingmotifstudio](https://user-images.githubusercontent.com/693511/102022121-ad5b8180-3d52-11eb-85c3-45a2aa0d930c.gif)

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


## Roadmap

- [ ] Click/drag interface for adding edges and nodes
- [ ] Inspection panel
- [ ] Motif "interestingness" heuristics to indicate anticipated search complexity
- [x] Pass warnings and errors from the backend along to the user
- [ ] Pass Validator errors to the user
