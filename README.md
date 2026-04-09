# Pitch Perfect

**Try It Out:** [Link to Hosted App](#) *(Replace this with your hosted link)*

Pitch Perfect is a real-time pitch detection web app that compares your live vocal pitch against a reference track's pitch data.

## How to Use

1. **Upload Audio:** Click **Choose File** to upload a reference track. 
   > ⚠️ **Note:** The file *must* be in `.wav` format. It is highly recommended to keep the audio **under 1 minute**, as accurate pitch fingerprinting takes time.
2. **Process Audio:** Click **Fetch Audio File**, and then click **Synthesize Pitch**.
3. **Sing Along:** Click **Singalong** to start the session. 
   * *Tip:* We recommend using headphones for the playback reference so it doesn't feed back into your mic. You can also mute it if you don't need playback.
4. **Get Your Score:** Click **Stop Singalong** to instantly halt the process and calculate your final pitch correlation score.

## Technical Details

- **Pitch Detection:** Built using the YIN algorithm. It identifies low-energy bands to filter out silence/noise and uses confidence scoring to prevent anomalies (like octave errors).
- **AudioWorklet:** Heavy YIN math for microphone input is offloaded to a background thread. This prevents the main browser window from hanging up during calculations.
- **Visualization:** Synchronized, real-time vocal data curves are plotted using **Chart.js**.

## AI-Assisted Optimization

AI pair-programming was heavily used to optimize:
- Pitch score calculations and data bucketing.
- Smoothing out math for the visual frequency curves.

## Future Updates

- **Performance Fix:** The current implementation manually calculates local minima, resulting in an **O(n²)** complexity. A future goal is to implement an **FFT Autolocalizer** to reduce this to **O(n log n)**.
- **Design:** The UI requires a visual overhaul and will be updated for a more premium experience.
