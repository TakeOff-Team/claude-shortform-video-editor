# Notices

Parts of this project are adapted from **master-skills** by Jake Schincariol, used under the MIT License:

- the audio mastering method (`tools/master_audio.sh`: one fixed gain to -14 LUFS plus a true-peak limiter, no compression on the voice)
- the caption phrasing rules (`engine/src/components/Captions.tsx`: break after sentence ends, after commas once a phrase has two words, on pauses, never end on a weak word)
- the adaptive noise-floor idea used when splitting speech

```
MIT License

Copyright (c) Jake Schincariol

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Third-party software installed by setup.sh

- [Remotion](https://www.remotion.dev): free for individuals and companies of up to 3 people; larger companies need a company license (https://www.remotion.pro/license).
- [FFmpeg](https://ffmpeg.org): LGPL/GPL, installed through Homebrew.
- [mlx-whisper](https://github.com/ml-explore/mlx-examples) / [openai-whisper](https://github.com/openai/whisper): MIT.
- [yt-dlp](https://github.com/yt-dlp/yt-dlp): Unlicense.
