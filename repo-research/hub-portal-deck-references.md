# Hub Portal Deck References

These references are principles, not designs to copy.

## Game Launcher And Library UI

Useful principle: selected games often change the background, color treatment,
and detail panel around the active title. The Hub should use this idea so the
selected game owns the page atmosphere.

Do not copy specific layouts or brand treatments.

## Console Dashboard Selected-Game Backgrounds

Useful principle: a selected game can fill the world behind a navigable list,
while details and actions stay stable in the foreground.

Apply this through:

- crossfading active-game backgrounds
- stable Enter action
- visible status
- low-motion mobile fallback

## Codrops-Style Image Transitions

Useful principle: image transitions can feel premium through masks, perspective,
and layered movement without requiring WebGL.

Apply this through:

- CSS `perspective`
- clipped portal frames
- Framer Motion `opacity` and `transform`
- stable dimensions

## 2.5D Card And Portal Animations

Useful principle: depth can come from stacked layers, parallax, shadow, scale,
and rotated planes. Start here before React Three Fiber.

## Diegetic Sci-Fi UI

Useful principle: interface elements can feel embedded in the fiction without
becoming unreadable. ENGG should keep the tactical HUD identity while making
game titles, statuses, and actions obvious.

Avoid:

- unreadably tiny labels
- excessive uppercase filler
- glow that lowers contrast
- UI chrome competing with game art

## Optional Future Phase

React Three Fiber or GSAP can be considered later if the 2.5D prototype is not
enough. That decision should happen after v1 is tested for interaction,
performance, and mobile readability.
