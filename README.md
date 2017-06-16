# Standoff

## Introduction

Standoff is a deckbuilding game inspired by Dominion with a board element which gives rise to a lot of tactics and calculation. Players represent giant galactic empires locked in a bitter stalemate in a protracted war. In order to gain a decisive edge over their opponents, the armies take the battle to the planet Zirconia, which hosts an ancient powerful superweapon (known as “The Red Gun”). Whoever takes control of The Red Gun will be able to turn the tide in the galactic war and overcome all of their opponents. 

## Setup
Place 16 black 1 x 1 blocks into the game board as follows: (basically 4 groups of 4 with a distance of 3 from the edges):
<img src="https://cloud.githubusercontent.com/assets/24876548/24582697/508c599e-1703-11e7-930f-007d4d1c406b.png" width="420">



Sort the following 8 cards into their own piles. These cards will form the **permanent market**.

<img src="https://cloud.githubusercontent.com/assets/24876548/24582716/b0a97582-1703-11e7-82af-f3755cdbab68.png" width="132" height="160"><img src="https://cloud.githubusercontent.com/assets/24876548/24582717/b19710c6-1703-11e7-8803-96ca2f4a3d27.png" width="132" height="160">
<img src="https://cloud.githubusercontent.com/assets/24876548/24582719/b261b9c0-1703-11e7-8c25-ed99f258f90a.png" width="132" height="160">
<img src="https://cloud.githubusercontent.com/assets/24876548/24582720/b32f7766-1703-11e7-8c1c-7f6f4f470044.png" width="132" height="160">
<img src="https://cloud.githubusercontent.com/assets/24876548/24582721/b4c6e58c-1703-11e7-8bfb-9f2530ff94b9.png" width="132" height="160">
<img src="https://cloud.githubusercontent.com/assets/24876548/24582722/b5a392de-1703-11e7-8d0d-b9c2dda66e05.png" width="132" height="160">
<img src="https://cloud.githubusercontent.com/assets/24876548/24582723/b6735bea-1703-11e7-8d1b-46bf784a8381.png" width="132" height="160">
<img src="https://cloud.githubusercontent.com/assets/24876548/24582715/ae55733a-1703-11e7-8986-76993ffdf4ec.png" width="132" height="160">

Put all other cards into a different pile, shuffle the pile, and flip the top 8 cards of the pile face-up to form the **temporary market**.

Each player takes 6 copies of <img src="https://cloud.githubusercontent.com/assets/24876548/24582721/b4c6e58c-1703-11e7-8bfb-9f2530ff94b9.png" width="132" height="160"> and 4 copies of <img src="https://cloud.githubusercontent.com/assets/24876548/24582716/b0a97582-1703-11e7-82af-f3755cdbab68.png" width="132" height="160"> to form his/her starting deck.

## Resources, budget, and stockpile
There are two resources in Standoff, **credits** and **minerals**. 

A player's budget is the amount of credits he/she currently has available to play actions (see **__Phases of a turn__**). A player's stockpile is the amount of minerals possessed by that player. Minerals can only be obtained through the refinery card. 

A player's budget will reset at the end of each of his/her turns, while his/her minerals will carry over to future turns (see **__Phases of a turn__** for more details).

Certain effects may decrease a player's budget to below 0. In that case, action cards and polyomino cards CANNOT be played at all if you have negative credits in your budget, even if the card in question costs 0 credits to play. 

## Phases of a turn
Each turn is composed of three phases.

### Upkeep phase:
This is the phase during which players have to pay “upkeep”, i.e. resolve leftover effects from previous turns. Certain cards will indicate certain effects to happen during the upkeep phases, and all such effects are resolved automatically during the upkeep phase. 

### Action phase:
This is the phase during which a player may play up to **4** actions. An action consists of one of the following:

•	__Drawing a card__: If the player's deck is not empty, then he/she adds the top card of his/her deck to her hand. If the player's deck is empty, then that player shuffles the discard pile and the discard pile will form his/her deck. Then the player draws a card from the new deck. If both the player's deck and discard pile are empty, then nothing happens.

•	__Discarding a card from the hand__: The player places one card of his/her choosing into his/her discard pile.

