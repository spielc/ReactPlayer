// import React = require("react");
// import ReactDOM = require("react-dom");
// import WaveSurfer from "react-wavesurfer";

// interface TestComponentState {
//     file: Blob
// }

// export class TestComponent extends React.Component<{}, TestComponentState> {

//     constructor(props?: any, context?: any) {
//         super(props, context)
//         this.state = {
//             file: new Blob()
//         }
//     }

//     private filesSelected(evt: React.FormEvent<HTMLInputElement>): void {
//         var rawObject = evt.currentTarget as any;
//         var files = rawObject.files as FileList;
//         var file = files[0];
//         var reader = new FileReader();
//         reader.onload = (event) => {
//             var fileReader=event.target as FileReader;
//             var data = fileReader.result as string;
//             var splittedData = data.split(",");
//             var base64EncodedData = splittedData[1];
//             var decodedData = atob(base64EncodedData);
//             var mimeString = data.split(',')[0].split(':')[1].split(';')[0];
//             var ab = new ArrayBuffer(decodedData.length);
//             var ia = new Uint8Array(ab);
//             for (var i = 0; i < decodedData.length; i++) {
//                 ia[i] = decodedData.charCodeAt(i);
//             }
//             this.setState({
//                 file: new Blob([ab])//, { type: mimeString })
//             });
//         };
//         reader.readAsDataURL(file);
//         /*this.setState({
//             file: file
//         });*/
//     }

//     private onReady(): void {

//     }

//     public render(): JSX.Element {
//         return (
//             <div>
//                 <input type="file" multiple={false} onChange={(evt) => this.filesSelected(evt)} />
//                 <WaveSurfer audioFile = {this.state.file} playing={false} pos={0} volume={0.5} onReady={()=>this.onReady()} />
//             </div>
//         );
//     }
// }