export function calculateDT(signal) {

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

export function calculateNormalizedDT(dTArray) {

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

export function calculateDip(normalizedDtArray, threshold) {

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

export function calculatePitch(sampleRate, tou) {
    let pitch = sampleRate / tou;
    return pitch;
}

export function rmsCheck(sample, threshold) {
    let sqSample = sample.map(s => {
        return s * s;
    });

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

export function fixOctaveJumps(pitchData) {
    for (let i = 1; i < pitchData.length; i++) {
        let ratio = pitchData[i] / pitchData[i - 1];

        if (ratio >= 1.8 && ratio <= 2.2) {
            pitchData[i] /= 2;
        }
        else if (ratio >= 0.4 && ratio <= 0.6) {
            pitchData[i] *= 2;
        }
    }

    return pitchData;
}

export function medianSmoothening(pitchData, windowSize) {
    let smoothed = [];

    let half = Math.floor(windowSize / 2);

    for (let i = 0; i < pitchData.length; i++) {
        let start = Math.max(0, i - half);
        let end = Math.min(pitchData.length - 1, i + half);

        let window = [];

        for (let j = start; j <= end; j++) {
            window.push(pitchData[j]);
        }

        window.sort((a, b) => a - b);
        smoothed.push(window[Math.floor(window.length / 2)]);
    }

    return smoothed;


}

export function snapToClosestOctave(userHz, refHz) {
    // Try shifting up and down by octaves (factors of 2)
    let best = userHz;
    let bestDiff = Math.abs(convertToCents(userHz) - convertToCents(refHz));

    for (let octave = -3; octave <= 3; octave++) {
        if (octave === 0) continue;
        let shifted = userHz * Math.pow(2, octave);
        if (shifted < 20) continue; // below audible range
        let diff = Math.abs(convertToCents(shifted) - convertToCents(refHz));
        if (diff < bestDiff) {
            bestDiff = diff;
            best = shifted;
        }
    }
    return best;
}

export function convertToCents(hz) {
    return 1200 * Math.log2(hz / 32.7);
}

export function bucketPitchData(data, bucketSize, songDuration) {
    let buckets = [];
    for (let t = 0; t < songDuration; t += bucketSize) {
        let pointsInBucket = data.filter(p => p.x >= t && p.x < t + bucketSize);
        if (pointsInBucket.length === 0) {
            buckets.push(null);
        } else {
            let pitches = pointsInBucket.map(p => p.y).sort((a, b) => a - b);
            buckets.push(pitches[Math.floor(pitches.length / 2)]); // median
        }
    }
    return buckets;
}