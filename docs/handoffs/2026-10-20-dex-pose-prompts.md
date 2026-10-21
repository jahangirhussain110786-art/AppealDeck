# Dex: mood and pose prompts (for the finished mascot)

The mascot is the design you chose: a paper document with a navy binder clip, an orange folded corner, a big wink and smile, a navy cape with an orange hem, white gloves, an orange check on the paper, and navy boots with white soles.

To get the other moods with the **exact same character**, ask the image generator for each one, **with your chosen image attached as the reference**. One mood per message.

## 1. Paste this first (once per chat)

> I am attaching my finished mascot. Treat it as the exact character reference.
> Keep the character **identical** in every picture: the same paper body with its page edges and orange folded corner, the same navy binder clip, the same eyes, eyebrows, cheeks and mouth style, the same grey text lines with the small orange dot, the same orange check mark on the paper, the same navy cape with the orange hem, the same white gloves, the same navy legs with orange bands, the same navy boots with white soles, and the same soft 3D finish and lighting.
> **Only the expression and the pose change.**
> For every picture: a plain pure white background, the character centred and full body, the same camera distance and size as the reference, a soft grey floor shadow under him, no text, no logos, no watermark, and a square-ish canvas of about 1200 by 1330.

## 2. One prompt per mood

Paste "Now draw the same character:" and then one of these.

| Mood | Prompt |
|---|---|
| **Welcome** | Both arms open wide in a friendly welcome, a warm open smile, both eyes open and bright, eyebrows relaxed and raised slightly. |
| **Happy** | Both arms raised in a gentle cheer, both eyes closed in happy curved arcs, a big open smile, small gold sparkle lines around him. |
| **Calm** | Eyes gently closed, a small peaceful smile, both gloved hands resting together in front of him, a few small green leaves floating around. Relaxed and still. |
| **Problem** | Concerned but steady, not scared: both eyes open, eyebrows tilted up in the middle, a small flat mouth, one gloved hand rubbing the back of his head, one small sweat drop. He looks ready to help. |
| **Idea** | One gloved finger raised, a bright glowing yellow lightbulb above his head with short gold rays, eyes sparkling, a confident smile. |
| **Thinking** | One gloved hand under his chin, one eyebrow raised, eyes looking up to the side, a small blue question mark floating beside him. |
| **Reading** | Holding a brass magnifying glass up to one eye, the eye enlarged behind the glass, a curious expression, a small paper page nearby. |
| **Done** | Both thumbs up, eyes closed in a happy arc, a gentle smile, a soft warm glow around the orange check mark on his paper. |
| **Waiting** | A relaxed, patient stance, eyes half closed in a soft calm look, one glove holding a small round clock, a faint "z z" floating above. Patient, never sleepy-silly. |
| **Oops** | A small apologetic shrug, both gloves turned up, eyebrows tilted, a slightly crooked small smile, one small sweat drop. Friendly and sorry, not distressed. |

## 3. Where each mood is allowed

The mascot never cheers a decision. These rules protect the seller:

- **Never** use Happy, Welcome, Idea or Done on a refused, fraud, forged-document or child-safety case, on a legal warning, or on anything about an Amazon decision.
- **Problem and Oops** are only for our own screens (something is missing, a check could not run), never for an Amazon outcome.
- **Calm and Waiting** are the right moods after "Sent" or while the seller waits.
- One short line of 8 words at most goes with any picture. No text inside the picture.

## 4. When you have the pictures

Save each one as a PNG or WebP with a plain white background, and send them to me (or drop them in a folder). I process each one like this:

```bash
node scripts/cutout-mascot.mjs <picture> public/mascot <mood>
```

That gives `dex-<mood>.png` and `dex-<mood>-960/640/320/160.webp` with a transparent background, checked on light and dark backgrounds.

Then I will build the small `Mascot` component for the site: it takes a mood, shows the right picture, fades between moods, and holds still for reduced motion. I will place it in the spots you approve.

## 5. A quick quality check before you send

For each picture, check that it matches the reference in these six things. If one is off, ask the generator to "fix only the X and keep everything else identical":

1. the clip, 2. the orange corner, 3. the orange check on the paper, 4. the gloves (thumb and fingers), 5. the boots (white soles), 6. the cape hem.
