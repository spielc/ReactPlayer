declare module "react-wavesurfer" {

    import React = require("react");
 
    interface WaveSurferProperties {
        scrollParent?: boolean;
        height?: number;
        progressColor?: string;
        waveColor?: string;
        normalize?: boolean;
        barWidth?: number;
        fillParent?: boolean;
        minPxPerSec?: number;
    }

    interface WaveSurferEventParams {
        wavesurfer: any;
        originalArgs: any[];
    }

    interface WaveSurferComponentProperties {
        playing: boolean;
        volume: number;
        //zoom: number;
        pos: number;
        //audioPeaks:
        audioFile: string | Blob;
        options?: WaveSurferProperties;

        onReady?: () => void;
        onPosChange?: (param: WaveSurferEventParams) => void;
        onFinish?: (param: WaveSurferEventParams) => void;
        onAudioprocess?: (param: WaveSurferEventParams) => void;
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