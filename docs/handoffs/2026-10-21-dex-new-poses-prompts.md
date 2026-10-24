# Dex: new poses for the corner guide (21 Oct 2026)

Each prompt asks for a NEW body pose and a NEW face, not a prop added to an old pose. Generate them in an image generator that accepts a reference picture (ChatGPT image, Gemini, Midjourney --cref). Attach `public/mascot/dex-hello-960.webp` plus one other existing Dex picture as references. Ask for one pose per message.

## Paste this first (once per chat)

> These pictures show my mascot Dex. Keep the character identical in every new picture: the white rounded layered paper-file body, the navy clip on top, the orange folded corner, the lilac text lines with the small orange dot, the orange check mark, the navy cape with the orange hem, the white cartoon gloves, the navy legs with orange bands, and the navy boots with ivory soles. Keep the same glossy, soft 3D finish, the same lighting and the same face style (glossy navy eyes, rosy cheeks, simple mouth).
> Change only the pose, the gestures and the facial expression, exactly as I describe.
> Every picture: full body, centred, front or slight three-quarter view, a transparent (or plain pure white) background, no floor shadow, no props unless I name one, no text.

Then: "Now draw Dex:" followed by one line below.

## Calm and steady (safe on case, decode, dashboard, vault)

| Name | Body language and face |
|---|---|
| listening | Leaning slightly forward, head tilted a little to one side, one glove cupped behind where an ear would be; eyes open and attentive, small gentle closed smile. |
| reassuring | Both gloves held out low in front, palms down, making a slow "it's okay, easy" gesture; soft eyes, eyebrows relaxed, warm small smile. |
| patient | Standing relaxed with both gloves clasped loosely behind his back, weight on one foot; eyes softly half-closed, calm small smile. |
| nodding | Body upright, head and clip tipped forward in a nod, both gloves resting together in front at waist height; eyes closed in content arcs, small smile. |
| sympathy | Shoulders slightly lowered, one glove placed flat over his chest (on the paper); eyebrows tilted up in the middle, eyes soft and kind, a small caring smile. |
| breathe-in | Chest (paper) lifted, both arms opening slowly outward and upward at shoulder height, cape lifting; eyes closed, peaceful, mouth softly closed. |
| focused-reading | Leaning in, both gloves holding an imaginary page at reading distance, slight frown of concentration; eyes narrowed and focused downward, mouth a small flat line. |
| writing | Sitting on an invisible chair edge, one glove writing in the air as if on a page, the other steadying it; focused eyes looking down, tongue slightly out in concentration. |
| pointing-down | Bent slightly at the waist, pointing down and to the side with one finger, as if at a form field below; helpful expression, eyes on where he points, small open smile. |
| pointing-side | Standing side-on, one arm stretched out straight to the left, presenting with an open palm; looking back at the viewer, friendly confident smile. |
| waiting-seated | Sitting on the floor with knees up, gloves around his knees, cape draped around him; patient soft eyes, tiny calm smile. |
| determined | Feet planted apart, both fists lightly clenched at his sides, chin up; eyebrows angled down with resolve, eyes bright, a firm closed confident smile. |

## Our own problems only (never for an Amazon decision)

| Name | Body language and face |
|---|---|
| worried | Both gloves raised near his face, fingers slightly curled, body leaning back a little; eyebrows tilted up in the middle, eyes wide, small wavy mouth. |
| oops | Shoulders up in an apologetic shrug, one glove rubbing the back of his clip, the other palm up; one eye squinted, an embarrassed crooked smile, one small sweat drop. |
| careful | Holding one glove up flat like a calm "wait / stop" sign at chest height, the other at his side; serious but kind eyes, mouth a small straight line. |
| searching | Bent forward, one glove shading his eyes like a visor, looking far to the side; eyebrows raised, curious open eyes, small "o" mouth. |
| puzzled | Head tilted strongly, scratching the top of his clip with one glove, the other on his hip; one eyebrow up and one down, mouth pulled to one side. |

## Warm moments (public pages only: home, sign-up, pricing, changelog)

| Name | Body language and face |
|---|---|
| waving | Standing tall, one arm raised high waving hello, the other on his hip, slight three-quarter turn; big open smile, both eyes bright and open. |
| bow | A small polite bow from the waist, one glove across his front, the other behind his back, cape draped forward; eyes closed, gentle smile. |
| peek | Leaning in from the left side of the frame, only head, one shoulder and one waving glove visible; playful wink, small open smile. |
| high-five | One glove raised flat toward the viewer for a high five, leaning forward eagerly; happy open eyes, wide smile. |
| salute | Standing straight, heels together, one glove at his clip in a light salute; one eye winking, confident grin. |
| laughing | Leaning back slightly, one glove over his mouth area, the other on his side, shoulders shaking; eyes squeezed shut in happy arcs, open laughing mouth. |
| run | Mid-stride running to the right, arms swinging, cape flowing behind; eager determined eyes, open smile. |
| jump | Mid-air jump, knees tucked, both fists raised, cape flying up; eyes closed in joy, wide open smile. (Never on a case outcome.) |
| sleepy | Standing with one glove covering a yawn, the other stretched up, cape slumped; eyes nearly closed, open yawning mouth. (For a "come back later" or offline screen.) |

## After generating

Check six details against the reference: the clip, the orange corner, the check mark, the gloves, the boots (ivory soles) and the cape hem. If one is wrong, ask: "Fix only the [detail]; keep everything else identical."

To add them to the site, put the PNGs in `docs/handoffs/assets/poses/` and add a line for each to `POSES` in `scripts/build-mascot-set.mjs`. That script crops every pose to one shared box, so Dex keeps the same size and footing in every mood.
