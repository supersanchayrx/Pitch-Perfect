class YinProcessor extends AudioWorkletProcessor {

    constructor() {
        super();
        this.buffer = new Float32Array(2048);
        this.bufferIndex = 0;
        this.frameSize = 2048;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0][0];

        if (!input) return true;

        for (let i = 0; i < input.length; i++) {
            this.buffer[this.bufferIndex] = input[i];
            this.bufferIndex++;

            if (this.bufferIndex >= this.frameSize) {
                this.runYin(this.buffer);
                this.bufferIndex = 0;
            }
        }

        return true;
    }

    runYin(frame) {

        let time = currentTime;

        if (!this.rmsCheck(frame, 0.025)) {
            this.port.postMessage({ pitch: null, time: time });
            return;
        }

        let dT = this.calculateDT(frame);
        let normalizedDt = this.calculateNormalizedDT(dT);
        let result = this.calculateDip(normalizedDt, 0.5);

        if (result.tou !== -1 && result.dipValue < 0.5) {
            let pitch = sampleRate / result.tou;

            this.port.postMessage({ pitch: pitch, time: time });
        }
        else {
            this.port.postMessage({ pitch: null, time: time });
        }

    }

    calculateDT(signal) {

        let dTarray = [];
        for (let t = 1; t <= signal.length / 2; t++) {
            let sum = 0;
            for (let i = 0; i < signal.length - t; i++) {
                let diff = signal[i] - signal[i + t];
                sum += diff * diff;
            }

            dTarray.push(sum);
        }

        //console.log(dTarray, " This is 0 based indexing and this is processed signal ");

        return dTarray;
    }

    calculateNormalizedDT(dTArray) {

        let normalizedDtArray = [];

        let runningSum = 0;
        for (let i = 0; i < dTArray.length; i++) {
            runningSum += dTArray[i];
            let t = i + 1;

            let avg = runningSum / t;

            if (avg > 0) {
                normalizedDtArray.push(dTArray[i] / avg);
                continue;
            }

            normalizedDtArray.push(1);
        }

        //console.log(normalizedDtArray, "This is the processed normalized array");


        return normalizedDtArray;
    }

    calculateDip(normalizedDtArray, threshold) {

        let candidates = [];

        for (let i = 1; i < normalizedDtArray.length - 1; i++) {
            if (normalizedDtArray[i] < normalizedDtArray[i - 1] && normalizedDtArray[i] <= normalizedDtArray[i + 1]) {
                candidates.push({ tou: i + 1, dipValue: normalizedDtArray[i] });
                //console.log("We found tou as -> ", tou);
                //return {tou : i+1, dipValue : normalizedDtArray[i]};
            }
        }

        if (candidates.length === 0) {
            return { tou: -1, dipValue: 1 };
        }

        let filtered = candidates.filter(c => {
            return (c.dipValue <= threshold)
        });

        if (filtered.length === 0) {
            let best = candidates[0];
            for (let i = 1; i < candidates.length; i++) {
                if (candidates[i].dipValue < best.dipValue) {
                    best = candidates[i];
                }
            }

            return best;
        }

        let bestDip = filtered[0].dipValue;
        for (let i = 1; i < filtered.length; i++) {
            if (filtered[i].dipValue < bestDip) {
                bestDip = filtered[i].dipValue;
            }
        }

        let tolerance = 1.1;
        for (let i = 0; i < filtered.length; i++) {
            if (filtered[i].dipValue <= bestDip * tolerance) {
                return filtered[i];
            }
        }

        return filtered[0];

        // let minVal = Infinity;
        // let minValChanged = false;
        // let minIndex = 0;
        // for(let i = 0; i<normalizedDtArray.length; i++){
        //     if(normalizedDtArray[i]<minVal){
        //         if(!minValChanged){
        //             minValChanged = true;
        //         }
        //         minVal = normalizedDtArray[i];
        //         minIndex = i;
        //     }
        // }

        // if(minValChanged)
        //     return {tou : minIndex+1, dipValue : minVal};

        // console.log("Tou cant be found");
        // return {tou : -1, dipValue : 1};
    }

    rmsCheck(sample, threshold) {
        let sqSample = [];

        for (let i = 0; i < sample.length; i++) {
            let sq = sample[i] * sample[i];
            sqSample.push(sq);
        }

        let squareSum = 0;
        for (let i = 0; i < sqSample.length; i++) {
            squareSum += sqSample[i];
        }

        let meanSquareSum = squareSum / sqSample.length;

        let rms = Math.sqrt(meanSquareSum);

        if (rms <= threshold)
            return false;

        return true;
    }
}

registerProcessor("yin-processor", YinProcessor);