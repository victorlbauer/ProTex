import { ProTex } from "./components/protex"

const Scene = ProTex.Scene;
const UI = ProTex.UI;
const Renderer = ProTex.Renderer;

function main() {
    Promise.resolve()
        .then(Scene.Init())
        .then(UI.Init(Scene))
        .then(Renderer.Init(Scene));
}

main();