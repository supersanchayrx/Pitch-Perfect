import { useState, useRef } from 'react';
import {
    calculateDT, calculateNormalizedDT, calculateDip,
    calculatePitch, rmsCheck, fixOctaveJumps,
    medianSmoothening, snapToClosestOctave, convertToCents,
    bucketPitchData
} from '../utils/pitchUtils';
export default function useAudioEngine() {
    const [refPitchData, setRefPitchData] = useState([]);
    const [userPitchData, setUserPitchData] = useState([]);
    const [score, setScore] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSinging, setIsSinging] = useState(false);
    const audioFile = useRef(null);
    const currentSource = useRef(null);
    const samplesRef = useRef(null);
    const sampleRateRef = useRef(-1);
    const micStreamRef = useRef(null);
    const audioCtxRef = useRef(null);
    function setFile(file) {
        audioFile.current = file;
    }

    async function loadAudio() {
        const file = audioFile.current;

        if (!file) {
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

        samplesRef.current = filteredAudioBuffer.getChannelData(0);
        sampleRateRef.current = filteredAudioBuffer.sampleRate;


        //console.log("Samples length -> ", samples.length);
        //console.log("Sample Rate -> ",sampleRate);

        setIsProcessing(true);

        processAudio();
    }


    async function processAudio() {
        let frameSize = 2048;
        let pitchData = [];
        let timeData = [];

        setIsSinging(false);
        setRefPitchData([]);
        setUserPitchData([]);
        setScore(null);

        for (let s = 0; s < samplesRef.current.length; s += frameSize) {
            let frame = samplesRef.current.slice(s, s + frameSize);
            let frameTime = s / sampleRateRef.current;
            let tau = -1;
            let confidence = 1;

            if (rmsCheck(frame, 0.025)) {
                let result = calculateDip(calculateNormalizedDT(calculateDT(frame)), 0.5);
                tau = result.tou;
                confidence = result.dipValue;
            } else {
                continue;
            }

            if (tau != -1) {
                let pitch = calculatePitch(sampleRateRef.current, tau);
                if (confidence < 0.5) {
                    pitchData.push(pitch);
                    timeData.push(frameTime);
                }
            }

            console.log("Frame " + (s / frameSize) + " / " + Math.floor(samplesRef.current.length / frameSize));
            await new Promise(r => setTimeout(r, 0));
        }

        let pitchData2 = fixOctaveJumps(pitchData);
        pitchData2 = medianSmoothening(pitchData2, 5);

        console.log("Processing complete: " + pitchData2.length + " pitch points detected");
        setRefPitchData(pitchData2.map((p, i) => ({ x: timeData[i], y: p })));
        setIsProcessing(false);
    }
    async function startSingAlong() {
        const file = audioFile.current;
        if (!file) {
            alert("Please upload a WAV file first");
            return;
        }

        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;
        await audioCtx.audioWorklet.addModule('/yin-processor.js');

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
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

        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        currentSource.current = source;
        source.connect(audioCtx.destination);
        const startTime = audioCtx.currentTime;

        setIsSinging(true);
        setUserPitchData([]);

        let liveUserData = [];

        source.onended = () => {
            setIsSinging(false);

            stream.getTracks().forEach(track => track.stop());
            yinNode.disconnect();
            micSource.disconnect();
            audioCtx.close();

            // Post-process user pitch data
            let userPitches = liveUserData.map(p => p.y);
            let userTimes = liveUserData.map(p => p.x);

            userPitches = fixOctaveJumps(userPitches);
            userPitches = medianSmoothening(userPitches, 5);

            const finalUserData = userPitches.map((p, i) => ({ x: userTimes[i], y: p }));
            setUserPitchData(finalUserData);

            // Calculate score using the latest ref and user data
            calculateSimilarityScore(finalUserData);
        };

        yinNode.port.onmessage = (event) => {
            const { pitch, time } = event.data;
            if (pitch !== null) {
                let relativeTime = time - startTime;
                const newPoint = { x: relativeTime, y: pitch };
                liveUserData.push(newPoint);
                setUserPitchData(prev => [...prev, newPoint]);
            }
        };

        source.start(0);
    }

    function stopSingAlong() {
        if (currentSource.current) {
            currentSource.current.stop();
            currentSource.current = null;
        }
    }

    function calculateSimilarityScore(userData) {
        const refData = refPitchData;

        if (refData.length === 0 || userData.length === 0) {
            console.log("Not enough data to calculate score");
            return;
        }

        const bucketSize = 0.25;
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
        let computedScore = Math.round(100 * Math.exp(-avgCentsDiff / 300));
        computedScore = Math.max(0, Math.min(100, computedScore));

        setScore(computedScore);
        console.log(`Similarity Score: ${computedScore}/100`);
    }

    function resetUserData() {
        setUserPitchData([]);
        setScore(null);
    }

    return {
        refPitchData,
        userPitchData,
        score,
        isProcessing,
        isSinging,
        setFile,
        loadAudio,
        startSingAlong,
        stopSingAlong,
        resetUserData,
    };
}