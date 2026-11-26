# Cuba Baju

Try a hat, top, pants and shoes on a photo of a child. Built for toddlers; works on phones.

Live: https://rayz1156.github.io/cuba-baju/

## Privacy

The child's photo and the clothing pictures never leave the device. Pose detection (MediaPipe Pose, loaded from a CDN) and background removal run in the browser. Nothing is stored after the page closes.

## How it works

1. Photo: MediaPipe Pose finds 33 body points. If it cannot, a toddler-shaped template appears and the parent drags 13 points onto the body.
2. Clothing: each picture has its plain background removed (flood fill from the picture edge), then is trimmed.
3. Fit: the picture is warped onto the body from the points (`js/fit.js`): top from the shoulders, pants as a two-leg mesh that follows hips, knees and ankles, shoes at the feet, hat from the ears and eyes.
4. The parent can move, resize, stretch, rotate and flip each piece, then save a PNG.

This is a 2D paper-doll fit, not an AI-generated photo. Arms in front of the body are not layered over the clothing.

## Reference studied

IDM-VTON's public Gradio demo (yisol-idm-vton.hf.space) was inspected to learn the usual online try-on flow: person image (with optional mask) plus one garment image are uploaded to a server, which masks the body, runs a diffusion model (30 steps by default) and returns one image. That design needs a GPU server, handles one upper-body garment at a time and uploads the person's photo. Cuba Baju keeps the same two-picture flow but does everything on the device, with four clothing slots.

## Reused from X-Ray Body Mirror

MediaPipe loader, kids theme tokens, Fredoka and Nunito fonts (OFL), Sendi mascot, BM/EN text pattern.

## Run locally

    python -m http.server 8751

No build step.
