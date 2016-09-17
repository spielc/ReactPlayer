declare module "react-wavesurfer" {

    import React = require("react");
 
    interface WaveSurferProperties {
        scrollParent: boolean;
        height: number;
        progressColor: string;
        waveColor: string;
        normalize: boolean;
        barWidth: number;
    }

    interface OnPosChangeParam {
        wavesurfer: WaveSurfer;
        originalArgs: number[];
    }

    interface OnFinishParam {
        wavesurfer: WaveSurfer;
    }

    interface WaveSurferComponentProperties {
        playing: boolean;
        volume: number;
        //zoom: number;
        pos: number;
        //audioPeaks:
        audioFile: string | Blob | File;
        options?: WaveSurferProperties;

        onReady?: () => void;
        onPosChange?: (param: OnPosChangeParam) => void;
        onFinish?: (wavesurfer: OnFinishParam) => void;
        //mediaElt: string | HTMLElement; 
    }

    /**
     * WaveSurfer
     */
    class WaveSurfer extends React.Component<WaveSurferComponentProperties,{}> {
        constructor(props: WaveSurferComponentProperties, context?: any);
        render(): JSX.Element;
        componentDidMount(): void;
        componentWillReceiveProps(nextProps: WaveSurferComponentProperties, nextContext: any): void;
        componentWillUnmount(): void;
    }

    export default WaveSurfer;

}