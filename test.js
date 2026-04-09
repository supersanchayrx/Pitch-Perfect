//const signal = [1  ,2  ,3  ,1  ,2  ,3  ,1  ,2  ,3 ];
//console.log(signal, "This is the raw signal");


//let tou = calculateDip(calculateNormalizedDT(calculateDT(signal)), 0.1);

// if(tou!=-1){
//     let pitch = calculatePitch(44100,tou);
//     console.log("PITCH -> ",pitch);
// }

let sampleRate = -1;
let samples = null;
let currentSource = null;

let pitchDataRef = [];

let audioFile = null;


const fetchButton = document.getElementById('fetchbutton');
const pitchButton = document.getElementById('pitchButton');
const singButton = document.getElementById('singButton');
const chartCanvas = document.getElementById('pitchChart');
const stopButton = document.getElementById('stopSingAlongButton');
const chooseFileButton = document.getElementById('audioInput');

fetchButton.addEventListener('click', loadAudio);
pitchButton.addEventListener('click', processAudio);
singButton.addEventListener('click', startSingAlong);
stopButton.addEventListener('click', stopSingAlong);
chooseFileButton.addEventListener("change", fileSelected);

fetchButton.disabled = true;
pitchButton.disabled = true;
singButton.disabled = true;
stopButton.disabled = true;

let chart = new Chart(chartCanvas, {
    type: 'line',
    data: {
        datasets: [{
            label: 'Pitch (Hz)',
            data: [],
            borderWidth: 1,
            pointRadius: 0,
            borderColor: 'rgb(54, 162, 235)',
            showLine: true
        },
        {
            label: 'Your Pitch (Hz)',
            data: [],
            borderWidth: 1,
            pointRadius: 0,
            borderColor: 'rgb(255, 99, 132)',
            showLine: true
        }
        ]
    },
    options: {
        scales: {
            x: {
                type: 'linear',
                title: { display: true, text: 'Time(s)' }
            },
            y: { title: { display: true, text: 'Frequency(hz)' } }
        }
    }
});

function fileSelected(){
    file = chooseFileButton.files[0];

    if(file){
        fetchButton.disabled = false;
        pitchButton.disabled = true;
        singButton.disabled = true;
        stopButton.disabled = true;
    }
}


async function startSingAlong() {
    const audioCtx = new AudioContext();
    await audioCtx.audioWorklet.addModule('yin-processor.js');

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const micSource = audioCtx.createMediaStreamSource(stream);

    const highPass = audioCtx.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = 60;

    const lowPass = audioCtx.createBiquadFilter();
    lowPass.type = "lowpass";
    lowPass.frequency.value = 1300;

    const yinNode = new AudioWorkletNode(audioCtx, "yin-processor");

    micSource.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(yinNode);

    file = chooseFileButton.files[0];

    if(!file){
        alert("Please upload a WAV file first");
        return;
    }

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    currentSource = source;
    source.connect(audioCtx.destination);
    const startTime = audioCtx.currentTime;

    source.onended = () => {

        fetchButton.disabled = false;
        pitchButton.disabled = false;
        singButton.disabled = true;
        stopButton.disabled = true;

        console.log("Playback finished");

        stream.getTracks().forEach(track => track.stop());

        yinNode.disconnect();
        micSource.disconnect();

        audioCtx.close();


        let userData = chart.data.datasets[1].data;
        let userTimes = userData.map(p => p.x);
        let userPitches = userData.map(p => p.y);


        userPitches = fixOctaveJumps(userPitches);
        userPitches = medianSmoothening(userPitches, 5);


        chart.data.datasets[1].data = userPitches.map((p, i) => ({ x: userTimes[i], y: p }));
        chart.update();

        calculateSimilarityScore();

    }

    yinNode.port.onmessage = (event) => {
        const { pitch, time } = event.data;
        if (pitch !== null) {
            let relativeTime = time - startTime;
            chart.data.datasets[1].data.push({ x: relativeTime, y: pitch });
            chart.update();
        }
    };

    source.start(0);
    console.log("Sing along started!");

    stopButton.disabled = false;
}

function stopSingAlong() {
    if (currentSource) {
        currentSource.stop();

        currentSource = null;
    }
}