•	__Playing an action card__: The player pays resources equal to the cost indicated by the bottom-left corner, then resolves the effects of the action card. After the effect is resolved, the action card is placed into the discard pile (unless the card indicates otherwise). 

•	__Playing a polyomino card__: The player pays resources equal to the cost indicated by the bottom-left corner, then makes a legal placement of a **N-polyomino** onto the field (see **__Placement__**), where N is the number of blocks indicated on the card. Only one polyomino card may be played per turn.

•	__Buying a card from the markets__:  The player pays resources equal to the cost indicated by the bottom-right corner, then places the card into his/her discard pile. (see **__Markets__**)

•	__Mining__:  The player gains 1 mineral for each **Refinery Token** he/she controls that is placed over a **Small Mineral Patch**, and gains 2 minerals for each Refinery Token he/she controls that is placed over a **Large Mineral Patch**. 

Players can also play free actions, all free actions are related to resource management. Free actions comprise of the following:

•	__Adding credits__: The player plays a resource card and adds to his/her budget the number of credits indicated on the card.

•	__Converting minerals to credits__: The player dispenses 1 mineral from her stockpile and adds 1 credit to his/her budget.

### Discard phase:
Standoff has a maximum hand size of 5. After all available actions have been taken by a player and he/she has more than 5 cards in hand, he/she must discard down to 5 cards.

If the player has less than 5 cards in hand, that player draws up to 5. 

In this phase, a player's budget resets to 0 (even if it is negative), however a player's stockpile will remain the same. 

## Placement
To make a placement of an **N-polyomino**, first the plaer takes N 1 x 1 blocks of his/her colour, then he/she must obey the following rules for making a legal placement of an **N-polyomino**:

• __Contiguity__: The N 1 x 1 blocks must be placed in one contiguous group.

•	__Adjacency__: At least one block in the aforementioned group must be orthogonally adjacent to either the edge of the field, or a block of the same colour.

•	__Non-collision__: Each tile on the field can only hold one block. I.e. two different groups cannot collide. 

With the rules above, there is 1 possible configuration for a 1-polyomino, 1 possible configuration for a 2-polyomino, 2 possible configurations for a 3-polyomino, and 8 possible configurations for a 4-polyomino.

### Improvements
Certain actions cards grant the player the power to improve their blocks that are already on the field. To improve a block, put an improvement token (the specific type of token will be specified by the action card) on the block, then that block will be an **improved block**. Each block can only hold one improvement, therefore improvement tokens cannot be placed on improved blocks. 

## Markets
The markets are where players obtain new cards to add to their decks. There are two markets in Standoff.

### The Permanent Market
The permanent market offers staple products that were consistently in demand throughout the war. In this market there is no randomness. It consists of 18 **1-polyomino** cards, 18 **2-polyomino** cards, 18 **3-polyomino** cards, 18 **4-polyomino** cards, 30 **1-credit** cards, 24 **2-credit** cards, 16 **3-credit** cards, and 16 **Refinery** cards, each in its own pile. Players can choose from any of the 8 cards at any moment in the game (before one of them is exhausted).

### The Temporary Market
The temporary market is in a constant state of flux. Its products are always changing, and there is no single product that is always offered. The temporary market is drawn from the pile of all cards that are not included in the permanent market, and the 8 cards for sale are chosen randomly. 

Whenever a player purchases a card from the temporary market, the top card of the draft pile is put into the temporary market to take its place. This process continues until the draft pile has been exhausted.

## The Object of Standoff
The player's goal is to achieve a majority of the red zone in the center of the game board, which is known as **The Red Gun**. The game ends when **The Red Gun** is completely filled (which requires 12 blocks). Then the winner is the player with the most blocks of his/her colour in **The Red Gun**. 

If the number of blocks is tied, then the winner is the player with the least number of total blocks of his/her colour on the game board. 

If that is still tied, the winner is the last player out of the tied players to take his/her first turn (for example: 1) In a 2-player game this scenario means that the second player is the winner. 2) In a 4-player game where players 2 and 3 are tied by the first two metrics, then player 3 is the winner).
