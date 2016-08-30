import * as React from "react";
import * as ReactDOM from "react-dom";

import { PlayerComponent } from "./components/PlayerComponent";
import { PlaylistComponent } from "./components/PlaylistComponent";

/*ReactDOM.render(
    <Hello compiler="TypeScript" framework="React" />,
    document.getElementById("example")
);*/
ReactDOM.render(<PlaylistComponent />, document.getElementById("example"));
//ReactDOM.render(<PlayerComponent />, document.getElementById("example"));