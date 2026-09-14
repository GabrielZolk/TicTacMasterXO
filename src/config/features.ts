/**
 * Feature flags that decide what the player can actually reach.
 *
 * They live here rather than inside a screen so that everything depending on a
 * feature can be switched off together. The tournament is the reason this file
 * exists: its banner was hidden inside HomeScreen while the achievement that
 * requires winning one stayed in the list, which made the achievement list
 * impossible to complete and nobody could tell why.
 */

/** Tournament mode: banner on Home, its screen, and the achievement it feeds. */
export const SHOW_TOURNAMENT = false;
