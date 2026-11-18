#!/bin/sh
# Pack the move frames (render on top, ID map below) into the /3d clips: ida = in, vuelta = reversed.
# Usage: tools/blender/encode.sh <frames-dir> <prefix ("" desktop, "m-" phone>
D=$1; P=$2; O=public/hero3d; mkdir -p $O
for dir in ida vuelta; do
  R=""; [ $dir = vuelta ] && R=",reverse"
  ffmpeg -y -loglevel error -framerate 24 -i "$D/%04d.png" -framerate 24 -i "$D/%04d-id.png" \
    -filter_complex "[0:v]format=rgb24[a];[1:v]format=rgb24[b];[a][b]vstack,scale=trunc(iw/2)*2:trunc(ih/2)*2$R,format=yuv420p" \
    -c:v libx264 -crf 23 -preset slow -movflags +faststart -an "$O/$P$dir.mp4"
done