function calculateSimilarityScore() {
    const refData = chart.data.datasets[0].data;
    const userData = chart.data.datasets[1].data;

    if (refData.length === 0 || userData.length === 0) {
        console.log("Not Enough data to calculate score");
        return;
    }

    const bucketSize = 0.25; // seconds
    const songDuration = Math.max(
        refData[refData.length - 1].x,
        userData[userData.length - 1].x
    );

    const refBuckets = bucketPitchData(refData, bucketSize, songDuration);
    const userBuckets = bucketPitchData(userData, bucketSize, songDuration);
    let totalCentsDiff = 0;
    let matchedBuckets = 0;
    for (let i = 0; i < refBuckets.length; i++) {
        if (refBuckets[i] !== null && userBuckets[i] !== null) {
            let refHz = refBuckets[i];
            let userHz = userBuckets[i];
            userHz = snapToClosestOctave(userHz, refHz);

            let refCents = convertToCents(refHz);
            let userCents = convertToCents(userHz);
            totalCentsDiff += Math.abs(refCents - userCents);
            matchedBuckets++;
        }
    }
    if (matchedBuckets === 0) {
        console.log("No overlapping pitch data found");
        return;
    }
    let avgCentsDiff = totalCentsDiff / matchedBuckets;
    //Ai generated code for better overllaping
    // Exponential decay scoring: 0 cents = 100, 50 cents ≈ 85, 100 cents ≈ 72, 200 cents ≈ 52
    // A semitone (100 cents) is a small error; 200 cents (whole tone) is moderate
    let score = Math.round(100 * Math.exp(-avgCentsDiff / 300));
    score = Math.max(0, Math.min(100, score));

    console.log(`Similarity Score: ${score}/100`);
    console.log(`Average pitch difference: ${avgCentsDiff.toFixed(1)} cents`);
    console.log(`Matched time buckets: ${matchedBuckets}/${refBuckets.length}`);

    alert(`Your pitch accuracy: ${score}/100`);
}
//ai generated code
// Shift userHz up or down by octaves until it's as close as possible to refHz
function snapToClosestOctave(userHz, refHz) {
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

function convertToCents(hz) {
    return 1200 * Math.log2(hz / 32.7);
}

function bucketPitchData(data, bucketSize, songDuration) {
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


async function processAudio() {
    let frameSize = 2048;
    let pitchData = [];
    let timeData = [];

    singButton.disabled = true;
    stopButton.disabled = true;

    chart.data.datasets[0].data = [];
    chart.data.datasets[1].data = [];
    chart.update();

    for (let s = 0; s < samples.length; s += frameSize) {
        let frame = samples.slice(s, s + frameSize);

        //console.log(frame.slice(0,50));
        let frameTime = s / sampleRate;
        let tau = -1;
        let confidence = 1;
        if (rmsCheck(frame, 0.025)) {
            let result = calculateDip(calculateNormalizedDT(calculateDT(frame)), 0.5);
            tau = result.tou;
            confidence = result.dipValue;
        }
        else {
            console.log("Silence....skip");
            continue;
        }

        if (tau != -1) {
            let pitch = calculatePitch(sampleRate, tau);

            if (confidence < 0.3) {
                console.log("Pitch -> ", pitch, "High Confidence");
                pitchData.push(pitch);
                timeData.push(frameTime);
                chart.data.datasets[0].data.push({ x: frameTime, y: pitch });
                chart.update();
            }
            else if (confidence < 0.5) {
                console.log("Pitch -> ", pitch, "Medium Confidence");
                pitchData.push(pitch);
                timeData.push(frameTime);
                chart.data.datasets[0].data.push({ x: frameTime, y: pitch });
                chart.update();
            }
            else {
                console.log("Pitch -> ", pitch, "Low Confidence SKIPPING");
            }
        }
        else {
            console.log("Failed to detect Pitch");
        }

        console.log("Frame " + (s / frameSize) + " / " + Math.floor(samples.length / frameSize))
        await new Promise(r => setTimeout(r, 0));
    }

    let pitchData2 = fixOctaveJumps(pitchData);
    pitchData2 = medianSmoothening(pitchData, 5);

    chart.data.datasets[0].data = pitchData2.map((p, i) => ({ x: timeData[i], y: p }));
    chart.update();

    pitchDataRef = pitchData;

    //console.log(pitchData);
    //plotPitchData(pitchData,timeData);

    singButton.disabled = false;
    
}
async function loadAudio() {

    file = chooseFileButton.files[0];

    if(!file){
        alert("Please Upload an audio file first");
        return;
    }

    const arrayBuffer = await file.arrayBuffer();

    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    const highPass = offlineCtx.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = 60;

    const lowPass = offlineCtx.createBiquadFilter();
    lowPass.type = "lowpass";
    lowPass.frequency.value = 1300;

    source.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(offlineCtx.destination);

    source.start(0);
    const filteredAudioBuffer = await offlineCtx.startRendering();

    samples = filteredAudioBuffer.getChannelData(0);
    sampleRate = filteredAudioBuffer.sampleRate;


    //console.log("Samples length -> ", samples.length);
    //console.log("Sample Rate -> ",sampleRate);

    pitchButton.disabled = false;

}

function calculateDT(signal) {

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

function calculateNormalizedDT(dTArray) {

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

function calculateDip(normalizedDtArray, threshold) {

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

function calculatePitch(sampleRate, tou) {
    let pitch = sampleRate / tou;
    return pitch;
}

function rmsCheck(sample, threshold) {
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

function fixOctaveJumps(pitchData) {
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

function medianSmoothening(pitchData, windowSize) {
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

